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
- 676/676 named assertions passed
- Included: `job`, `instance`, OTel resource identity, and `target_info`
- Excluded: metric names/types, scope data, histograms, timestamps, temporality, exemplars, and HELP/TYPE/UNIT

The workbench uses the Lab's constrained topology: the OTel SDK source and final Prometheus server are fixed, with zero or one optional Collector represented as a receiver/exporter pair. Receivers and Prometheus ingestion modes follow the adjacent protocol automatically; exporters remain switchable. Prometheus-source topologies are crossed with the SDK Prometheus exporter's `UnderscoreEscapingWithSuffixes` and `NoTranslation` strategies, so the source exposes either underscore-form or dotted resource labels in each case, never both. Every valid composition maps to its exact Lab case ID. The complete matrix is linked as reference material instead of being presented as a preset launcher.

Each pipeline can independently show measured current behavior or one of the stakeholder alternatives B, C, C.1, and E. C and C.1 expose their service-attribute defaulting choice. The output inspector can trace one alternative or compare two independently configured pipelines and alternatives. The interface labels unaffected rows as measured, affected B/C/C.1 outcomes as specification-predicted, and Option E as symbolic where its resource-ID synthesis or output-label policy remains unresolved.

Trace mode follows identity through one pipeline and supports a contiguous boundary range. Compare mode clones the current route into Pipeline B, then lets each pipeline independently add or remove its Collector and select the boundary output to compare. Its correlation is symmetric rather than directional: same-name labels are paired before values are compared, value-preserving renames are treated as remaps, and one-sided labels are marked as A-only or B-only. Protocol and configuration controls remain inside the SDK, Collector, or Prometheus component that owns them, so A and B can be varied independently without losing the connection between a setting and its effect.

## Reproduce the Lab matrix

The full Docker test harness is checked in under [`experiments/complete-36`](experiments/complete-36). The historical directory name is retained so existing links keep working; the harness now executes the expanded 58-case matrix against fresh Prometheus storage, captures every boundary, and regenerates the assertion report, source-strategy comparison, and coverage manifest.

The reproduction fixture uses stable scrape jobs across the matrix: `identity-lab-source` at the Collector receiver and `identity-lab-final` at the final Prometheus scrape. Case attribution is carried separately by `coverage_case`.

```bash
./experiments/complete-36/run.sh
```

The lab also includes a separate [specification-predicted alternatives dataset](experiments/complete-36/predicted/README.md). It applies the stakeholder proposals B, C, C.1, and E to the measured matrix without presenting those counterfactuals as runtime evidence.

See the [complete reproduction guide](experiments/complete-36/README.md) for prerequisites, evidence layout, inspection commands, expected results, and troubleshooting.
