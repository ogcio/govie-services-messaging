"use server"

// biome-ignore assist/source/organizeImports: TODO
import { redirect, RedirectType } from "next/navigation"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildServerUrl } from "@/utils/url-utils.server"
import { ConsentStatuses } from "@/components/consent/types"
import { CONSENT_SUBJECT } from "@/components/consent/const"

export const handleConsent = async ({
  accept,
  profileId,
  preferredLanguage,
}: {
  accept: boolean
  profileId: string
  preferredLanguage: "en" | "ga"
}) => {
  const profile = await BBClients.getProfileClient().createConsent(profileId, {
    status: accept ? ConsentStatuses.OptedIn : ConsentStatuses.OptedOut,
    subject: CONSENT_SUBJECT,
  })

  if (profile?.error) {
    return { error: profile.error }
  }

  redirect(
    buildServerUrl({
      url: [preferredLanguage ?? "en", "home"].join("/"),
    }).toString(),
    RedirectType.replace,
  )
}
