import { Stack } from "@govie-ds/react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { FullWidthContainer, MenuContainer } from "@/components/containers"
import { NavLink } from "@/components/NavLink"
import favicon from "@/public/favicon.ico"

export const metadata: Metadata = {
  title: "Messaging",
  icons: [{ rel: "icon", url: favicon.src }],
}

export default async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) => {
  const t = await getTranslations("SideMenu")

  const { locale } = params

  return (
    <Stack direction='row' gap={10} className='sm-wrap'>
      <MenuContainer>
        <Stack gap={3} direction='column'>
          <NavLink href={`/${locale}/admin/send-a-message`}>
            {t("sendMessage")}
          </NavLink>
          <NavLink href={`/${locale}/admin/message-templates`}>
            {t("templates")}
          </NavLink>
          <NavLink href={`/${locale}/admin/providers`}>
            {t("providers")}
          </NavLink>
          <NavLink href={`/${locale}/admin/message-events`}>
            {t("events")}
          </NavLink>
          <NavLink href={`/${locale}/admin/help`}>{t("help")}</NavLink>
        </Stack>
      </MenuContainer>
      <FullWidthContainer>{children}</FullWidthContainer>
    </Stack>
  )
}
