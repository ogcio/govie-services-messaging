"use server"
import { SelectedOrganizationHandler } from "@ogcio/nextjs-auth"
import { getServerLogger } from "@ogcio/nextjs-logging-wrapper/server-logger"
import { revalidatePath } from "next/cache"
import { getCachedConfig } from "@/utils/env-config"

export async function setOrganization(organizationId: string) {
  const logger = getServerLogger()
  const config = getCachedConfig()()
  try {
    SelectedOrganizationHandler.set(
      organizationId,
      config.isProductionEnv,
      true,
    )
    revalidatePath("/")
  } catch (error) {
    logger.error("Error setting organization", { error })
  }
}
