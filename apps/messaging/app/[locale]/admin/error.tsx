"use client"

import { useAnalytics } from "@ogcio/nextjs-analytics"
import { ANALYTICS } from "const/analytics"
import { useEffect } from "react"
import GenericPageError from "@/components/GenericPageError"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const analyticsClient = useAnalytics()

  // biome-ignore lint/correctness/useExhaustiveDependencies: legacy
  useEffect(() => {
    analyticsClient.trackEvent({
      event: {
        name: ANALYTICS.system.error.name,
        category: ANALYTICS.system.category,
        action: ANALYTICS.system.error.action,
      },
    })
  }, [])

  return <GenericPageError error={error} reset={reset} />
}
