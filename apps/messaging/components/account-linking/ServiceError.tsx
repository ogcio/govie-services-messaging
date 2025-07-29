"use client"
import { Button, Paragraph, Spinner, Stack } from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { ONBOARDING_ACTIONS, OnboardingAnalyticsEvent } from "const/analytics"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { reportAccountLinkingServiceError } from "@/app/[locale]/secure-messages/[messageId]/actions"
import { DEFAULT_STACK_GAP } from "./const"

export const ServiceError = () => {
  const analytics = useAnalytics()
  const t = useTranslations("accountLinking")
  const [isLoading, setIsLoading] = useState(false)

  return (
    <Stack direction='column' gap={DEFAULT_STACK_GAP}>
      <Paragraph>
        {t.rich("error.server", {
          bold: (chunks) => <b>{chunks}</b>,
        })}
      </Paragraph>
      <Button
        variant='secondary'
        disabled={isLoading}
        onClick={async () => {
          setIsLoading(true)
          analytics.trackEvent(
            OnboardingAnalyticsEvent({
              name: "report-account-linking-service-error",
              action: ONBOARDING_ACTIONS.REPORT_ACCOUNT_LINKING,
            }),
          )

          await reportAccountLinkingServiceError()
          setIsLoading(false)
        }}
      >
        {t("report")}
        {isLoading && <Spinner />}
      </Button>
    </Stack>
  )
}
