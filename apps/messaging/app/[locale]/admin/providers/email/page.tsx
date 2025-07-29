"use server"
import { EmailProviderForm } from "@/components/providers/EmailProviderForm"
import loader from "./loader"

export default async (props: {
  params: { locale: string }
  searchParams?: { id: string }
}) => {
  if (props.searchParams?.id) {
    const apiResponse = await loader(props.searchParams.id)
    if ("errors" in apiResponse) {
      throw apiResponse.errors
    }

    return <EmailProviderForm provider={apiResponse} />
  }

  return <EmailProviderForm />
}
