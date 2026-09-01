"use strict";

const RELEASE_SIGNING_BACKENDS = Object.freeze({
  AZURE: "azure",
  PFX: "pfx",
});

const trimEnvironment = (environment, name) => {
  const value = environment[name];
  return typeof value === "string" ? value.trim() : "";
};

const requireEnvironment = (environment, name) => {
  const value = trimEnvironment(environment, name);
  if (!value) {
    throw new Error(`[desktop-release-signing] ${name} is required`);
  }
  return value;
};

const validateOpaqueName = (value, label, minimumLength) => {
  if (
    value.length < minimumLength ||
    value.length > 100 ||
    !/^[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9]$/u.test(value) ||
    value.includes("--")
  ) {
    throw new Error(
      `[desktop-release-signing] ${label} must be a valid Artifact Signing resource name`,
    );
  }
  return value;
};

const validatePublisherName = (value) => {
  if (/[\x00-\x1f\x7f]/u.test(value)) {
    throw new Error(
      "[desktop-release-signing] WINDOWS_PUBLISHER_NAME contains control characters",
    );
  }
  return value;
};

const validateArtifactSigningEndpoint = (value) => {
  let endpoint;
  try {
    endpoint = new URL(value);
  } catch {
    throw new Error(
      "[desktop-release-signing] AZURE_ARTIFACT_SIGNING_ENDPOINT must be a valid HTTPS Artifact Signing endpoint",
    );
  }
  if (
    endpoint.protocol !== "https:" ||
    !/^[a-z0-9-]+\.codesigning\.azure\.net$/u.test(endpoint.hostname) ||
    (endpoint.pathname !== "/" && endpoint.pathname !== "") ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.username ||
    endpoint.password
  ) {
    throw new Error(
      "[desktop-release-signing] AZURE_ARTIFACT_SIGNING_ENDPOINT must be a regional https://*.codesigning.azure.net endpoint without credentials, path, query, or fragment",
    );
  }
  return `${endpoint.origin}/`;
};

const resolveReleaseSigning = ({
  environment = process.env,
  releaseMode = environment.CASIMIR_DESKTOP_RELEASE === "1",
} = {}) => {
  if (!releaseMode) {
    return Object.freeze({
      backend: "none",
      publisherName: null,
      electronBuilderWin: Object.freeze({}),
    });
  }

  const backend = requireEnvironment(
    environment,
    "CASIMIR_DESKTOP_SIGNING_BACKEND",
  ).toLowerCase();
  if (!Object.values(RELEASE_SIGNING_BACKENDS).includes(backend)) {
    throw new Error(
      "[desktop-release-signing] CASIMIR_DESKTOP_SIGNING_BACKEND must be azure or pfx",
    );
  }

  const publisherName = validatePublisherName(
    requireEnvironment(environment, "WINDOWS_PUBLISHER_NAME"),
  );

  if (backend === RELEASE_SIGNING_BACKENDS.PFX) {
    requireEnvironment(environment, "CSC_LINK");
    requireEnvironment(environment, "CSC_KEY_PASSWORD");
    return Object.freeze({
      backend,
      publisherName,
      electronBuilderWin: Object.freeze({
        signtoolOptions: Object.freeze({
          publisherName: Object.freeze([publisherName]),
        }),
      }),
    });
  }

  const endpoint = validateArtifactSigningEndpoint(
    requireEnvironment(environment, "AZURE_ARTIFACT_SIGNING_ENDPOINT"),
  );
  const codeSigningAccountName = validateOpaqueName(
    requireEnvironment(environment, "AZURE_ARTIFACT_SIGNING_ACCOUNT_NAME"),
    "AZURE_ARTIFACT_SIGNING_ACCOUNT_NAME",
    3,
  );
  const certificateProfileName = validateOpaqueName(
    requireEnvironment(
      environment,
      "AZURE_ARTIFACT_SIGNING_CERTIFICATE_PROFILE_NAME",
    ),
    "AZURE_ARTIFACT_SIGNING_CERTIFICATE_PROFILE_NAME",
    5,
  );

  return Object.freeze({
    backend,
    publisherName,
    electronBuilderWin: Object.freeze({
      azureSignOptions: Object.freeze({
        publisherName,
        endpoint,
        codeSigningAccountName,
        certificateProfileName,
        fileDigest: "SHA256",
        timestampDigest: "SHA256",
        timestampRfc3161: "http://timestamp.acs.microsoft.com",
      }),
    }),
  });
};

module.exports = {
  RELEASE_SIGNING_BACKENDS,
  resolveReleaseSigning,
  validateArtifactSigningEndpoint,
};
