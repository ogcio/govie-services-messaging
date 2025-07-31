"use client"

import { Alert, Link } from "@govie-ds/react"
import { useTranslations } from "next-intl"
import { useFeatureFlags } from "../FeatureFlagsProvider"
import { useConsent } from "./ConsentProvider"

export const ConsentBanner = ({ profileUrl }: { profileUrl: string }) => {
  const { isConsentEnabled } = useFeatureFlags()
  const t = useTranslations("home")
  const { isOptedOut } = useConsent()
  if (!isOptedOut || !isConsentEnabled) {
    return null
  }
  return (
    <div className='gi-mb-4'>
      <Alert
        variant='info'
        title={
          t.rich("consent.title", {
            b: (chunks) => <b>{chunks}</b>,
            link: (chunks) => (
              <Link href={new URL(profileUrl).href}>{chunks}</Link>
            ),
          }) as string
        }
      />
    </div>
  )
}
