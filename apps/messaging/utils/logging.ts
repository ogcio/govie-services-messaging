import { getCommonLogger } from "@ogcio/nextjs-logging-wrapper/common-logger"
import type { Level } from "pino"
import { getCachedConfig } from "./env-config"

const isValidLogLevel = (logLevel: string | undefined): logLevel is Level => {
  return (
    logLevel !== undefined &&
    ["fatal", "error", "warn", "info", "debug", "trace"].includes(logLevel)
  )
}

export function getCommonLoggerWithEnvLevel() {
  const { logLevel } = getCachedConfig()()
  return getCommonLogger(
    isValidLogLevel(logLevel) ? (logLevel as Level) : undefined,
  )
}
