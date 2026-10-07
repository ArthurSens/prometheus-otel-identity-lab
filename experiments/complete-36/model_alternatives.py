#!/usr/bin/env python3
"""Build specification-predicted identity variants from the measured matrix.

This is deliberately not an emulator for an unreleased Prometheus or Collector.
It applies the stakeholder document's stated entity-less precedence rules to the
measured fixture and records uncertainty wherever the design is not normative.
"""

import argparse
import csv
import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parent
DESIGN_URL = "https://docs.google.com/document/d/1jHfIOriXvBAFQ9PwRRuEqnmDH8nQ3U1cistdfE7XOIE/edit?tab=t.bnx0d8mtm00h"
DESIGN_REVISION = "ANLCKQm87uVb-V_d6y6EpxmlV89YUNrTtY0mWEQc1s5JeiQcLqa5kjEgrBHtjgZq5ENGYak-MEewfD0DCLi_GPOmviNshLJFYEsRmz3JrM0"

APP_SERVICE = {
    "service.namespace": "payments",
    "service.name": "checkout",
    "service.instance.id": "sdk-1",
}
SOURCE_SCRAPE = {"job": "identity-lab-source", "instance": "c36-sdk:9464"}
FINAL_SDK_SCRAPE = {"job": "identity-lab-final", "instance": "c36-sdk:9464"}
FINAL_COLLECTOR_SCRAPE = {"job": "identity-lab-final", "instance": "c36-collector:9464"}

PROFILES = [
    {
        "id": "B",
        "option": "B",
        "label": "Option B — namespaced scrape pair, pair first",
        "precedence": "prometheus_pair_first",
        "recognize_bare_underscore_service": False,
        "derive_service_from_scrape": True,
        "entity_mode": "not_exercised",
    },
    {
        "id": "C-default-derive",
        "option": "C",
        "label": "Option C — declared first, current derivation retained",
        "precedence": "covered_service_first",
        "recognize_bare_underscore_service": True,
        "derive_service_from_scrape": True,
        "entity_mode": "not_exercised",
    },
    {
        "id": "C-never-derive",
        "option": "C",
        "label": "Option C — declared first, never-derive enabled",
        "precedence": "covered_service_first",
        "recognize_bare_underscore_service": True,
        "derive_service_from_scrape": False,
        "entity_mode": "not_exercised",
    },
    {
        "id": "C1-default-derive",
        "option": "C.1",
        "label": "Option C.1 — no underscore recognition, current derivation retained",
        "precedence": "covered_service_first",
        "recognize_bare_underscore_service": False,
        "derive_service_from_scrape": True,
        "entity_mode": "not_exercised",
    },
    {
        "id": "C1-never-derive",
        "option": "C.1",
        "label": "Option C.1 — no underscore recognition, never-derive enabled",
        "precedence": "covered_service_first",
        "recognize_bare_underscore_service": False,
        "derive_service_from_scrape": False,
        "entity_mode": "not_exercised",
    },
    {
        "id": "E-symbolic",
        "option": "E",
        "label": "Option E — otel_resource_id join key (symbolic)",
        "precedence": "new_resource_join_key",
        "recognize_bare_underscore_service": True,
        "derive_service_from_scrape": False,
        "entity_mode": "symbolic_complete_resource_identity",
    },
]


def pair(job, instance):
    return {"job": job, "instance": instance}


def measured_pair(case_record):
    metric = case_record["ordinary_series"][0]
    return pair(metric.get("job", ""), metric.get("instance", ""))


def receiver_resource(case, profile, resource_kind="ordinary"):
    if resource_kind == "collision":
        scrape = pair("sdk-metric-job", "sdk-metric-instance")
        has_target_info = False
    else:
        scrape = dict(SOURCE_SCRAPE)
        has_target_info = True

    dotted_source = case.get("source_strategy") == "NoTranslation"
    recognize = dotted_source or profile["recognize_bare_underscore_service"]
    covered_service = dict(APP_SERVICE) if has_target_info and recognize else None
    raw_underscore = dict(APP_SERVICE) if has_target_info and not recognize else None

    if covered_service:
        semantic_service = covered_service
        service_origin = "source_target_info"
    elif profile["derive_service_from_scrape"]:
        semantic_service = {
            "service.name": scrape["job"],
            "service.instance.id": scrape["instance"],
        }
        service_origin = "derived_from_normalized_scrape_pair"
    else:
        semantic_service = None
        service_origin = "absent_never_derive"

    if profile["precedence"] == "prometheus_pair_first":
        selected = scrape
        authority = "prometheus.job+prometheus.instance"
        selection = "exact"
    elif profile["precedence"] == "covered_service_first":
        if covered_service:
            selected = pair(
                "/".join(filter(None, [covered_service.get("service.namespace"), covered_service.get("service.name")])),
                covered_service.get("service.instance.id", ""),
            )
            authority = "service.namespace+service.name+service.instance.id"
        else:
            selected = scrape
            authority = "prometheus.job+prometheus.instance fallback"
        selection = "exact"
    else:
        selected = {
            "job": "policy-dependent",
            "instance": "policy-dependent",
        }
        authority = "otel_resource_id"
        selection = "symbolic"

    attributes = {
        "prometheus.job": scrape["job"],
        "prometheus.instance": scrape["instance"],
    }
    if semantic_service:
        attributes.update(semantic_service)
    if raw_underscore:
        attributes.update({
            "service_name": raw_underscore["service.name"],
            "service_namespace": raw_underscore["service.namespace"],
            "service_instance_id": raw_underscore["service.instance.id"],
        })

    return {
        "resource_kind": resource_kind,
        "normalized_scrape_pair": scrape,
        "resource_attributes": attributes,
        "covered_service_declaration": covered_service,
        "raw_underscore_service_metadata": raw_underscore,
        "semantic_service_origin": service_origin,
        "selected_prometheus_identity": selected,
        "identity_authority": authority,
        "selection_status": selection,
        "otel_resource_id": (
            "uuidv5(<canonical-complete-resource-identity>)"
            if profile["option"] == "E"
            else None
        ),
    }


def apply_final_ingestion(case, selected):
    if case["final"] != "scrape" or case.get("final_honor", False):
        return {
            "job_instance": dict(selected),
            "authority": "upstream_translator",
            "upstream_job_instance": dict(selected),
        }
    target = FINAL_COLLECTOR_SCRAPE if case.get("collector") else FINAL_SDK_SCRAPE
    return {
        "job_instance": dict(target),
        "authority": "final_scrape_target",
        "upstream_job_instance": dict(selected),
        "upstream_preserved_as": ["exported_job", "exported_instance"],
    }


def prediction(case_record, profile):
    case = case_record["tuple"]
    measured = measured_pair(case_record)
    applicable = case["source"] == "prom" and case.get("collector", False)

    if not applicable:
        reason = (
            "direct Prometheus scrape has no Prometheus-to-OTLP boundary"
            if case["source"] == "prom"
            else "native SDK OTLP behavior is an agreed non-regression requirement"
        )
        final = {"job_instance": measured, "authority": "unchanged_measured_path"}
        return {
            "case_id": case["id"],
            "profile_id": profile["id"],
            "option": profile["option"],
            "classification": "unchanged_measured_behavior",
            "confidence": "measured",
            "applicable": False,
            "applicability_reason": reason,
            "measured_current_final": measured,
            "collector_resources": [],
            "predicted_final": final,
            "target_info": {
                "predicted_series_count": len(case_record["target_info_series"]),
                "cardinality_change": False,
                "projection": "unchanged",
            },
            "assumptions": [],
        }

    resources = [receiver_resource(case, profile, "ordinary")]
    if case.get("receiver_honor"):
        resources.append(receiver_resource(case, profile, "collision"))
    ordinary = resources[0]
    final = apply_final_ingestion(case, ordinary["selected_prometheus_identity"])
    symbolic = profile["option"] == "E"
    assumptions = [
        "prometheus.job and prometheus.instance producer emission is enabled",
        "the fixture contains no EntityRefs",
        "same-named point attributes remain ordinary metric labels",
        "receiver honor_labels and final scrape honor_labels continue to run before/after the proposed translation rule respectively",
    ]
    if profile["option"] in {"C", "C.1"}:
        assumptions.append(
            "never-derive is " + ("enabled" if not profile["derive_service_from_scrape"] else "disabled")
        )
    if profile["option"] == "C":
        assumptions.append("the three bare underscore service labels are recognized as covered service declarations")
    if profile["option"] == "C.1":
        assumptions.append("bare underscore service labels remain uninterpreted Resource attributes")
    if symbolic:
        assumptions.extend([
            "otel_resource_id is present on every series as the resource join key",
            "the UUID namespace, canonical serialization, entity inference, and final job/instance policy remain unresolved",
        ])

    semantic = ordinary["covered_service_declaration"] or (
        {k: v for k, v in ordinary["resource_attributes"].items() if k.startswith("service.")}
        or None
    )
    target_projection = {
        "predicted_series_count": len(case_record["target_info_series"]),
        "cardinality_change": False,
        "join_pair": final["job_instance"],
        "semantic_service_attributes": semantic,
        "scrape_provenance_attributes": {
            "prometheus.job": SOURCE_SCRAPE["job"],
            "prometheus.instance": SOURCE_SCRAPE["instance"],
        },
        "raw_underscore_service_metadata": ordinary["raw_underscore_service_metadata"],
        "identifying_attributes_visible": (
            case.get("keep") if case["final"] == "otlp" else "exporter-dependent"
        ),
        "projection_note": (
            "symbolic: exact output labels cannot be fixed until Option E standardizes resource-ID synthesis"
            if symbolic
            else "conceptual attributes are exact; wire label spelling follows the configured downstream translation strategy"
        ),
    }

    return {
        "case_id": case["id"],
        "profile_id": profile["id"],
        "option": profile["option"],
        "classification": "symbolic_counterfactual" if symbolic else "specification_predicted",
        "confidence": "symbolic" if symbolic else "conditional",
        "applicable": True,
        "applicability_reason": "Prometheus source crosses a Collector Prometheus-to-OTLP translation boundary",
        "measured_current_final": measured,
        "collector_resources": resources,
        "predicted_final": final,
        "target_info": target_projection,
        "assumptions": assumptions,
    }


def pair_tuple(value):
    return value.get("job"), value.get("instance")


def build_pair_comparisons(predictions, cases):
    by_key = {(p["profile_id"], p["case_id"]): p for p in predictions}
    rows = []
    for profile in PROFILES:
        for dotted in cases:
            source_case = dotted["tuple"].get("source_case")
            if not source_case:
                continue
            a = by_key[(profile["id"], source_case)]["predicted_final"]["job_instance"]
            b = by_key[(profile["id"], dotted["id"])]["predicted_final"]["job_instance"]
            symbolic = "policy-dependent" in pair_tuple(a) or "policy-dependent" in pair_tuple(b)
            rows.append({
                "profile_id": profile["id"],
                "underscore_case": source_case,
                "dotted_case": dotted["id"],
                "underscore_final": a,
                "dotted_final": b,
                "comparison": "unresolved" if symbolic else ("same" if a == b else "different"),
            })
    return rows


def write_csv(path, predictions):
    columns = [
        "profile_id", "option", "case_id", "classification", "confidence", "applicable",
        "current_job", "current_instance", "predicted_job", "predicted_instance",
        "predicted_authority", "target_info_count", "resource_id",
    ]
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for item in predictions:
            final = item["predicted_final"]["job_instance"]
            resource_id = ""
            if item["collector_resources"]:
                resource_id = item["collector_resources"][0].get("otel_resource_id") or ""
            writer.writerow({
                "profile_id": item["profile_id"],
                "option": item["option"],
                "case_id": item["case_id"],
                "classification": item["classification"],
                "confidence": item["confidence"],
                "applicable": str(item["applicable"]).lower(),
                "current_job": item["measured_current_final"]["job"],
                "current_instance": item["measured_current_final"]["instance"],
                "predicted_job": final["job"],
                "predicted_instance": final["instance"],
                "predicted_authority": item["predicted_final"]["authority"],
                "target_info_count": item["target_info"]["predicted_series_count"],
                "resource_id": resource_id,
            })


def write_report(path, payload):
    summary = payload["summary"]
    lines = [
        "# Specification-predicted identity variants",
        "",
        "> These are counterfactual predictions, not runtime test results. No released Prometheus or OpenTelemetry Collector implements the complete alternatives.",
        "",
        "## Baseline and method",
        "",
        f"The input is the clean `{payload['measured_baseline']['run']}` Docker run: "
        f"{payload['measured_baseline']['coverage']['covered']}/{payload['measured_baseline']['coverage']['total']} cases and "
        f"{payload['measured_baseline']['assertions']['passed']}/{payload['measured_baseline']['assertions']['total']} measured assertions passed.",
        "",
        "For every case and profile, the model preserves the measured topology, applies the proposal at each Prometheus-to-OTLP or OTLP-to-Prometheus boundary, and then applies the existing final scrape behavior. Direct Prometheus scrapes and native SDK OTLP paths remain measured and unchanged. The fixture contains no EntityRefs.",
        "",
        "## Profiles",
        "",
        "| Profile | Rule | Source-pair result | Status |",
        "| --- | --- | --- | --- |",
    ]
    for profile in payload["profiles"]:
        result = summary[profile["id"]]
        pair_result = (
            f"{result['source_pairs_same']} same, {result['source_pairs_different']} different"
            + (f", {result['source_pairs_unresolved']} unresolved" if result["source_pairs_unresolved"] else "")
        )
        status = "symbolic" if profile["option"] == "E" else "conditional on stated design rules"
        lines.append(f"| `{profile['id']}` | {profile['label']} | {pair_result} | {status} |")
    lines += [
        "",
        "Each profile covers all 58 cases. Forty cases cross an affected Collector Prometheus-receiver boundary; eighteen paths are unchanged measured behavior.",
        "",
        "## Principal predictions",
        "",
        "- **B:** all 22 underscore/dotted source pairs converge on final ordinary identity. Where no later scrape overrides it, the preserved `prometheus.job` and `prometheus.instance` pair becomes `job` and `instance`.",
        "- **C:** all 22 pairs converge because the three bare underscore service forms are recovered as semantic `service.*` declarations. Where no later scrape overrides it, the application pair `payments/checkout / sdk-1` becomes authoritative.",
        "- **C.1:** 16 pairs remain different and 6 remain the same, matching the current authority split. Underscore application values survive as uninterpreted raw attributes, while the scrape pair is preserved separately.",
        "- **E:** 18 unaffected paths retain measured values. The remaining 40 are symbolic because exact `otel_resource_id`, entity synthesis, and the future `job`/`instance` policy are not standardized.",
        "- Final `honor_labels=false` scrapes still mask an upstream identity choice by assigning `identity-lab-final`; the dataset retains the upstream pair so editors can show the hidden transformation.",
        "- The proposals do not change the expected `target_info` cardinality in this fixture. Receiver `honor_labels` remains the cardinality control.",
        "",
        "## Representative U05/D04 pair",
        "",
        "| Profile | U05 underscore source | D04 dotted source |",
        "| --- | --- | --- |",
        "| Current measured | `identity-lab-source / c36-sdk:9464` | `payments/checkout / sdk-1` |",
        "| B | `identity-lab-source / c36-sdk:9464` | `identity-lab-source / c36-sdk:9464` |",
        "| C, either derivation profile | `payments/checkout / sdk-1` | `payments/checkout / sdk-1` |",
        "| C.1, either derivation profile | `identity-lab-source / c36-sdk:9464` | `payments/checkout / sdk-1` |",
        "| E | `job`/`instance` policy-dependent; `otel_resource_id=uuidv5(<canonical-complete-resource-identity>)` | same unresolved form |",
        "",
        "## Data files",
        "",
        "- `alternative-variants.json`: full boundary-level predictions, Resource attributes, target-info projections, assumptions, pair comparisons, and limitations.",
        "- `alternative-variants.csv`: one flat row per profile and case for website ingestion and editorial filtering.",
        "- `SHA256SUMS`: integrity hashes for the generated dataset and this interpretation guide.",
        "- `model_alternatives.py`: reproducible generator tied to the measured coverage manifest.",
        "",
        "## Interpretation rules",
        "",
        "- `measured` means the proposal is out of path and the value comes directly from the Docker run.",
        "- `conditional` means the value follows deterministically from the proposal rules and assumptions recorded in that row, but no implementation was executed.",
        "- `symbolic` means the design has not specified enough information to produce an exact value.",
        "- Conceptual Resource attributes are modeled separately from their eventual Prometheus label spelling. Translation strategy and unresolved collision rules can change wire names without changing the conceptual value.",
        "",
        "## Known limitations",
        "",
    ]
    lines.extend(f"- {item}" for item in payload["global_limitations"])
    lines += ["", f"Design source: {payload['design_document']['url']}", ""]
    path.write_text("\n".join(lines))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("run_dir", type=pathlib.Path)
    parser.add_argument("output_dir", type=pathlib.Path)
    args = parser.parse_args()
    manifest = json.loads((args.run_dir / "coverage-manifest.json").read_text())
    predictions = [prediction(case, profile) for profile in PROFILES for case in manifest["cases"]]
    comparisons = build_pair_comparisons(predictions, manifest["cases"])
    summary = {}
    for profile in PROFILES:
        selected = [p for p in predictions if p["profile_id"] == profile["id"]]
        paired = [p for p in comparisons if p["profile_id"] == profile["id"]]
        summary[profile["id"]] = {
            "cases": len(selected),
            "applicable_counterfactuals": sum(p["applicable"] for p in selected),
            "unchanged_measured_paths": sum(not p["applicable"] for p in selected),
            "measured": sum(p["confidence"] == "measured" for p in selected),
            "conditional": sum(p["confidence"] == "conditional" for p in selected),
            "symbolic": sum(p["classification"] == "symbolic_counterfactual" for p in selected),
            "source_pairs_same": sum(p["comparison"] == "same" for p in paired),
            "source_pairs_different": sum(p["comparison"] == "different" for p in paired),
            "source_pairs_unresolved": sum(p["comparison"] == "unresolved" for p in paired),
        }

    payload = {
        "artifact_kind": "specification-predicted-counterfactuals",
        "not_runtime_evidence": True,
        "design_document": {"url": DESIGN_URL, "revision_id": DESIGN_REVISION},
        "measured_baseline": {
            "run": args.run_dir.name,
            "coverage": manifest["coverage"],
            "assertions": manifest["assertions"],
            "versions": manifest["versions"],
        },
        "fixture": {
            "application_service": APP_SERVICE,
            "collector_receiver_scrape": SOURCE_SCRAPE,
            "final_sdk_scrape": FINAL_SDK_SCRAPE,
            "final_collector_scrape": FINAL_COLLECTOR_SCRAPE,
            "entities_present": False,
        },
        "profiles": PROFILES,
        "summary": summary,
        "pair_comparisons": comparisons,
        "predictions": predictions,
        "global_limitations": [
            "No released Prometheus or Collector implements these complete alternatives.",
            "The model validates rule consistency, not implementation behavior, performance, wire compatibility, or rollout safety.",
            "Option E output is symbolic because canonical complete-Resource serialization, UUID namespace, entity inference, and the final job/instance policy are unresolved.",
            "Exact target_info wire spelling remains dependent on the downstream translation strategy and unresolved collision rules; conceptual Resource attributes are recorded separately.",
            "Mixed-version producer/consumer rollout states are outside this first dataset.",
        ],
    }
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / "alternative-variants.json").write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    write_csv(args.output_dir / "alternative-variants.csv", predictions)
    write_report(args.output_dir / "README.md", payload)
    hashed = ["README.md", "alternative-variants.csv", "alternative-variants.json"]
    hash_lines = []
    for name in hashed:
        digest = hashlib.sha256((args.output_dir / name).read_bytes()).hexdigest()
        hash_lines.append(f"{digest}  {name}")
    (args.output_dir / "SHA256SUMS").write_text("\n".join(hash_lines) + "\n")

    assert len(predictions) == len(PROFILES) * 58
    assert summary["B"]["source_pairs_same"] == 22
    assert summary["C-default-derive"]["source_pairs_same"] == 22
    assert summary["C-never-derive"]["source_pairs_same"] == 22
    assert summary["C1-default-derive"]["source_pairs_different"] == 16
    assert summary["C1-never-derive"]["source_pairs_different"] == 16
    assert summary["E-symbolic"]["source_pairs_unresolved"] == 16
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
