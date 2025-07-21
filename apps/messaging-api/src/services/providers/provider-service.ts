import type { Logger } from "@ogcio/building-blocks-sdk/dist/types/index.js";
import type { Pool } from "pg";
import type { EnvConfig } from "../../plugins/external/env.js";
import type {
  EditableProviderTypes,
  EmailProvider,
  Provider,
  ProviderCreateBody,
  ProvidersList,
} from "../../types/providers.js";
import type { PaginationParams } from "../../types/schemaDefinitions.js";
import { ProviderFactory } from "./provider-factory.js";

export async function getProvider(params: {
  pool: Pool;
  providerType: "email";
  providerId: string;
  organisationId: string;
}): Promise<EmailProvider>;
export async function getProvider(params: {
  pool: Pool;
  providerType: EditableProviderTypes;
  providerId: string;
  organisationId: string;
}): Promise<Provider>;
export async function getProvider(params: {
  pool: Pool;
  providerType: EditableProviderTypes;
  providerId: string;
  organisationId: string;
}): Promise<Provider> {
  const specificProvider = ProviderFactory.getSpecificProvider(
    params.providerType,
    params.organisationId,
    params.pool,
  );

  return specificProvider.get(params);
}

export async function getPrimaryProvider(params: {
  pool: Pool;
  providerType: "email";
  organisationId: string;
  config: EnvConfig;
  logger: Logger;
}): Promise<EmailProvider>;
export async function getPrimaryProvider(params: {
  pool: Pool;
  providerType: EditableProviderTypes;
  organisationId: string;
  config: EnvConfig;
  logger: Logger;
}): Promise<Provider>;
export async function getPrimaryProvider(params: {
  pool: Pool;
  providerType: EditableProviderTypes;
  organisationId: string;
  config: EnvConfig;
  logger: Logger;
}): Promise<Provider> {
  const specificProvider = ProviderFactory.getSpecificProvider(
    params.providerType,
    params.organisationId,
    params.pool,
    params.config,
    params.logger,
  );

  return specificProvider.getPrimaryOrDefault();
}

export async function listProviders(params: {
  pool: Pool;
  providerType: EditableProviderTypes;
  isPrimary: boolean | undefined;
  pagination: Required<PaginationParams>;
  organisationId: string;
}): Promise<{ data: ProvidersList; totalCount: number }> {
  const specificProvider = ProviderFactory.getSpecificProvider(
    params.providerType,
    params.organisationId,
    params.pool,
  );

  return specificProvider.list(params);
}

export async function updateProvider(params: {
  pool: Pool;
  organisationId: string;
  provider: Provider;
}) {
  const { pool, organisationId, provider } = params;
  const specificProvider = ProviderFactory.getSpecificProvider(
    provider.type,
    organisationId,
    pool,
  );
  // check if provider exists
  await specificProvider.get({
    providerId: provider.id,
  });

  return specificProvider.update({
    inputBody: provider as EmailProvider,
  });
}

export async function createProvider(params: {
  pool: Pool;
  organisationId: string;
  provider: ProviderCreateBody;
}): Promise<string> {
  const { pool, provider, organisationId } = params;
  const specificProvider = ProviderFactory.getSpecificProvider(
    provider.type,
    organisationId,
    pool,
  );

  return specificProvider.create({ ...params, inputBody: params.provider });
}

export async function deleteProvider(params: {
  providerType: EditableProviderTypes;
  providerId: string;
  organisationId: string;
  pool: Pool;
}): Promise<void> {
  const specificProvider = ProviderFactory.getSpecificProvider(
    params.providerType,
    params.organisationId,
    params.pool,
  );

  return specificProvider.delete({
    providerId: params.providerId,
  });
}
