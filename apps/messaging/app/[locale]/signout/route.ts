import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthenticationFactory } from "@/utils/authentication-factory"
import { getCachedConfig } from "@/utils/env-config"

export async function GET() {
  const isPublicServant =
    await AuthenticationFactory.getInstance().isPublicServant()
  const referer = headers().get("referer")
  const _cookies = cookies()
  for (const { name } of _cookies.getAll()) {
    _cookies.delete(name)
  }

  let { baseUrl: url, profileUrl } = getCachedConfig()()

  if (referer?.includes("admin")) {
    url += "/admin"
  }

  const globalSignoutURL = new URL("/global-signout", profileUrl)
  globalSignoutURL.searchParams.set("postRedirectUri", url)
  globalSignoutURL.searchParams.set(
    "role",
    isPublicServant ? "public-servant" : "citizen",
  )

  redirect(globalSignoutURL.toString())
}
