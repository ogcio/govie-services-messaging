export const ConsentStatuses = {
  Pending: "pending",
  Undefined: "undefined",
  PreApproved: "pre-approved",
  OptedOut: "opted-out",
  OptedIn: "opted-in",
} as const
export type ConsentStatus =
  (typeof ConsentStatuses)[keyof typeof ConsentStatuses]

// Configuration interfaces for reusable consent system

export interface ConsentContent {
  title: string
  bodyParagraphs: string[]
  listItems: string[]
  infoAlert?: {
    title: string
    items: string[]
  }
  footerText: string
  buttons: {
    accept: string
    decline: string
  }
  success: {
    title: string
    message?: string
  }
  error: {
    title: string
    message: string
  }
}

export interface ConsentLinks {
  privacyPolicy: string
  termsAndConditions: string
}

export interface ConsentResult {
  error?: {
    detail: string
  }
}

export interface ConsentAPI {
  submitConsent(params: {
    accept: boolean
    subject: string
    preferredLanguage?: string
  }): Promise<ConsentResult>
  setConsentToPending(subject: string): Promise<ConsentResult>
}

export interface ConsentAnalyticsEvent {
  event: {
    category: string
    action: string
    name: string
    value: number
  }
}

export interface ConsentAnalytics {
  trackEvent: (event: ConsentAnalyticsEvent) => void
  category?: string
}

export type ConsentAction = "accept" | "decline"

export interface ConsentAnalyticsTracker {
  trackConsentDecision: (action: ConsentAction) => void
  trackConsentError: (action: ConsentAction) => void
  trackConsentSuccess: (action: ConsentAction) => void
}

export interface ConsentUserContext {
  isPublicServant: boolean
  preferredLanguage: string
  [key: string]: unknown
}

export interface ConsentConfig {
  subject: string

  // Content (from backend)
  content: ConsentContent

  // External links
  links: ConsentLinks

  // User context configuration
  userContext: {
    shouldShowModal: (
      user: ConsentUserContext,
      consentStatus: ConsentStatus,
      isEnabled: boolean,
    ) => boolean
    getPreferredLanguage: (user: ConsentUserContext) => string
  }

  // API integration
  api: ConsentAPI

  // Analytics (optional)
  analytics?: ConsentAnalytics

  // Simplified analytics tracker (optional, preferred over analytics)
  analyticsTracker?: ConsentAnalyticsTracker

  // Feature flags
  featureFlags?: {
    isEnabled: () => boolean
  }

  // Routing behavior
  onConsentSuccess?: {
    redirectTo?:
      | string
      | ((accepted: boolean, preferredLanguage: string) => string)
    showToast?: boolean
  }

  // URL parameters
  forceModalParam?: string
}

export interface ConsentEvents {
  onConsentDecision?: (accepted: boolean) => void
  onConsentError?: (error: Error) => void
  onModalOpen?: () => void
  onModalClose?: () => void
  onScrollToBottom?: () => void
}
