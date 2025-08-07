import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { FeatureFlagsWrapper } from "../../utils/feature-flags.js";

declare module "fastify" {
  export interface FastifyInstance {
    featureFlagsWrapper: FeatureFlagsWrapper;
  }
}

export default fp(
  async (server: FastifyInstance, _opts: FastifyPluginAsync) => {
    server.decorate(
      "featureFlagsWrapper",
      new FeatureFlagsWrapper({
        url: server.config.FEATURE_FLAGS_URL ?? "",
        token: server.config.FEATURE_FLAGS_TOKEN ?? "",
      }),
    );
  },
);
