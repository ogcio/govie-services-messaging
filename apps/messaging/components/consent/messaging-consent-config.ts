import { useAnalytics } from "@ogcio/nextjs-analytics"
import { ConsentAnalyticsEvent } from "./analytics"
import { CONSENT_SUBJECT } from "./const"
import { createMessagingConsentAPI } from "./messaging-consent-api-impl"
import type {
  ConsentAction,
  ConsentAnalyticsTracker,
  ConsentConfig,
  ConsentContent,
  ConsentUserContext,
} from "./types"

/**
 * Creates the consent configuration for the messaging application
 * This encapsulates all messaging-specific logic and dependencies
 */
export const createMessagingConsentConfig = ({
  content,
  isConsentEnabled,
}: {
  content: ConsentContent
  isConsentEnabled: boolean
}): ConsentConfig => {
  return {
    subject: CONSENT_SUBJECT,
    content,

    links: {
      // TODO: Make these configurable from env/config
      privacyPolicy:
        "https://www.gov.ie/en/privacy-and-data-protection/privacy-notices/privacy-notice-for-messagingie/",
      termsAndConditions:
        "https://www.gov.ie/en/privacy-and-data-protection/privacy-notices/privacy-notice-for-messagingie/",
    },

    userContext: {
      shouldShowModal: (
        user: ConsentUserContext,
        _consentStatus,
        isEnabled,
      ) => {
        // Messaging-specific logic: don't show to public servants
        return !user.isPublicServant && isEnabled
      },
      getPreferredLanguage: (user: ConsentUserContext) => {
        return user.preferredLanguage
      },
    },

    api: createMessagingConsentAPI(),

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
  content: ConsentContent
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
export const createSampleConsentContent = (): ConsentContent => ({
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
})
