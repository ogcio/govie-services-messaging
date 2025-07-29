import { BBClients } from "@/utils/building-blocks-sdk"

export default async (props: { params: { eventId: string } }) => {
  const messagingClient = BBClients.getMessagingClient()
  const messageEvents = await messagingClient.getMessageEvent(
    props.params.eventId,
  )

  let recipient = ""
  let subject = ""
  let plainText = ""
  let richText = ""
  for (const event of messageEvents.data || []) {
    if ("receiverFullName" in event.data) {
      recipient = event.data.receiverFullName
      subject = event.data.subject
      plainText = event.data.plainText
      richText = event.data.richText ?? richText
      break
    }
  }

  return {
    recipient,
    subject,
    richText,
    plainText,
    messageEvents,
  }
}
