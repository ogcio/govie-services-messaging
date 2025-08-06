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
  userConsentStatementId,
}: {
  children: React.ReactNode
  userContext: ConsentUserContext
  consentStatus: ConsentStatus
  isConsentEnabled: boolean
  consentStatementContent: ConsentStatementContent
  userConsentStatementId: string | null
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
      userConsentStatementId={userConsentStatementId}
    >
      {children}
    </ConsentProvider>
  )
}
