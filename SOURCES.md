# Sources and claim boundaries

## Editorial sources

- Editorial Brain: https://docs.google.com/document/d/1GNSNFgrh09Qq677mEqfLFe62DdKGtH0W4-wAOogQS2c
- Complete Lab report: https://docs.google.com/document/d/1NcVE-wGccI8HcNW2TFuiN3mBDNtKw5h6-Kw7gb7rRGk/edit
- Canonical Markdown: https://drive.google.com/file/d/1Tk_u0ocZVLu19xnzVMficZgkohsjwzFF/view
- Reproducibility archive: https://drive.google.com/file/d/1U4NV0Z7ahvBDOufBusfHNNamdrl8By8X/view
- Canonical positioning reference: `conversa_prometheus_otel_dots.pdf` from the referenced ChatGPT conversation.

## Implementation policy

The interactive composer prevents disconnected or role-invalid chains. The OTel SDK and final Prometheus server are fixed; Collector receivers are selected from their incoming protocol; Collector exporters are user-selectable; and optional relay servers always forward through Remote Write 2.0. All 58 zero-or-one-Collector configurations are matched to the authoritative Lab tuple manifest. Prometheus-source routes expose an SDK-owned translation control that selects either flattened or dotted `target_info` resource keys, never both. The inspector represents the resulting identity-authority change, semicolon-joined values under keep=true plus underscore translation, distinct dotted/underscore keys under `NoTranslation`, and double-prefixed exported identity after two honor-false scrape boundaries. The Lab's artificial `lab_honor_probe` series is intentionally excluded from the workbench. Relay and multi-Collector compositions remain labeled as outside the complete matrix.

## Version and scope

- Prometheus `3.14.0`
- OpenTelemetry Collector Contrib `0.162.0`
- Clean Docker rerun: 58/58 exact configurations covered; 632/632 named assertions passed
- Prometheus-source coverage: 22 topology pairs, each run once with underscore-form SDK exposition and once with dotted SDK exposition
- Analyzed: `job`, `instance`, OTel resource identity, `target_info`
- Out of scope: metric names/types, scope data, histograms, timestamps, temporality, exemplars, and HELP/TYPE/UNIT
