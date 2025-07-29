import type { Record } from "@sinclair/typebox";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { afterEach, describe, expect, it, suite } from "vitest";
import { build } from "../test-server-builder.js";

describe("/api/v1/providers", {}, () => {
  const getServer = async (): Promise<FastifyInstance> => {
    const server = await build();
    server.addHook("onRequest", async (req: FastifyRequest) => {
      // Override the request decorator
      server.checkPermissions = async (
        request: FastifyRequest,
        _reply: FastifyReply,
        _permissions: string[],
        _matchConfig?: { method: "AND" | "OR" },
      ) => {
        req.userData = {
          userId: "userId",
          accessToken: "accessToken",
          organizationId: "organisationId",
          isM2MApplication: false,
        };

        request.userData = req.userData;
      };
    });

    return server;
  };

  let app: FastifyInstance | undefined;

  afterEach(() => {
    if (app) {
      app.close();
      app = undefined;
    }
  });

  suite("create", async () => {
    it("should fail when no type is provided", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: "",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(
        body.validation.find(
          (v: Record<string, string>) => v.fieldName === "type",
        )?.message,
      ).toBe("must have required property 'type'");
    });

    it("should fail when invalid type is provided", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "fail",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: Record<string, string>) => v.fieldName === "type",
        )?.message,
      ).toBe("must be equal to one of the allowed values");
    });

    it("should fail with empty providerName", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: "",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: Record<string, string>) => v.fieldName === "providerName",
        )?.message,
      ).toBe("must NOT have fewer than 1 characters");
    });

    it("should fail with null providerName", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: null,
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: Record<string, string>) => v.fieldName === "providerName",
        )?.message,
      ).toBe("must be string");
    });

    it("should fail with empty fromAddress", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: "name",
          fromAddress: "",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: Record<string, string>) => v.fieldName === "fromAddress",
        )?.message,
      ).toBe("must NOT have fewer than 1 characters");
    });

    it("should fail with empty password", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: Record<string, string>) => v.fieldName === "password",
        )?.message,
      ).toBe("must NOT have fewer than 1 characters");
    });

    it("should fail with null username", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: null,
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: Record<string, string>) => v.fieldName === "username",
        )?.message,
      ).toBe("must be string");
    });

    it("should fail with non-numeric smtpPort", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: "",
          username: "usr",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: Record<string, string>) => v.fieldName === "smtpPort",
        )?.message,
      ).toBe("must be number");
    });

    it("should fail with null smtpPort", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: null,
          username: "usr",
          password: "password",
          providerName: "name1",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: Record<string, string>) => v.fieldName === "smtpPort",
        )?.message,
      ).toBe("must be number");
    });

    it("null smtpHost should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: null,
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "smtpHost",
        )?.message,
      ).toBe("must be string");
    });

    it("string ssl should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: "fail",
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "ssl",
        )?.message,
      ).toBe("must be boolean");
    });

    it("no ssl should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "ssl",
        )?.message,
      ).toBe("must have required property 'ssl'");
    });

    it("string isPrimary should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          isPrimary: "fail",
          smtpHost: "host",
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: true,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "isPrimary",
        )?.message,
      ).toBe("must be boolean");
    });

    it("no isPrimary should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/providers",
        body: {
          type: "email",
          smtpHost: "host",
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: true,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "isPrimary",
        )?.message,
      ).toBe("must have required property 'isPrimary'");
    });
  });

  suite("update", async () => {
    it("should fail when id in url parameter mismatch with body id", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "da3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "fail",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "type",
        )?.message,
      ).toBe("must be equal to one of the allowed values");
    });

    it("providing no type should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: "",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "type",
        )?.message,
      ).toBe("must have required property 'type'");
    });

    it("providing invalid type should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "fail",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "type",
        )?.message,
      ).toBe("must be equal to one of the allowed values");
    });

    it("non uuid id in url parameter should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/123",
        body: {
          id: "123",
          type: "fail",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "providerId",
        )?.message,
      ).toBe('must match format "uuid"');
    });

    it("null fromAddress should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: "update password",
          providerName: "name",
          fromAddress: null,
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "fromAddress",
        )?.message,
      ).toBe("must be string");
    });

    it("null password should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "update user",
          password: null,
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "password",
        )?.message,
      ).toBe("must be string");
    });

    it("null username should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: null,
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "username",
        )?.message,
      ).toBe("must be string");
    });

    it("null smtpPort should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: null,
          username: "usr",
          password: "password",
          providerName: "name1",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "smtpPort",
        )?.message,
      ).toBe("must be number");
    });

    it("null smtpHost should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          isPrimary: false,
          smtpHost: null,
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "smtpHost",
        )?.message,
      ).toBe("must be string");
    });

    it("no smtpHost should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          isPrimary: false,
          username: "user",
          smtpPort: 12345,
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: false,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "smtpHost",
        )?.message,
      ).toBe("must have required property 'smtpHost'");
    });

    it("string ssl should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: "fail",
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "ssl",
        )?.message,
      ).toBe("must be boolean");
    });

    it("no ssl should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          isPrimary: false,
          smtpHost: "host",
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "ssl",
        )?.message,
      ).toBe("must have required property 'ssl'");
    });

    it("string isPrimary should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          isPrimary: "fail",
          smtpHost: "host",
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: true,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "isPrimary",
        )?.message,
      ).toBe("must be boolean");
    });

    it("no isPrimary should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
        body: {
          id: "ca3b108f-7b9a-487e-b40a-eb535e6056ca",
          type: "email",
          smtpHost: "host",
          smtpPort: 12345,
          username: "user",
          password: "password",
          providerName: "name",
          fromAddress: "addr",
          ssl: true,
        },
      });

      const body = await res.json();
      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "isPrimary",
        )?.message,
      ).toBe("must have required property 'isPrimary'");
    });
  });

  suite("get one provider schema validations", () => {
    it("non uuid id url param should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/providers/fail",
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "providerId",
        )?.message,
      ).toBe('must match format "uuid"');
    });

    it("no type search query should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca",
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "type",
        )?.message,
      ).toBe("must have required property 'type'");
    });

    it("invalid type search query should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/providers/ca3b108f-7b9a-487e-b40a-eb535e6056ca?type=fail",
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "type",
        )?.message,
      ).toBe("must be equal to one of the allowed values");
    });
  });

  suite("get many providers schema validations", () => {
    it("no type search query should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/providers",
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "type",
        )?.message,
      ).toBe("must have required property 'type'");
    });

    it("invalid type search query should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/providers?type=fail",
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "type",
        )?.message,
      ).toBe("must be equal to one of the allowed values");
    });
  });

  suite("delete provider schema validations", () => {
    it("non uuid id url param should fail", async () => {
      app = await getServer();
      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/providers/fail",
      });

      const body = await res.json();

      expect(res.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(
        body.validation.find(
          (v: { fieldName: string }) => v.fieldName === "providerId",
        )?.message,
      ).toBe('must match format "uuid"');
    });
  });
});
