"use server"
import { MessageSecurityLevel } from "const/messaging"
import { LANG_EN, type MessageState } from "@/types/shared"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function createMessages({
  templateMetaId,
  userIds,
  schedule,
  securityLevel,
}: Partial<MessageState>) {
  if (!templateMetaId || !userIds?.filter(Boolean)?.length || !schedule) {
    return {
      created: 0,
      errors: {},
    }
  }

  const messaging = BBClients.getMessagingClient()
  const { data: template } = await messaging.getTemplate(templateMetaId)

  if (!template) {
    return {
      created: 0,
      errors: { api: "Template not found" },
    }
  }

  let created = 0
  const errors: Record<string, string> = {}
  const profiles = await BBClients.getProfileClient().selectProfiles(
    userIds.join(","),
  )

  const userMessages = await Promise.all(
    userIds.map(async (userId) => {
      const profile = profiles.data.find((p) => p.id === userId)
      if (!profile) {
        errors[userId] = "Profile not found"
        return { [userId]: null }
      }

      try {
        const preferredLanguageOrDefault = template.contents.some(
          (content) => content.language === profile.preferredLanguage,
        )
          ? profile.preferredLanguage
          : template.contents.at(0)?.language || LANG_EN
        const message = await messaging.buildMessage(
          template.contents.map((c) => ({
            ...c,
            threadName: c.subject,
          })),
          preferredLanguageOrDefault,
          {
            publicName: profile.publicName,
            email: profile.email,
            ppsn: profile.details?.ppsn || "",
          },
        )
        return {
          [userId]: message,
        }
      } catch (err) {
        errors[userId] = err.message
        return { [userId]: null }
      }
    }),
  )

  for (const userMessage of userMessages) {
    const userId = Object.keys(userMessage)[0]
    const message = userMessage[userId]

    if (!message) {
      errors[userId] = "no message"
      continue
    }

    try {
      const { error } = await messaging.send({
        message,
        preferredTransports: ["email"],
        scheduleAt: schedule,
        security: securityLevel ?? MessageSecurityLevel.CONFIDENTIAL,
        recipientUserId: userId,
      })
      if (error) {
        errors[userId] = error.detail
      }
      created += 1
    } catch (err) {
      errors[userId] = err.detail
    }
  }

  return {
    created,
    errors,
  }
}
