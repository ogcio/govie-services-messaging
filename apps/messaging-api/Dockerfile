FROM base-deps AS deps

WORKDIR /app

COPY ./package*.json /app/
COPY ./apps/messaging-api/ /app/apps/messaging-api/

RUN npm ci 

FROM deps AS builder

RUN npm run build --workspace=apps/messaging-api

FROM base-deps AS assembler
WORKDIR /app

ENV NODE_ENV=production
ENV LOG_LEVEL=trace

COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/node_modules /app/node_modules

COPY --from=builder /app/apps/messaging-api/dist /app/apps/messaging-api/dist
COPY --from=builder /app/apps/messaging-api/node_modules /app/apps/messaging-api/node_modules
COPY --from=builder /app/apps/messaging-api/package*.json /app/apps/messaging-api/

RUN npm prune --omit=dev

FROM base-deps AS runner

ENV NODE_ENV=production
ENV LOG_LEVEL=trace

COPY --from=assembler /app /app

EXPOSE 8002

WORKDIR /app/apps/messaging-api

CMD [ "node", "--import", "./dist/instrumentation.js", "dist/index.js" ]
