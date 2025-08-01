"use server"

import { getServerLogger } from "@ogcio/nextjs-logging-wrapper/server-logger"
import { RedirectType, redirect } from "next/navigation"
import { LANG_EN } from "@/types/shared"
import type { ProfilePayload } from "@/types/types"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildServerUrl } from "@/utils/url-utils.server"
import { CONSENT_ENABLED_FLAG, CONSENT_SUBJECT } from "./const"
import type { ConsentContent, ConsentResult, ConsentStatus } from "./types"
import { ConsentStatuses } from "./types"

/**
 * Server action to submit consent for messaging
 */
export async function submitConsent({
  accept,
  subject,
  preferredLanguage,
  versionId,
}: {
  accept: boolean
  subject: typeof CONSENT_SUBJECT
  preferredLanguage?: string
  versionId?: string // Version ID of the consent being accepted/declined
}): Promise<ConsentResult> {
  // Log version for development until SDK supports it
  if (versionId) {
    console.log(`Submitting consent for version: ${versionId}`)
  }

  const profile = await BBClients.getProfileClient().citizen.submitConsent({
    status: accept ? ConsentStatuses.OptedIn : ConsentStatuses.OptedOut,
    subject,
    // TODO: Update Building Blocks SDK to support version tracking
    // versionId, // Store which version the user consented to
  })

  if (profile?.error) {
    return { error: profile.error }
  }

  redirect(
    buildServerUrl({
      url: [preferredLanguage ?? LANG_EN, "home?tab=unread"].join("/"),
    }).toString(),
    RedirectType.replace,
  )
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

/**
 * Server action to get consent status and maybe set it to pending
 */
export async function getAndMaybeSetConsentStatus({
  profile,
}: {
  profile: ProfilePayload
}): Promise<{
  consentStatus: ConsentStatus
  isConsentEnabled: boolean
}> {
  const logger = getServerLogger()
  let isConsentEnabled = false
  try {
    // TODO: remove this once consent is ready to be deployed
    isConsentEnabled = await BBClients.getFeatureFlagsClient().isFlagEnabled(
      CONSENT_ENABLED_FLAG,
      {
        userId: profile.id,
      },
    )
  } catch (error) {
    logger.error(`Error fetching feature flag: ${error}`, {
      error,
    })
  }
  if (!isConsentEnabled) {
    return {
      consentStatus: ConsentStatuses.Undefined,
      isConsentEnabled,
    }
  }
  // Consent: if the profile has no consent status or a consent status of undefined
  // for the messaging service, set the consent status to pending
  const consentStatus =
    profile.consentStatuses?.[CONSENT_SUBJECT] ?? ConsentStatuses.Undefined
  if (consentStatus === ConsentStatuses.Undefined) {
    const { error } = await setConsentToPending()

    return {
      consentStatus: error
        ? ConsentStatuses.Undefined
        : ConsentStatuses.Pending,
      isConsentEnabled,
    }
  }

  return {
    consentStatus,
    isConsentEnabled,
  }
}

/**
 * Server action to fetch consent content from the API
 */
export async function getConsentContent({
  subject = CONSENT_SUBJECT,
  locale = "en",
}: {
  subject?: typeof CONSENT_SUBJECT
  locale?: string
} = {}): Promise<ConsentContent> {
  try {
    // TODO: Replace with actual API call to fetch consent content
    // const response = await BBClients.getConsentClient().getContent({
    //   subject,
    //   locale,
    // })

    // For now, return sample content based on locale
    // In production, this would be:
    // if (response.error) {
    //   console.error("Failed to fetch consent content:", response.error)
    //   return getFallbackContent(locale)
    // }
    // return response.data

    // Use the subject parameter to show it's intended for future API calls
    console.log(
      `Fetching consent content for subject: ${subject}, locale: ${locale}`,
    )
    return getFallbackContent(locale)
  } catch (error) {
    console.error("Error fetching consent content:", error)
    // Return fallback content if API fails
    return getFallbackContent(locale)
  }
}

/**
 * Fallback content generator (will be replaced by API response)
 */
function getFallbackContent(locale: string): ConsentContent {
  const isGaelic = locale === "ga"

  return {
    // Mock version data - in production this comes from API
    version: {
      id: "messaging-consent-v1.0.0",
      createdAt: new Date().toISOString(),
      description: "Initial messaging consent terms",
    },

    title: isGaelic
      ? "Do thoiliú do theachtaireachtaí"
      : "Your consent for messaging",
    bodyParagraphs: [
      isGaelic
        ? "Ba mhaith linn do thoiliú chun teachtaireachtaí a sheoladh chugat faoi sheirbhísí rialtais."
        : "We would like your consent to send you messages about government services.",
      isGaelic
        ? "Áirítear air seo fógraí faoi nuashonruithe tábhachtacha agus seirbhísí ar iarr tú iad."
        : "This includes notifications about important updates and services you have requested.",
    ],
    listItems: [
      isGaelic
        ? "Fógraí agus nuashonruithe seirbhíse"
        : "Service notifications and updates",
      isGaelic
        ? "Fógraí tábhachtacha rialtais"
        : "Important government announcements",
    ],
    infoAlert: {
      title: isGaelic ? "Faisnéis thábhachtach" : "Important information",
      items: [
        isGaelic
          ? "Is féidir leat do thoiliú a tharraingt siar am ar bith"
          : "You can withdraw your consent at any time",
        isGaelic
          ? "Ní théann sé seo i bhfeidhm ach ar chumarsáidí neamhriachtanacha"
          : "This only affects non-essential communications",
      ],
    },
    footerText: isGaelic
      ? "Le haghaidh tuilleadh faisnéise, féach ár [link1] agus [link2]."
      : "For more information, please see our [link1] and [link2].",
    buttons: {
      accept: isGaelic ? "Glac leis" : "Accept",
      decline: isGaelic ? "Diúltaigh" : "Decline",
    },
    success: {
      title: isGaelic
        ? "Sainroghanna toilithe nuashonraithe"
        : "Consent preferences updated",
      message: isGaelic
        ? "Sábháladh do shainroghanna toilithe go rathúil."
        : "Your consent preferences have been saved successfully.",
    },
    error: {
      title: isGaelic
        ? "Earráid agus sainroghanna toilithe á nuashonrú"
        : "Error updating consent",
      message: isGaelic
        ? "Bhí earráid ann agus do shainroghanna toilithe á nuashonrú. Bain triail eile as le do thoil."
        : "There was an error updating your consent preferences. Please try again.",
    },
  }
}
