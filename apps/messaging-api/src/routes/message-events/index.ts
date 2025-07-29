import type { FastifyInstance } from "fastify";
import {
  getMessageEvent,
  listMessageEvents,
} from "../../services/message-events/message-event-service.js";
import {
  type GetMessageEventParams,
  GetMessageEventReqSchema,
  type GetMessageEventResponse,
  type ListMessageEventsQueryParams,
  ListMessageEventsReqSchema,
  type ListMessageEventsResponse,
} from "../../types/message-events.js";
import { Permissions } from "../../types/permissions.js";
import {
  ensureOrganizationIdIsSet,
  getM2MAnalyticsSdk,
} from "../../utils/authentication-factory.js";
import {
  formatAPIResponse,
  sanitizePagination,
} from "../../utils/pagination.js";

export const prefix = "/message-events";

export default async function messageEvents(app: FastifyInstance) {
  app.get<{
    Querystring: ListMessageEventsQueryParams;
    Response: ListMessageEventsResponse;
  }>(
    "/",
    {
      preValidation: (req, res) =>
        app.checkPermissions(req, res, [Permissions.Event.Read]),
      schema: ListMessageEventsReqSchema,
    },
    async function getEventsHandler(request, _reply) {
      const pagination = sanitizePagination({
        limit: request.query.limit,
        offset: request.query.offset,
      });

      (await getM2MAnalyticsSdk(request.log)).track.event({
        event: {
          action: "Audit Log Viewed",
          category: "Event Logs",
          name: "event-view-all",
        },
      });

      const response = await listMessageEvents({
        pagination,
        organizationId: ensureOrganizationIdIsSet(request),
        pool: app.pg.pool,
        search: request.query.search,
        dateFrom: request.query.dateFrom,
        dateTo: request.query.dateTo,
        status: request.query.status,
        messageId: request.query.messageId,
      });

      return formatAPIResponse({
        data: response.data,
        totalCount: response.totalCount,
        request,
      });
    },
  );

  app.get<{
    Params: GetMessageEventParams;
    Response: GetMessageEventResponse;
  }>(
    "/:eventId",
    {
      preValidation: (req, res) =>
        app.checkPermissions(req, res, [Permissions.Event.Read]),
      schema: GetMessageEventReqSchema,
    },
    async function getEventHandler(request, _reply) {
      const eventId = request.params.eventId;
      const organizationId = ensureOrganizationIdIsSet(request);

      (await getM2MAnalyticsSdk(request.log)).track.event({
        event: {
          action: "Individual Event Viewed",
          category: "Event Logs",
          name: "event-view-detail",
        },
      });

      const response = await getMessageEvent({
        eventId,
        organizationId,
        pool: app.pg.pool,
      });

      return { data: response };
    },
  );
}
