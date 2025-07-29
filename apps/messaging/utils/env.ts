import { getCommonLogger } from "@ogcio/nextjs-logging-wrapper/common-logger"
import type { z } from "zod"

export function validateEnv<T extends Record<string, string>>(
  schema: z.ZodSchema<T>,
): T {
  const result = schema.safeParse(process.env)

  if (!result.success) {
    const logger = getCommonLogger("error")
    logger.error(result.error.message)
    throw new Error(result.error.message)
  }

  return result.data as T
}
