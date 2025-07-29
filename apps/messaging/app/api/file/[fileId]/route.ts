import { trackEvent } from "@ogcio/nextjs-analytics"
import { getServerLogger } from "@ogcio/nextjs-logging-wrapper/server-logger"
import { ANALYTICS } from "const/analytics"
import { notFound } from "next/navigation"
import { userAgent } from "next/server"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function GET(
  request: Request,
  { params: { fileId } }: { params: { fileId: string } },
) {
  const uploadClient = BBClients.getUploadClient()
  const { data, error, headers, status } = await uploadClient.getFile(fileId)

  trackEvent(BBClients.getAnalyticsClient())({
    event: {
      name: ANALYTICS.message.attachmentDownload.name,
      category: ANALYTICS.message.category,
      action: ANALYTICS.message.attachmentDownload.action,
    },
    metadataOverride: {
      language:
        request.headers.get("accept-language")?.split(",")[0] || "en-US",
      userAgent: userAgent(request).ua,
      referrer: request.headers.get("referer") ?? undefined,
    },
  })

  if (error || !data) {
    if (error) {
      getServerLogger().error(error)
      if (status === 404) {
        throw notFound()
      }
      return new Response("Error", { status })
    }
  }

  return new Response(data, { headers: headers || {} })
}
