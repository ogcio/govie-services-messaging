import type { FastifyInstance } from "fastify";
import {
  createProvider,
  deleteProvider,
  getProvider,
  listProviders,
  updateProvider,
} from "../../services/providers/provider-service.js";
import { Permissions } from "../../types/permissions.js";
import {
  type Provider,
  type ProviderCreateBody,
  ProviderCreateReqSchema,
  type ProviderCreateResponse,
  type ProviderDeleteReqQueryParams,
  ProviderDeleteReqSchema,
  type ProviderDeleteResponse,
  type ProviderGetReqQueryParams,
  ProviderGetReqSchema,
  type ProviderGetResponse,
  type ProviderId,
  type ProvidersListReqQueryParams,
  ProvidersListReqSchema,
  type ProvidersListResponse,
  ProviderUpdateReqSchema,
  type ProviderUpdateResponse,
} from "../../types/providers.js";
import { parseBooleanEnum } from "../../types/schemaDefinitions.js";
import { ensureOrganizationIdIsSet } from "../../utils/authentication-factory.js";
import {
  formatAPIResponse,
  sanitizePagination,
} from "../../utils/pagination.js";

export const prefix = "/providers";

export default async function providers(app: FastifyInstance) {
  // get providers
  app.get<{
    Querystring: ProvidersListReqQueryParams;
    Response: ProvidersListResponse;
  }>(
    "/",
    {
      preValidation: (req, res) =>
        app.checkPermissions(req, res, [Permissions.Provider.Read]),
      schema: ProvidersListReqSchema,
    },
    async function handleGetProviders(request) {
      const pagination = sanitizePagination({
        limit: request.query.limit,
        offset: request.query.offset,
      });
      const organisationId = ensureOrganizationIdIsSet(request);
      const isPrimary = request.query.primary
        ? parseBooleanEnum(request.query.primary)
        : undefined;

      const result = await listProviders({
        pool: app.pg.pool,
        isPrimary,
        providerType: request.query.type,
        pagination,
        organisationId,
      });

      return formatAPIResponse({
        data: result.data,
        request,
        totalCount: result.totalCount,
      });
    },
  );

  //get provider
  app.get<{
    Querystring: ProviderGetReqQueryParams;
    Params: ProviderId;
    Response: ProviderGetResponse;
  }>(
    "/:providerId",
    {
      preValidation: (req, res) =>
        app.checkPermissions(req, res, [Permissions.Provider.Read]),
      schema: ProviderGetReqSchema,
    },
    async function handleGetProvider(request) {
      return {
        data: await getProvider({
          pool: app.pg.pool,
          providerType: request.query.type,
          organisationId: ensureOrganizationIdIsSet(request),
          providerId: request.params.providerId,
        }),
      };
    },
  );

  // create provider
  app.post<{
    Body: ProviderCreateBody;
    Response: ProviderCreateResponse;
  }>(
    "/",
    {
      preValidation: (req, res) =>
        app.checkPermissions(req, res, [Permissions.Provider.Write]),
      schema: ProviderCreateReqSchema,
    },
    async function handleCreateProvider(request, response) {
      const organisationId = ensureOrganizationIdIsSet(request);
      const providerId = await createProvider({
        pool: app.pg.pool,
        organisationId,
        provider: request.body,
      });
      response.status(201);
      return { data: { id: providerId } };
    },
  );

  // update provider
  app.put<{
    Body: Provider;
    Params: ProviderId;
    Response: ProviderUpdateResponse;
  }>(
    "/:providerId",
    {
      preValidation: (req, res) =>
        app.checkPermissions(req, res, [Permissions.Provider.Write]),
      schema: ProviderUpdateReqSchema,
    },
    async function handleUpdateProvider(request) {
      if (request.body.id !== request.params.providerId) {
        throw app.httpErrors.badRequest(
          "provider id from body and url param are not identical",
        );
      }

      const organisationId = ensureOrganizationIdIsSet(request);

      await updateProvider({
        pool: app.pg.pool,
        organisationId,
        provider: request.body,
      });

      return { data: { id: request.params.providerId } };
    },
  );

  app.delete<{
    Params: ProviderId;
    Response: ProviderDeleteResponse;
    Querystring: ProviderDeleteReqQueryParams;
  }>(
    "/:providerId",
    {
      preValidation: (req, res) =>
        app.checkPermissions(req, res, [Permissions.Provider.Delete]),
      schema: ProviderDeleteReqSchema,
    },
    async function handleDeleteProvider(request) {
      const organisationId = ensureOrganizationIdIsSet(request);
      const providerId = request.params.providerId;
      const providerType = request.query.type;

      await deleteProvider({
        providerType,
        organisationId,
        providerId,
        pool: app.pg.pool,
      });

      return { data: { id: providerId } };
    },
  );
}
