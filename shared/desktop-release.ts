import { z } from "zod";

export const DESKTOP_RELEASE_STATUS_SCHEMA_VERSION =
  "casimir_desktop_release_status/1" as const;
export const DESKTOP_RELEASE_OWNER = "pestypig" as const;
export const DESKTOP_RELEASE_REPOSITORY = "casimirbot-" as const;

export const desktopReleaseVersionSchema = z
  .string()
  .regex(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
  );

export const isImmutableDesktopReleaseUrl = (
  candidate: string,
  version: string,
  installerFileName: string,
): boolean => {
  try {
    const url = new URL(candidate);
    const expectedPath =
      `/${DESKTOP_RELEASE_OWNER}/${DESKTOP_RELEASE_REPOSITORY}/releases/download/` +
      `desktop-v${version}/${installerFileName}`;
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === expectedPath
    );
  } catch {
    return false;
  }
};

export const desktopReleaseUnavailableReasonSchema = z.enum([
  "not_configured",
  "invalid_configuration",
]);

export const desktopReleaseInfoSchema = z
  .object({
    platform: z.literal("windows"),
    arch: z.literal("x64"),
    version: desktopReleaseVersionSchema,
    installerFileName: z.string().min(1),
    downloadUrl: z.string().url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    publisher: z.string().min(1),
    publishedAt: z.string().datetime().nullable(),
    casimirGate: z
      .object({
        verdict: z.literal("PASS"),
        certificateHash: z.string().regex(/^[a-f0-9]{64}$/),
        integrity: z.literal("OK"),
      })
      .strict(),
  })
  .strict()
  .superRefine((release, context) => {
    const expectedFileName = `CasimirBot-${release.version}-x64-setup.exe`;
    if (release.installerFileName !== expectedFileName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installerFileName"],
        message: "Installer filename does not match the approved version",
      });
    }
    if (
      !isImmutableDesktopReleaseUrl(
        release.downloadUrl,
        release.version,
        release.installerFileName,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["downloadUrl"],
        message: "Download URL is not the exact immutable release asset",
      });
    }
  });

const desktopReleaseUnavailableSchema = z
  .object({
    schemaVersion: z.literal(DESKTOP_RELEASE_STATUS_SCHEMA_VERSION),
    available: z.literal(false),
    approved: z.literal(false),
    reason: desktopReleaseUnavailableReasonSchema,
  })
  .strict();

const desktopReleaseAvailableSchema = z
  .object({
    schemaVersion: z.literal(DESKTOP_RELEASE_STATUS_SCHEMA_VERSION),
    available: z.literal(true),
    approved: z.literal(true),
    release: desktopReleaseInfoSchema,
  })
  .strict();

export const desktopReleaseStatusSchema = z.discriminatedUnion("available", [
  desktopReleaseUnavailableSchema,
  desktopReleaseAvailableSchema,
]);

export type DesktopReleaseInfo = z.infer<typeof desktopReleaseInfoSchema>;
export type DesktopReleaseStatus = z.infer<typeof desktopReleaseStatusSchema>;
