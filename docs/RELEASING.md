# Releasing Packages

This repo ships two npm packages:
- `casimir-sdk` (SDK)
- `casimir-cli` (CLI)

Workflow
1) Ensure `NPM_TOKEN` is set as a repository secret.
2) Run the GitHub Actions workflow: `Release Packages`.
3) Choose which package(s) to release and the version bump (`patch`, `minor`,
   `major`, or an explicit `x.y.z`).

Notes
- The workflow builds the package, bumps the version, commits, tags, and
  publishes to npm.
- Tags are `casimir-sdk-vX.Y.Z` and `casimir-cli-vX.Y.Z`.
