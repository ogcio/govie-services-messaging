"use server"

import { getServerLogger } from "@ogcio/nextjs-logging-wrapper/server-logger"
import { RedirectType, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { LANG_EN } from "@/types/shared"
import type { ProfilePayload } from "@/types/types"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildServerUrl } from "@/utils/url-utils.server"
import { CONSENT_ENABLED_FLAG, CONSENT_SUBJECT } from "./const"
import type {
  ConsentResult,
  ConsentStatementContent,
  ConsentStatementData,
  ConsentStatus,
} from "./types"
import { ConsentStatuses } from "./types"

/**
 * Server action to submit consent for messaging
 */
export async function submitConsent({
  accept,
  subject,
  preferredLanguage,
  consentStatementId,
}: {
  accept: boolean
  subject: typeof CONSENT_SUBJECT
  preferredLanguage?: string
  consentStatementId: string // Version ID of the consent being accepted/declined
}): Promise<ConsentResult> {
  const citizenClient = BBClients.getProfileClient().citizen
  const profile = await citizenClient.submitConsent({
    status: accept ? ConsentStatuses.OptedIn : ConsentStatuses.OptedOut,
    subject,
    consentStatementId,
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
  consentStatementId: string,
): Promise<ConsentResult> {
  const citizenClient = BBClients.getProfileClient().citizen

  const profile = await citizenClient.submitConsent({
    status: ConsentStatuses.Pending,
    subject,
    consentStatementId,
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
  latestConsentStatementId,
}: {
  profile: ProfilePayload
  latestConsentStatementId: string
}): Promise<
  | {
      consentStatus: ConsentStatus
      isConsentEnabled: false
    }
  | {
      consentStatus: ConsentStatus
      isConsentEnabled: true
      userConsentStatementId: string | null
    }
> {
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
  const profileConsentStatus = profile.consentStatuses?.[CONSENT_SUBJECT]
  const consentStatus =
    profileConsentStatus?.status ?? ConsentStatuses.Undefined
  if (consentStatus === ConsentStatuses.Undefined) {
    const { error } = await setConsentToPending(
      CONSENT_SUBJECT,
      latestConsentStatementId,
    )

    return {
      consentStatus: error
        ? ConsentStatuses.Undefined
        : ConsentStatuses.Pending,
      isConsentEnabled,
      userConsentStatementId:
        profileConsentStatus?.consent_statement_id ?? null,
    }
  }

  return {
    consentStatus,
    isConsentEnabled,
    userConsentStatementId: profileConsentStatus?.consent_statement_id ?? null,
  }
}

/**
 * Server action to fetch consent content from the API
 */
export async function getConsentStatementContent({
  subject = CONSENT_SUBJECT,
  locale = LANG_EN,
}: {
  subject?: typeof CONSENT_SUBJECT
  locale?: string
} = {}): Promise<ConsentStatementContent> {
  try {
    const response =
      await BBClients.getProfileClient().citizen.getLatestConsentStatement({
        subject,
      })
    if (response.error || !response.data) {
      return getFallbackContent()
    }
    // Use the transformation function to convert backend response to frontend format
    return await transformBackendResponse(response.data.data, locale)
  } catch (error) {
    console.error("Error fetching consent content:", error)
    // Return fallback content if API fails
    return await getFallbackContent()
  }
}

/**
 * Transform backend API response to frontend content structure
 */
async function transformBackendResponse(
  data: ConsentStatementData,
  locale: string,
): Promise<ConsentStatementContent> {
  const translation = data.translations[locale] || data.translations[LANG_EN]
  const t = await getTranslations("consent")

  return {
    version: {
      id: data.id,
      createdAt: data.createdAt,
      description: `Version ${data.version}`,
    },
    title: translation.title || t("title"),
    bodyParagraphs: translation.bodyTop,
    listItems: translation.bodyList,
    bodyBottom: translation.bodyBottom,
    infoAlert: {
      title: t("body.small.title"),
      items: translation.bodySmall,
    },
    footerText: translation.bodyFooter || translation.bodyBottom.join(" "),
    buttons: {
      accept: t("button.accept"),
      decline: t("button.decline"),
    },
    success: {
      title: t("success.title"),
    },
    error: {
      title: t("error.title"),
      message: t("error.body"),
    },
    links: translation.bodyLinks,
  }
}

/**
 * Fallback content generator (will be replaced by API response)
 */
async function getFallbackContent(): Promise<ConsentStatementContent> {
  const t = await getTranslations("consent")

  return {
    // Mock version data - in production this comes from API
    version: {
      id: "messaging-consent-v1.0.0",
      createdAt: new Date().toISOString(),
      description: "Default consent version",
    },

    title: t("title"),
    bodyParagraphs: [t("body.top.0"), t("body.top.1")],
    listItems: [t("body.list.0"), t("body.list.1")],
    bodyBottom: [t("body.bottom")],
    infoAlert: {
      title: t("body.small.title"),
      items: [t("body.small.0"), t("body.small.1")],
    },
    footerText: t("body.footer"),
    buttons: {
      accept: t("button.accept"),
      decline: t("button.decline"),
    },
    success: {
      title: t("success.title"),
    },
    error: {
      title: t("error.title"),
      message: t("error.body"),
    },
    // Mock links for fallback content
    links: {
      tc: "https://www.gov.ie/terms",
      pp: "https://www.gov.ie/privacy",
    },
  }
}
