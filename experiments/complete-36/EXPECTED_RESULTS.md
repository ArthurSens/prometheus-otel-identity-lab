# Expected identity results

The harness treats the final Prometheus label sets as observed, version-specific behavior for Prometheus 3.14.0 and Collector Contrib 0.162.0.

## Stable ordinary-series identity

- Direct and Collector-mediated OTLP routes derive `job="payments/checkout"` and `instance="sdk-1"` from the fixed SDK resource unless a later Prometheus scrape with `honor_labels=false` replaces them.
- With underscore-form SDK exposition, a Collector Prometheus receiver derives primary resource identity from its scrape target. The ordinary downstream identity therefore uses `case-<id>-receiver` and `c36-sdk:9464` unless a later honor-false scrape replaces it.
- With dotted SDK exposition, `target_info`'s `service.name="checkout"`, `service.namespace="payments"`, and `service.instance.id="sdk-1"` replace the receiver-derived service identity. A downstream Prometheus, OTLP, or Remote Write exporter therefore emits `job="payments/checkout"` and `instance="sdk-1"`, unless a later honor-false scrape replaces them.
- A final honor-false scrape assigns `case-<id>-final` and either `c36-sdk:9464` or `c36-collector:9464`, preserving the exporter-provided pair as `exported_job` and `exported_instance`.

## SDK source translation strategy

Each Prometheus-source topology is executed as an exclusive pair:

- The original case uses SDK `UnderscoreEscapingWithSuffixes` and exposes `service_name`, `service_namespace`, and `service_instance_id`.
- Its `Dxx` twin uses SDK `NoTranslation` and exposes `service.name`, `service.namespace`, and `service.instance.id` using quoted OpenMetrics label-name syntax.

The source strategy changes identity authority in 16 of the 22 paired topologies. It does not change authority in the two direct-SDK scrapes or the four Collector Prometheus-exporter routes followed by `honor_labels=false`, because the final scrape target controls identity in those six pairs.

The clearest pair is `U05` and `D04`, which share the same topology:

```text
U05 underscore source -> job="case-u05-receiver", instance="c36-sdk:9464"
D04 dotted source     -> job="payments/checkout", instance="sdk-1"
```

This is the current implementation behavior behind the design discussion's Prometheus → OTel → Prometheus inconsistency.

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

For the dotted counterpart, the receiver Resource contains only the dotted application identity; there is no second underscore application identity to collide with it. With keep=false (`D04`/`D06`), the identifying service attributes are omitted from generated `target_info`. With keep=true (`D05`/`D07`), they are repeated once without semicolon joining.

The complete exact label sets and the 22 paired comparisons belong in the generated `coverage-manifest.json`, not in this prose summary.
