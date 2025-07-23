import { useCallback, useState } from "react"

export function useAsyncThrow() {
  const [err, setErr] = useState<Error | null>()
  if (err) {
    throw err
  }
  return useCallback((err: Error) => {
    setErr(err)
  }, [])
}
