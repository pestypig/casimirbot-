Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1 platform/package/runtime-profile reconciliation
Capability or component: Environment Home, GitHub-backed connector packages, execution profiles, provider credentials and supervised local runtimes
Lifecycle stage: source-backed product and architecture audit under CFP-1; no child-stage implementation admitted
Reaction timescale: installation and configuration before a mission, then supervised runtime and per-operation admission
Authority owner: the canonical work program controls stage; CFP-1 controls the release boundary; the program owner controls program effects; the installed native host controls credential custody and local processes; the catalog owner controls admitted package versions
Current maturity: specified concept over partial built-in directory, pairing, installation-record and native credential-broker components; no accepted customer Store, GitHub installer, Environment Home or generic execution-profile path
Target maturity: a curated source-backed Store and permanent Environment Home for both account modes whose installed packages can use separately authorized reasoning profiles without patching the signed EXE or exposing credentials; developer remains the control superset
Required evidence: current-code inventory; immutable package/source policy; native secret-custody boundary; isolated installer/runtime policy; one read-only public package; one external-Codex profile; one user-funded provider profile; update, withdrawal, revocation and uninstall negatives
Explicit non-goals: no arbitrary GitHub clone/execute; no raw key in renderer, manifest, room, model context or process arguments; no public branch as a release identity; no dynamic trusted action registration; no third-party in-process React panel; no claim that provider use or hosting is free; no CFP-2/3 implementation admission
Downstream gate unlocked: none automatically; this review supplies CFP-1 D12 and later C10/DIR/DEV packet inputs

# Environment Home, GitHub packages and execution profiles review 342

Date: 2026-09-21

Result: **VIABLE WITH A FIVE-OBJECT SEPARATION**

## Judgment

The proposed Wii-like environment home and GitHub-centered developer ecosystem
fit the platform direction. The design becomes coherent when “Opaque launcher”
is not one user-facing object that installs repositories, stores API keys,
chooses models and controls programs.

Use five separately governed objects:

1. **Catalog record** — what has been reviewed and can be discovered.
2. **Installed connector package** — the exact adapter version present on one
   owner-controlled node.
3. **Execution Profile** — which admitted reasoning/planning/selection roles the
   owner wants to use for that environment.
4. **Credential Connection** — an opaque native reference to a provider secret.
5. **Runtime supervisor** — the native process boundary that starts, monitors,
   stops and receipts an isolated connector/runtime.

The repository already uses “approved opaque launcher” for an external
credential-bearing developer bootstrap that starts the keyed CasimirBot service.
That mechanism is useful implementation precedent, but exposing it as the
customer configuration model would mix privileged process admission with model
choice and package configuration. The UI should say **Execution Profile** and
**Provider Connection**. Opaque launcher and broker details stay behind the
native boundary.

## What exists in current code

| Surface | Current implementation | Consequence for the proposal |
| --- | --- | --- |
| Package records | [Migration 039](../../../../server/db/migrations/039_environment_connector_platform.ts) stores package/version, publisher, content hash, signature, compatibility, capability descriptors and review/lifecycle state. | Good catalog foundation, but it lacks source repository, pinned commit/release asset, license, install recipe, artwork and runtime-profile declarations. |
| Public directory | [Directory service](../../../../server/services/environment-connectors/directory/index.ts) reads database rows after seeding built-in packages. The [public route](../../../../server/routes/environment-connector-platform.ts) exposes metadata and keeps runtime/evidence claims separate. | It is a built-in metadata directory, not a GitHub registry, artifact downloader or installer. |
| Installation identity | [Installation service](../../../../server/services/environment-connectors/installations/index.ts) defines owner-scoped status over an immutable package version; pairing services materialize records. | The identity model exists, but no general package acquisition, filesystem staging, build, update or uninstall engine exists. |
| Capabilities | [Server-owned catalog](../../../../server/services/environment-connectors/catalog/index.ts) defines code-owned read/action descriptors. | A package manifest cannot dynamically grant trusted capabilities. This must remain true until a separately admitted dynamic action contract exists. |
| Pairing | [Environment connector routes](../../../../server/routes/environment-connector-platform.ts) support directory listing, generic pairing and device lifecycle. | A future installed GitHub package can reuse pairing after artifact admission; pairing is not installation or trust. |
| Credential custody | The [installed profile broker packet](../../../work-packets/eh-g8-installed-profile-connection-broker-v1.md) and desktop host use Windows/Electron `safeStorage`, ciphertext-only provider records and an authenticated loopback broker. | Reuse this. The tile overflow menu may start trusted native enrollment but must not implement a raw web/React API-key field. |
| Workstation navigation | [Panel registry](../../../../client/src/lib/desktop/panelRegistry.ts) is static and currently marks Endpoints & Panels as default-open. The separate `/home` page remains a Needle Hull research page. | There is no permanent public Environment Home or dynamic environment tile registry today. It should be a new first-party panel backed by package/install projections. |
| Menu architecture | [Casimir Guide contract](../../../architecture/casimir-guide-menu-v1.md) requires one navigation system and preserves the existing panel registry/account policy. | Environment Home should be a full workstation panel. The Guide can link to it without becoming a competing store or launcher. |

No reviewed source establishes the proposed end-to-end Store or Execution
Profile experience as implemented.

## Correct GitHub role

GitHub should be the preferred **public source and release-artifact plane** for
reviewed open integrations. CasimirBot still needs a catalog control plane.

```text
GitHub repository and immutable release
  → developer submission names exact commit, asset and hashes
  → CasimirBot review records publisher, rights, permissions and compatibility
  → Store presents the reviewed record
  → native host downloads the exact asset directly or through an accepted mirror
  → native host verifies identity before isolated installation
```

This means the domain database does not need to store every package byte. It
does need to retain the reviewed record, package identity, source URL, immutable
commit/release asset, hashes/signature, license disposition, permissions,
compatibility, support state and withdrawal decision. GitHub deletion or
repository compromise must not erase the catalog's ability to deny a package or
identify already-installed copies.

Do not install `main`, another mutable branch or a pull request. Branches remain
development inputs. A release candidate is an immutable commit and preferably
a GitHub Release asset with a verified digest and provenance. Source-build
packages need a pinned toolchain, lockfile, reproducible build instructions and
an isolated build result before their output can become the installed artifact.

## Review of the Minecraft reference

The referenced
[Astra and JEV Minecraft agent](https://github.com/rmalde/minecraft-agent)
is valuable architecture evidence:

- Astra performs milestone/high-level planning.
- JEV selects from bounded actions using structured observations.
- Mineflayer performs local movement/pathfinding and normal game-protocol work.
- Model calls are separated from the local action loop.
- Recorded events and native outcomes support verification.

That separation validates the need for role-aware Execution Profiles such as
`planner`, `bounded_selector`, `controller` and `observer`. It does not validate
arbitrary repository installation. The current repository is not an admissible
Store package without author work and review:

- its [package manifest](https://raw.githubusercontent.com/rmalde/minecraft-agent/main/package.json)
  is marked `private`, runs post-install code and uses several `latest`
  dependencies;
- the visible root has no license file, so public visibility alone supplies no
  redistribution right;
- its
  [model relay](https://raw.githubusercontent.com/rmalde/minecraft-agent/main/model-relay.mjs)
  and [model configuration](https://raw.githubusercontent.com/rmalde/minecraft-agent/main/models.mjs)
  reference the author's Google project/Secret Manager and OpenRouter routes;
  and
- its README says runtime paths and local server settings require configuration
  outside the author's macOS setup.

It should be treated as a reference implementation that could later publish a
CasimirBot adapter and package manifest. CasimirBot should not wrap or advertise
it as installable until the publisher supplies rights, pinned dependencies,
portable configuration, a bounded adapter contract and accepted artifacts.

## API and sandbox interpretation

The official [OpenAI Agents API overview](https://developers.openai.com/api/docs/guides/agents-api/overview)
describes a managed Codex harness: OpenAI owns sessions, orchestration,
compaction and recovery while the application supplies tools and selects an
environment. Model use is billed at API rates, and OpenAI-hosted sandboxes add
container charges. Therefore Agents API plus a sandbox is not a free Codex
interpreter and is not included merely because a customer has a ChatGPT/Codex
subscription.

The official [self-hosted sandbox guide](https://developers.openai.com/api/docs/guides/agents-api/environments/self-hosted)
supports connecting a laptop, container or other owned environment through
`codex exec-server`. It requires an application API key plus a separate
restricted environment key; the application key stays outside the sandbox.
This maps well to a later user-funded Execution Profile, but the executor's
shell/filesystem powers require stronger isolation than an ordinary Minecraft
connector and do not themselves grant a CasimirBot program action.

The official [OpenAI-hosted sandbox guide](https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted)
supports packages, files, setup commands, skills/plugins and network policy.
Secrets should use vault credentials rather than ordinary environment values.
A hosted Linux workspace can plan, inspect files or create artifacts, but it
does not directly control a game on the user's Windows machine. Local effects
still need the authenticated CasimirBot connector/admission path.

Use these product labels:

| User choice | Actual behavior |
| --- | --- |
| Use my Codex app | External Codex uses local MCP; no additional Casimir model key. |
| Use my OpenAI API project | Agents API session under the user's separate API billing, with a qualified hosted or self-hosted environment. |
| Use another provider | Reviewed provider/endpoint and role contract, with a native credential connection. |
| Use local procedures/model | No provider call; declared local compute and controller policy. |
| Use Casimir managed reasoning | Seller-funded metered service only after separate commercial admission. |

A user-owned key can make provider inference **zero cost to CasimirBot**. It is
not free to the user, and it does not remove CasimirBot's catalog, room, relay,
update, security or support costs.

## Environment Home contract

The visual reference is useful for hierarchy: a stable grid of large
recognizable channels, directional/controller navigation and a dedicated Store
tile. CasimirBot should use its own visual language and state semantics.

The first-party Environment Home remains registered in the existing workstation
panel system. Its first cohort can show:

```text
[Environment Store] [Local Harness] [System Clock] [Minecraft — conditional]
[Account & Security] [Rooms] [empty/install slot] [empty/install slot]
```

An environment tile includes:

- reviewed icon/banner, publisher and installed version;
- install, update, enabled, process, connected and authorized state;
- current program/subject and observation freshness;
- active operation and physical-control state; and
- an overflow menu for Details, Execution Profiles, Provider Connections,
  Permissions, Update/Rollback, Stop, Revoke and Uninstall.

The menu opens trusted first-party dialogs. Repository-supplied artwork is
pinned, hashed, size-limited and non-executable. The initial generic environment
detail panel renders reviewed manifest fields and state. Arbitrary third-party
React/components do not load into the signed renderer. A later plugin UI must
use a separately reviewed sandbox and message contract.

## Package and execution-profile contract additions

The later package manifest needs fields for:

- publisher/package/version and immutable source/release identity;
- license, notices, distribution and commercial-use review state;
- host OS/architecture and supported program versions;
- artifact hashes/signature/provenance and reproducible-build identity;
- required filesystem, process, command, port and network permissions;
- observation/action capability descriptors and whether each is preview-only;
- runtime entrypoint and health/stop protocol without embedded secrets;
- declared reasoning roles, accepted input/output schemas and supported
  provider classes;
- configuration schema split into public values and credential references;
- reviewed artwork hashes; and
- update, rollback, withdrawal, data-retention and uninstall behavior.

An Execution Profile binds:

```text
owner + installed node + package version + program subject
  + reasoning role assignments + provider/model policy
  + opaque credential references + budgets
  + network/filesystem/runtime policy + revision
```

It does not bind a room grant, action lease or mission-principal role by itself.
Those remain separately admitted and revision-fenced.

## Recommended implementation sequence

1. **CFP-1 freeze.** Decide whether Environment Home and GitHub-backed C10 are
   first-release requirements. Freeze manifest fields, allowed artifact kinds,
   credential/profile object boundaries and user-facing claims.
2. **Static Environment Home prototype.** Build the first-party panel over
   current built-in package/install projections. Show truthful unavailable
   states; do not add downloading or keys yet. This is blocked until its stage
   is admitted.
3. **C10 GitHub release qualification.** Publish the selected read-only kit as
   an immutable versioned artifact, record its source/license/hash/provenance and
   prove external build plus system-clock pairing.
4. **Native installer/supervisor.** Download to staging, verify, install beneath
   owner-scoped application data, start under a restrictive policy and produce
   lifecycle receipts. Reject arbitrary post-install scripts by default.
5. **External Codex profile.** Use the already selected local MCP path without
   another API key; prove tile → connect → authorize → observe/act → stop.
6. **One user-funded provider profile.** Extend the existing native provider
   broker with one exact reviewed provider/role schema. Test enrollment,
   rotation, restart, wrong-package access and zero raw-secret exposure.
7. **Reference adapter evaluation.** Invite an external project to publish an
   adapter rather than importing its repository wholesale. Validate one
   planner/selector split against a non-game or read-only fixture before making
   a general multi-interpreter claim.
8. **Withdrawal/update/uninstall acceptance.** Prove compromised release,
   changed hash, removed GitHub asset, incompatible host, rollback, running
   process termination and stale-authority denial.

## Launch-guide disposition

The [Platform Market Launch Execution Guide](../../../work-packets/eh-g8-casimirbot-platform-market-launch-execution-v1.md)
now records:

- Environment Home as the target permanent public environment panel;
- GitHub Releases as an allowed public artifact channel rather than the catalog
  authority;
- the five-object separation;
- reviewed Execution Profile choices and their cost boundaries;
- immutable package and artwork requirements; and
- the complete Store/profile lifecycle and negative evidence.

This does not admit implementation while CFP-1 remains active. It prevents the
launch program from treating the developer opaque launcher, a GitHub repository
or a three-dot key field as the complete product architecture.
