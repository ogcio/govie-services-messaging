"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const NavLink = ({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) => {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link href={href} data-active={isActive}>
      {children}
    </Link>
  )
}
