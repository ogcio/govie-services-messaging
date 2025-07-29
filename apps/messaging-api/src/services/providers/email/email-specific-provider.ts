import { httpErrors } from "@fastify/sensible";
import type { Logger } from "@ogcio/building-blocks-sdk/dist/types/index.js";
import type { Pool, PoolClient } from "pg";
import type { EnvConfig } from "../../../plugins/external/env.js";
import type {
  EditableProviderTypes,
  EmailCreateBody,
  EmailProvider,
  ProvidersList,
  ProvidersListItem,
} from "../../../types/providers.js";
import type { PaginationParams } from "../../../types/schemaDefinitions.js";
import type { SpecificProvider } from "../provider-factory.js";

const FAILED_TO_FIND = "failed to find email provider";

export class EmailSpecificProvider implements SpecificProvider<EmailProvider> {
  readonly providerType: EditableProviderTypes;
  constructor(
    readonly pool: Pool,
    readonly organisationId: string,
    readonly config?: EnvConfig,
    readonly logger?: Logger,
  ) {
    this.providerType = "email";
  }

  async get(params: { providerId: string }): Promise<EmailProvider> {
    let provider: EmailProvider | undefined;
    try {
      const queryResult = await this.pool.query<EmailProvider>(
        `
SELECT id,
    'email' as "type",
    provider_name as "providerName",
    COALESCE(is_primary, false) as "isPrimary",
    smtp_host as "smtpHost",
    smtp_port as "smtpPort",
    username,
    pw as "password",
    COALESCE(throttle_ms, 0) as "throttle",
    from_address as "fromAddress",
    is_ssl as "ssl"
FROM email_providers
WHERE organisation_id = $1 AND id = $2
AND deleted_at is null
ORDER BY provider_name`,
        [this.organisationId, params.providerId],
      );

      provider = queryResult.rows.at(0);
    } catch (error) {
      throw httpErrors.createError(500, "failed to query email provider", {
        parent: error,
      });
    }

    if (!provider) {
      throw httpErrors.notFound(FAILED_TO_FIND);
    }

    return provider;
  }

  getDefault(): EmailProvider {
    if (!this.config) {
      throw httpErrors.internalServerError(
        "No config found for default email provider",
      );
    }
    return {
      id: "default",
      providerName: "Gov.ie Secure Messaging",
      isPrimary: true,
      smtpHost: this.config.EMAIL_PROVIDER_SMTP_HOST,
      smtpPort: this.config.EMAIL_PROVIDER_SMTP_PORT,
      username: this.config.EMAIL_PROVIDER_SMTP_USERNAME,
      password: this.config.EMAIL_PROVIDER_SMTP_PASSWORD,
      fromAddress: this.config.EMAIL_PROVIDER_SMTP_FROM_ADDRESS,
      ssl: this.config.EMAIL_PROVIDER_SMTP_USE_SSL,
      throttle: 1,
      type: "email",
    };
  }

  async getPrimaryOrDefault(): Promise<EmailProvider> {
    let provider: EmailProvider | undefined;
    try {
      const queryResult = await this.pool.query<EmailProvider>(
        `
SELECT id,
  'email' as "type",
  provider_name as "providerName",
  is_primary as "isPrimary",
  smtp_host as "smtpHost",
  smtp_port as "smtpPort",
  username,
  pw as "password",
  COALESCE(throttle_ms, 0) as "throttle",
  from_address as "fromAddress",
  is_ssl as "ssl"
FROM email_providers
WHERE organisation_id = $1 AND is_primary = true
AND deleted_at is null
ORDER BY provider_name`,
        [this.organisationId],
      );

      provider = queryResult.rows.at(0);
    } catch (error) {
      throw httpErrors.createError(
        500,
        "failed to query primary email provider",
        {
          parent: error,
        },
      );
    }

    // If no primary provider is found, return the default provider
    if (!provider) {
      this.logger?.warn(
        { organisationId: this.organisationId },
        "No primary email provider found, returning default",
      );
      return this.getDefault();
    }

    return provider;
  }

  async delete(params: { providerId: string }): Promise<void> {
    let deleted = 0;
    try {
      const deleteQueryResult = await this.pool.query(
        `
UPDATE email_providers 
SET deleted_at = now()
WHERE id = $1 AND organisation_id = $2
RETURNING 1`,
        [params.providerId, this.organisationId],
      );

      deleted = deleteQueryResult.rowCount || 0;
    } catch (error) {
      throw httpErrors.createError(500, "failed delete query", {
        parent: error,
      });
    }

    if (deleted === 0) {
      throw httpErrors.notFound(FAILED_TO_FIND);
    }
  }

  async create(params: { inputBody: EmailCreateBody }): Promise<string> {
    const { inputBody } = params;
    await this.ensureEmailProviderDoesntExist({
      inputBody,
      organisationId: this.organisationId,
    });

    const client = await this.pool.connect();
    try {
      client.query("BEGIN");

      const isPrimary = await this.needToSetProviderAsPrimary({
        client,
        organisationId: this.organisationId,
        setAsPrimary: inputBody.isPrimary,
        tableName: "email_providers",
      });

      if (isPrimary) {
        await client.query(
          `
UPDATE email_providers
SET is_primary = null
WHERE organisation_id = $1`,
          [this.organisationId],
        );
      }

      const queryResult = await client.query<{ providerId: string }>(
        `
INSERT INTO email_providers(provider_name, smtp_host, smtp_port, username, pw, from_address, throttle_ms, is_ssl, organisation_id, is_primary)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
RETURNING id as "providerId"`,
        [
          inputBody.providerName,
          inputBody.smtpHost,
          inputBody.smtpPort,
          inputBody.username,
          inputBody.password,
          inputBody.fromAddress,
          inputBody.throttle,
          inputBody.ssl,
          this.organisationId,
          isPrimary,
        ],
      );

      const providerId = queryResult.rows.at(0)?.providerId;
      if (!providerId) {
        throw httpErrors.internalServerError("no record has been inserted");
      }

      await client.query("COMMIT");

      return providerId;
    } catch (error) {
      await client.query("ROLLBACK");
      throw httpErrors.createError(500, "failed to insert email provider", {
        parent: error,
      });
    } finally {
      client.release();
    }
  }

  async update(params: { inputBody: EmailProvider }): Promise<void> {
    const { inputBody } = params;
    await this.ensureEmailProviderDoesntExist({
      inputBody,
      organisationId: this.organisationId,
      providerIdToIgnore: params.inputBody.id,
    });

    const client = await this.pool.connect();
    let updatedCount = 0;
    try {
      client.query("BEGIN");
      const isPrimary = await this.needToSetProviderAsPrimary({
        client,
        organisationId: this.organisationId,
        setAsPrimary: inputBody.isPrimary,
        providerIdToIgnore: inputBody.id,
        tableName: "email_providers",
      });
      if (isPrimary) {
        await client.query(
          `
UPDATE email_providers SET is_primary = null
WHERE organisation_id = $1`,
          [this.organisationId],
        );
      }

      const updateResult = await client.query(
        `
UPDATE email_providers SET 
  provider_name = $1, 
  smtp_host = $2,
  smtp_port = $3,
  username = $4,
  pw = $5,
  from_address = $6,
  throttle_ms = $7,
  is_ssl = $8,
  is_primary = $9
WHERE id = $10 AND organisation_id = $11
RETURNING 1`,
        [
          inputBody.providerName,
          inputBody.smtpHost,
          inputBody.smtpPort,
          inputBody.username,
          inputBody.password,
          inputBody.fromAddress,
          inputBody.throttle,
          inputBody.ssl,
          isPrimary,
          inputBody.id,
          this.organisationId,
        ],
      );
      updatedCount = updateResult.rowCount || 0;
      client.query("COMMIT");
    } catch (error) {
      client.query("ROLLBACK");
      throw httpErrors.createError(500, "failed to update email provider", {
        parent: error,
      });
    } finally {
      client.release();
    }

    if (!updatedCount) {
      throw httpErrors.notFound(FAILED_TO_FIND);
    }
  }

  async list(params: {
    isPrimary: boolean | undefined;
    pagination: Required<PaginationParams>;
  }): Promise<{ data: ProvidersList; totalCount: number }> {
    let isPrimaryWhereClause = "";
    if (params.isPrimary !== undefined) {
      isPrimaryWhereClause = params.isPrimary
        ? "AND is_primary = true"
        : "AND (is_primary = false OR is_primary IS NULL)";
    }
    try {
      // separated count result query because using CTE
      // no result is returned if the requested offset is
      // higher than the total count
      const countResult = await this.pool.query<{ count: number }>(
        `
SELECT count(*) FROM email_providers
WHERE organisation_id = $1
AND deleted_at is null
${isPrimaryWhereClause}`,
        [this.organisationId],
      );
      if (countResult.rowCount === 0 || countResult.rows[0].count === 0) {
        return { data: [], totalCount: 0 };
      }
      const result = await this.pool.query<ProvidersListItem>(
        `
SELECT
  id,
  provider_name as "providerName",
  is_primary as "isPrimary",
  'email' as "type"
FROM email_providers
WHERE organisation_id = $1
AND deleted_at is null 
${isPrimaryWhereClause}
ORDER BY provider_name
LIMIT $2
OFFSET $3`,
        [
          this.organisationId,
          params.pagination.limit,
          params.pagination.offset,
        ],
      );

      return {
        data: result.rows,
        totalCount: Number(countResult.rows[0].count),
      };
    } catch (error) {
      throw httpErrors.createError(500, "failed to query email providers", {
        parent: error,
      });
    }
  }

  private async ensureEmailProviderDoesntExist(params: {
    inputBody: EmailCreateBody;
    organisationId: string;
    providerIdToIgnore?: string;
  }): Promise<void> {
    const values: string[] = [
      params.organisationId,
      params.inputBody.fromAddress,
      params.inputBody.providerName,
    ];
    let templateIdToIgnoreWhere = "";
    if (params.providerIdToIgnore) {
      templateIdToIgnoreWhere = " AND id != $4 ";
      values.push(params.providerIdToIgnore);
    }

    const duplicationQueryResult = await this.pool.query<{
      exists: boolean;
    }>(
      `
SELECT exists(
  SELECT * from email_providers
  WHERE organisation_id = $1 
  AND (lower(from_address) = lower($2) OR lower(provider_name) = lower($3))
  ${templateIdToIgnoreWhere}
)`,
      values,
    );

    const addressExists = Boolean(duplicationQueryResult.rows.at(0)?.exists);

    if (addressExists) {
      throw httpErrors.createError(
        422,
        "provider from address or name already exists",
        {
          validation: [
            {
              fieldName: "fromAddress",
              message: "alreadyInUse",
              validationRule: "already-in-use",
            },
          ],
        },
      );
    }
  }

  private async needToSetProviderAsPrimary(params: {
    client: PoolClient;
    organisationId: string;
    providerIdToIgnore?: string;
    setAsPrimary: boolean | null;
    tableName: "email_providers";
  }): Promise<boolean | null> {
    if (params.setAsPrimary) {
      return true;
    }
    const values = [params.organisationId];
    let idWhereClause = "";
    if (params.providerIdToIgnore) {
      idWhereClause = " AND id != $2";
      values.push(params.providerIdToIgnore);
    }
    const otherProviders = await params.client.query<{ id: string }>(
      `
SELECT id FROM ${params.tableName}
WHERE organisation_id = $1
AND deleted_at is null
${idWhereClause}
LIMIT 1`,
      values,
    );

    return otherProviders.rowCount === 0 || null;
  }
}
