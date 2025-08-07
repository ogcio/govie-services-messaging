import type { BuildingBlocksSDK } from "@ogcio/building-blocks-sdk";
import { getFeatureFlagsClient } from "./authentication-factory.js";

const CONSENT_ENABLED_FLAG = "consent-enabled";

export class FeatureFlagsWrapper {
  private readonly featureFlagsClient: BuildingBlocksSDK["featureFlags"];
  constructor(ffConfig: { url: string; token: string }) {
    this.featureFlagsClient = getFeatureFlagsClient(ffConfig);
  }

  public async isConsentFlagEnabled(context: unknown): Promise<boolean> {
    try {
      return await this.featureFlagsClient.isFlagEnabled(
        CONSENT_ENABLED_FLAG,
        context,
      );
    } catch {
      return false;
    }
  }
}
