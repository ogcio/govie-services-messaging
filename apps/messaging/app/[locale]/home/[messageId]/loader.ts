import { RedirectType, redirect } from "next/navigation"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildClientUrlWithSearchParams } from "@/utils/url-utils.client"

export default async ({
  params,
  searchParams,
}: {
  params: { messageId: string; locale: string }
  searchParams: { [key: string]: string | string[] } | undefined
}) => {
  const messagingSdk = BBClients.getMessagingClient()
  const message = await messagingSdk.getMessage(params.messageId)
  // Redirect back to home page if message is not found
  if (!message.data) {
    return redirect(
      buildClientUrlWithSearchParams({
        locale: params.locale,
        dir: "/home",
        searchParams,
      }).toString(),
      RedirectType.replace,
    )
  }

  const meta: {
    fileName: string
    id?: string
    key: string
    ownerId: string
    fileSize: number
    mimeType: string
    createdAt: string
    lastScan: string
    deleted: boolean
    infected: boolean
    infectionDescription?: string
    antivirusDbVersion?: string
    expiresAt?: string
  }[] = []
  let attachments: string[] = []
  if ("attachments" in message.data) {
    attachments = message.data.attachments
  }
  if (attachments.length) {
    const uploadSdk = BBClients.getUploadClient()
    const responses = await Promise.all(
      attachments.map((a) => uploadSdk.getFileMetadata(a)),
    )
    for (const response of responses) {
      if (response.data) {
        meta.push(response.data)
      }
    }
  }

  return { message, meta }
}
