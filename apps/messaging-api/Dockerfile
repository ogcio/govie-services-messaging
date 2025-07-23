FROM base-deps AS messaging-api-base-deps

RUN apk add --no-cache pnpm
# Add non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -G nodejs

FROM messaging-api-base-deps AS deps

WORKDIR /app

COPY ./package*.json /app/
COPY ./apps/messaging-api/ /app/apps/messaging-api/

COPY package.json pnpm-*.yaml /app/
COPY apps/messaging-api/package*.json /app/apps/messaging-api/

RUN pnpm i --frozen-lockfile

FROM deps AS builder

WORKDIR /app

COPY --from=deps --chown=node:node /app/apps/messaging-api/node_modules /app/apps/messaging-api/node_modules
COPY --from=deps --chown=node:node /app/node_modules /app/node_modules
COPY apps/messaging-api/src /app/apps/messaging-api/src
COPY apps/messaging-api/tsconfig* /app/apps/messaging-api/

RUN pnpm build:api

FROM messaging-api-base-deps AS assembler
WORKDIR /app

COPY --from=builder --chown=node:node /app/package.json /app/
COPY --from=builder --chown=node:node /app/pnpm-*.yaml /app/
COPY --from=builder --chown=node:node /app/apps/messaging-api/dist /app/apps/messaging-api/dist
COPY --from=builder --chown=node:node /app/apps/messaging-api/package*.json /app/apps/messaging-api/

RUN pnpm install --prod --frozen-lockfile && \
    rm /app/pnpm-*.yaml

FROM messaging-api-base-deps AS runner

ARG PORT

ENV NODE_ENV=production
ENV LOG_LEVEL=INFO
ENV PORT=$PORT

COPY --from=assembler /app /app

EXPOSE ${PORT}

WORKDIR /app/apps/messaging-api

CMD [ "node", "--import", "./dist/instrumentation.js", "dist/index.js" ]
