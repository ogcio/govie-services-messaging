import { randomUUID } from "node:crypto";
import { NodeCache } from "@cacheable/node-cache";
import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { EnvConfig } from "../../../plugins/external/env.js";
import { executeJob, JobStatus } from "../../../services/jobs/job-service.js";
import { MessagingEventLogger } from "../../../services/messages/event-logger.js";
import { EmailSpecificProvider } from "../../../services/providers/email/email-specific-provider.js";
import { AvailableTransports } from "../../../services/users/shared-users.js";
import { ProviderTypes } from "../../../types/providers.js";
import { getCurrentUTCDate } from "../../../utils/date-times.js";
import { Translator } from "../../../utils/i18n.js";
import {
  DATABASE_TEST_URL_KEY,
  getPoolFromConnectionString,
} from "../../build-testcontainer-pg.js";
import { getMockBaseLogger } from "../../test-server-builder.js";
import {
  deleteJobsAndRelatedForOrganization,
  getJob,
  getMessage,
  insertMockJob,
  insertMockMessage,
} from "./job-service-utils.js";

const organizationId = "job-service-org";
const mockLogger = getMockBaseLogger();
let pool: Pool;
let eventLogger: MessagingEventLogger;
let doesProfileExist = true;
let mustEmailSendingFail = false;
let preferredLanguage = "en";
let sentEmails: { html: string; text: string; subject: string }[] = [];
// biome-ignore lint/suspicious/noExplicitAny: insert any type
let cache: NodeCache<any>;
vi.mock("nodemailer", () => ({
  createTransport: vi.fn((_transport: unknown) => {
    return {
      sendMail: (toSend: { html: string; text: string; subject: string }) => {
        if (mustEmailSendingFail) {
          throw new Error("Mail sending failed");
        }
        sentEmails.push(toSend);
      },
    };
  }),
}));

const getMockProfile = (profileId: string) => ({
  id: profileId,
  publicName: "Mock Public Name",
  email: "e@mail.com",
  primaryUserId: profileId,
  safeLevel: 0,
  preferredLanguage,
  createdAt: getCurrentUTCDate(),
  updatedAt: getCurrentUTCDate(),
  details: {
    email: "e@mail.com",
    firstName: "Name",
    lastName: "Surname",
    phone: "1234567890",
    address: "123 Main St",
  },
  linkedProfiles: [],
});

vi.mock("../../../services/users/profile-sdk-wrapper.js", () => {
  return {
    ProfileSdkWrapper: vi.fn().mockImplementation(() => {
      return {
        getProfile: vi.fn((profileId: string) => {
          if (!doesProfileExist) {
            throw httpErrors.createError(
              503,
              "Failed fetching user from profile sdk",
            );
          }

          return getMockProfile(profileId);
        }),
        getOrganisationWithCache: vi.fn((orgId: string, _cache, _logger) => {
          return {
            id: orgId,
            translations: {
              en: {
                name: "Mock Organisation",
              },
              ga: {
                name: "Mock Organisation",
              },
            },
          };
        }),
      };
    }),
  };
});

beforeAll(() => {
  pool = getPoolFromConnectionString(process.env[DATABASE_TEST_URL_KEY]);
  cache = new NodeCache();
});

beforeEach(() => {
  eventLogger = new MessagingEventLogger(pool, mockLogger);
  doesProfileExist = true;
  mustEmailSendingFail = false;
  sentEmails = [];
  preferredLanguage = "en";
  cache.flushAll();
});

afterEach(async () => {
  await deleteJobsAndRelatedForOrganization(pool, organizationId);
});

afterAll(async () => {
  if (pool) {
    await pool.end();
  }
});

describe("Execute job", () => {
  it("should handle errors if no job exists", async () => {
    await expect(
      executeJob({
        pool,
        logger: mockLogger,
        jobId: randomUUID(),
        token: randomUUID(),
        eventLogger,
        i18n: new Translator(),
        config: {} as EnvConfig,
        cache,
      }),
    ).rejects.toThrow("job doesn't exist");
  });

  it("should throw if already running", async () => {
    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      status: "working",
    });
    await expect(
      executeJob({
        pool,
        logger: mockLogger,
        jobId: insertedJob.jobId,
        token: insertedJob.token,
        eventLogger,
        i18n: new Translator(),
        config: {} as EnvConfig,
        cache,
      }),
    ).rejects.toThrow("job is already in progress");
  });

  it("should set jobs as failed if message does not exist", async () => {
    const insertedJob = await insertMockJob({ pool, organizationId });
    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    const job = await getJob(pool, insertedJob.jobId, organizationId);

    expect(job).toBeDefined();
    expect(job?.status).toStrictEqual(JobStatus.Failed);
  });

  it("should set jobs and messages as delivered if message does not have transports", async () => {
    const insertedMessage = await insertMockMessage({
      pool,
      organizationId,
      transports: [],
    });

    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      entityId: insertedMessage.id,
      userId: insertedMessage.user_id,
    });

    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    const job = await getJob(pool, insertedJob.jobId, organizationId);
    expect(job).toBeDefined();
    expect(job?.status).toStrictEqual(JobStatus.Delivered);
    const gotMessage = await getMessage(
      pool,
      insertedJob.userId,
      insertedMessage.id,
    );
    expect(gotMessage).toBeDefined();
    expect(gotMessage?.delivered).toStrictEqual(true);
  });

  it("should set jobs as delivered if only sent to LifeEvents", async () => {
    const insertedMessage = await insertMockMessage({
      pool,
      organizationId,
      transports: [AvailableTransports.LIFE_EVENT],
    });

    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      entityId: insertedMessage.id,
      userId: insertedMessage.user_id,
    });

    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    const job = await getJob(pool, insertedJob.jobId, organizationId);
    const gotMessage = await getMessage(
      pool,
      insertedJob.userId,
      insertedMessage.id,
    );
    expect(job).toBeDefined();
    expect(job?.status).toStrictEqual(JobStatus.Delivered);

    expect(gotMessage).toBeDefined();
    expect(gotMessage?.delivered).toStrictEqual(true);
  });

  it("should set jobs as failed if profile does not exist", async () => {
    doesProfileExist = false;
    const insertedMessage = await insertMockMessage({
      pool,
      organizationId,
      transports: [AvailableTransports.EMAIL],
    });

    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      entityId: insertedMessage.id,
      userId: insertedMessage.user_id,
    });

    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    const job = await getJob(pool, insertedJob.jobId, organizationId);
    const gotMessage = await getMessage(
      pool,
      insertedJob.userId,
      insertedMessage.id,
    );
    expect(job).toBeDefined();
    expect(job?.status).toStrictEqual(JobStatus.Failed);

    expect(gotMessage).toBeDefined();
    expect(gotMessage?.delivered).toStrictEqual(false);
  });

  it("should set jobs as delivered if only sent to LifeEvents", async () => {
    const insertedMessage = await insertMockMessage({
      pool,
      organizationId,
      transports: [AvailableTransports.LIFE_EVENT],
    });

    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      entityId: insertedMessage.id,
      userId: insertedMessage.user_id,
    });

    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    const job = await getJob(pool, insertedJob.jobId, organizationId);
    const gotMessage = await getMessage(
      pool,
      insertedJob.userId,
      insertedMessage.id,
    );
    expect(job).toBeDefined();
    expect(job?.status).toStrictEqual(JobStatus.Delivered);

    expect(gotMessage).toBeDefined();
    expect(gotMessage?.delivered).toStrictEqual(true);
  });

  it("should set jobs as succesful if email succeeds", async () => {
    const provider = new EmailSpecificProvider(pool, organizationId);
    await provider.create({
      inputBody: {
        fromAddress: "mock@mail.com",
        providerName: "MockName",
        isPrimary: true,
        type: ProviderTypes.Email,
        smtpHost: "host",
        smtpPort: 123,
        username: "user",
        password: "supersecret",
        ssl: true,
      },
    });
    const insertedMessage = await insertMockMessage({
      pool,
      organizationId,
      transports: [AvailableTransports.EMAIL],
    });

    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      entityId: insertedMessage.id,
      userId: insertedMessage.user_id,
    });

    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    const job = await getJob(pool, insertedJob.jobId, organizationId);
    const gotMessage = await getMessage(
      pool,
      insertedJob.userId,
      insertedMessage.id,
    );
    expect(job).toBeDefined();
    expect(job?.status).toStrictEqual(JobStatus.Delivered);

    expect(gotMessage).toBeDefined();
    expect(gotMessage?.delivered).toStrictEqual(true);
  });

  it("should set jobs as failed if email sending fails", async () => {
    mustEmailSendingFail = true;
    const provider = new EmailSpecificProvider(pool, organizationId);
    await provider.create({
      inputBody: {
        fromAddress: "mock@mail.com",
        providerName: "MockName",
        isPrimary: true,
        type: ProviderTypes.Email,
        smtpHost: "host",
        smtpPort: 123,
        username: "user",
        password: "supersecret",
        ssl: true,
      },
    });
    const insertedMessage = await insertMockMessage({
      pool,
      organizationId,
      transports: [AvailableTransports.LIFE_EVENT, AvailableTransports.EMAIL],
    });

    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      entityId: insertedMessage.id,
      userId: insertedMessage.user_id,
    });

    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    const job = await getJob(pool, insertedJob.jobId, organizationId);
    const gotMessage = await getMessage(
      pool,
      insertedJob.userId,
      insertedMessage.id,
    );
    expect(job).toBeDefined();
    expect(job?.status).toStrictEqual(JobStatus.Failed);

    expect(gotMessage).toBeDefined();
    expect(gotMessage?.delivered).toStrictEqual(false);
  });

  it("should use default provider if primary email provider is missing", async () => {
    // no provider is created
    const insertedMessage = await insertMockMessage({
      pool,
      organizationId,
      transports: [AvailableTransports.LIFE_EVENT, AvailableTransports.EMAIL],
    });

    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      entityId: insertedMessage.id,
      userId: insertedMessage.user_id,
    });

    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    const job = await getJob(pool, insertedJob.jobId, organizationId);
    const gotMessage = await getMessage(
      pool,
      insertedJob.userId,
      insertedMessage.id,
    );
    expect(job).toBeDefined();
    expect(job?.status).toStrictEqual(JobStatus.Delivered);

    expect(gotMessage).toBeDefined();
    expect(gotMessage?.delivered).toStrictEqual(true);
  });

  it("should send confidential message body when requested", async () => {
    const provider = new EmailSpecificProvider(pool, organizationId);
    await provider.create({
      inputBody: {
        fromAddress: "mock@mail.com",
        providerName: "MockName",
        isPrimary: true,
        type: ProviderTypes.Email,
        smtpHost: "host",
        smtpPort: 123,
        username: "user",
        password: "supersecret",
        ssl: true,
      },
    });
    const insertedMessage = await insertMockMessage({
      pool,
      organizationId,
      transports: [AvailableTransports.EMAIL],
      securityLevel: "confidential",
    });

    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      entityId: insertedMessage.id,
      userId: insertedMessage.user_id,
    });

    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    const job = await getJob(pool, insertedJob.jobId, organizationId);
    const gotMessage = await getMessage(
      pool,
      insertedJob.userId,
      insertedMessage.id,
    );
    expect(job).toBeDefined();
    expect(job?.status).toStrictEqual(JobStatus.Delivered);

    expect(gotMessage).toBeDefined();
    expect(gotMessage?.delivered).toStrictEqual(true);

    expect(sentEmails[0].html).toContain(
      "<p>A new secure message has been sent to your Messaging mailbox",
    );
    expect(sentEmails[0].subject).toContain(
      "You have received a new secure message",
    );
    expect(sentEmails[0].text).toContain("The Gov.ie Messaging Team");
  });

  it("should send confidential message body when requested  - ga translation", async () => {
    preferredLanguage = "ga";
    const provider = new EmailSpecificProvider(pool, organizationId);
    await provider.create({
      inputBody: {
        fromAddress: "mock@mail.com",
        providerName: "MockName",
        isPrimary: true,
        type: ProviderTypes.Email,
        smtpHost: "host",
        smtpPort: 123,
        username: "user",
        password: "supersecret",
        ssl: true,
      },
    });
    const insertedMessage = await insertMockMessage({
      pool,
      organizationId,
      transports: [AvailableTransports.EMAIL],
      securityLevel: "confidential",
    });

    const insertedJob = await insertMockJob({
      pool,
      organizationId,
      entityId: insertedMessage.id,
      userId: insertedMessage.user_id,
    });

    await executeJob({
      pool,
      logger: mockLogger,
      jobId: insertedJob.jobId,
      token: insertedJob.token,
      eventLogger,
      i18n: new Translator(),
      config: {} as EnvConfig,
      cache,
    });

    expect(sentEmails[0].html).toContain("<p>A chara Mock Public Name");
    expect(sentEmails[0].subject).toContain(
      "Tá teachtaireacht shlán nua faighte agat",
    );
    expect(sentEmails[0].text).toContain("Tá teachtaireacht shlán nua");
  });
});
