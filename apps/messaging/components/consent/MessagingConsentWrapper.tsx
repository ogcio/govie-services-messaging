"use client"

import { ConsentProvider } from "./ConsentProvider"
import { useMessagingConsentConfig } from "./messaging-consent-config"
import type { ConsentContent, ConsentStatus, ConsentUserContext } from "./types"

/**
 * Wrapper component that creates messaging-specific consent configuration
 * and provides it to the ConsentProvider
 */
export const MessagingConsentWrapper = ({
  children,
  userContext,
  consentStatus,
  isConsentEnabled,
  consentContent,
  userConsentVersion,
}: {
  children: React.ReactNode
  userContext: ConsentUserContext
  consentStatus: ConsentStatus
  isConsentEnabled: boolean
  consentContent: ConsentContent
  userConsentVersion?: string // Version ID the user consented to
}) => {
  const config = useMessagingConsentConfig({
    content: consentContent,
    isConsentEnabled,
  })

  return (
    <ConsentProvider
      config={config}
      userContext={userContext}
      consentStatus={consentStatus}
      userConsentVersion={userConsentVersion}
    >
      {children}
    </ConsentProvider>
  )
}
