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

// Backend API response structure
// TODO: type this with awaited response from BB SDK
export interface ConsentStatementTranslation {
  id: string
  consentStatementId: string
  language: string
  title?: string
  bodyTop: string[]
  bodyList: string[]
  bodyBottom: string[]
  bodySmall: string[]
  bodyFooter?: string
  bodyLinks: Record<string, string> // Dynamic links from backend (tc, pp, etc.)
  createdAt: string
}

export interface ConsentStatementData {
  id: string
  subject: string
  version: number
  createdAt: string
  translations: Record<string, ConsentStatementTranslation> // "en", "ga", etc.
}

export interface ConsentStatementResponse {
  data: ConsentStatementData
}

// Frontend content structure (transformed from backend)
export interface ConsentContent {
  // Version tracking for consent updates
  version: {
    id: string
    createdAt: string // ISO date string
    description?: string // Optional description of what changed
  }

  title: string
  bodyParagraphs: string[]
  listItems: string[]
  bodyBottom?: string[]
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
  // Dynamic links from backend
  links: Record<string, string>
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
    versionId?: string // Version ID of the consent being accepted/declined
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

export interface ConsentModalVisibilityParams {
  userContext: ConsentUserContext
  consentStatus: ConsentStatus
  searchParams: URLSearchParams
  // Version tracking for checking if user needs to re-consent
  userConsentVersion?: string // Version ID the user previously consented to
  latestConsentVersion: string // Latest version ID from API
}

export interface ConsentConfig {
  subject: string

  // Content (from backend) - now includes links
  content: ConsentContent

  // User context configuration
  userContext: {
    getPreferredLanguage: (user: ConsentUserContext) => string
  }

  // Composable modal visibility logic
  shouldShowModal: (params: ConsentModalVisibilityParams) => boolean

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
