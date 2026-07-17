# Local/Replit Parity Contract

This contract makes CasimirBot's local, Replit Preview, and Replit production
identity and Helix Ask behavior measurable. A matching page title or bundle
filename is not parity evidence.

## What parity means

Two targets have the same Helix Ask experience when all of these match:

- Git source commit and source/material fingerprint
- Theory Badge Graph fingerprint
- workstation capability/tool-surface fingerprint
- non-secret reasoning configuration fingerprint
- client Helix Ask build-configuration fingerprint
- account capability-policy fingerprint
- deterministic referent binding and Theory Badge Graph observation
- runtime provider and terminal-product contract for the replay turn
- resolved model/reasoning policy summary for the replay turn

Development and production are allowed to differ in hosting mechanics such as
`NODE_ENV`, Vite middleware, and `FAST_BOOT`. Those values are reported under
`hosting_configuration_sha256`, but they are intentionally excluded from
`experience_contract_sha256`.

The supported local, Replit Preview, and Replit production commands all set
`HELIX_ASK_GOLDEN_PATH_RUNTIME=0`, so normal turns use the live model/tool route
in every environment. `npm run dev:golden-path` remains the explicit scaffold
test command. An environment override is allowed, but the reasoning fingerprint
and replay will then report an experience mismatch.

Final answer prose is also intentionally excluded. Model sampling can phrase a
correct answer differently. The replay compares the referent hash, graph badge
placement, provider, route product, and terminal authority instead.

## Authoritative endpoints and artifacts

- `GET /api/agi/runtime-parity/fingerprint` returns the safe runtime contract.
- `dist/build-meta.json` binds a production build to its Git commit and emitted
  client, server, runtime-data, and parity-fixture artifacts. Its normalized
  `source_tree` hash covers build-relevant tracked and non-ignored source
  content while excluding generated/runtime debris, so two materially different
  trees at the same commit cannot falsely compare equal.
- `dist/build-meta.env` exports that build identity to the production process.
- `scripts/fixtures/helix-replit-parity.v1.json` is the canonical replay input.
- `dist/parity/static-result.json` is the deterministic graph result packaged
  with a Replit build.

The fingerprint includes hashes of the active docs metadata and code lattice.
Those generated materials can change agent context even when a commit label is
unchanged, so a mismatch is treated as an experience mismatch.

No secret values are returned. Secret-like environment variables are omitted,
and `CODEX_ARGS` is represented only by a hash.

## Deployment gate

Replit's deployment command runs with `REPLIT_STRICT_GIT_BUILD=1` and requires:

1. `HEAD` equals `origin/main` (the configured authority ref).
2. The checkout is clean before dependency installation.
3. Dependency installation does not modify tracked source.
4. The deterministic referent/graph fixture passes.
5. The minified Vite client and bundled server build successfully.
6. StarSim runtime JSON files are packaged.
7. Build metadata verifies against the checkout and emitted artifacts.
8. A keyless `node dist/index.js` smoke process reaches full app readiness and
   serves `/desktop`, `/api/account/session`, `/api/helix/pipeline`, and the
   runtime fingerprint endpoint. It also fetches a real Markdown document to
   verify the production document viewer's on-demand `/docs/*` source path.

Any failure stops deployment. Production startup independently verifies
`dist/build-meta.json`; a missing, modified, or wrong-commit bundle is rebuilt
instead of being served as current.

## Standard update workflow

Commit and push local work to `main`, then use the Replit Shell:

```bash
rm -f .git/index.lock .git/refs/remotes/origin/HEAD.lock
git fetch origin
git reset --hard origin/main
git status --short --branch
git log -1 --oneline
```

The status must show `main...origin/main` with no local changes. Then restart
Preview through the Replit workflow (`npm run replit:dev`). The workflow runs
the static parity fixture before it starts the source server.

Before deployment, the useful local commands are:

```bash
npm run replit:parity:static
npm run replit:build
npm run replit:parity:gate
```

`npm run replit:build` already includes metadata verification and the compiled
production smoke. The standalone gate is useful when validating an existing
`dist/` without rebuilding it.

After deployment, compare the Replit origin and custom domain without invoking
a model:

```powershell
$env:HELIX_REPLIT_DEPLOYMENT_TARGETS = "replit=https://casimir-bot-pestypig.replit.app,domain=https://casimirbot.com"
npm run replit:deployment:parity
```

This command fails if either URL is not compiled production or if their source,
client tree, build artifact, reasoning material, policy, experience, or
deployment hashes differ. It also resolves local `origin/main` and fails when
both domains agree with each other but are still serving an older commit. Use
`HELIX_REPLIT_EXPECTED_COMMIT` (a commit or ref) only when deliberately checking
against another Git authority.

## Cross-environment replay

Start a keyed local server yourself, keep Replit Preview running, and execute:

```powershell
$env:HELIX_REPLIT_PARITY_TARGETS = "local=http://127.0.0.1:5050,replit=https://casimir-bot-pestypig.replit.app"
npm run replit:parity:replay
```

The replay forces the Codex provider for the canonical superconductivity
referent turn, fetches each debug export, and writes a compact comparison under
`artifacts/helix-replit-parity/`. It calls the configured model provider and can
incur normal API usage. The build gate itself is keyless and does not call a
model.

Run both targets under the same account type. For authenticated comparisons,
headers can be supplied without committing them:

```powershell
$env:HELIX_REPLIT_PARITY_HEADERS_JSON = '{"local":{"Cookie":"..."},"replit":{"Cookie":"..."}}'
```

Never put cookies or API keys in the fixture or repository.

## Reading a mismatch

- `source_identity_sha256`: checkout, package lock, Theory sources, client
  settings, docs metadata, or code lattice differ.
- `source_tree_sha256`: normalized source bytes differ, even if the two targets
  report the same commit label.
- `theory_graph_sha256`: the graph itself differs.
- `tool_surface_sha256`: capability registration or schema differs.
- `reasoning_configuration_sha256`: Helix/LLM behavior flags differ.
- `account_policy_sha256`: the sessions have different account permissions.
- referent fields: the follow-up was not bound to the same prior answer.
- exact/likely badge fields: deterministic graph placement differs.
- provider, model-policy, or terminal fields: runtime selection, reasoning
  settings, or terminal authority differ even if prose looks plausible.
- only `hosting_configuration_sha256`: expected dev/production host difference;
  not an experience failure.
- only final-answer hash: acceptable wording variation; inspect content quality
  separately.

For deployed-domain checks, compare the fingerprint endpoint on both the
`.replit.app` URL and the custom domain. Matching HTML ETags alone prove only
that the same static shell was served; matching deployment and experience
contracts prove the server and reasoning surfaces are aligned.
