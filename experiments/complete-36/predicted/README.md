# Specification-predicted identity variants

> These are counterfactual predictions, not runtime test results. No released Prometheus or OpenTelemetry Collector implements the complete alternatives.

## Baseline and method

The input is the clean `stable-scrape-identity-20261007` Docker run: 58/58 cases and 676/676 measured assertions passed.

For every case and profile, the model preserves the measured topology, applies the proposal at each Prometheus-to-OTLP or OTLP-to-Prometheus boundary, and then applies the existing final scrape behavior. Direct Prometheus scrapes and native SDK OTLP paths remain measured and unchanged. The fixture contains no EntityRefs.

## Profiles

| Profile | Rule | Source-pair result | Status |
| --- | --- | --- | --- |
| `B` | Option B — namespaced scrape pair, pair first | 22 same, 0 different | conditional on stated design rules |
| `C-default-derive` | Option C — declared first, current derivation retained | 22 same, 0 different | conditional on stated design rules |
| `C-never-derive` | Option C — declared first, never-derive enabled | 22 same, 0 different | conditional on stated design rules |
| `C1-default-derive` | Option C.1 — no underscore recognition, current derivation retained | 6 same, 16 different | conditional on stated design rules |
| `C1-never-derive` | Option C.1 — no underscore recognition, never-derive enabled | 6 same, 16 different | conditional on stated design rules |
| `E-symbolic` | Option E — otel_resource_id join key (symbolic) | 6 same, 0 different, 16 unresolved | symbolic |

Each profile covers all 58 cases. Forty cases cross an affected Collector Prometheus-receiver boundary; eighteen paths are unchanged measured behavior.

## Principal predictions

- **B:** all 22 underscore/dotted source pairs converge on final ordinary identity. Where no later scrape overrides it, the preserved `prometheus.job` and `prometheus.instance` pair becomes `job` and `instance`.
- **C:** all 22 pairs converge because the three bare underscore service forms are recovered as semantic `service.*` declarations. Where no later scrape overrides it, the application pair `payments/checkout / sdk-1` becomes authoritative.
- **C.1:** 16 pairs remain different and 6 remain the same, matching the current authority split. Underscore application values survive as uninterpreted raw attributes, while the scrape pair is preserved separately.
- **E:** 18 unaffected paths retain measured values. The remaining 40 are symbolic because exact `otel_resource_id`, entity synthesis, and the future `job`/`instance` policy are not standardized.
- Final `honor_labels=false` scrapes still mask an upstream identity choice by assigning `identity-lab-final`; the dataset retains the upstream pair so editors can show the hidden transformation.
- The proposals do not change the expected `target_info` cardinality in this fixture. Receiver `honor_labels` remains the cardinality control.

## Representative U05/D04 pair

| Profile | U05 underscore source | D04 dotted source |
| --- | --- | --- |
| Current measured | `identity-lab-source / c36-sdk:9464` | `payments/checkout / sdk-1` |
| B | `identity-lab-source / c36-sdk:9464` | `identity-lab-source / c36-sdk:9464` |
| C, either derivation profile | `payments/checkout / sdk-1` | `payments/checkout / sdk-1` |
| C.1, either derivation profile | `identity-lab-source / c36-sdk:9464` | `payments/checkout / sdk-1` |
| E | `job`/`instance` policy-dependent; `otel_resource_id=uuidv5(<canonical-complete-resource-identity>)` | same unresolved form |

## Data files

- `alternative-variants.json`: full boundary-level predictions, Resource attributes, target-info projections, assumptions, pair comparisons, and limitations.
- `alternative-variants.csv`: one flat row per profile and case for website ingestion and editorial filtering.
- `SHA256SUMS`: integrity hashes for the generated dataset and this interpretation guide.
- `model_alternatives.py`: reproducible generator tied to the measured coverage manifest.

## Interpretation rules

- `measured` means the proposal is out of path and the value comes directly from the Docker run.
- `conditional` means the value follows deterministically from the proposal rules and assumptions recorded in that row, but no implementation was executed.
- `symbolic` means the design has not specified enough information to produce an exact value.
- Conceptual Resource attributes are modeled separately from their eventual Prometheus label spelling. Translation strategy and unresolved collision rules can change wire names without changing the conceptual value.

## Known limitations

- No released Prometheus or Collector implements these complete alternatives.
- The model validates rule consistency, not implementation behavior, performance, wire compatibility, or rollout safety.
- Option E output is symbolic because canonical complete-Resource serialization, UUID namespace, entity inference, and the final job/instance policy are unresolved.
- Exact target_info wire spelling remains dependent on the downstream translation strategy and unresolved collision rules; conceptual Resource attributes are recorded separately.
- Mixed-version producer/consumer rollout states are outside this first dataset.

Design source: https://docs.google.com/document/d/1jHfIOriXvBAFQ9PwRRuEqnmDH8nQ3U1cistdfE7XOIE/edit?tab=t.bnx0d8mtm00h
