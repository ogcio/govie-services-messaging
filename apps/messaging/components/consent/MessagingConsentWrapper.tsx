"use client"

import { ConsentProvider } from "./ConsentProvider"
import {
  createSampleConsentContent,
  useMessagingConsentConfig,
} from "./messaging-consent-config"
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
  // TODO: This should come from backend/API call
  consentContent = createSampleConsentContent(),
}: {
  children: React.ReactNode
  userContext: ConsentUserContext
  consentStatus: ConsentStatus
  isConsentEnabled: boolean
  consentContent?: ConsentContent // Content from backend
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
    >
      {children}
    </ConsentProvider>
  )
}
