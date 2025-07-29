"use server"
import { RedirectType, redirect } from "next/navigation"
import { AuthenticationFactory } from "./authentication-factory"

const isAuthenticated = async () => {
  const authentication = AuthenticationFactory.getInstance()
  return authentication.isAuthenticated()
}

const getUser = async () => {
  const authentication = AuthenticationFactory.getInstance()
  const user = await authentication.getUser()
  return {
    user,
    isPublicServant: await authentication.isPublicServant(),
    isInactivePublicServant: await authentication.isInactivePublicServant(),
  }
}

const getPublicServantOrRedirect = async ({
  redirectUserTo,
  redirectTo,
}: {
  redirectUserTo: string
  redirectTo?: string
}) => {
  const { user, isPublicServant } = await getUser()

  if (!isPublicServant) {
    redirect(redirectUserTo, RedirectType.replace)
  }

  if (redirectTo) {
    redirect(redirectTo, RedirectType.replace)
  }

  return {
    user,
    isPublicServant,
  }
}

const requireActivePublicServant = async ({
  redirectTo,
  redirectUserTo,
  redirectInactiveTo,
}) => {
  const { isInactivePublicServant } = await getUser()
  if (isInactivePublicServant) {
    return redirect(redirectInactiveTo, RedirectType.replace)
  }

  await getPublicServantOrRedirect({ redirectUserTo })

  redirect(redirectTo, RedirectType.replace)
}

export {
  getUser,
  getPublicServantOrRedirect,
  requireActivePublicServant,
  isAuthenticated,
}
