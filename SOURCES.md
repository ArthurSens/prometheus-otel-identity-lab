# Sources and claim boundaries

## Editorial sources

- Editorial Brain: https://docs.google.com/document/d/1GNSNFgrh09Qq677mEqfLFe62DdKGtH0W4-wAOogQS2c
- Lab report: https://docs.google.com/document/d/1LKj4Ey2WGNCW45PQFE5W3CgSUuXRlzq7vxcib6llpHU
- Canonical Markdown: https://drive.google.com/file/d/1Tk_u0ocZVLu19xnzVMficZgkohsjwzFF/view
- Reproducibility archive: https://drive.google.com/file/d/1U4NV0Z7ahvBDOufBusfHNNamdrl8By8X/view
- Canonical positioning reference: `conversa_prometheus_otel_dots.pdf` from the referenced ChatGPT conversation.

## Implementation policy

The interactive composer prevents disconnected or role-invalid chains. The OTel SDK and final Prometheus server are fixed; Collector receivers are selected from their incoming protocol; Collector exporters are user-selectable; and optional relay servers always forward through Remote Write 2.0. Custom complete compositions are labeled as not run end-to-end, while their boundary explanations reuse only component rules observed in the clean Lab rerun.

## Version and scope

- Prometheus `3.14.0`
- OpenTelemetry Collector Contrib `0.162.0`
- Clean Docker rerun: 44/44 identity assertions passed
- Analyzed: `job`, `instance`, OTel resource identity, `target_info`
- Out of scope: metric names/types, scope data, histograms, timestamps, temporality, exemplars, and HELP/TYPE/UNIT
