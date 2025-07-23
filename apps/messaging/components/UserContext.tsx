"use client"

import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect } from "react"
import { setOrganization } from "@/app/[locale]/actions"
import type { AppUser } from "@/types/types"
import { routes } from "../utils"

type UserContextType = {
  user: AppUser | undefined
}

const UserContext = createContext<UserContextType>({
  user: undefined,
})

const UserProvider = ({
  user,
  children,
}: {
  user: AppUser
  children: React.ReactNode
}) => {
  useEffect(() => {
    setOrganization(user.currentOrganization?.id as string)
  }, [user.currentOrganization?.id])

  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  )
}

export const useUser = () => {
  const { user } = useContext(UserContext)
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push(routes.logtoLogin.url)
    }
  }, [user, router])

  return user as AppUser
}

export { UserContext, UserProvider }
