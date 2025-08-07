import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  getMessage,
  listMessages,
  processMessage,
} from "../../../services/messages/message-service.js";
import type { CreateMessageBody } from "../../../types/messages.js";
import type { FeatureFlagsWrapper } from "../../../utils/feature-flags.js";
import { utils } from "../../../utils/utils.js";
import {
  DATABASE_TEST_URL_KEY,
  getPoolFromConnectionString,
} from "../../build-testcontainer-pg.js";
import { getMockBaseLogger } from "../../test-server-builder.js";

let pool: Pool;

let schedulerWorks = true;
const disabledFeatureFlags = {
  isConsentFlagEnabled: (_context: unknown): Promise<boolean> => {
    return Promise.resolve(false);
  },
} as unknown as FeatureFlagsWrapper;
const enabledFeatureFlags = {
  isConsentFlagEnabled: (_context: unknown): Promise<boolean> => {
    return Promise.resolve(true);
  },
} as unknown as FeatureFlagsWrapper;
type MessageId = string;
async function insertMessage(
  recipientProfileId: string,
  organisationId: string,
  pool: Pool,
): Promise<MessageId> {
  const qres = await pool.query(
    `
    insert into messages(
      is_delivered,
      user_id,
      subject,
      excerpt,
      plain_text,
      rich_text,
      security_level,
      lang,
      preferred_transports,
      thread_name,
      organisation_id,
      scheduled_at,
      is_seen)
    values(
      true,
      $1,
      's',
      'exc',
      'pt',
      'rt',
      'public',
      'en',
      $2,
      'tn',
      $3,
      now(),
      false)
      returning id
  `,

    [recipientProfileId, utils.postgresArrayify([""]), organisationId],
  );

  return qres.rows.at(0).id as string;
}

afterEach(() => {
  schedulerWorks = true;
});

beforeAll(() => {
  pool = getPoolFromConnectionString(process.env[DATABASE_TEST_URL_KEY]);
});

afterAll(async () => {
  if (pool) {
    await pool.end();
  }
  vi.resetAllMocks();
});

describe("Message Service", () => {
  const notFoundProfileId = "not-found";
  const linkedProfileId = "linked-id";
  const optedOutProfileId = "opted-out";
  const optedInProfileId = "opted-in";

  vi.mock("../../../utils/authentication-factory.js", () => ({
    getM2MUploadSdk: vi.fn().mockResolvedValue({}),
    getM2MSchedulerSdk: vi.fn().mockResolvedValue({
      scheduleTasks: vi.fn(() => {
        if (schedulerWorks) {
          return [];
        }

        throw new Error("Schedulation failed!");
      }),
    }),
    getPersonalProfileSdk: vi.fn().mockResolvedValue({
      getProfile: vi.fn((id: string) => {
        const notFoundProfileId = "not-found";
        const linkedProfileId = "linked-id";
        if (id === notFoundProfileId) {
          return { data: undefined, error: { detail: "user not found" } };
        }
        if (id === linkedProfileId) {
          const childProfileOne = "child-1";
          const childProfileTwo = "child-2";
          return {
            data: {
              id,
              linkedProfiles: [
                {
                  id: childProfileOne,
                },
                { id: childProfileTwo },
              ],
            },
          };
        }
        return {
          data: { id, email: `${id}@example.com` },
        };
      }),
    }),
    getM2MProfileSdk: vi.fn().mockResolvedValue({
      getProfile: vi.fn((id: string) => {
        const notFoundProfileId = "not-found";
        const optedOutProfileId = "opted-out";
        const optedInProfileId = "opted-in";
        switch (id) {
          case optedOutProfileId:
            return {
              data: {
                id,
                email: `${id}@example.com`,
                consentStatuses: { messaging: { status: "opted-out" } },
              },
            };
          case optedInProfileId:
            return {
              data: {
                id,
                email: `${id}@example.com`,
                consentStatuses: { messaging: { status: "opted-in" } },
              },
            };
          case notFoundProfileId:
            return { data: undefined, error: { detail: "user not found" } };
          default:
            return {
              data: { id, email: `${id}@example.com` },
            };
        }
      }),
    }),
  }));

  describe("processMessages", () => {
    const sender = {
      id: "test-sender-id",
      organizationId: "test-organization-id",
      isM2MApplication: false,
    };

    const getMockMessage = (): CreateMessageBody => ({
      recipientUserId: "test-rec-id",
      message: {
        excerpt: "Test Excerpt",
        language: "en",
        plainText: "Test Plain Text",
        richText: "Test Rich Text",
        subject: "Test Subject",
        threadName: "Test Thread",
      },
      scheduleAt: "2024-08-27T07:46:10.290Z",
      security: "confidential",
      preferredTransports: ["email"],
      attachments: [],
    });

    it("should process messages successfully", async () => {
      schedulerWorks = true;
      const message = getMockMessage();
      const output = await processMessage({
        pool,
        sender,
        message,
        logger: getMockBaseLogger(),
        featureFlagsWrapper: disabledFeatureFlags,
      });

      expect(output.messageId).toBeDefined();

      const gotMessage = await getMessage({
        pool,
        userId: message.recipientUserId,
        messageId: output.messageId,
        loggedInUser: { userId: message.recipientUserId, accessToken: "123" },
        hasOnboardingPermission: false,
        logger: getMockBaseLogger(),
      });

      expect(gotMessage).toMatchObject({
        subject: message.message.subject,
        excerpt: message.message.excerpt,
        plainText: message.message.plainText,
        richText: message.message.richText,
        threadName: message.message.threadName,
        security: message.security,
      });
    });

    it("should process messages with null excerpt, rich text and threadName successfully", async () => {
      schedulerWorks = true;
      const fullMessage = getMockMessage();
      const output = await processMessage({
        pool,
        sender,
        message: {
          ...fullMessage,
          message: {
            ...fullMessage.message,
            richText: undefined,
            excerpt: undefined,
            threadName: undefined,
          },
        },
        logger: getMockBaseLogger(),
        featureFlagsWrapper: disabledFeatureFlags,
      });

      expect(output.messageId).toBeDefined();

      const gotMessage = await getMessage({
        pool,
        userId: fullMessage.recipientUserId,
        messageId: output.messageId,
        loggedInUser: {
          userId: fullMessage.recipientUserId,
          accessToken: "123",
        },
        hasOnboardingPermission: false,
        logger: getMockBaseLogger(),
      });

      expect(gotMessage).toMatchObject({
        subject: fullMessage.message.subject,
        excerpt: null,
        plainText: fullMessage.message.plainText,
        richText: null,
        threadName: null,
        security: fullMessage.security,
      });
    });

    it("should handle errors during messaging processing", async () => {
      const message = getMockMessage();
      await expect(
        processMessage({
          pool,
          sender: { ...sender, id: notFoundProfileId },
          message,
          logger: getMockBaseLogger(),
          featureFlagsWrapper: disabledFeatureFlags,
        }),
      ).rejects.toThrow(
        "Failed fetching user from profile sdk: user not found",
      );
    });

    it("should handle errors during messaging creation", async () => {
      const message = getMockMessage();

      await expect(
        processMessage({
          pool,
          sender: {
            ...sender,
            organizationId:
              "this-organization-id-is-longer-than-21-that-is-max-length",
          },
          message,
          logger: getMockBaseLogger(),
          featureFlagsWrapper: disabledFeatureFlags,
        }),
      ).rejects.toThrow("Message creation failed");
    });

    it("should handle errors during scheduling", async () => {
      schedulerWorks = false;
      const message = getMockMessage();

      await expect(
        processMessage({
          pool,
          sender,
          message,
          logger: getMockBaseLogger(),
          featureFlagsWrapper: disabledFeatureFlags,
        }),
      ).rejects.toThrow("Error scheduling messages");
    });

    it("should handle opted out error during messaging processing", async () => {
      const message = getMockMessage();
      message.recipientUserId = optedOutProfileId;
      await expect(
        processMessage({
          pool,
          sender: { ...sender, id: sender.id },
          message,
          logger: getMockBaseLogger(),
          featureFlagsWrapper: enabledFeatureFlags,
        }),
      ).rejects.toThrow(
        "User has not consented to receive messages. Please check the user's consent status.",
      );
    });

    it("should process messages successfully if user opted in", async () => {
      schedulerWorks = true;
      const message = getMockMessage();
      message.recipientUserId = optedInProfileId;
      const output = await processMessage({
        pool,
        sender,
        message,
        logger: getMockBaseLogger(),
        featureFlagsWrapper: disabledFeatureFlags,
      });

      expect(output.messageId).toBeDefined();

      const gotMessage = await getMessage({
        pool,
        userId: message.recipientUserId,
        messageId: output.messageId,
        loggedInUser: { userId: message.recipientUserId, accessToken: "123" },
        hasOnboardingPermission: false,
        logger: getMockBaseLogger(),
      });

      expect(gotMessage).toMatchObject({
        subject: message.message.subject,
        excerpt: message.message.excerpt,
        plainText: message.message.plainText,
        richText: message.message.richText,
        threadName: message.message.threadName,
        security: message.security,
      });
    });
  });

  describe("getMessage", () => {
    const childProfileOne = "child-1";
    it("should get message for user id", async () => {
      const recipientProfileId = "profileId1";
      const messageId = await insertMessage(recipientProfileId, "org-A", pool);

      const retrievedMessage = await getMessage({
        messageId,
        pool,
        userId: recipientProfileId,
        loggedInUser: { userId: recipientProfileId, accessToken: "123" },
        hasOnboardingPermission: false,
        logger: getMockBaseLogger(),
      });
      expect(retrievedMessage.recipientUserId).toEqual(recipientProfileId);
    });

    it("should throw if no message exist for user id", async () => {
      const recipientProfileId = "profileId1";
      const messageId = await insertMessage("another", "org-A", pool);

      await expect(
        getMessage({
          messageId,
          pool,
          userId: recipientProfileId,
          loggedInUser: { userId: recipientProfileId, accessToken: "123" },
          hasOnboardingPermission: false,
          logger: getMockBaseLogger(),
        }),
      ).rejects.toThrow(
        `No message with id ${messageId} for the logged in user does exist`,
      );
    });

    it("should get message without recipient user id", async () => {
      const messageId = await insertMessage("someId", "org-A", pool);

      const retrievedMessage = await getMessage({
        messageId,
        pool,
        loggedInUser: { accessToken: "123", userId: "someId" },
        hasOnboardingPermission: false,
        logger: getMockBaseLogger(),
      });
      expect(retrievedMessage.recipientUserId).toEqual("someId");
    });

    it("should throw if no message exist without user id", async () => {
      await insertMessage("someId", "org-A", pool);

      await expect(
        getMessage({
          pool,
          messageId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          loggedInUser: { userId: "not-exist", accessToken: "123" },
          hasOnboardingPermission: false,
          logger: getMockBaseLogger(),
        }),
      ).rejects.toThrow(
        "No message with id aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa exist",
      );
    });

    it("should get message for linked user id", async () => {
      const messageId = await insertMessage(childProfileOne, "org-A", pool);

      const retrievedMessage = await getMessage({
        messageId,
        pool,
        userId: childProfileOne,
        loggedInUser: { userId: linkedProfileId, accessToken: "123" },
        hasOnboardingPermission: false,
        logger: getMockBaseLogger(),
      });

      expect(retrievedMessage.recipientUserId).toEqual(childProfileOne);
    });

    it("should throw exception if recipient id is not linked", async () => {
      const messageId = await insertMessage("not-linked", "org-A", pool);

      const retrievedMessage = getMessage({
        messageId,
        pool,
        userId: "not-linked",
        loggedInUser: { userId: linkedProfileId, accessToken: "123" },
        hasOnboardingPermission: false,
        logger: getMockBaseLogger(),
      });

      await expect(retrievedMessage).rejects.toThrow(
        `No message with id ${messageId} for the logged in user does exist`,
      );
    });

    it("should throw exception if recipient id is not linked and target id not set", async () => {
      const messageId = await insertMessage("not-linked", "org-A", pool);

      const retrievedMessage = getMessage({
        messageId,
        pool,
        loggedInUser: { userId: linkedProfileId, accessToken: "123" },
        hasOnboardingPermission: false,
        logger: getMockBaseLogger(),
      });

      await expect(retrievedMessage).rejects.toThrow(
        `No message with id ${messageId} for the logged in user does exist`,
      );
    });
  });

  describe("listMessages", () => {
    const childProfileOne = "child-1";
    const childProfileTwo = "child-2";

    it("should get messages for linked profiles too", async () => {
      const recipientProfileId = linkedProfileId;
      const orgId = randomUUID().substring(0, 12);
      const messageId = await insertMessage(recipientProfileId, orgId, pool);
      const childMessage = await insertMessage(childProfileOne, orgId, pool);
      const childMessageTwo = await insertMessage(childProfileTwo, orgId, pool);
      const messageIds = [messageId, childMessage, childMessageTwo].sort();
      const recipientsIds = [
        recipientProfileId,
        childProfileOne,
        childProfileTwo,
      ].sort();

      const retrievedMessages = await listMessages({
        loggedInUserData: {
          userId: recipientProfileId,
          organizationId: undefined,
          accessToken: "123",
        },
        query: {
          messagesStatus: "delivered",
          organisationId: orgId,
          recipientUserId: undefined,
          isSeen: "false",
          search: undefined,
        },
        pool,
        pagination: { offset: "0", limit: "20" },
        logger: getMockBaseLogger(),
      });

      expect(retrievedMessages.totalCount).toEqual(3);
      expect(retrievedMessages.data.length).toEqual(3);
      expect(
        retrievedMessages.data.map((d) => d.recipientUserId).sort(),
      ).toStrictEqual(recipientsIds);
      expect(retrievedMessages.data.map((d) => d.id).sort()).toStrictEqual(
        messageIds,
      );
    });

    it("should get messages only for linked profile if query set", async () => {
      const recipientProfileId = linkedProfileId;
      const organizationId = randomUUID().substring(0, 15);
      await insertMessage(recipientProfileId, organizationId, pool);
      const childMessage = await insertMessage(
        childProfileOne,
        organizationId,
        pool,
      );
      await insertMessage(childProfileTwo, organizationId, pool);

      const retrievedMessages = await listMessages({
        loggedInUserData: {
          userId: recipientProfileId,
          organizationId: undefined,
          accessToken: "123",
        },
        query: {
          messagesStatus: "delivered",
          organisationId: organizationId,
          recipientUserId: childProfileOne,
          isSeen: "false",
          search: undefined,
        },
        pool,
        pagination: { offset: "0", limit: "20" },
        logger: getMockBaseLogger(),
      });

      expect(retrievedMessages.totalCount).toEqual(1);
      expect(retrievedMessages.data.length).toEqual(1);
      expect(
        retrievedMessages.data.map((d) => d.recipientUserId),
      ).toStrictEqual([childProfileOne]);
      expect(retrievedMessages.data.map((d) => d.id)).toStrictEqual([
        childMessage,
      ]);
    });

    it("should get messages only for primary account if query set", async () => {
      const recipientProfileId = linkedProfileId;
      const organizationId = randomUUID().substring(0, 15);
      const mainMessage = await insertMessage(
        recipientProfileId,
        organizationId,
        pool,
      );
      await insertMessage(childProfileOne, organizationId, pool);
      await insertMessage(childProfileTwo, organizationId, pool);

      const retrievedMessages = await listMessages({
        loggedInUserData: {
          userId: recipientProfileId,
          organizationId: undefined,
          accessToken: "123",
        },
        query: {
          messagesStatus: "delivered",
          organisationId: organizationId,
          recipientUserId: recipientProfileId,
          isSeen: "false",
          search: undefined,
        },
        pool,
        pagination: { offset: "0", limit: "20" },
        logger: getMockBaseLogger(),
      });

      expect(retrievedMessages.totalCount).toEqual(1);
      expect(retrievedMessages.data.length).toEqual(1);
      expect(
        retrievedMessages.data.map((d) => d.recipientUserId),
      ).toStrictEqual([recipientProfileId]);
      expect(retrievedMessages.data.map((d) => d.id)).toStrictEqual([
        mainMessage,
      ]);
    });

    it("should throw exception if recipient is not linked", async () => {
      const recipientProfileId = linkedProfileId;
      const organizationId = randomUUID().substring(0, 15);

      const retrievedMessages = listMessages({
        loggedInUserData: {
          userId: recipientProfileId,
          organizationId: undefined,
          accessToken: "123",
        },
        query: {
          messagesStatus: "delivered",
          organisationId: organizationId,
          recipientUserId: "not-a-child",
          isSeen: "false",
          search: undefined,
        },
        pool,
        pagination: { offset: "0", limit: "20" },
        logger: getMockBaseLogger(),
      });

      await expect(retrievedMessages).rejects.toThrow(
        "Not allowed to see messages for the requested user",
      );
    });
  });
});
