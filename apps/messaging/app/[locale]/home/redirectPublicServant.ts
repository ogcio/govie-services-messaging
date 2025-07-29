import { RedirectType, redirect } from "next/navigation"
import { AuthenticationFactory } from "utils/authentication-factory"

export const redirectIfPublicServant = async () => {
  const instance = AuthenticationFactory.getInstance()
  const { isPublicServant } = await instance.getContext()

  if (isPublicServant) {
    redirect("/admin", RedirectType.replace)
  }
}
