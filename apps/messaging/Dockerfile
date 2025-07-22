FROM base-deps AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-*.yaml /app/
COPY apps/messaging/package*.json /app/apps/messaging/

COPY ./apps/messaging/ /app/apps/messaging/

RUN pnpm install --frozen-lockfile

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
ENV LOG_LEVEL=info

RUN pnpm --filter messaging build

FROM base-deps AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/apps/messaging/.next/standalone ./
COPY --from=builder /app/apps/messaging/public ./public
COPY --from=builder /app/apps/messaging/.next/static ./.next/static

ENV NODE_ENV=production
EXPOSE 3002
ENV PORT=3002

CMD ["node", "apps/messaging/server.js"]