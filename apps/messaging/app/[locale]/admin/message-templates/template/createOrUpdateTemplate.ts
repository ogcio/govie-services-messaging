"use server"
import { redirect } from "next/navigation"
import { BBClients } from "@/utils/building-blocks-sdk"

async function createOrUpdateTemplate({ contents, templateId }) {
  const client = BBClients.getMessagingClient()

  if (templateId) {
    const { error } = await client.updateTemplate(templateId, {
      id: templateId,
      contents,
    })

    return error
      ? { errors: { api: (error as { detail?: string }).detail } }
      : redirect("./")
  }

  const { error, data } = await client.createTemplate({
    contents,
  })

  return error
    ? { errors: { api: (error as { detail?: string }).detail } }
    : redirect(`./?newid=${data.id}`)
}

export { createOrUpdateTemplate }
