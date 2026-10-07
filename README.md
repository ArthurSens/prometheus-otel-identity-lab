# Prometheus × OpenTelemetry Identity Lab

Static, dependency-free interactive site based on Arthur's Editorial Brain and the clean identity-boundary Lab rerun.

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

The UI does not invent results for arbitrary chains. Any adjacency not present in the Lab report is explicitly marked unsupported.
