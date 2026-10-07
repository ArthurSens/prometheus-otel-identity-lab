# Reproduce the complete 36-case identity matrix

This directory contains the Docker-based harness used to test every protocol-valid configuration in the website's bounded state space:

- OpenTelemetry SDK output: Prometheus exposition or OTLP/HTTP protobuf
- zero or one OpenTelemetry Collector
- Collector output: Prometheus exposition, OTLP/HTTP protobuf, or Prometheus Remote Write 2.0
- final Prometheus ingestion: scrape, native OTLP, or Remote Write 2.0
- every applicable combination of receiver and final-scrape `honor_labels`
- native OTLP `keep_identifying_resource_attributes=false` and `true`
- `UnderscoreEscapingWithSuffixes` and `NoTranslation`

The authoritative state-space definition is [`cases.json`](cases.json). It contains 36 exact tuples: `E01`–`E09` and `U01`–`U27`.

## Requirements

- Docker with a running Linux-container engine
- Bash
- Python 3
- `jq`
- `shasum`
- internet access for the first run so Docker can download images and Go modules
- approximately 10 minutes and 2 GB of free disk space for a cold run; warm runs are normally faster and smaller

The harness uses these pinned component images:

- `prom/prometheus:v3.14.0`
- `otel/opentelemetry-collector-contrib:0.162.0`
- `curlimages/curl:8.12.1`

The SDK fixture is built locally from [`app/`](app/). It exposes the same resource and metrics over Prometheus exposition while also exporting them over OTLP, letting each tuple select the required source protocol without changing the fixture.

## Run the full matrix

From the repository root:

```bash
./experiments/complete-36/run.sh
```

The script:

1. builds the SDK fixture image;
2. creates a dedicated Docker network;
3. renders exact Collector and Prometheus configuration for each tuple;
4. starts every tuple with a fresh Prometheus container and fresh TSDB;
5. recreates the SDK and, where applicable, Collector containers;
6. captures every observable boundary;
7. runs the named assertions;
8. writes a machine-readable coverage manifest and SHA-256 hashes.

A successful run ends with:

```text
SUMMARY: 272/272 assertions passed; failures=0; coverage=36/36
```

The final output line is the timestamped evidence directory. The same path is written to `experiments/complete-36/raw/LATEST`.

## Evidence produced for every tuple

Each `raw/runs/<timestamp>/cases/<ID>/` directory contains:

- `case.json`: normalized tuple, fixed SDK resource, and transport encodings
- `source-exposition.txt`: exact SDK Prometheus page, also retained as a baseline for OTLP-source cases
- `prometheus.yaml`: final Prometheus configuration
- `final-config-api.json`: configuration returned by the running Prometheus API
- `final-targets.json`: final scrape-target state
- `final-ordinary.json`: final PromQL result for the ordinary SDK metric
- `final-target-info.json`: final `target_info` series and labels
- `final-collision.json`: final result for the `honor_labels` collision probe
- SDK and Prometheus logs

Collector routes additionally contain:

- `collector.yaml`: exact generated Collector configuration
- `checkpoint.jsonl`: structured resource and datapoint state immediately after the Collector receiver
- `collector.log`: detailed debug-exporter output and runtime log
- `collector-exposition.txt`: Collector Prometheus exporter page, when applicable

At the run root:

- `coverage-manifest.json` maps every case ID to its tuple, final series, evidence inventory, sizes, and hashes;
- `assertions.txt` contains every named pass/fail check;
- `SHA256SUMS` covers the complete run;
- `environment/` records Docker, container-image, host, and harness metadata.

Binary OTLP and Remote Write 2.0 payloads are not packet-decoded. The structured Collector checkpoint records the logical state immediately before export, and the final Prometheus queries record the post-transport state.

## Inspect a result

```bash
run_dir=$(cat experiments/complete-36/raw/LATEST)
jq '.coverage, .assertions' "$run_dir/coverage-manifest.json"
sed -n '1,40p' "$run_dir/assertions.txt"
jq '.data.result[].metric' "$run_dir/cases/U13/final-collision.json"
jq '.data.result[].metric' "$run_dir/cases/U06/final-target-info.json"
```

`U13` demonstrates the three identity generations created by two honor-false scrape boundaries. `U06` demonstrates the semicolon-joined identifying values produced by keep=true plus underscore translation after a Prometheus receiver.

See [`EXPECTED_RESULTS.md`](EXPECTED_RESULTS.md) for the principal invariants and the cases that exercise them.

## Rerun with a separate namespace

The defaults are safe for one run at a time. To avoid colliding with another local invocation, override the Docker network and SDK image names:

```bash
MATRIX_DOCKER_NETWORK=complete36_alice \
MATRIX_SDK_IMAGE=complete36-sdk-alice \
RUN_ID=alice-$(date -u +%Y%m%dT%H%M%SZ) \
./experiments/complete-36/run.sh
```

The running containers intentionally use stable names (`c36-sdk`, `c36-collector`, and `c36-prom`), so concurrent full runs on the same Docker daemon are not supported.

## Troubleshooting

If the script reports that Docker is unavailable, start Docker and confirm `docker info` succeeds. If a case times out, inspect that case's component logs in the timestamped run directory. The script removes its three case containers on normal exit or interruption; it leaves the Docker network, fixture image, and evidence files for inspection.

To remove only the reusable harness resources after a run:

```bash
docker network rm complete36_lab
docker image rm complete36-sdk
```

Delete a timestamped directory under `raw/runs/` only when its evidence is no longer needed. Generated evidence is ignored by Git.

## Scope boundary

This is complete coverage of the finite zero-or-one-Collector state space encoded in `cases.json`. It does not claim exhaustive coverage of arbitrary Collector graphs, intermediate Prometheus relay servers, multiple scrape-relabeling stages, vendor backends, malformed resource identity, or translation strategies other than the two listed above.
