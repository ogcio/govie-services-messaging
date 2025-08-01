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
  ConsentContent,
  ConsentResult,
  ConsentStatementResponse,
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
  locale = LANG_EN,
}: {
  subject?: typeof CONSENT_SUBJECT
  locale?: string
} = {}): Promise<ConsentContent> {
  try {
    // TODO: Replace with actual API call to fetch consent content
    // const response: ConsentStatementResponse = await BBClients.getConsentClient().getContent({
    //   subject,
    //   locale,
    // })

    // For now, create mock backend response to test transformation
    // In production, this would be:
    // if (response.error) {
    //   console.error("Failed to fetch consent content:", response.error)
    //   return getFallbackContent(locale)
    // }
    // return transformBackendResponse(response.data, locale)

    // Use the subject parameter to show it's intended for future API calls
    console.log(
      `Fetching consent content for subject: ${subject}, locale: ${locale}`,
    )

    // Create mock backend response to test transformation logic
    const mockBackendResponse: ConsentStatementResponse = {
      data: {
        id: "messaging-consent-v1.0.0",
        subject: CONSENT_SUBJECT,
        version: 1,
        createdAt: new Date().toISOString(),
        translations: {
          en: {
            id: "en-translation",
            consentStatementId: "messaging-consent-v1.0.0",
            language: "en",
            title: "Welcome to MessagingIE",
            bodyTop: [
              "MessagingIE provides you with a safe and secure access to letters, documents, and messages from Public Sector Bodies (PSBs).",
              "Before you start using MessagingIE, we need your consent for the following:",
            ],
            bodyList: [
              "To allow Public Sector Bodies to send messages to you where they are required or permitted to give information to you in writing",
              "To notify you of new messages sent to you through MessagingIE",
            ],
            bodyBottom: [
              "Please note, messages sent to you through MessagingIE may contain personal data. In some cases, special categories of personal data.",
            ],
            bodySmall: [
              "If you Accept, you will be receiving secure communications from PSBs via MessagingIE.",
              "If you Decline, you will not receive any new messages, but you may still view previous messages already delivered. PSBs will no longer communicate with you through MessagingIE, but may contact you through other means.",
            ],
            bodyFooter:
              "Please read our <tc>Terms and Conditions</tc> and <pp>Privacy Notice</pp>.",
            bodyLinks: {
              tc: "https://www.gov.ie/terms",
              pp: "https://www.gov.ie/privacy",
            },
            createdAt: new Date().toISOString(),
          },
          ga: {
            id: "ga-translation",
            consentStatementId: "messaging-consent-v1.0.0",
            language: "ga",
            title: "Táimid ag fáilte duit le MessagingIE",
            bodyTop: [
              "MessagingIE tusa a fháilte le teachtaireachtaí sa bhunachar sonraí (PSBs).",
              "Nuair a thógann tú teachtaireachtaí le MessagingIE, ní mór duit <b>córas</b> leis an teachtaireachtaí seo.",
            ],
            bodyList: [
              "Chun teachtaireacht a sheoladh, ní mór duit teimpléad a chruthú ar dtús nó ceann a roghnú ón roghanna thíos. Mura bhfuil aon teimpléid cruthaithe, téigh chuig an gcuid <href>Teimpléidí Teachtaireachtaí</href> chun tús a chur leis.",
              "Roghnaigh an cineál teachtaireachta atá uait a sheoladh",
            ],
            bodyBottom: [
              "Please note, messages sent to you through MessagingIE may contain personal data. In some cases, special categories of personal data.",
            ],
            bodySmall: [
              "Má tá tú ag córas, beidh teachtaireachtaí a sheoladh le MessagingIE.",
              "Má tá tú ag córas, ní bheidh teachtaireachtaí a sheoladh le MessagingIE. Ní bheidh teachtaireachtaí a sheoladh le MessagingIE, ach beidh teachtaireachtaí a sheoladh leis an ríomhphost a phostáil ar do phróifíl.",
            ],
            bodyFooter:
              "Please read our <tc>Terms and Conditions</tc> and <pp>Privacy Notice</pp>.",
            bodyLinks: {
              tc: "https://www.gov.ie/terms",
              pp: "https://www.gov.ie/privacy",
            },
            createdAt: new Date().toISOString(),
          },
        },
      },
    }

    // Use the transformation function to convert backend response to frontend format
    return await transformBackendResponse(mockBackendResponse.data, locale)
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
  data: ConsentStatementResponse["data"],
  locale: string,
): Promise<ConsentContent> {
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
async function getFallbackContent(): Promise<ConsentContent> {
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
