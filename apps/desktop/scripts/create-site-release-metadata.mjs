import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OFFICIAL_REPOSITORY,
  createSiteReleaseMetadata,
} from "./site-release-metadata-lib.mjs";

const desktopRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const releaseRoot = path.resolve(
  process.env.DESKTOP_RELEASE_DIR ?? path.join(desktopRoot, "release"),
);
const metadata = await createSiteReleaseMetadata({
  releaseRoot,
  repository: process.env.GITHUB_REPOSITORY ?? OFFICIAL_REPOSITORY,
  releaseTag: process.env.RELEASE_TAG,
  outputPath: path.join(releaseRoot, "site-release-metadata.json"),
});

console.log(
  `[desktop-site-release] PASS version=${metadata.status.release.version} tag=${metadata.releaseTag} installer_sha256=${metadata.status.release.sha256}`,
);

