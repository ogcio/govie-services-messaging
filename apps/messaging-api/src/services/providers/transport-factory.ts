import { httpErrors } from "@fastify/sensible";
import type { HttpError } from "http-errors";
import type { MessageToDeliver } from "../../types/messages.js";
import {
  type EditableProviderTypes,
  type EmailProvider,
  type Provider,
  ProviderTypes,
} from "../../types/providers.js";
import type { MessagingEventLogger } from "../messages/event-logger.js";
import { EmailSpecificTransport } from "./email/email-specific-transport.js";

export interface SpecificTransport<T extends Provider> {
  readonly provider: T;
  sendMessage: (params: {
    message: MessageToDeliver;
    recipientAddress: string;
  }) => Promise<void>;
  checkIfMessageCanBeSent: (params: {
    eventLogger: MessagingEventLogger;
    message: MessageToDeliver;
    userAddress: string | undefined | null;
  }) => Promise<boolean>;
}

function notAllowedTransportError(providerType: string): HttpError {
  return httpErrors.badRequest(
    `This type of transport, ${providerType}, is not allowed`,
  );
}

type ProviderTypeMap = Record<EditableProviderTypes, Provider> & {
  email: EmailProvider;
};

export const TransportFactory = {
  getSpecificTransport<T extends EditableProviderTypes>(
    provider: ProviderTypeMap[T],
  ): SpecificTransport<ProviderTypeMap[T]> {
    switch (provider.type) {
      case ProviderTypes.Email:
        return new EmailSpecificTransport(provider);
      default:
        throw notAllowedTransportError(provider.type);
    }
  },
};
