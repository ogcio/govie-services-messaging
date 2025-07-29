import { Heading, Link, List, Paragraph, Stack } from "@govie-ds/react"
import { getTranslations } from "next-intl/server"
import type { ReactElement } from "react"
import { defaultFormGap } from "utils/datetime"
import { getCachedConfig } from "@/utils/env-config"

export default async function HelpPage(props: { params: { locale: string } }) {
  const t = await getTranslations("help")
  const { profileAdminUrl, baseUrl } = getCachedConfig()()
  const { locale } = props.params
  const serviceUsersUrl = new URL(`/${locale}/service-users`, profileAdminUrl)
  const messageTemplatesUrl = new URL(
    `/${locale}/admin/message-templates`,
    baseUrl,
  )
  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Heading>{t("heading.welcome")}</Heading>
      <Heading as='h2'>{t("heading.templates")}</Heading>
      <Paragraph style={{ maxWidth: "unset" }}>
        {t.rich("paragraph.templates", {
          link: (chunks) => (
            <Link href={messageTemplatesUrl.href}>{chunks}</Link>
          ),
        })}
      </Paragraph>
      <Heading as='h2'>{t("heading.recipients")}</Heading>
      <Paragraph style={{ maxWidth: "unset" }}>
        {t.rich("paragraph.recipients", {
          link: (chunks) => <Link href={serviceUsersUrl.href}>{chunks}</Link>,
        })}
      </Paragraph>
      <Heading as='h2'>{t("heading.setupSteps")}</Heading>
      <List
        type='number'
        items={[
          t.rich("list.setupSteps.0", {
            b: (chunks) => <b>{chunks}</b>,
          }) as ReactElement,
          t("list.setupSteps.1"),
          t.rich("list.setupSteps.2", {
            b: (chunks) => <b>{chunks}</b>,
          }) as ReactElement,
          t("list.setupSteps.3"),
          t.rich("list.setupSteps.4", {
            b: (chunks) => <b>{chunks}</b>,
          }) as ReactElement,
          t.rich("list.setupSteps.5", {
            b: (chunks) => <b>{chunks}</b>,
          }) as ReactElement,
          t.rich("list.setupSteps.6", {
            b: (chunks) => <b>{chunks}</b>,
          }) as ReactElement,
        ]}
      />
      <Link
        href={`/${props.params.locale}/admin/send-a-message`}
        asButton={{ appearance: "default" }}
      >
        {t("button.sendAMessage")}
      </Link>
    </Stack>
  )
}
