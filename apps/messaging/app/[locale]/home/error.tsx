"use client"

import GenericPageError from "@/components/GenericPageError"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <GenericPageError error={error} reset={reset} />
}
