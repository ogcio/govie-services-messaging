import { SelectedOrganizationHandler } from "@ogcio/nextjs-auth"
import { NextResponse } from "next/server"
import { AuthenticationFactory } from "utils/authentication-factory"
import { requireUser } from "@/app/[locale]/loaders"
import { getCachedConfig } from "@/utils/env-config"

// retrieve the token in a route handler so Logto can cache the token by setting the cookie
export async function GET() {
  const { messagingApiResource } = getCachedConfig()()
  let organizationId = SelectedOrganizationHandler.get()

  if (!organizationId) {
    const user = await requireUser()
    if (user.isPublicServant) {
      organizationId = user.currentOrganization?.id
    }
  }
  const token =
    await AuthenticationFactory.getInstance(organizationId).getToken(
      messagingApiResource,
    )

  return NextResponse.json({ token })
}
