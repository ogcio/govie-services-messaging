import path from "node:path"
import * as url from "node:url"
import createNextIntlPlugin from "next-intl/plugin"

const __dirname = url.fileURLToPath(new URL(".", import.meta.url))

const withNextIntl = createNextIntlPlugin("./i18n.ts")

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  frame-src 'self';
  upgrade-insecure-requests;
`

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      "pino",
      "@opentelemetry/instrumentation-pino",
    ],
  },
  // Added this because `unleash-client` is a peer dependency
  // of `building-blocks-sdk` and when next.js builds the project,
  // if the dependency is not installed, throws an error,
  // even if the unleash-client is not really used
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push("unleash-client")

      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@opentelemetry/exporter-jaeger": false,
        "@opentelemetry/winston-transport": false,
      }
    }

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@opentelemetry\/instrumentation/,
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /node_modules\/require-in-the-middle/,
        message:
          /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
    ]

    return config
  },
  headers: async () => {
    return [
      {
        source: "/home/:messageId",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
