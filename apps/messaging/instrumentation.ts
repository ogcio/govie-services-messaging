import type { SDKLogLevel } from "@ogcio/o11y-sdk-node"
import { getCachedConfig } from "./utils/env-config"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    import("@ogcio/o11y-sdk-node").then(async (sdk) => {
      const { o11y } = getCachedConfig()()
      await sdk.instrumentNode({
        serviceName: o11y.serverServiceName,
        collectorUrl: o11y.collectorUrl as string,
        collectorMode: "batch",
        diagLogLevel: (o11y.logLevel as SDKLogLevel) ?? "ERROR",
        resourceAttributes: {},
        spanAttributes: {},
      })
    })
  }
}
