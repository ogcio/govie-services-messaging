import {
  Heading,
  Paragraph,
  Stack,
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeader,
  TableRow,
} from "@govie-ds/react"
import { headers } from "next/headers"
import { getTranslations } from "next-intl/server"
import { defaultFormGap, formatDate, formatTime } from "utils/datetime"
import { BackLink } from "@/components/BackButton"
import { MessageStatus } from "@/components/message-events/MessageStatus"
import { CustomHeaders } from "@/utils/logto-config"
import loader from "./loader"

export default async (props: {
  params: { eventId: string; locale: string }
}) => {
  const t = await getTranslations("event")
  const { recipient, subject, richText, plainText, messageEvents } =
    await loader(props)

  const header = headers()
  const searchQuery = header.get(CustomHeaders.Search)

  const { locale } = props.params
  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Heading>{t("heading.mainEvent")}</Heading>

      <div className='gi-hidden'>
        <Stack direction='row' gap={3}>
          <Paragraph>
            <b>{t("label.recipient")}</b>:
          </Paragraph>
          <Paragraph>{recipient}</Paragraph>
        </Stack>
        <Stack direction='row' gap={3}>
          <Paragraph>
            <b>{t("label.subject")}</b>:
          </Paragraph>
          <Paragraph>{subject}</Paragraph>
        </Stack>
        <div>
          <Heading as='h2' size='xs'>
            {t("heading.plainText")}
          </Heading>
          <Paragraph whitespace='break-spaces'>{plainText}</Paragraph>
        </div>
      </div>

      <div>
        <Heading as='h2' size='xs'>
          {t("heading.richText")}
        </Heading>
        <Paragraph whitespace='break-spaces'>{richText}</Paragraph>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t("table.header.status")}</TableHeader>
            <TableHeader>{t("table.header.date")}</TableHeader>
            <TableHeader>{t("table.header.time")}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {messageEvents.data?.map(async (item) => {
            return (
              <TableRow key={item.data.messageId}>
                <TableData>
                  <MessageStatus
                    type={item.eventType}
                    status={item.eventStatus}
                  />
                </TableData>
                <TableData>{formatDate(item.createdAt)}</TableData>
                <TableData>{formatTime(item.createdAt)}</TableData>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <BackLink href={`/${locale}/admin/message-events${searchQuery || ""}`}>
        {t("link.back")}
      </BackLink>
    </Stack>
  )
}
