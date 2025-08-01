"use server"

import { RedirectType, redirect } from "next/navigation"
import { LANG_EN } from "@/types/shared"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildServerUrl } from "@/utils/url-utils.server"
import { CONSENT_SUBJECT } from "./const"
import type { ConsentResult } from "./types"
import { ConsentStatuses } from "./types"

/**
 * Server action to submit consent for messaging
 */
export async function submitConsent({
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

/**
 * Server action to set consent status to pending
 */
export async function setConsentToPending(
  subject: typeof CONSENT_SUBJECT = CONSENT_SUBJECT,
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
