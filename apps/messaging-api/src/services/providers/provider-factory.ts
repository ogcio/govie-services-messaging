import { httpErrors } from "@fastify/sensible";
import type { Logger } from "@ogcio/building-blocks-sdk/dist/types/index.js";
import type { HttpError } from "http-errors";
import type { Pool } from "pg";
import type { EnvConfig } from "../../plugins/external/env.js";
import {
  type EditableProviderTypes,
  type EmailProvider,
  type Provider,
  type ProviderCreateBody,
  type ProvidersList,
  ProviderTypes,
} from "../../types/providers.js";
import type { PaginationParams } from "../../types/schemaDefinitions.js";
import { EmailSpecificProvider } from "./email/email-specific-provider.js";

export interface SpecificProvider<T extends Provider> {
  readonly pool: Pool;
  readonly organisationId: string;
  readonly providerType: EditableProviderTypes;
  get(params: { providerId: string }): Promise<T>;
  getPrimaryOrDefault(): Promise<T>;
  delete(params: { providerId: string }): Promise<void>;
  create<B extends ProviderCreateBody>(params: {
    inputBody: B;
  }): Promise<string>;
  update(params: { inputBody: T }): Promise<void>;
  list(params: {
    isPrimary: boolean | undefined;
    pagination: Required<PaginationParams>;
  }): Promise<{ data: ProvidersList; totalCount: number }>;
}

function notAllowedProviderError(providerType: string): HttpError {
  return httpErrors.badRequest(
    `This type of provider, ${providerType}, is not allowed`,
  );
}

type ProviderTypeMap = Record<EditableProviderTypes, Provider> & {
  email: EmailProvider;
};

export const ProviderFactory = {
  getSpecificProvider<T extends EditableProviderTypes>(
    providerType: T,
    organisationId: string,
    pool: Pool,
    config?: EnvConfig,
    logger?: Logger,
  ): SpecificProvider<ProviderTypeMap[T]> {
    switch (providerType) {
      case ProviderTypes.Email:
        return new EmailSpecificProvider(pool, organisationId, config, logger);
      default:
        throw notAllowedProviderError(providerType);
    }
  },
};
