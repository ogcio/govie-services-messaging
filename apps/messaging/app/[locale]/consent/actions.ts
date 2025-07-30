"use server"

// biome-ignore assist/source/organizeImports: TODO
import { redirect, RedirectType } from "next/navigation"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildServerUrl } from "@/utils/url-utils.server"
import { ConsentStatuses } from "@/components/consent/types"
import { CONSENT_SUBJECT } from "@/components/consent/const"
import { LANG_EN, type LANG_GA } from "@/types/shared"

export const handleConsent = async ({
  accept,
  preferredLanguage,
}: {
  accept: boolean
  preferredLanguage: typeof LANG_EN | typeof LANG_GA
}) => {
  const profile = await BBClients.getProfileClient().citizen.submitConsent({
    status: accept ? ConsentStatuses.OptedIn : ConsentStatuses.OptedOut,
    subject: CONSENT_SUBJECT,
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
