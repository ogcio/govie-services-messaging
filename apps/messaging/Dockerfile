FROM base-deps AS deps

WORKDIR /app
ENV LOG_LEVEL=trace

COPY ./package*.json /app/
COPY ./apps/messaging/package*.json /app/apps/messaging/

RUN npm ci

COPY ./apps/messaging/ /app/apps/messaging/

FROM deps AS builder
WORKDIR /app

ARG NEXT_PUBLIC_MESSAGING_SERVICE_ENTRY_POINT
ARG NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT
ARG NEXT_PUBLIC_DASHBOARD_SERVICE_ENTRY_POINT
ARG NEXT_PUBLIC_DASHBOARD_ADMIN_SERVICE_ENTRY_POINT
ARG NEXT_PUBLIC_PROFILE_ADMIN_SERVICE_ENTRY_POINT

ENV NEXT_PUBLIC_MESSAGING_SERVICE_ENTRY_POINT=$NEXT_PUBLIC_MESSAGING_SERVICE_ENTRY_POINT
ENV NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT=$NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT
ENV NEXT_PUBLIC_DASHBOARD_SERVICE_ENTRY_POINT=$NEXT_PUBLIC_DASHBOARD_SERVICE_ENTRY_POINT
ENV NEXT_PUBLIC_DASHBOARD_ADMIN_SERVICE_ENTRY_POINT=$NEXT_PUBLIC_DASHBOARD_ADMIN_SERVICE_ENTRY_POINT
ENV NEXT_PUBLIC_PROFILE_ADMIN_SERVICE_ENTRY_POINT=$NEXT_PUBLIC_PROFILE_ADMIN_SERVICE_ENTRY_POINT
ENV NODE_ENV=production
ENV LOG_LEVEL=trace

RUN npm run build --workspace=apps/messaging

FROM base-deps AS assembler

WORKDIR /app

ENV LOG_LEVEL=trace
ENV NODE_ENV=production

COPY --from=builder /app/apps/messaging/.next/standalone ./
COPY --from=builder /app/apps/messaging/.next/static ./apps/messaging/.next/static
COPY --from=deps /app/node_modules/ /app/node_modules/

RUN npm prune --omit=dev

FROM base-deps AS runner
WORKDIR /app

ENV LOG_LEVEL=trace
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=assembler /app /app

RUN mkdir -p /app/apps/messaging/.next && \
    chown -R nextjs:nodejs /app/apps/messaging/.next && \
    chown nextjs:nodejs /app

USER nextjs:nodejs

EXPOSE 3002
ENV PORT=3002

CMD [ "node", "apps/messaging/server.js" ]