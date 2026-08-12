import {
  DESKTOP_RELEASE_STATUS_SCHEMA_VERSION,
  desktopReleaseStatusSchema,
  type DesktopReleaseStatus,
} from "@shared/desktop-release";

export type DesktopReleaseEnvironment = Readonly<
  Record<string, string | undefined>
>;

const unavailable = (
  reason: "not_configured" | "invalid_configuration",
): DesktopReleaseStatus =>
  desktopReleaseStatusSchema.parse({
    schemaVersion: DESKTOP_RELEASE_STATUS_SCHEMA_VERSION,
    available: false,
    approved: false,
    reason,
  });

const normalized = (value: string | undefined): string => value?.trim() ?? "";

export function resolveDesktopReleaseStatus(
  environment: DesktopReleaseEnvironment = process.env,
): DesktopReleaseStatus {
  if (normalized(environment.DESKTOP_RELEASE_APPROVED) !== "1") {
    return unavailable("not_configured");
  }

  const version = normalized(environment.DESKTOP_RELEASE_VERSION);
  const downloadUrl = normalized(environment.DESKTOP_RELEASE_DOWNLOAD_URL);
  const sha256 = normalized(environment.DESKTOP_RELEASE_SHA256).toLowerCase();
  const publisher = normalized(environment.DESKTOP_RELEASE_PUBLISHER);
  const certificateHash = normalized(
    environment.DESKTOP_RELEASE_CASIMIR_CERTIFICATE_HASH,
  ).toLowerCase();
  const publishedAt = normalized(environment.DESKTOP_RELEASE_PUBLISHED_AT);
  const installerFileName = `CasimirBot-${version}-x64-setup.exe`;
  const publishedAtDate = publishedAt ? new Date(publishedAt) : null;
  if (publishedAtDate && Number.isNaN(publishedAtDate.valueOf())) {
    return unavailable("invalid_configuration");
  }

  const parsed = desktopReleaseStatusSchema.safeParse({
    schemaVersion: DESKTOP_RELEASE_STATUS_SCHEMA_VERSION,
    available: true,
    approved: true,
    release: {
      platform: "windows",
      arch: "x64",
      version,
      installerFileName,
      downloadUrl,
      sha256,
      publisher,
      publishedAt: publishedAtDate?.toISOString() ?? null,
      casimirGate: {
        verdict: "PASS",
        certificateHash,
        integrity: "OK",
      },
    },
  });

  return parsed.success ? parsed.data : unavailable("invalid_configuration");
}
