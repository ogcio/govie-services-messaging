"use client"
import { Header } from "@govie-ds/react"
import { usePathname, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useUser } from "@/components/UserContext"
import { getClientLanguages } from "@/utils/get-languages"
import { DrawerLink } from "./DrawerLink"
import UserMenuDrawer from "./UserMenuDrawer"

export const PageHeader = ({
  publicName,
  config,
}: {
  publicName: string
  config: {
    profileAdminUrl: string
    profileUrl: string
    dashboardUrl: string
    dashboardAdminUrl: string
    messagingUrl: string
  }
}) => {
  const locale = useLocale()
  const path = usePathname()
  const user = useUser()
  const searchParams = useSearchParams()
  const t = useTranslations("navigation.header")
  const {
    profileAdminUrl,
    profileUrl,
    dashboardUrl,
    dashboardAdminUrl,
    messagingUrl,
  } = config

  const languages = getClientLanguages({
    path,
    locale,
    search: searchParams.get("search"),
  })

  return (
    <Header
      logo={{
        href: user.isPublicServant ? `/${locale}/admin` : `/${locale}/home`,
      }}
      secondaryLinks={[languages]}
      title={`${user.currentOrganization?.name ? `${user.currentOrganization.name} - ` : ""} ${t("drawer.link.messaging")}`.trim()}
      items={[
        {
          itemType: "slot",
          icon: "menu",
          label: t("label.menu"),
          showItemMode: "always",
          component: (
            <UserMenuDrawer
              name={publicName}
              selfLabel={t("drawer.link.profile")}
              selfHref={
                user.isPublicServant
                  ? `${profileAdminUrl}/${locale}`
                  : `${profileUrl}/${locale}`
              }
              signoutLabel={t("drawer.link.logout")}
            >
              <DrawerLink
                isBold
                href={
                  user.isPublicServant
                    ? `${dashboardAdminUrl}/${locale}`
                    : `${dashboardUrl}/${locale}`
                }
              >
                {t("drawer.link.dashboard")}
              </DrawerLink>
              <DrawerLink isBold href={`${messagingUrl}/${locale}`}>
                {t("drawer.link.messaging")}
              </DrawerLink>
              {user.isPublicServant && (
                <DrawerLink
                  isBold
                  href={[profileAdminUrl, locale, "service-users"].join("/")}
                >
                  {t("drawer.link.serviceUsers")}
                </DrawerLink>
              )}

              <DrawerLink href={languages.href}>{languages.label}</DrawerLink>
            </UserMenuDrawer>
          ),
          drawerPosition: "right",
          slotAppearance: "drawer",
        },
      ]}
    />
  )
}
