import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const require = createRequire(import.meta.url);
const {
  resolveReleaseSigning,
  validateArtifactSigningEndpoint,
} = require("../apps/desktop/scripts/release-signing-config.cjs") as {
  resolveReleaseSigning: (input: {
    environment?: Record<string, string>;
    releaseMode: boolean;
  }) => {
    backend: "none" | "azure" | "pfx";
    publisherName: string | null;
    electronBuilderWin: Record<string, unknown>;
  };
  validateArtifactSigningEndpoint: (value: string) => string;
};
const { validateConfiguration } = require(
  "../apps/desktop/node_modules/app-builder-lib/out/util/config/config",
) as {
  validateConfiguration: (
    config: Record<string, unknown>,
    logger: { isEnabled: boolean; add: () => void },
  ) => Promise<void>;
};

const publisherName = "CN=CasimirBot, O=CasimirBot, C=US";
const azureEnvironment = {
  CASIMIR_DESKTOP_SIGNING_BACKEND: "azure",
  WINDOWS_PUBLISHER_NAME: publisherName,
  AZURE_ARTIFACT_SIGNING_ENDPOINT: "https://eus.codesigning.azure.net",
  AZURE_ARTIFACT_SIGNING_ACCOUNT_NAME: "casimir-signing",
  AZURE_ARTIFACT_SIGNING_CERTIFICATE_PROFILE_NAME: "casimir-public-trust",
};

describe("desktop release signing backend", () => {
  it("keeps ordinary local packaging unsigned and credential-free", () => {
    expect(resolveReleaseSigning({
      environment: {},
      releaseMode: false,
    })).toEqual({
      backend: "none",
      publisherName: null,
      electronBuilderWin: {},
    });
  });

  it("requires an explicit release backend", () => {
    expect(() => resolveReleaseSigning({
      environment: { WINDOWS_PUBLISHER_NAME: publisherName },
      releaseMode: true,
    })).toThrow("CASIMIR_DESKTOP_SIGNING_BACKEND is required");
    expect(() => resolveReleaseSigning({
      environment: {
        CASIMIR_DESKTOP_SIGNING_BACKEND: "automatic",
        WINDOWS_PUBLISHER_NAME: publisherName,
      },
      releaseMode: true,
    })).toThrow("must be azure or pfx");
  });

  it("retains the advanced PFX path without selecting Azure", () => {
    const resolved = resolveReleaseSigning({
      environment: {
        CASIMIR_DESKTOP_SIGNING_BACKEND: "pfx",
        WINDOWS_PUBLISHER_NAME: publisherName,
        CSC_LINK: "opaque-certificate-value",
        CSC_KEY_PASSWORD: "opaque-password-value",
      },
      releaseMode: true,
    });

    expect(resolved).toEqual({
      backend: "pfx",
      publisherName,
      electronBuilderWin: {
        signtoolOptions: { publisherName: [publisherName] },
      },
    });
    expect(resolved.electronBuilderWin).not.toHaveProperty("azureSignOptions");
  });

  it("selects Azure Artifact Signing without a private-key secret", () => {
    const resolved = resolveReleaseSigning({
      environment: azureEnvironment,
      releaseMode: true,
    });

    expect(resolved).toEqual({
      backend: "azure",
      publisherName,
      electronBuilderWin: {
        azureSignOptions: {
          publisherName,
          endpoint: "https://eus.codesigning.azure.net/",
          codeSigningAccountName: "casimir-signing",
          certificateProfileName: "casimir-public-trust",
          fileDigest: "SHA256",
          timestampDigest: "SHA256",
          timestampRfc3161: "http://timestamp.acs.microsoft.com",
        },
      },
    });
    expect(resolved.electronBuilderWin).not.toHaveProperty("signtoolOptions");
  });

  it("validates both backends against the pinned Electron Builder schema", async () => {
    const pfx = resolveReleaseSigning({
      environment: {
        CASIMIR_DESKTOP_SIGNING_BACKEND: "pfx",
        WINDOWS_PUBLISHER_NAME: publisherName,
        CSC_LINK: "opaque-certificate-value",
        CSC_KEY_PASSWORD: "opaque-password-value",
      },
      releaseMode: true,
    });
    const azure = resolveReleaseSigning({
      environment: azureEnvironment,
      releaseMode: true,
    });
    const logger = { isEnabled: false, add: () => undefined };

    await expect(validateConfiguration({
      win: pfx.electronBuilderWin,
    }, logger)).resolves.toBeUndefined();
    await expect(validateConfiguration({
      win: azure.electronBuilderWin,
    }, logger)).resolves.toBeUndefined();
  });

  it.each([
    "http://eus.codesigning.azure.net",
    "https://example.com",
    "https://eus.codesigning.azure.net/extra",
    "https://user:password@eus.codesigning.azure.net",
  ])("rejects non-regional or credential-bearing endpoint %s", (endpoint) => {
    expect(() => validateArtifactSigningEndpoint(endpoint)).toThrow(
      "regional https://*.codesigning.azure.net endpoint",
    );
  });

  it("names missing inputs without echoing supplied values", () => {
    const sensitiveValue = "do-not-echo-this-value";
    let message = "";
    try {
      resolveReleaseSigning({
        environment: {
          ...azureEnvironment,
          AZURE_ARTIFACT_SIGNING_ACCOUNT_NAME: sensitiveValue,
          AZURE_ARTIFACT_SIGNING_CERTIFICATE_PROFILE_NAME: "",
        },
        releaseMode: true,
      });
    } catch (error) {
      message = String(error);
    }
    expect(message).toContain(
      "AZURE_ARTIFACT_SIGNING_CERTIFICATE_PROFILE_NAME is required",
    );
    expect(message).not.toContain(sensitiveValue);
  });

  it("binds cloud signing to the protected environment and GitHub OIDC", async () => {
    const workflowSource = await readFile(
      path.resolve(".github/workflows/desktop-release.yml"),
      "utf8",
    );
    const workflow = parse(workflowSource);
    const buildJob = workflow.jobs["build-verify"];
    const azureLogin = buildJob.steps.find(
      (step: { name?: string }) =>
        step.name === "Authenticate to Azure for Artifact Signing",
    );

    expect(workflow.permissions["id-token"]).toBe("write");
    expect(buildJob.environment).toBe("desktop-production");
    expect(azureLogin.uses).toBe(
      "azure/login@7184910d9eb2b1c5e48f7073824a90609bb9b6d6",
    );
    expect(azureLogin.if).toContain(
      "vars.CASIMIR_DESKTOP_SIGNING_BACKEND == 'azure'",
    );
    expect(azureLogin.with).toEqual({
      "client-id": "${{ vars.AZURE_CLIENT_ID }}",
      "tenant-id": "${{ vars.AZURE_TENANT_ID }}",
      "subscription-id": "${{ vars.AZURE_SUBSCRIPTION_ID }}",
    });
    expect(workflowSource).toContain("AZURE_ARTIFACT_SIGNING_ENDPOINT");
    expect(workflowSource).toContain(
      "AZURE_ARTIFACT_SIGNING_CERTIFICATE_PROFILE_NAME",
    );
    expect(workflowSource).not.toContain("AZURE_CLIENT_SECRET");
  });
});
