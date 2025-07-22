import { Heading, Stack } from "@govie-ds/react"
import { getTranslations } from "next-intl/server"
import { defaultFormGap } from "utils/datetime"
import EventTable from "@/components/message-events/EventTable"
import { SearchBar } from "@/components/message-events/SearchBar"

export default async () => {
  const t = await getTranslations("event")

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Heading>{t("heading.mainEvents")}</Heading>

      <SearchBar />

      <EventTable />
    </Stack>
  )
}
