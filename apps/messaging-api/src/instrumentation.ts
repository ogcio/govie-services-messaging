import { instrumentNode, type SDKLogLevel } from "@ogcio/o11y-sdk-node";

await instrumentNode({
  serviceName: process.env.OTEL_SERVER_SERVICE_NAME,
  collectorUrl: process.env.OTEL_COLLECTOR_URL as string,
  collectorMode: "batch",
  diagLogLevel: (process.env.OTEL_LOG_LEVEL as SDKLogLevel) ?? "ERROR",
  ignoreUrls: [{ type: "equals", url: "/health" }],
});
