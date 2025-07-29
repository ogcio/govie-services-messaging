import { SelectedOrganizationHandler } from "@ogcio/nextjs-auth"
import { NextResponse } from "next/server"
import { AuthenticationFactory } from "utils/authentication-factory"
import { getCommonLoggerWithEnvLevel } from "utils/logging"
import { requireUser } from "@/app/[locale]/loaders"
import { getCachedConfig } from "@/utils/env-config"

// retrieve the token in a route handler so Logto can cache the token by setting the cookie
export async function GET() {
  try {
    const config = getCachedConfig()()
    let organizationId = SelectedOrganizationHandler.get()
    if (!organizationId) {
      const user = await requireUser()
      organizationId = user.currentOrganization?.id
    }
    const token = await AuthenticationFactory.getInstance(
      organizationId,
    ).getToken(config.profileApiResource)

    return NextResponse.json({ token })
  } catch (error) {
    getCommonLoggerWithEnvLevel().error(
      { error },
      "Error raised requesting token in /api/profile-token",
    )

    throw error
  }
}
