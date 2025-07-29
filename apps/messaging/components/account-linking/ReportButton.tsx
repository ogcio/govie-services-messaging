"use client"
import { Button, Spinner } from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { ONBOARDING_ACTIONS, OnboardingAnalyticsEvent } from "const/analytics"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { reportAccountLinking } from "@/app/[locale]/secure-messages/[messageId]/actions"

export const ReportButton = () => {
  const t = useTranslations("accountLinking")
  const [isLoading, setIsLoading] = useState(false)
  const analytics = useAnalytics()

  return (
    <Button
      variant='secondary'
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true)
        analytics.trackEvent(
          OnboardingAnalyticsEvent({
            name: "report-account-linking",
            action: ONBOARDING_ACTIONS.REPORT_ACCOUNT_LINKING,
          }),
        )
        await reportAccountLinking()
        setIsLoading(false)
      }}
    >
      {t("report")}
      {isLoading && <Spinner />}
    </Button>
  )
}
