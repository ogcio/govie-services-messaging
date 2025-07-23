import { NextResponse } from "next/server"
import { AuthenticationFactory } from "@/utils/authentication-factory"
import { getCachedConfig } from "@/utils/env-config"

export async function GET() {
  const isPublicServant =
    await AuthenticationFactory.getInstance().isPublicServant()
  const { baseUrl, myGovIdEndSessionUrl } = getCachedConfig()()
  const signoutUrl = [baseUrl, "signout"].join("/")

  if (!isPublicServant) {
    const endSessionUrl = new URL(myGovIdEndSessionUrl)
    endSessionUrl.searchParams.set("post_logout_redirect_uri", signoutUrl)

    return NextResponse.redirect(endSessionUrl.toString(), 302)
  }

  return NextResponse.redirect(signoutUrl, 302)
}
