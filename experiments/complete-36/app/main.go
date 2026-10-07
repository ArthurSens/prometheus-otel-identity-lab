package main

import (
	"context"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	otelprom "go.opentelemetry.io/otel/exporters/prometheus"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.37.0"
)

func main() {
	ctx := context.Background()
	res, err := resource.New(ctx,
		resource.WithSchemaURL(semconv.SchemaURL),
		resource.WithAttributes(
			semconv.ServiceName("checkout"),
			semconv.ServiceNamespace("payments"),
			semconv.ServiceInstanceID("sdk-1"),
			attribute.String("deployment.environment.name", "lab"),
			attribute.String("resource.custom", "resource-value"),
		),
	)
	must(err)

	promReader, err := otelprom.New()
	must(err)
	otlpOptions := []otlpmetrichttp.Option{
		otlpmetrichttp.WithEndpoint(env("MATRIX_OTLP_ENDPOINT", "collector:4318")),
		otlpmetrichttp.WithInsecure(),
	}
	if urlPath := os.Getenv("MATRIX_OTLP_URL_PATH"); urlPath != "" {
		otlpOptions = append(otlpOptions, otlpmetrichttp.WithURLPath(urlPath))
	}
	otlpExporter, err := otlpmetrichttp.New(ctx, otlpOptions...)
	must(err)
	otlpReader := sdkmetric.NewPeriodicReader(otlpExporter, sdkmetric.WithInterval(2*time.Second))
	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
		sdkmetric.WithReader(promReader),
		sdkmetric.WithReader(otlpReader),
	)
	defer func() { _ = mp.Shutdown(ctx) }()

	meter := mp.Meter("matrix.scope",
		metric.WithInstrumentationVersion("1.2.3"),
		metric.WithSchemaURL("https://example.com/schemas/matrix/1.0"),
		metric.WithInstrumentationAttributes(attribute.String("scope.attr", "scope-value")),
	)
	requests, err := meter.Int64Counter("lab.requests",
		metric.WithDescription("Requests processed by the matrix workload"),
		metric.WithUnit("{request}"),
	)
	must(err)
	duration, err := meter.Float64Histogram("lab.request.duration",
		metric.WithDescription("Synthetic request duration"),
		metric.WithUnit("s"),
		metric.WithExplicitBucketBoundaries(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5),
	)
	must(err)
	inflight, err := meter.Int64UpDownCounter("lab.inflight",
		metric.WithDescription("Synthetic in-flight requests"),
		metric.WithUnit("{request}"),
	)
	must(err)
	temperature, err := meter.Float64Gauge("lab.temperature",
		metric.WithDescription("Synthetic gauge with a dot in its name"),
		metric.WithUnit("Cel"),
	)
	must(err)

	attrs := metric.WithAttributes(
		attribute.String("route", "/checkout"),
		attribute.String("http.request.method", "GET"),
		attribute.String("metric.custom", "metric-value"),
	)

	// This control makes honor_labels observable by deliberately colliding with
	// the job and instance labels assigned by Prometheus scrape targets.
	honorProbe := prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Name: "lab_honor_probe",
		Help: "Control metric whose job and instance labels collide with scrape labels",
	}, []string{"job", "instance"})
	prometheus.MustRegister(honorProbe)
	honorProbe.WithLabelValues("sdk-metric-job", "sdk-metric-instance").Set(1)

	go func() {
		var n int64
		for {
			n++
			requests.Add(ctx, 1, attrs)
			duration.Record(ctx, 0.008+0.011*math.Mod(float64(n), 12), attrs)
			inflight.Add(ctx, 1, attrs)
			temperature.Record(ctx, 20.0+math.Mod(float64(n), 5), attrs)
			inflight.Add(ctx, -1, attrs)
			time.Sleep(500 * time.Millisecond)
		}
	}()

	http.Handle("/metrics", promhttp.HandlerFor(
		prometheus.DefaultGatherer,
		promhttp.HandlerOpts{EnableOpenMetrics: true},
	))
	http.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = fmt.Fprintln(w, "ok")
	})
	log.Printf("resource service.namespace=payments service.name=checkout service.instance.id=sdk-1 deployment.environment.name=lab resource.custom=resource-value")
	log.Printf("listening on :9464; OTLP endpoint=%s path=%s", env("MATRIX_OTLP_ENDPOINT", "collector:4318"), env("MATRIX_OTLP_URL_PATH", "/v1/metrics"))
	log.Fatal(http.ListenAndServe(":9464", nil))
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}
