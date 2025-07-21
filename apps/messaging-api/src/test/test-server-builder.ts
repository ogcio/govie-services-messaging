import fastify, { type FastifyBaseLogger } from "fastify";
import fp from "fastify-plugin";
import { vi } from "vitest";
import buildServer from "../app.js";

declare module "fastify" {
  interface FastifyInstance {}
}

// automatically build and tear down our instance
export function build() {
  const app = fastify({
    ajv: {
      customOptions: {
        coerceTypes: false,
        removeAdditional: "all",
      },
    },
  });

  app.register(fp(buildServer));

  return app;
}

export function getMockBaseLogger(level = "info"): FastifyBaseLogger {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
    silent: vi.fn(),
    level,
  };
}
