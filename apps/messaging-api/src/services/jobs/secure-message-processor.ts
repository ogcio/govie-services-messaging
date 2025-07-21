import { httpErrors } from "@fastify/sensible";
import type { MessageToDeliver } from "../../types/messages.js";
import { DEFAULT_LANGUAGE } from "../../types/schemaDefinitions.js";
import type { I18n } from "../../utils/i18n.js";
import type {
  GetOrganisationResponse,
  GetProfileResponse,
} from "../users/profile-sdk-wrapper.js";

export function prepareForSecureDelivery({
  profile,
  messageToDeliver,
  i18n,
  organisation,
}: {
  profile: GetProfileResponse;
  messageToDeliver: MessageToDeliver;
  i18n: I18n;
  organisation: NonNullable<GetOrganisationResponse>["data"];
}): MessageToDeliver & { transports: string[] } {
  if (messageToDeliver.securityLevel === "public") {
    return {
      ...messageToDeliver,
      transports: messageToDeliver.transports ?? [],
    };
  }

  const cloned = { ...messageToDeliver };
  cloned.attachmentIds = undefined;

  const secureFields = getSecureFields({
    profile,
    messageToDeliver,
    i18n,
    organisation,
  });

  cloned.body = secureFields.textBody;
  cloned.richText = secureFields.htmlBody;
  cloned.subject = secureFields.subject;
  cloned.excerpt = secureFields.excerpt;

  return { ...cloned, transports: cloned.transports ?? [] };
}

function getSecureFields({
  profile,
  messageToDeliver,
  i18n,
  organisation,
}: {
  profile: GetProfileResponse;
  messageToDeliver: MessageToDeliver;
  i18n: I18n;
  organisation: NonNullable<GetOrganisationResponse>["data"];
}): { htmlBody: string; textBody: string; subject: string; excerpt: string } {
  if (!process.env.MESSAGING_SECURE_MESSAGE_URL) {
    throw httpErrors.internalServerError(
      "Missing MESSAGING_SECURE_MESSAGE_URL variable",
    );
  }

  const seeMessageUrl = process.env.MESSAGING_SECURE_MESSAGE_URL.replace(
    "{{language}}",
    profile.preferredLanguage,
  ).replace("{{messageId}}", messageToDeliver.id);

  const organizationName =
    organisation.translations[profile.preferredLanguage ?? DEFAULT_LANGUAGE]
      .name;
  const htmlBody = i18n.translate(
    profile.preferredLanguage,
    "secureMessageHtml",
    {
      publicName: profile.publicName,
      organizationName,
      showMessageUrl: seeMessageUrl,
    },
  );
  const textBody = i18n.translate(
    profile.preferredLanguage,
    "secureMessageText",
    {
      publicName: profile.publicName,
      showMessageUrl: seeMessageUrl,
      organizationName,
    },
  );

  const subject = i18n.translate(
    profile.preferredLanguage,
    "secureMessageSubject",
    { organizationName },
  );

  const excerpt = i18n.translate(
    profile.preferredLanguage,
    "secureMessageExcerpt",
    { organizationName },
  );

  return { excerpt, subject, textBody, htmlBody };
}
