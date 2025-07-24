"use client"

import { useAnalytics } from "@ogcio/nextjs-analytics"
import { ANALYTICS } from "const/analytics"
import { useEffect, useRef } from "react"
import GenericPageError from "@/components/GenericPageError"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const analyticsClient = useAnalytics()

  const trackEventRef = useRef(analyticsClient.trackEvent)

  useEffect(() => {
    trackEventRef.current({
      event: {
        name: ANALYTICS.system.error.name,
        category: ANALYTICS.system.category,
        action: ANALYTICS.system.error.action,
      },
    })
  }, [])

  return <GenericPageError error={error} reset={reset} />
}
