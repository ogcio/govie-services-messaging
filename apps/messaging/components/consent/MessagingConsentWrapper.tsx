"use client"

import { ConsentProvider } from "./ConsentProvider"
import { useMessagingConsentConfig } from "./messaging-consent-config"
import type {
  ConsentStatementContent,
  ConsentStatus,
  ConsentUserContext,
} from "./types"

/**
 * Wrapper component that creates messaging-specific consent configuration
 * and provides it to the ConsentProvider
 */
export const MessagingConsentWrapper = ({
  children,
  userContext,
  consentStatus,
  isConsentEnabled,
  consentStatementContent,
  userConsentVersion,
}: {
  children: React.ReactNode
  userContext: ConsentUserContext
  consentStatus: ConsentStatus
  isConsentEnabled: boolean
  consentStatementContent: ConsentStatementContent
  userConsentVersion?: string // Version ID the user consented to
}) => {
  const config = useMessagingConsentConfig({
    content: consentStatementContent,
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
