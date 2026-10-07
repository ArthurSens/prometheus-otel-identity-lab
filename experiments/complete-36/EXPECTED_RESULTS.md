# Expected identity results

The harness treats the final Prometheus label sets as observed, version-specific behavior for Prometheus 3.14.0 and Collector Contrib 0.162.0.

## Stable ordinary-series identity

- Direct and Collector-mediated OTLP routes derive `job="payments/checkout"` and `instance="sdk-1"` from the fixed SDK resource unless a later Prometheus scrape with `honor_labels=false` replaces them.
- A Collector Prometheus receiver derives primary resource identity from its scrape target. The ordinary downstream identity therefore uses `case-<id>-receiver` and `c36-sdk:9464` unless a later honor-false scrape replaces it.
- A final honor-false scrape assigns `case-<id>-final` and either `c36-sdk:9464` or `c36-collector:9464`, preserving the exporter-provided pair as `exported_job` and `exported_instance`.

## Collision-probe behavior

The SDK exposition includes:

```text
lab_honor_probe{job="sdk-metric-job",instance="sdk-metric-instance"} 1
```

- With receiver `honor_labels=false`, the receiver target is primary and the SDK pair becomes `exported_job` and `exported_instance` datapoint attributes.
- With receiver `honor_labels=true`, the SDK pair remains active and creates a second resource identity. Prometheus, OTLP, and Remote Write exporters materialize that resource as a second `target_info` series. Cases `U09`–`U12`, `U16`–`U19`, and `U22`–`U23` exercise this behavior.
- With two honor-false scrape boundaries, the collision probe preserves three generations: final `job`/`instance`, original SDK `exported_job`/`exported_instance`, and intermediate receiver `exported_exported_job`/`exported_exported_instance`. Case `U13` is the clearest example.

## Native OTLP keep behavior

- `keep_identifying_resource_attributes=false` omits the duplicated dotted identifying attributes from `target_info`; it does not change the ordinary derived `job` and `instance`.
- `keep_identifying_resource_attributes=true` repeats the identifying resource attributes on `target_info`; it still does not change the ordinary derived pair.
- After a Prometheus receiver, the resource can contain both dotted primary identity and underscore-form identity recovered from the source `target_info`.

## Translation collision

For cases such as `U06` and `U10`, `UnderscoreEscapingWithSuffixes` maps dotted primary identity onto the same Prometheus label keys as the recovered underscore attributes. Prometheus preserves both values by joining them:

```text
service_name="case-u06-receiver;checkout"
service_instance_id="c36-sdk:9464;sdk-1"
```

For `U08` and `U12`, `NoTranslation` keeps the concepts distinguishable:

```text
service.name="case-u08-receiver"
service_name="checkout"
service.instance.id="c36-sdk:9464"
service_instance_id="sdk-1"
```

The complete exact label sets belong in the generated `coverage-manifest.json`, not in this prose summary.
