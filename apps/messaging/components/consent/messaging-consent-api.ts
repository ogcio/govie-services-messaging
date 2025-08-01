"use server"

import { RedirectType, redirect } from "next/navigation"
import { LANG_EN } from "@/types/shared"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildServerUrl } from "@/utils/url-utils.server"
import { CONSENT_SUBJECT } from "./const"
import type { ConsentAPI, ConsentResult } from "./types"
import { ConsentStatuses } from "./types"

/**
 * Messaging application implementation of ConsentAPI
 * This encapsulates the specific integration with building blocks SDK
 */
export class MessagingConsentAPI implements ConsentAPI {
  async submitConsent({
    accept,
    subject,
    preferredLanguage,
  }: {
    accept: boolean
    subject: typeof CONSENT_SUBJECT
    preferredLanguage?: string
  }): Promise<ConsentResult> {
    const profile = await BBClients.getProfileClient().citizen.submitConsent({
      status: accept ? ConsentStatuses.OptedIn : ConsentStatuses.OptedOut,
      subject,
    })

    if (profile?.error) {
      return { error: profile.error }
    }

    // For messaging app, redirect to home after successful consent
    if (preferredLanguage) {
      redirect(
        buildServerUrl({
          url: [preferredLanguage ?? LANG_EN, "home?tab=unread"].join("/"),
        }).toString(),
        RedirectType.replace,
      )
    }

    return {}
  }

  async setConsentToPending(
    subject: typeof CONSENT_SUBJECT,
  ): Promise<ConsentResult> {
    const profile = await BBClients.getProfileClient().citizen.submitConsent({
      status: ConsentStatuses.Pending,
      subject,
    })

    if (profile?.error) {
      return { error: profile.error }
    }

    return {}
  }
}

// Factory function to create messaging consent API
export const createMessagingConsentAPI = (): ConsentAPI => {
  return new MessagingConsentAPI()
}

// Standalone function for backward compatibility with loaders
export const setConsentToPending = async (): Promise<ConsentResult> => {
  const api = createMessagingConsentAPI()
  return api.setConsentToPending(CONSENT_SUBJECT)
}
