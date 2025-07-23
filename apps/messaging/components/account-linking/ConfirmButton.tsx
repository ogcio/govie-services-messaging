"use client"
import { Button, Spinner } from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { ONBOARDING_ACTIONS, OnboardingAnalyticsEvent } from "const/analytics"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { confirmAccountLinking } from "@/app/[locale]/secure-messages/[messageId]/actions"

export const ConfirmButton = ({
  currentUserId,
  targetUserId,
  messageId,
}: {
  currentUserId: string
  targetUserId: string
  messageId: string
}) => {
  const t = useTranslations("accountLinking")
  const [isLoading, setIsLoading] = useState(false)
  const analytics = useAnalytics()

  return (
    <Button
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true)
        analytics.trackEvent(
          OnboardingAnalyticsEvent({
            name: "account-linking",
            action: ONBOARDING_ACTIONS.CONFIRM_ACCOUNT_LINKING,
          }),
        )

        const res = await confirmAccountLinking({
          currentUserId,
          targetUserId,
          messageId,
        })

        if (res.error) {
          analytics.trackEvent(
            OnboardingAnalyticsEvent({
              name: "account-linking-failed",
              action: ONBOARDING_ACTIONS.CONFIRM_ACCOUNT_LINKING,
            }),
          )
        }
        setIsLoading(false)
      }}
    >
      {t("confirm")}
      {isLoading && <Spinner />}
    </Button>
  )
}
