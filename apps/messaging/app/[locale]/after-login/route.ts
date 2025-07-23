import { trackEvent } from "@ogcio/nextjs-analytics"
import { AuthenticationRoutes } from "@ogcio/nextjs-auth"
import { ANALYTICS } from "const/analytics"
import { type NextRequest, userAgent } from "next/server"
import { getSignInConfiguration } from "utils/logto-config"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function GET(request: NextRequest) {
  trackEvent(BBClients.getAnalyticsClient())({
    event: {
      name: ANALYTICS.user.login.name,
      category: ANALYTICS.user.category,
      action: ANALYTICS.user.login.action,
    },
    metadataOverride: {
      language:
        request.headers.get("accept-language")?.split(",")[0] || "en-US",
      userAgent: userAgent(request).ua,
      referrer: request.headers.get("referer") ?? undefined,
    },
  })

  await AuthenticationRoutes.login(getSignInConfiguration())
}
