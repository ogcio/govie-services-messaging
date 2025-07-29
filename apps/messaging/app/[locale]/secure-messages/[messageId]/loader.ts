"use server"
import { ONBOARDING_ACTIONS, OnboardingAnalyticsEvent } from "const/analytics"
import { RedirectType, redirect } from "next/navigation"
import { getUser, isAuthenticated } from "@/utils/auth"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildLoginUrlWithPostLoginRedirect } from "@/utils/logto-config"
import { buildClientUrl } from "@/utils/url-utils.client"

export default async (props: {
  params: { locale?: string; messageId: string }
}) => {
  const analytics = BBClients.getAnalyticsClient()
  const isUserAuthenticated = await isAuthenticated()
  if (!isUserAuthenticated) {
    const url = buildLoginUrlWithPostLoginRedirect()
    // Redirect to login page and add return url to redirect to this page after login
    return redirect(url.toString())
  }
  // If user is public servant, redirect to admin page
  const { user, isPublicServant } = await getUser()
  if (isPublicServant) {
    redirect("/admin", RedirectType.replace)
  }
  // If user is not public servant, and the message has the same recipient ID as
  // the current user, show the message
  const message = await BBClients.getMessagingClient().getMessage(
    props.params.messageId,
  )
  if (![401, 403, 404].includes(message.error?.statusCode)) {
    analytics.track.event(
      OnboardingAnalyticsEvent({
        name: "view-secure-message",
        action: ONBOARDING_ACTIONS.ACCOUNT_LINKING,
      }),
    )
    return redirect(
      buildClientUrl({
        locale: props.params.locale,
        url: ["/home", props.params.messageId].join("/"),
      }).toString(),
    )
  }

  // The current user might be the recipient of the message
  const partialMessage = await BBClients.getOnboardingClient().getMessage(
    props.params.messageId,
  )
  if (!partialMessage.error) {
    const linkedProfile =
      await BBClients.getOnboardingProfileClient().getProfile(
        partialMessage.data.recipientUserId,
      )
    // Make sure that the current user is not intentionally trying to access
    // a message that has already been linked to another user
    if (linkedProfile.data.id !== linkedProfile.data.primaryUserId) {
      analytics.track.event(
        OnboardingAnalyticsEvent({
          name: "attempt-to-view-secure-message",
          action: ONBOARDING_ACTIONS.ACCOUNT_LINKING,
        }),
      )
      return redirect(
        buildClientUrl({
          locale: props.params.locale,
          url: "/home",
        }).toString(),
        RedirectType.replace,
      )
    }
    const currentProfile = await BBClients.getProfileClient().getProfile(
      user.id,
    )
    analytics.track.event(
      OnboardingAnalyticsEvent({
        name: "confirm-account-linking",
        action: ONBOARDING_ACTIONS.ACCOUNT_LINKING,
      }),
    )
    return {
      message: partialMessage,
      linkedProfile,
      currentProfile,
      error: null,
    }
  }
  return {
    message: partialMessage,
    currentProfile: null,
    linkedProfile: null,
    error: partialMessage.error,
  }
}
