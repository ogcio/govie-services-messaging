import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createProvider,
  deleteProvider,
  getProvider,
  listProviders,
  updateProvider,
} from "../../../services/providers/provider-service.js";
import type { Provider, ProviderCreateBody } from "../../../types/providers.js";
import {
  DATABASE_TEST_URL_KEY,
  getPoolFromConnectionString,
} from "../../build-testcontainer-pg.js";

let pool: Pool;

beforeAll(() => {
  pool = getPoolFromConnectionString(process.env[DATABASE_TEST_URL_KEY]);
});

afterAll(async () => {
  if (pool) {
    await pool.end();
  }
});

const organizationId = "test-organization-id";

describe("Provider Service", () => {
  it("should list providers", async () => {
    const pagination = { limit: "10", offset: "0" };
    const response = await listProviders({
      pool,
      providerType: "email",
      isPrimary: undefined,
      pagination,
      organisationId: organizationId,
    });

    expect(response).toHaveProperty("data");
    expect(response).toHaveProperty("totalCount");
  });

  it("pagination works as expected", async () => {
    await Promise.all([createHelperProvider(), createHelperProvider()]);
    const pagination = { limit: "10", offset: "0" };
    const all = await listProviders({
      pool,
      providerType: "email",
      isPrimary: undefined,
      pagination,
      organisationId: organizationId,
    });

    const firstPagination = { limit: "1", offset: "0" };
    const first = await listProviders({
      pool,
      providerType: "email",
      isPrimary: undefined,
      pagination: firstPagination,
      organisationId: organizationId,
    });

    const secondPagination = { limit: "1", offset: "1" };
    const second = await listProviders({
      pool,
      providerType: "email",
      isPrimary: undefined,
      pagination: secondPagination,
      organisationId: organizationId,
    });

    expect(first.data.length).toEqual(1);
    expect(second.data.length).toEqual(1);
    expect(first.data[0].id).toEqual(all.data[0].id);
    expect(second.data[0].id).toEqual(all.data[1].id);
  });

  it("should get a provider", async () => {
    const created = await createHelperProvider();
    const response = await getProvider({
      pool,
      providerType: created.provider.type,
      providerId: created.id,
      organisationId: organizationId,
    });

    expect(response).toMatchObject({
      type: created.provider.type,
      providerName: created.provider.providerName,
      isPrimary: created.provider.isPrimary,
      smtpHost: created.provider.smtpHost,
      smtpPort: created.provider.smtpPort,
      username: created.provider.username,
      fromAddress: created.provider.fromAddress,
      ssl: created.provider.ssl,
      id: created.id,
      throttle: created.provider.throttle ?? 0,
    });
  });

  it("getting a not existent provider returns 404", async () => {
    const providerId = randomUUID();

    await expect(
      getProvider({
        pool,
        providerType: "email",
        providerId,
        organisationId: organizationId,
      }),
    ).rejects.toThrowError("failed to find email provider");
  });

  it("should create a provider", async () => {
    const created = await createHelperProvider();

    const provider = await getProvider({
      pool,
      providerType: created.provider.type,
      providerId: created.id,
      organisationId: organizationId,
    });

    expect(provider).toMatchObject({
      type: created.provider.type,
      providerName: created.provider.providerName,
      isPrimary: created.provider.isPrimary,
      smtpHost: created.provider.smtpHost,
      smtpPort: created.provider.smtpPort,
      username: created.provider.username,
      fromAddress: created.provider.fromAddress,
      ssl: created.provider.ssl,
      id: created.id,
      throttle: created.provider.throttle ?? 0,
    });
  });

  it("creating a provider with already existent name throw error", async () => {
    const createdProvider = await createHelperProvider();

    await expect(
      createProvider({
        pool,
        provider: createdProvider.provider,
        organisationId: organizationId,
      }),
    ).rejects.toThrow("provider from address or name already exists");
  });

  it("can create a provider with same name for other org", async () => {
    const createdProvider = await createHelperProvider();
    const anotherOrgCreatedId = await createProvider({
      pool,
      provider: createdProvider.provider,
      organisationId: "another-org-id",
    });

    const getAnotherProvider = await getProvider({
      pool,
      providerType: createdProvider.provider.type,
      providerId: anotherOrgCreatedId,
      organisationId: "another-org-id",
    });

    expect(getAnotherProvider.id).toEqual(anotherOrgCreatedId);
    expect(getAnotherProvider.providerName).toEqual(
      createdProvider.provider.providerName,
    );
  });

  it("should update a provider", async () => {
    const createdProvider = await createHelperProvider();
    const inputBody: Provider = {
      ...createdProvider.provider,
      providerName: `${createdProvider.provider.providerName}-up`,
      id: createdProvider.id,
    };

    await updateProvider({
      pool,
      provider: inputBody,
      organisationId: organizationId,
    });

    const updatedProvider = await getProvider({
      pool,
      providerType: inputBody.type,
      providerId: createdProvider.id,
      organisationId: organizationId,
    });

    expect(updatedProvider.providerName).toBe(inputBody.providerName);
  });

  it("updating a provider with already existent name throw error", async () => {
    const alreadyExistent = await createHelperProvider();
    const toUpdate = await createHelperProvider();
    await expect(
      updateProvider({
        pool,
        provider: { ...alreadyExistent.provider, id: toUpdate.id },
        organisationId: organizationId,
      }),
    ).rejects.toThrow("provider from address or name already exists");
  });

  it("can update a provider with same name for other org", async () => {
    const createdProvider = await createHelperProvider();
    const anotherOrgCreated = await createHelperProvider({
      organisationId: "another-org-id",
    });

    await updateProvider({
      pool,
      provider: { ...createdProvider.provider, id: anotherOrgCreated.id },
      organisationId: "another-org-id",
    });

    const getUpdated = await getProvider({
      pool,
      providerType: createdProvider.provider.type,
      providerId: anotherOrgCreated.id,
      organisationId: "another-org-id",
    });

    expect(getUpdated.providerName).toBe(createdProvider.provider.providerName);
  });

  it("should delete a provider", async () => {
    const createdProvider = await createHelperProvider();

    await deleteProvider({
      pool,
      providerType: createdProvider.provider.type,
      providerId: createdProvider.id,
      organisationId: organizationId,
    });

    await expect(
      getProvider({
        pool,
        providerType: createdProvider.provider.type,
        providerId: createdProvider.id,
        organisationId: organizationId,
      }),
    ).rejects.toThrow("failed to find email provider");
  });

  it("deleting a not existent provider returns 404", async () => {
    const providerId = randomUUID();

    await expect(
      deleteProvider({
        pool,
        providerType: "email",
        providerId,
        organisationId: organizationId,
      }),
    ).rejects.toThrowError("failed to find email provider");
  });
});

async function createHelperProvider(params?: {
  organisationId?: string;
}): Promise<{
  provider: ProviderCreateBody;
  id: string;
}> {
  const toUseOrganisationId = params?.organisationId || organizationId;
  const random = Math.floor(Math.random() * 10000);
  const inputBody: ProviderCreateBody = {
    type: "email",
    providerName: `Test Provider ${random}`,
    isPrimary: false,
    smtpHost: `random${random}.com`,
    smtpPort: 12345,
    username: `username${random}`,
    password: `password${random}`,
    fromAddress: `abc@${random}.com`,
    ssl: false,
  };

  return {
    id: await createProvider({
      pool,
      provider: inputBody,
      organisationId: toUseOrganisationId,
    }),
    provider: inputBody,
  };
}
