"use server"
import { BBClients } from "@/utils/building-blocks-sdk"

export default async (props: {
  searchParams?: { tab: "all" | "unread"; search?: string; offset?: number }
}) => {
  const messagingSdk = BBClients.getMessagingClient()

  const shouldGetAllMessages = props.searchParams?.tab === "all"
  const offset = props.searchParams?.offset ? props.searchParams.offset * 10 : 0

  return await messagingSdk.getMessagesForUser({
    offset,
    limit: 10,
    isSeen: shouldGetAllMessages ? undefined : false,
    search: props.searchParams?.search,
  })
}
