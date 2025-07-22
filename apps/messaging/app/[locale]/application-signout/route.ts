import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const localCookies = cookies()
  for (const { name } of localCookies.getAll()) {
    if (name.startsWith("logto:")) {
      localCookies.delete(name)
    }
  }

  return NextResponse.json({})
}

export const dynamic = "force-dynamic"
