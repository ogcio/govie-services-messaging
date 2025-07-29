"use server"
import { RedirectType, redirect } from "next/navigation"
import { BBClients } from "@/utils/building-blocks-sdk"
import { getCachedConfig } from "@/utils/env-config"
import { buildServerUrl } from "@/utils/url-utils.server"
import { requireUser } from "../../loaders"

export const confirmAccountLinking = async ({
  currentUserId,
  targetUserId,
  messageId,
}: {
  currentUserId: string
  targetUserId: string
  messageId: string
}) => {
  const profile = await BBClients.getProfileClient().patchProfile(
    targetUserId,
    {
      primaryUserId: currentUserId,
    },
  )
  if (!profile?.error) {
    return redirect(
      buildServerUrl({
        url: `${profile?.data.preferredLanguage ?? "en"}/home/${messageId}`,
      }).toString(),
      RedirectType.replace,
    )
  }

  return {
    error: profile?.error,
  }
}

export const reportAccountLinking = async () => {
  const user = await requireUser()
  const profile = await BBClients.getProfileClient().getProfile(user.id)
  const { formsServiceUrl, errorFormId } = getCachedConfig()()
  const formURL = [formsServiceUrl, errorFormId].join("/")

  return redirect(`${formURL}?userEmail=${profile.data.email}`)
}

export const reportAccountLinkingServiceError = async () => {
  const user = await requireUser()
  const profile = await BBClients.getProfileClient().getProfile(user.id)
  const { formsServiceUrl, errorFormId } = getCachedConfig()()
  const formURL = [formsServiceUrl, errorFormId].join("/")

  return redirect(`${formURL}?userEmail=${profile.data.email}`)
}
