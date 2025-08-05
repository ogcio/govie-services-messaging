import { useAnalytics } from "@ogcio/nextjs-analytics"
import { ConsentAnalyticsEvent } from "./analytics"
import { CONSENT_SUBJECT } from "./const"
import { createMessagingConsentAPI } from "./messaging-consent-api-impl"
import type {
  ConsentAction,
  ConsentAnalyticsTracker,
  ConsentConfig,
  ConsentStatementContent,
  ConsentUserContext,
} from "./types"
import { ConsentStatuses } from "./types"

/**
 * Creates the consent configuration for the messaging application
 * This encapsulates all messaging-specific logic and dependencies
 */
export const createMessagingConsentConfig = ({
  content,
  isConsentEnabled,
}: {
  content: ConsentStatementContent
  isConsentEnabled: boolean
}): ConsentConfig => {
  return {
    subject: CONSENT_SUBJECT,
    content,

    userContext: {
      getPreferredLanguage: (user: ConsentUserContext) => {
        return user.preferredLanguage
      },
    },

    // Composable modal visibility logic - all concerns in one place
    shouldShowModal: ({
      userContext,
      consentStatus,
      searchParams,
      userConsentStatementId,
      latestConsentStatementId,
    }) => {
      // 1. Feature flag check first
      if (!isConsentEnabled) return false

      // 2. User type check - don't show to public servants
      if (userContext.isPublicServant) return false

      // 3. Consent status check
      const hasValidConsent =
        consentStatus === ConsentStatuses.OptedIn ||
        consentStatus === ConsentStatuses.OptedOut

      // 4. Version check - show if user consented to older version
      // If userConsentVersion is undefined, treat as valid for backward compatibility
      // (only enforce version check when version tracking is implemented)
      const hasValidVersion =
        userConsentStatementId === undefined ||
        userConsentStatementId === latestConsentStatementId

      // 5. Force show parameter check
      const shouldForceShowModal = searchParams.get("force-consent") === "1"

      // 6. Final decision: show if no valid consent OR outdated version OR forced
      return !hasValidConsent || !hasValidVersion || shouldForceShowModal
    },

    api: (latestConsentStatementId: string) =>
      createMessagingConsentAPI(latestConsentStatementId),

    analytics: {
      trackEvent: (_event) => {
        // This will be used by the component, but we need to access useAnalytics hook there
        // For now, we'll structure it to be compatible with the existing analytics system
      },
      category: "consent",
    },

    featureFlags: {
      isEnabled: () => isConsentEnabled,
    },

    onConsentSuccess: {
      showToast: true,
    },

    forceModalParam: "force-consent",
  }
}

/**
 * Hook to create messaging consent config with analytics integration
 * This needs to be a hook because useAnalytics must be called from a component
 */
export const useMessagingConsentConfig = ({
  content,
  isConsentEnabled,
}: {
  content: ConsentStatementContent
  isConsentEnabled: boolean
}): ConsentConfig => {
  const analytics = useAnalytics()

  const config = createMessagingConsentConfig({ content, isConsentEnabled })

  // Create simplified analytics tracker
  const analyticsTracker: ConsentAnalyticsTracker = {
    trackConsentDecision: (action: ConsentAction) => {
      analytics.trackEvent(
        ConsentAnalyticsEvent({
          name: "consent",
          action,
        }),
      )
    },
    trackConsentError: (action: ConsentAction) => {
      analytics.trackEvent(
        ConsentAnalyticsEvent({
          name: "consent-error",
          action,
        }),
      )
    },
    trackConsentSuccess: (action: ConsentAction) => {
      analytics.trackEvent(
        ConsentAnalyticsEvent({
          name: "consent-success",
          action,
        }),
      )
    },
  }

  // Override analytics with the actual hook implementation
  config.analytics = {
    trackEvent: (event) => {
      analytics.trackEvent(event)
    },
    category: "consent",
  }

  // Add the simplified tracker
  config.analyticsTracker = analyticsTracker

  return config
}

/**
 * Helper to create sample content structure for testing/development
 * In production, this would come from the backend
 */
export const createSampleConsentContent = (): ConsentStatementContent => ({
  // Sample version data for development
  version: {
    id: "messaging-consent-v1.0.0",
    createdAt: new Date().toISOString(),
    description: "Initial messaging consent terms",
  },

  title: "Your consent for messaging",
  bodyParagraphs: [
    "We would like your consent to send you messages about government services.",
    "This includes notifications about important updates and services you have requested.",
  ],
  listItems: [
    "Service notifications and updates",
    "Important government announcements",
  ],
  infoAlert: {
    title: "Important information",
    items: [
      "You can withdraw your consent at any time",
      "This only affects non-essential communications",
    ],
  },
  footerText: "For more information, please see our [link1] and [link2].",
  buttons: {
    accept: "Accept",
    decline: "Decline",
  },
  success: {
    title: "Consent preferences updated",
    message: "Your consent preferences have been saved successfully.",
  },
  error: {
    title: "Error updating consent",
    message:
      "There was an error updating your consent preferences. Please try again.",
  },
  // Sample links for development
  links: {
    link1: "https://www.gov.ie/privacy",
    link2: "https://www.gov.ie/terms",
  },
})
