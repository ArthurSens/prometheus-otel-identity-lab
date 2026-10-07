#!/usr/bin/env python3
import hashlib
import json
import pathlib
import sys


ROOT = pathlib.Path(__file__).resolve().parent


def load(path):
    with path.open() as handle:
        return json.load(handle)


def series(path):
    payload = load(path)
    if payload.get("status") != "success":
        return []
    return [item.get("metric", {}) for item in payload.get("data", {}).get("result", [])]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def identity_pairs(items):
    return sorted({(item.get("job", ""), item.get("instance", "")) for item in items})


def identity_authority(case):
    if case["source"] == "prom":
        if not case.get("collector") or (case["final"] == "scrape" and not case["final_honor"]):
            return "final_scrape_target"
        if case["source_strategy"] == "NoTranslation":
            return "sdk_service_resource"
        return "collector_receiver_scrape_target"
    if case["final"] == "scrape" and not case["final_honor"]:
        return "final_scrape_target"
    return "sdk_service_resource"


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: analyze.py RUN_DIRECTORY")
    run_dir = pathlib.Path(sys.argv[1])
    cases = json.loads((ROOT / "cases.json").read_text())
    assertions = []
    manifest = []

    def check(case_id, name, condition, detail=""):
        assertions.append({"case": case_id, "name": name, "passed": bool(condition), "detail": detail})

    for case in cases:
        case_id = case["id"]
        case_dir = run_dir / "cases" / case_id
        ordinary = series(case_dir / "final-ordinary.json")
        target_info = series(case_dir / "final-target-info.json")
        collision = series(case_dir / "final-collision.json")
        files = sorted(path for path in case_dir.iterdir() if path.is_file())
        evidence = {path.name: {"sha256": digest(path), "bytes": path.stat().st_size} for path in files}

        check(case_id, "final Prometheus query succeeded", bool(ordinary), f"series={len(ordinary)}")
        check(case_id, "target_info query captured", bool(target_info), f"series={len(target_info)}")
        check(case_id, "exact final config preserved", (case_dir / "prometheus.yaml").stat().st_size > 0)
        check(case_id, "source manifest preserved", (case_dir / "case.json").stat().st_size > 0)
        if case["source"] == "prom":
            check(case_id, "SDK exposition captured", (case_dir / "source-exposition.txt").stat().st_size > 0)
            check(case_id, "collision probe reached final Prometheus", bool(collision), f"series={len(collision)}")
            source_text = (case_dir / "source-exposition.txt").read_text()
            if case["source_strategy"] == "NoTranslation":
                check(case_id, "SDK exposition retained dotted service.name", '"service.name"="checkout"' in source_text)
                check(case_id, "SDK exposition retained dotted service.instance.id", '"service.instance.id"="sdk-1"' in source_text)
            else:
                check(case_id, "SDK exposition flattened service_name", 'service_name="checkout"' in source_text)
                check(case_id, "SDK exposition flattened service_instance_id", 'service_instance_id="sdk-1"' in source_text)

            if not case.get("collector"):
                expected = [("identity-lab-final", "c36-sdk:9464")]
            elif case["final"] == "scrape" and not case["final_honor"]:
                expected = [("identity-lab-final", "c36-collector:9464")]
            elif case["source_strategy"] == "NoTranslation":
                expected = [("payments/checkout", "sdk-1")]
            else:
                expected = [("identity-lab-source", "c36-sdk:9464")]
            check(
                case_id,
                "ordinary identity matches source-strategy semantics",
                identity_pairs(ordinary) == expected,
                f"expected={expected} actual={identity_pairs(ordinary)}",
            )
            check(
                case_id,
                "ordinary identity contains no case-derived value",
                all(case_id.lower() not in (job + instance).lower() and "case-" not in (job + instance).lower() for job, instance in identity_pairs(ordinary)),
                f"actual={identity_pairs(ordinary)}",
            )

            expected_target_info = 2 if case.get("collector") and case.get("receiver_honor") else 1
            check(
                case_id,
                "target_info cardinality matches receiver collision policy",
                len(target_info) == expected_target_info,
                f"expected={expected_target_info} actual={len(target_info)}",
            )
        if case.get("collector"):
            checkpoint = case_dir / "checkpoint.jsonl"
            check(case_id, "post-receiver structured checkpoint captured", checkpoint.exists() and checkpoint.stat().st_size > 0)
            check(case_id, "Collector debug log captured", (case_dir / "collector.log").stat().st_size > 0)
            if case.get("exporter") == "prom":
                exposition = case_dir / "collector-exposition.txt"
                check(case_id, "Collector Prometheus exporter page captured", exposition.exists() and exposition.stat().st_size > 0)

        if case["final"] == "otlp" and case.get("keep"):
            flattened = json.dumps(target_info, sort_keys=True)
            expected_key = "service.name" if case["strategy"] == "NoTranslation" else "service_name"
            check(case_id, "keep=true retained an identifying resource label", expected_key in flattened, expected_key)
        if case["final"] == "otlp" and not case.get("keep") and case["source"] == "otlp":
            flattened = json.dumps(target_info, sort_keys=True)
            forbidden_key = "service.name" if case["strategy"] == "NoTranslation" else "service_name"
            check(case_id, "keep=false omitted duplicated identifying labels", forbidden_key not in flattened, forbidden_key)

        manifest.append({
            "id": case_id,
            "tuple": case,
            "ordinary_series": ordinary,
            "target_info_series": target_info,
            "collision_series": collision,
            "evidence": evidence,
        })

    by_id = {item["id"]: item for item in manifest}
    source_strategy_pairs = []
    for dotted in (item for item in manifest if item["tuple"].get("source_strategy") == "NoTranslation"):
        underscore = by_id[dotted["tuple"]["source_case"]]
        source_strategy_pairs.append({
            "dotted_case": dotted["id"],
            "underscore_case": underscore["id"],
            "topology": {key: value for key, value in dotted["tuple"].items() if key not in {"id", "source_case", "source_strategy"}},
            "underscore_ordinary_identity": identity_pairs(underscore["ordinary_series"]),
            "dotted_ordinary_identity": identity_pairs(dotted["ordinary_series"]),
            "underscore_identity_authority": identity_authority(underscore["tuple"]),
            "dotted_identity_authority": identity_authority(dotted["tuple"]),
            "underscore_target_info_count": len(underscore["target_info_series"]),
            "dotted_target_info_count": len(dotted["target_info_series"]),
            "ordinary_identity_changed": identity_pairs(underscore["ordinary_series"]) != identity_pairs(dotted["ordinary_series"]),
            "identity_authority_changed": identity_authority(underscore["tuple"]) != identity_authority(dotted["tuple"]),
        })

    passed = sum(1 for item in assertions if item["passed"])
    failed = len(assertions) - passed
    coverage = {
        "scope": "SDK -> optional maximum one Collector -> final Prometheus",
        "versions": {"prometheus": "3.14.0", "collector_contrib": "0.162.0"},
        "source_prometheus_strategies": ["UnderscoreEscapingWithSuffixes", "NoTranslation"],
        "downstream_translation_strategies": ["UnderscoreEscapingWithSuffixes", "NoTranslation"],
        "coverage": {"covered": len(manifest), "total": len(cases)},
        "assertions": {"passed": passed, "failed": failed, "total": len(assertions)},
        "source_strategy_pairs": source_strategy_pairs,
        "cases": manifest,
    }
    (run_dir / "coverage-manifest.json").write_text(json.dumps(coverage, indent=2, sort_keys=True) + "\n")
    with (run_dir / "assertions.txt").open("w") as handle:
        for item in assertions:
            handle.write(f"{'PASS' if item['passed'] else 'FAIL'} {item['case']}: {item['name']}")
            if item["detail"]:
                handle.write(f" ({item['detail']})")
            handle.write("\n")
        handle.write(f"SUMMARY: {passed}/{len(assertions)} assertions passed; coverage {len(manifest)}/{len(cases)}\n")
    print(f"SUMMARY: {passed}/{len(assertions)} assertions passed; failures={failed}; coverage={len(manifest)}/{len(cases)}")
    if failed:
        for item in assertions:
            if not item["passed"]:
                print(f"FAIL {item['case']}: {item['name']} {item['detail']}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
