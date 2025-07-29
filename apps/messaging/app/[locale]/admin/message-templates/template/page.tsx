import { MessageTemplateForm } from "@/components/message-templates/MessageTemplateForm"
import type { MessageTemplateFormData } from "@/types/types"
import { getTemplate } from "./getTemplate"

export default async (props: {
  params: { locale: string }
  searchParams: { id?: string }
}) => {
  const templates: MessageTemplateFormData = {
    languages: [] as string[],
    templateId: undefined,
  }

  if (props.searchParams.id) {
    const apiResponse = await getTemplate(props.searchParams.id)
    if ("errors" in apiResponse) {
      throw apiResponse.errors
    }

    for (const item of apiResponse.contents) {
      templates.templateId = props.searchParams.id
      templates[item.language] = {
        subject: item.subject,
        plainText: item.plainText,
        richText: item.richText ?? "",
        templateName: item.templateName,
      }
      templates.languages.push(item.language)
    }
    return <MessageTemplateForm templates={templates} />
  }

  return <MessageTemplateForm templates={templates} />
}
