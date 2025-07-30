"use server"

// biome-ignore assist/source/organizeImports: TODO
import { RedirectType, redirect } from "next/navigation"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildServerUrl } from "@/utils/url-utils.server"
import { ConsentStatuses } from "@/components/consent/types"
import { CONSENT_SUBJECT } from "@/components/consent/const"
import { getServerLogger } from "@ogcio/nextjs-logging-wrapper/server-logger"

export const handleConsent = async ({
  accept,
  profileId,
  preferredLanguage,
}: {
  accept: boolean
  profileId: string
  preferredLanguage: "en" | "ga"
}) => {
  const logger = getServerLogger()
  try {
    const profile = await BBClients.getProfileClient().createConsent(
      profileId,
      {
        status: accept ? ConsentStatuses.OptedIn : ConsentStatuses.OptedOut,
        subject: CONSENT_SUBJECT,
      },
    )
    // const profile = {
    //   error: null,
    // }

    if (profile?.error) {
      return { error: profile.error }
    }

    return redirect(
      buildServerUrl({
        url: [preferredLanguage ?? "en", "home"].join("/"),
      }).toString(),
      RedirectType.replace,
    )

    // return {}
  } catch (error) {
    logger.error(error)
    return {
      error:
        "An error occurred while updating your consent, please try again later",
    }
  }
}
