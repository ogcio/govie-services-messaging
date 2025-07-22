"use client"
import { Heading, Link, Stack } from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { ANALYTICS } from "const/analytics"
import { setOrganization } from "@/app/[locale]/actions"
import { UserMenuDrawerContainer } from "@/components/containers"
import { useUser } from "@/components/UserContext"
import { DrawerLink } from "./DrawerLink"
import { OrganizationSelector } from "./OrganizationSelector"

export default function UserMenuDrawer(
  props: React.PropsWithChildren<{
    name: string
    selfHref: string
    selfLabel: string
    signoutLabel: string
  }>,
) {
  const { organizations, currentOrganization, isPublicServant } = useUser()
  const analyticsClient = useAnalytics()

  return (
    <UserMenuDrawerContainer>
      <Stack direction='column' gap={12}>
        <div>
          <Heading as='h2' size='md'>
            {props.name}
          </Heading>
          <DrawerLink href={props.selfHref} isBold>
            {props.selfLabel}
          </DrawerLink>
        </div>
        {organizations && organizations.length > 1 && (
          <OrganizationSelector
            title='Department'
            actionTitle='Change department'
            organizations={organizations.map((org) => ({
              name: org.name,
              id: org.id,
            }))}
            defaultOrganization={currentOrganization?.id}
            handleChange={setOrganization}
            disabled={false}
          />
        )}
        <Stack direction='column' gap={4} hasDivider>
          {props.children}
        </Stack>
      </Stack>

      <Link
        className='gi-w-full footer'
        href='/signout'
        asButton={{
          size: "large",
        }}
        onClick={() => {
          const eventType = ANALYTICS[isPublicServant ? "adminUser" : "user"]

          analyticsClient.trackEvent({
            event: {
              name: eventType.logout.name,
              category: eventType.category,
              action: eventType.logout.action,
            },
          })
        }}
      >
        {props.signoutLabel}
      </Link>
    </UserMenuDrawerContainer>
  )
}
