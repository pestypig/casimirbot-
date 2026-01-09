# Releasing Packages

This repo ships two npm packages:
- `shadow-of-intent-sdk` (SDK)
- `shadow-of-intent` (CLI)

Day-1 publishing definition
- "Published" means the CLI/SDK install and succeed against a local server on `http://localhost:5173` with no extra configuration.
- Hosted endpoints are opt-in via `--url`, `CASIMIR_PUBLIC_BASE_URL`, or `SHADOW_OF_INTENT_BASE_URL` once they are live and stable (expect `/health` and `/version`).
- Release rule: defaults must succeed on a fresh machine.

Workflow
1) Ensure `NPM_TOKEN` is set as a repository secret.
2) Run the GitHub Actions workflow: `Release Packages`.
3) Choose which package(s) to release and the version bump (`patch`, `minor`,
   `major`, or an explicit `x.y.z`).

Notes
- The workflow builds the package, bumps the version, commits, tags, and
  publishes to npm.
- Tags are `shadow-of-intent-sdk-vX.Y.Z` and `shadow-of-intent-vX.Y.Z`.
