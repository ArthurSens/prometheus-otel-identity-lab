#!/usr/bin/env bash
set -euo pipefail

LAB_DIR=$(cd "$(dirname "$0")" && pwd)
RUN_ID=${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}
RUN_DIR="$LAB_DIR/raw/runs/$RUN_ID"
NETWORK=${MATRIX_DOCKER_NETWORK:-complete36_lab}
SDK_IMAGE=${MATRIX_SDK_IMAGE:-complete36-sdk}

for command in docker jq python3 shasum; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "required command not found: $command" >&2
    exit 1
  fi
done
if ! docker info >/dev/null 2>&1; then
  echo "Docker is not available. Start Docker and rerun this script." >&2
  exit 1
fi

mkdir -p "$RUN_DIR/cases" "$RUN_DIR/environment"

docker build -t "$SDK_IMAGE" "$LAB_DIR/app" > "$RUN_DIR/environment/sdk-build.log" 2>&1
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
  docker network create "$NETWORK" >/dev/null
fi

cleanup_case() {
  docker rm -f c36-sdk c36-collector c36-prom >/dev/null 2>&1 || true
}
trap cleanup_case EXIT

dcurl() {
  docker run --rm --network "$NETWORK" curlimages/curl:8.12.1 "$@"
}

query() {
  local out=$1 expr=$2
  dcurl -fsS -G --data-urlencode "query=$expr" http://c36-prom:9090/api/v1/query > "$out"
}

wait_url() {
  local url=$1
  for _ in $(seq 1 80); do
    if dcurl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  echo "timed out waiting for $url" >&2
  return 1
}

while IFS= read -r case_id; do
  cleanup_case
  case_dir="$RUN_DIR/cases/$case_id"
  mkdir -p "$case_dir/evidence"
  chmod 0777 "$case_dir/evidence"
  python3 "$LAB_DIR/render_case.py" "$case_id" "$case_dir"

  final=$(jq -r '.case.final' "$case_dir/case.json")
  source=$(jq -r '.case.source' "$case_dir/case.json")
  has_collector=$(jq -r '.case.collector' "$case_dir/case.json")

  prom_args=(
    --config.file=/etc/prometheus/prometheus.yml
    --storage.tsdb.path=/prometheus
    --log.level=debug
  )
  if [[ "$final" == "otlp" ]]; then
    prom_args+=(--web.enable-otlp-receiver)
  elif [[ "$final" == "rw2" ]]; then
    prom_args+=(--web.enable-remote-write-receiver --web.remote-write-receiver.accepted-protobuf-messages=io.prometheus.write.v2.Request)
  fi
  docker run -d --name c36-prom --network "$NETWORK" \
    -v "$case_dir/prometheus.yaml:/etc/prometheus/prometheus.yml:ro" \
    prom/prometheus:v3.14.0 "${prom_args[@]}" >/dev/null
  wait_url http://c36-prom:9090/-/ready

  if [[ "$has_collector" == "true" ]]; then
    docker run -d --name c36-collector --network "$NETWORK" \
      -v "$case_dir/collector.yaml:/etc/otelcol/config.yaml:ro" \
      -v "$case_dir/evidence:/evidence" \
      otel/opentelemetry-collector-contrib:0.162.0 \
      --config=/etc/otelcol/config.yaml \
      --feature-gates=exporter.prometheusremotewritexporter.enableSendingRW2 >/dev/null
  fi

  otlp_endpoint=127.0.0.1:9
  otlp_path=/v1/metrics
  if [[ "$source" == "otlp" ]]; then
    if [[ "$has_collector" == "true" ]]; then
      otlp_endpoint=c36-collector:4318
    else
      otlp_endpoint=c36-prom:9090
      otlp_path=/api/v1/otlp/v1/metrics
    fi
  fi
  docker run -d --name c36-sdk --network "$NETWORK" \
    -e MATRIX_OTLP_ENDPOINT="$otlp_endpoint" \
    -e MATRIX_OTLP_URL_PATH="$otlp_path" \
    -e MATRIX_PROM_TRANSLATION_STRATEGY="$(jq -r '.case.source_strategy // "UnderscoreEscapingWithSuffixes"' "$case_dir/case.json")" \
    "$SDK_IMAGE" >/dev/null
  wait_url http://c36-sdk:9464/healthz

  sleep 8
  dcurl -fsS -H 'Accept: application/openmetrics-text; version=1.0.0; escaping=allow-utf-8' \
    http://c36-sdk:9464/metrics > "$case_dir/source-exposition.txt"
  if [[ "$has_collector" == "true" ]] && [[ "$(jq -r '.case.exporter' "$case_dir/case.json")" == "prom" ]]; then
    dcurl -fsS -H 'Accept: application/openmetrics-text; version=1.0.0; escaping=allow-utf-8' \
      http://c36-collector:9464/metrics > "$case_dir/collector-exposition.txt"
  fi

  query "$case_dir/final-ordinary.json" '{__name__=~"lab[._]requests(_total)?"}'
  query "$case_dir/final-target-info.json" 'target_info'
  query "$case_dir/final-collision.json" 'lab_honor_probe'
  dcurl -fsS http://c36-prom:9090/api/v1/status/config > "$case_dir/final-config-api.json"
  dcurl -fsS http://c36-prom:9090/api/v1/targets > "$case_dir/final-targets.json"

  docker logs c36-sdk > "$case_dir/sdk.log" 2>&1 || true
  docker logs c36-prom > "$case_dir/prometheus.log" 2>&1 || true
  if [[ "$has_collector" == "true" ]]; then
    docker stop c36-collector >/dev/null
    cp "$case_dir/evidence/checkpoint.jsonl" "$case_dir/checkpoint.jsonl"
    docker logs c36-collector > "$case_dir/collector.log" 2>&1 || true
  fi
  echo "captured $case_id"
done < <(jq -r '.[].id' "$LAB_DIR/cases.json")

cleanup_case
docker image inspect "$SDK_IMAGE" otel/opentelemetry-collector-contrib:0.162.0 prom/prometheus:v3.14.0 > "$RUN_DIR/environment/images.json"
docker version > "$RUN_DIR/environment/docker-version.txt"
uname -a > "$RUN_DIR/environment/uname.txt"
cp "$LAB_DIR/cases.json" "$LAB_DIR/render_case.py" "$LAB_DIR/analyze.py" "$LAB_DIR/run.sh" "$RUN_DIR/environment/"

python3 "$LAB_DIR/analyze.py" "$RUN_DIR"
(cd "$RUN_DIR" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 shasum -a 256) > "$RUN_DIR/SHA256SUMS"
printf '%s\n' "$RUN_DIR" | tee "$LAB_DIR/raw/LATEST"
