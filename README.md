# Prometheus × OpenTelemetry Identity Lab

Static, dependency-free technical explainer based on Arthur's Editorial Brain and the clean identity-boundary Lab rerun. The presentation is intentionally evidence-first and avoids product or campaign framing.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Evidence scope

- OpenTelemetry Collector Contrib `0.162.0`
- Prometheus `3.14.0`
- 44/44 identity assertions passed
- Included: `job`, `instance`, OTel resource identity, and `target_info`
- Excluded: metric names/types, scope data, histograms, timestamps, temporality, exemplars, and HELP/TYPE/UNIT

The workbench uses a constrained topology: the OTel SDK source and final Prometheus server are fixed, optional stages are inserted between them, and each Collector is represented as a receiver/exporter pair. Receivers and Prometheus ingestion modes follow the adjacent protocol automatically; exporters remain switchable. Custom topologies are marked as structurally valid but not run end-to-end.
