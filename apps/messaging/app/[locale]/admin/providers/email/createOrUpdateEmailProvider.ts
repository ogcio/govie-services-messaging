"use server"
import type { getBuildingBlockSDK } from "@ogcio/building-blocks-sdk"
import { providerRoutes } from "utils/routes"
import { buildServerUrl } from "utils/url-utils.server"
import { BBClients } from "@/utils/building-blocks-sdk"

export const createOrUpdateEmailProvider = async ({
  provider,
  locale,
}: {
  provider: Omit<
    NonNullable<
      Awaited<
        ReturnType<
          Awaited<
            ReturnType<typeof getBuildingBlockSDK>["messaging"]
          >["getEmailProvider"]
        >
      >["data"]
    >,
    "id"
  > & { id?: string }
  locale: string
  // biome-ignore lint/suspicious/noExplicitAny: legacy
}): Promise<{ errors?: Record<string, any>; id?: string }> => {
  const client = BBClients.getMessagingClient()
  const url = buildServerUrl({ locale, url: providerRoutes.url })
  url.searchParams.append("provider", "email")

  if (!provider.id) {
    const { error, data } = await client.createEmailProvider(provider)
    if (error) {
      return {
        errors: { api: error.detail },
      }
    }

    return { id: data.id }
  }

  try {
    await client.updateEmailProvider({ ...provider, id: provider.id })
    return { id: provider.id }
  } catch (error) {
    return {
      errors: { api: (error as Error).message },
    }
  }
}
