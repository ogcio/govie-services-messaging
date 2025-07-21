import env from "@fastify/env";

export interface EnvDbConfig {
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB_NAME: string;
}

export interface EnvEmailConfig {
  EMAIL_PROVIDER_SMTP_HOST: string;
  EMAIL_PROVIDER_SMTP_PORT: number;
  EMAIL_PROVIDER_SMTP_USERNAME: string;
  EMAIL_PROVIDER_SMTP_PASSWORD: string;
  EMAIL_PROVIDER_SMTP_FROM_ADDRESS: string;
  EMAIL_PROVIDER_SMTP_USE_SSL: boolean;
}

export interface EnvSnsConfig {
  SNS_REGION: string | undefined;
  SNS_SENDER_ID: string | undefined;
  SNS_THROTTLE_TIME_MS: number | undefined;
  SNS_ALLOWED_ORGANIZATIONS: string | undefined;
}

export interface EnvConfig extends EnvDbConfig, EnvEmailConfig, EnvSnsConfig {
  PROFILE_BACKEND_URL: string;
  LOGTO_JWK_ENDPOINT: string;
  LOGTO_OIDC_ENDPOINT: string;
  LOGTO_API_RESOURCE_INDICATOR: string;
  LOGTO_M2M_PROFILE_APP_SECRET: string;
  LOGTO_M2M_PROFILE_APP_ID: string;
  LOGTO_M2M_ONBOARDING_APP_SECRET: string;
  LOGTO_M2M_ONBOARDING_APP_ID: string;
  LOGTO_M2M_SCHEDULER_APP_SECRET: string;
  LOGTO_M2M_SCHEDULER_APP_ID: string;
  SCHEDULER_BACKEND_URL: string;
  UPLOAD_BACKEND_URL: string;
  LOGTO_M2M_UPLOADER_APP_ID: string;
  LOGTO_M2M_UPLOADER_APP_SECRET: string;
  LOG_LEVEL: string;
  MESSAGING_SECURE_MESSAGE_URL: string;
}

declare module "fastify" {
  export interface FastifyInstance {
    config: EnvConfig;
  }
}

export const EnvKeys: Record<
  string,
  {
    type: "number" | "string" | "boolean";
    default?: number | string | boolean;
    required: boolean;
  }
> = {
  POSTGRES_USER: {
    type: "string",
    required: true,
  },
  POSTGRES_PASSWORD: {
    type: "string",
    required: true,
  },
  POSTGRES_HOST: {
    type: "string",
    required: true,
  },
  POSTGRES_PORT: {
    type: "number",
    required: true,
  },
  POSTGRES_DB_NAME: {
    type: "string",
    required: true,
  },
  PROFILE_BACKEND_URL: {
    type: "string",
    required: true,
  },
  LOGTO_JWK_ENDPOINT: {
    type: "string",
    required: true,
  },
  LOGTO_OIDC_ENDPOINT: {
    type: "string",
    required: true,
  },
  LOGTO_API_RESOURCE_INDICATOR: {
    type: "string",
    required: true,
  },
  LOGTO_M2M_PROFILE_APP_SECRET: {
    type: "string",
    required: true,
  },
  LOGTO_M2M_PROFILE_APP_ID: {
    type: "string",
    required: true,
  },
  LOGTO_M2M_ONBOARDING_APP_SECRET: {
    type: "string",
    required: true,
  },
  LOGTO_M2M_ONBOARDING_APP_ID: {
    type: "string",
    required: true,
  },
  LOGTO_M2M_SCHEDULER_APP_SECRET: {
    type: "string",
    required: true,
  },
  LOGTO_M2M_SCHEDULER_APP_ID: {
    type: "string",
    required: true,
  },
  SCHEDULER_BACKEND_URL: {
    type: "string",
    required: true,
  },
  UPLOAD_BACKEND_URL: {
    type: "string",
    required: true,
  },
  LOGTO_M2M_UPLOADER_APP_ID: {
    type: "string",
    required: true,
  },
  LOGTO_M2M_UPLOADER_APP_SECRET: {
    type: "string",
    required: true,
  },
  LOG_LEVEL: {
    type: "string",
    default: "debug",
    required: false,
  },
  MESSAGING_SECURE_MESSAGE_URL: {
    type: "string",
    required: true,
  },
  EMAIL_PROVIDER_SMTP_HOST: {
    type: "string",
    required: true,
  },
  EMAIL_PROVIDER_SMTP_PORT: {
    type: "number",
    required: false,
    default: 587,
  },
  EMAIL_PROVIDER_SMTP_USERNAME: {
    type: "string",
    required: true,
  },
  EMAIL_PROVIDER_SMTP_PASSWORD: {
    type: "string",
    required: true,
  },
  EMAIL_PROVIDER_SMTP_FROM_ADDRESS: {
    type: "string",
    required: true,
  },
  EMAIL_PROVIDER_SMTP_USE_SSL: {
    type: "boolean",
    required: false,
    default: true,
  },
  SNS_THROTTLE_TIME_MS: {
    type: "number",
    required: false,
  },
  SNS_REGION: {
    type: "string",
    required: false,
  },
  SNS_SENDER_ID: {
    type: "string",
    required: false,
  },
  SNS_ALLOWED_ORGANIZATIONS: {
    type: "string",
    required: false,
  },
};

const allKeys = Object.keys(EnvKeys);
const required = allKeys.filter((keyName) => EnvKeys[keyName].required);
const properties = allKeys.reduce(
  (
    accumulator: Record<
      string,
      { type: string; default?: number | boolean | string }
    >,
    key: string,
  ) => {
    accumulator[key] = {
      type: EnvKeys[key].type,
      default: EnvKeys[key].default,
    };

    return accumulator;
  },
  {},
);

const schema = {
  type: "object",
  required,
  properties,
};

export const autoConfig = {
  schema,
  dotenv: true,
};

export default env;
