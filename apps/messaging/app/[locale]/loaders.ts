"use server"

import {
  type AuthSessionOrganizationInfo,
  SelectedOrganizationHandler,
} from "@ogcio/nextjs-auth"
import { getServerLogger } from "@ogcio/nextjs-logging-wrapper/server-logger"
import { notFound, redirect } from "next/navigation"
import type { AppUser, ProfilePayload } from "@/types/types"
import { AuthenticationFactory } from "@/utils/authentication-factory"
import { BBClients } from "@/utils/building-blocks-sdk"
import { buildLoginUrlWithPostLoginRedirect } from "@/utils/logto-config"

export const requireUser = async (): Promise<AppUser> => {
  const logger = getServerLogger()
  // Maintain the get context outside of the try
  // catch because in this way it already redirects
  // to the correct login url based on
  // logto config, if needed
  const instance = AuthenticationFactory.getInstance()
  const context = await instance.getContext()
  // TODO: ADO-29439 - remove this debug log
  logger.debug("requireUser - got context")

  try {
    const userInfo = await instance.getUser()
    // TODO: ADO-29439 - remove this debug log
    logger.debug("requireUser - got user info")

    const userData: AppUser = {
      id: userInfo.id,
      isPublicServant: context.isPublicServant,
      isInactivePublicServant: context.isInactivePublicServant,
    }

    if (context.isPublicServant) {
      const organizationList = Object.values(userInfo.organizationData ?? {})

      const organizationId = SelectedOrganizationHandler.get()
      const defaultOrganization =
        organizationList.find((org) => org.id === organizationId) ??
        organizationList[0]

      return {
        ...userData,
        currentOrganization: defaultOrganization,
        organizations: organizationList.map((org) => ({
          id: org.id,
          name: org.name,
          roles: org.roles,
        })),
      }
    }
    return userData
  } catch (error) {
    logger.error(`Error fetching user info, redirecting to login: ${error}`, {
      error,
    })
    redirect(buildLoginUrlWithPostLoginRedirect())
  }
}

export const getOrganizations = async (): Promise<{
  organizations: AuthSessionOrganizationInfo[]
  defaultOrganization: AuthSessionOrganizationInfo
}> => {
  const instance = AuthenticationFactory.getInstance()
  const userInfo = await instance.getUser()
  const defaultOrganizationId = userInfo.currentOrganization?.id
  if (
    !defaultOrganizationId ||
    !userInfo.organizationData ||
    !userInfo.organizationData[defaultOrganizationId]
  ) {
    throw notFound()
  }

  return {
    organizations: Object.values(userInfo.organizationData ?? {}),
    defaultOrganization: userInfo.organizationData[defaultOrganizationId],
  }
}

export const requireProfile = async ({
  userId,
}: {
  userId: string
}): Promise<{
  profile: ProfilePayload
}> => {
  const profile = await BBClients.getProfileClient().getProfile(userId)
  if (profile.error) {
    throw new Error("profile error")
  }
  if (!profile.data) {
    throw new Error("profile not found")
  }
  return { profile: profile.data }
}
