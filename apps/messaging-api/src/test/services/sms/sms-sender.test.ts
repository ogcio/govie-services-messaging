import type { FastifyBaseLogger } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EnvConfig } from "../../../plugins/external/env.js";
import { SmsSender } from "../../../services/sms/sms-sender.js";
import type { GetProfileResponse } from "../../../services/users/profile-sdk-wrapper.js";

const getMockLogger = (): FastifyBaseLogger => {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn().mockReturnThis(),
  } as unknown as FastifyBaseLogger;
};

const getMockConfig = (overrides: Partial<EnvConfig> = {}): EnvConfig => ({
  SNS_REGION: "eu-west-1",
  SNS_SENDER_ID: "TestSender",
  SNS_ALLOWED_ORGANIZATIONS: "org1,org2",
  SNS_THROTTLE_TIME_MS: 0,
  POSTGRES_USER: "user",
  POSTGRES_PASSWORD: "pass",
  POSTGRES_HOST: "host",
  POSTGRES_PORT: 5432,
  POSTGRES_DB_NAME: "db",
  EMAIL_PROVIDER_SMTP_HOST: "smtp",
  EMAIL_PROVIDER_SMTP_PORT: 587,
  EMAIL_PROVIDER_SMTP_USERNAME: "user",
  EMAIL_PROVIDER_SMTP_PASSWORD: "pass",
  EMAIL_PROVIDER_SMTP_FROM_ADDRESS: "from@ex.com",
  EMAIL_PROVIDER_SMTP_USE_SSL: true,
  PROFILE_BACKEND_URL: "url",
  LOGTO_JWK_ENDPOINT: "url",
  LOGTO_OIDC_ENDPOINT: "url",
  LOGTO_API_RESOURCE_INDICATOR: "url",
  LOGTO_M2M_PROFILE_APP_SECRET: "secret",
  LOGTO_M2M_PROFILE_APP_ID: "id",
  LOGTO_M2M_ONBOARDING_APP_SECRET: "secret",
  LOGTO_M2M_ONBOARDING_APP_ID: "id",
  LOGTO_M2M_SCHEDULER_APP_SECRET: "secret",
  LOGTO_M2M_SCHEDULER_APP_ID: "id",
  SCHEDULER_BACKEND_URL: "url",
  UPLOAD_BACKEND_URL: "url",
  LOGTO_M2M_UPLOADER_APP_ID: "id",
  LOGTO_M2M_UPLOADER_APP_SECRET: "secret",
  LOG_LEVEL: "debug",
  MESSAGING_SECURE_MESSAGE_URL: "url",
  ...overrides,
});

const getMockProfile = (
  overrides: Partial<GetProfileResponse> = {},
): GetProfileResponse => {
  const details =
    overrides.details !== undefined
      ? overrides.details
      : {
          firstName: "Test",
          lastName: "User",
          preferredLanguage: "en",
          phone: "+353871234567",
          email: "test@example.com",
        };
  return {
    id: "user-id",
    details,
    ...overrides,
  } as GetProfileResponse;
};

describe("SmsSender", () => {
  let logger: FastifyBaseLogger;
  let config: EnvConfig;
  let profile: GetProfileResponse;

  beforeEach(() => {
    logger = getMockLogger();
    config = getMockConfig();
    profile = getMockProfile();
    vi.clearAllMocks();
  });

  it("should enable SMS if all conditions are met", () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).smsEnabled).toBe(true);
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).parsedPhoneNumber).toBe("+353871234567");
  });

  it("should not enable SMS if organization is not allowed", () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    const sender = new SmsSender({
      profile,
      organizationId: "not-allowed",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).smsEnabled).toBe(false);
  });

  it("should not enable SMS if phone number is missing", () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    profile = getMockProfile({
      details: {
        firstName: "Test",
        lastName: "User",
        preferredLanguage: "en",
        phone: undefined,
        email: "test@example.com",
      },
    });
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).smsEnabled).toBe(false);
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).parsingError).toBe("User has no phone number set");
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: profile.id,
        organizationId: "org1",
      }),
      "User has no phone number set",
    );
  });

  it("should not enable SMS if phone number is invalid (ParseError)", () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    profile = getMockProfile({
      details: {
        firstName: "Test",
        lastName: "User",
        preferredLanguage: "en",
        phone: "INVALID",
        email: "test@example.com",
      },
    });
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).smsEnabled).toBe(false);
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).parsingError).toBe("Error parsing phone number");
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: profile.id,
        organizationId: "org1",
        error: "Error parsing phone number",
      }),
      "Error parsing phone number",
    );
  });

  it("should not enable SMS if phone number is invalid (Error)", () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    profile = getMockProfile({
      details: {
        firstName: "Test",
        lastName: "User",
        preferredLanguage: "en",
        phone: "ERROR",
        email: "test@example.com",
      },
    });
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).smsEnabled).toBe(false);
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).parsingError).toBe("Error parsing phone number");
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: profile.id,
        organizationId: "org1",
        error: "Error parsing phone number",
      }),
      "Error parsing phone number",
    );
  });

  it("should not enable SMS if SNS_REGION is missing", () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    config = getMockConfig({ SNS_REGION: undefined });
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).smsEnabled).toBe(false);
  });

  it("should not enable SMS if SNS_ALLOWED_ORGANIZATIONS is missing", () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    config = getMockConfig({ SNS_ALLOWED_ORGANIZATIONS: undefined });
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).smsEnabled).toBe(false);
  });

  it("should not enable SMS if parsed phone number does not start with +353", () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    profile = getMockProfile({
      details: {
        firstName: "Test",
        lastName: "User",
        preferredLanguage: "en",
        phone: "ANYTHING",
        email: "test@example.com",
      },
    });
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private properties
    expect((sender as any).smsEnabled).toBe(false);
  });

  it("should log and return false if send() called when smsEnabled is false", async () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    config = getMockConfig({ SNS_REGION: undefined });
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    const result = await sender.send();
    expect(result).toBe(false);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: profile.id,
        organizationId: "org1",
      }),
      expect.stringContaining("Cannot send SMS"),
    );
  });

  it("should send SMS and log success if smsEnabled is true", async () => {
    const mockTransport = {
      sendSms: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    };
    config = getMockConfig({
      SNS_REGION: "eu-west-1",
      SNS_ALLOWED_ORGANIZATIONS: "org1",
    });
    profile = getMockProfile({
      details: {
        firstName: "Test",
        lastName: "User",
        preferredLanguage: "en",
        phone: "+353871234567",
        email: "test@example.com",
      },
    });
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    const result = await sender.send();
    expect(result).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({}),
        profileId: profile.id,
        organizationId: "org1",
      }),
      "SMS sent successfully",
    );
  });

  it("should log and return false if transport.sendSms throws", async () => {
    const mockTransport = {
      sendSms: vi.fn().mockRejectedValueOnce(new Error("Transport error")),
    };
    config = getMockConfig({
      SNS_REGION: "eu-west-1",
      SNS_ALLOWED_ORGANIZATIONS: "org1",
    });
    profile = getMockProfile({
      details: {
        firstName: "Test",
        lastName: "User",
        preferredLanguage: "en",
        phone: "+353871234567",
        email: "test@example.com",
      },
    });
    const sender = new SmsSender({
      profile,
      organizationId: "org1",
      logger,
      config,
      getTransport: () => mockTransport,
    });
    const result = await sender.send();
    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        profileId: profile.id,
        organizationId: "org1",
      }),
      "Error sending SMS",
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
