FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /otel-prom-matrix .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /otel-prom-matrix /otel-prom-matrix
EXPOSE 9464
ENTRYPOINT ["/otel-prom-matrix"]
