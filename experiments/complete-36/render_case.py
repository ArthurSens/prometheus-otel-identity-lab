#!/usr/bin/env python3
import json
import pathlib
import sys


ROOT = pathlib.Path(__file__).resolve().parent


def yn(value):
    return "true" if value else "false"


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: render_case.py CASE_ID OUTPUT_DIRECTORY")
    case_id = sys.argv[1]
    output = pathlib.Path(sys.argv[2])
    cases = {case["id"]: case for case in json.loads((ROOT / "cases.json").read_text())}
    if case_id not in cases:
        raise SystemExit(f"unknown case: {case_id}")
    case = cases[case_id]
    output.mkdir(parents=True, exist_ok=True)

    prom_lines = [
        "global:",
        "  scrape_interval: 1s",
        "  evaluation_interval: 1s",
    ]
    if case["final"] == "scrape":
        target = "c36-collector:9464" if case.get("collector") else "c36-sdk:9464"
        prom_lines += [
            "scrape_configs:",
            "  - job_name: identity-lab-final",
            f"    honor_labels: {yn(case['final_honor'])}",
            "    scrape_protocols: [OpenMetricsText1.0.0, PrometheusText1.0.0, PrometheusText0.0.4]",
            "    static_configs:",
            f"      - targets: [{target}]",
            f"        labels: {{coverage_case: {case_id}}}",
        ]
    else:
        prom_lines += ["scrape_configs: []"]
    if case["final"] == "otlp":
        prom_lines += [
            "otlp:",
            f"  translation_strategy: {case['strategy']}",
            f"  keep_identifying_resource_attributes: {yn(case['keep'])}",
        ]
    (output / "prometheus.yaml").write_text("\n".join(prom_lines) + "\n")

    if case.get("collector"):
        receiver = "otlp"
        receiver_config = [
            "  otlp:",
            "    protocols:",
            "      http:",
            "        endpoint: 0.0.0.0:4318",
        ]
        if case["source"] == "prom":
            receiver = "prometheus/source"
            receiver_config = [
                "  prometheus/source:",
                "    config:",
                "      scrape_configs:",
                "        - job_name: identity-lab-source",
                "          scrape_interval: 1s",
                f"          honor_labels: {yn(case['receiver_honor'])}",
                "          static_configs:",
                "            - targets: [c36-sdk:9464]",
                f"              labels: {{coverage_case: {case_id}}}",
            ]

        exporter_name = "otlp_http/final"
        exporter_config = [
            "  otlp_http/final:",
            "    metrics_endpoint: http://c36-prom:9090/api/v1/otlp/v1/metrics",
            "    tls: {insecure: true}",
        ]
        if case["exporter"] == "prom":
            exporter_name = "prometheus/final"
            exporter_config = [
                "  prometheus/final:",
                "    endpoint: 0.0.0.0:9464",
                "    enable_open_metrics: true",
                f"    translation_strategy: {case['strategy']}",
                "    resource_to_telemetry_conversion: {enabled: false}",
            ]
        elif case["exporter"] == "rw2":
            exporter_name = "prometheus_remote_write/final"
            exporter_config = [
                "  prometheus_remote_write/final:",
                "    endpoint: http://c36-prom:9090/api/v1/write",
                "    tls: {insecure: true}",
                "    protobuf_message: io.prometheus.write.v2.Request",
                f"    translation_strategy: {case['strategy']}",
            ]

        collector_lines = ["receivers:"] + receiver_config + [
            "processors:",
            "  batch:",
            "    timeout: 500ms",
            "exporters:",
            "  debug/checkpoint:",
            "    verbosity: detailed",
            "  file/checkpoint:",
            "    path: /evidence/checkpoint.jsonl",
            "    format: json",
            "    flush_interval: 500ms",
        ] + exporter_config + [
            "service:",
            "  pipelines:",
            "    metrics:",
            f"      receivers: [{receiver}]",
            "      processors: [batch]",
            f"      exporters: [debug/checkpoint, file/checkpoint, {exporter_name}]",
            "  telemetry:",
            "    logs:",
            "      level: info",
        ]
        (output / "collector.yaml").write_text("\n".join(collector_lines) + "\n")

    sender = {
        "case": case,
        "sdk_resource": {
            "service.namespace": "payments",
            "service.name": "checkout",
            "service.instance.id": "sdk-1",
            "deployment.environment.name": "lab",
            "resource.custom": "resource-value",
        },
        "sdk_prometheus_endpoint": "http://c36-sdk:9464/metrics",
        "otlp_encoding": "OTLP/HTTP protobuf",
        "remote_write_encoding": "io.prometheus.write.v2.Request",
    }
    (output / "case.json").write_text(json.dumps(sender, indent=2, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
