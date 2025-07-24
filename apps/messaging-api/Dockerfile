FROM base-deps AS messaging-api-base-deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM messaging-api-base-deps AS builder
WORKDIR /app

COPY ./pnpm*.yaml /app/
COPY ./package.json /app/
COPY ./apps/messaging-api/ /app/apps/messaging-api/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
RUN pnpm api:build
RUN pnpm deploy --filter=messaging-api --prod /app/deploy

FROM messaging-api-base-deps AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV PORT=8002

COPY --from=builder /app/deploy/dist /app/apps/messaging-api/dist
COPY --from=builder /app/deploy/node_modules /app/apps/messaging-api/node_modules
COPY --from=builder /app/deploy/package.json /app/apps/messaging-api/
COPY --from=builder /app/deploy/pnpm*.yaml /app/apps/messaging-api/

EXPOSE ${PORT}

WORKDIR /app/apps/messaging-api

CMD [ "node", "--import", "./dist/instrumentation.js", "dist/index.js" ]