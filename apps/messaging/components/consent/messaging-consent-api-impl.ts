import type { CONSENT_SUBJECT } from "./const"
import { setConsentToPending, submitConsent } from "./messaging-consent-api"
import type { ConsentAPI, ConsentResult } from "./types"

/**
 * Implementation of ConsentAPI that uses server actions
 * This bridges the interface with the actual server actions
 */
class MessagingConsentAPIImpl implements ConsentAPI {
  async submitConsent(params: {
    accept: boolean
    subject: string
    preferredLanguage?: string
  }): Promise<ConsentResult> {
    return submitConsent({
      accept: params.accept,
      subject: params.subject as typeof CONSENT_SUBJECT,
      preferredLanguage: params.preferredLanguage,
    })
  }

  async setConsentToPending(subject: string): Promise<ConsentResult> {
    return setConsentToPending(subject as typeof CONSENT_SUBJECT)
  }
}

// Factory function to create messaging consent API
export const createMessagingConsentAPI = (): ConsentAPI => {
  return new MessagingConsentAPIImpl()
}
