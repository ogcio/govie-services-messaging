"use client"

import {
  type Faro,
  instrumentFaro,
  withFaroErrorBoundary,
} from "@ogcio/o11y-sdk-react"
import { useEffect, useRef } from "react"
import type { getCachedConfig } from "@/utils/env-config"

export const useFaro = ({
  config,
}: {
  config: ReturnType<ReturnType<typeof getCachedConfig>>["o11y"]
}) => {
  const faroRef = useRef<Faro | undefined>(undefined)

  useEffect(() => {
    if (!faroRef.current) {
      faroRef.current = instrumentFaro({
        serviceName: config.clientServiceName,
        collectorUrl: config.faroUrl as string,
        corsTraceHeaders: config.faroCorsAllowedUrls,
        collectorMode: "single",
      })
    }
  }, [config])
}

export const FaroWrapper = ({
  children,
  config,
}: {
  children: React.ReactNode
  config: ReturnType<ReturnType<typeof getCachedConfig>>["o11y"]
}) => {
  useFaro({ config })
  return children
}

// TODO: Wrap layout with this
export const withFaro = (Component: React.ComponentType<unknown>) => {
  return withFaroErrorBoundary(Component, {})
}
