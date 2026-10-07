# Prometheus × OpenTelemetry Identity Lab

Static, dependency-free technical explainer based on Arthur's Editorial Brain and the clean identity-boundary Lab rerun. The presentation is intentionally evidence-first and avoids product or campaign framing.

Live site: https://arthursens.github.io/prometheus-otel-identity-lab/

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Evidence scope

- OpenTelemetry Collector Contrib `0.162.0`
- Prometheus `3.14.0`
- 58/58 exact zero-or-one-Collector configurations covered
- 632/632 named assertions passed
- Included: `job`, `instance`, OTel resource identity, and `target_info`
- Excluded: metric names/types, scope data, histograms, timestamps, temporality, exemplars, and HELP/TYPE/UNIT

The workbench uses a constrained topology: the OTel SDK source and final Prometheus server are fixed, optional stages are inserted between them, and each Collector is represented as a receiver/exporter pair. Receivers and Prometheus ingestion modes follow the adjacent protocol automatically; exporters remain switchable. Prometheus-source topologies are now crossed with the SDK Prometheus exporter's `UnderscoreEscapingWithSuffixes` and `NoTranslation` strategies, so the source exposes either underscore-form or dotted resource labels in each case, never both. Every configuration with zero or one Collector maps to its exact Lab case ID. Intermediate Prometheus relays and multi-Collector graphs remain outside the complete matrix and are labeled accordingly.

## Reproduce the Lab matrix

The full Docker test harness is checked in under [`experiments/complete-36`](experiments/complete-36). The historical directory name is retained so existing links keep working; the harness now executes the expanded 58-case matrix against fresh Prometheus storage, captures every boundary, and regenerates the assertion report, source-strategy comparison, and coverage manifest.

```bash
./experiments/complete-36/run.sh
```

See the [complete reproduction guide](experiments/complete-36/README.md) for prerequisites, evidence layout, inspection commands, expected results, and troubleshooting.
