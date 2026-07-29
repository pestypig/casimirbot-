# Helix Environment Adapter Registry v1

## Outcome

Helix admits current-state observations from multiple environment types through
one trusted adapter contract. Minecraft Java is the first enabled game
adapter. A synthetic game adapter exists only as a nonproduction fixture that
proves the contract is generic and cross-adapter isolation fails closed.

An adapter is not a model, agent runtime, plugin binary loader, or action
executor. It is a code-owned policy profile that tells Helix which external
producer identity, protocol, observation types, freshness limits, read-only
probes, and mechanics collections are compatible.

## Authority split

- Codex owns reasoning, tool selection and execution, retries, observation
  re-entry, and completion.
- Helix owns adapter registration, source and manifest admission, exact
  provenance, normalization, mechanics compatibility, proof gates, and
  terminal eligibility.
- The external environment producer reports observations. It cannot register
  an adapter, expand a profile, choose a run/chat/turn, sample a model, execute
  an action, or write an answer.
- `docs.search` retrieves versioned mechanics evidence. Live source ingress
  reports current world state. Neither lane privately invokes the other.

All adapter admissions, mechanics results, and room observations are
nonterminal and require a later Codex reasoning step.

## Trusted profile

`helix.environment_adapter_profile.v1` is code-owned and contract-hashed with a
canonical SHA-256 digest. Each versioned profile declares:

- stable profile ID/version and lifecycle state;
- environment domain and source family;
- exact accepted `domain_adapter` identities and `world_id` prefixes;
- admitted protocol versions;
- required modalities and snapshot sections;
- allowed and required read-only probe types;
- world-event, snapshot, manifest, heartbeat, probe-result, and normalized
  evidence schemas;
- transport, heartbeat, and observation freshness ceilings;
- per-payload size ceilings;
- compatible versioned mechanics collections and bounded document paths;
- one server-owned normalizer identity; and
- an execution policy that forbids live actions and credential reuse.

Profiles are compiled into
`server/services/situation-room/environment-adapter-registry.ts`. A source
manifest can prove compatibility with a profile but cannot create or alter
one. Unknown, disabled, identity-crossed, or protocol-incompatible sources fail
before observation admission.

## First adapters

| Profile                              | Deployment state | Adapter identities                                                                                                                | World identity     | Mechanics                                                                                   |
| ------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `game.minecraft.readonly.v1`         | enabled          | `minecraft.paper_plugin.v1`, `minecraft.fabric_mod.v1`, Minehut, generic Minecraft v1, and the retained legacy Minecraft identity | `minecraft:*`      | `mechanics.minecraft.java.v1`; Fabric may also admit `mechanics.minecraft.crimson_curse.v1` |
| `game.synthetic_fixture.readonly.v1` | fixture-only     | `synthetic_game.fixture.v1`                                                                                                       | `synthetic-game:*` | `mechanics.synthetic_game.fixture.v1`                                                       |

Fixture profiles require `HELIX_ENVIRONMENT_ADAPTER_FIXTURES=1` and are always
disabled in production.

## Source and manifest admission

Source creation resolves `(domain_adapter, world_id)` through the registry.
After receiving its show-once source credential, a producer must register a
complete environment manifest before heartbeats, world events, or probe traffic
is accepted.

The server records a durable
`helix.environment_adapter_admission.v1` for the exact:

- room, source, world, and adapter;
- binding and active credential;
- producer epoch;
- adapter profile ID, profile version, and contract hash; and
- manifest ID/hash, source family, and mechanics collection IDs.

The raw credential and raw producer epoch are never included in receipts,
evidence, debug projections, or model context. Model-visible provenance uses a
one-way epoch reference. Every subsequent request rechecks the current
credential, binding, owner policy, profile identity/hash, and durable
admission. A new producer epoch requires a new manifest admission.

Rotation, revocation, credential expiry, owner-policy loss, and room closure
invalidate durable admissions. Replayed transport receipts remain receipts;
they cannot substitute for a current active adapter admission or current-turn
evidence.

## Observation normalization and evidence

The protected ingress lane accepts only registry-admitted schemas and
profile-bounded payloads, timestamps, and probes. External payloads cannot
manufacture the server admission envelope. Event-journal records use the
profile's `source_family`, exact room/source/world identity, and exact request
evidence reference.

`room.evidence.read_bound` selects only an active, credentialed, registry-
admitted source for the authenticated run's one active room binding. Its
generic `environment_observations` projection carries:

- adapter domain, source family, profile/version/hash, admission and manifest
  references;
- compatible mechanics collection IDs;
- bounded fresh events and optional normalized environment snapshot; and
- exact request/admission provenance.

For migration compatibility, Minecraft additionally receives the temporary
`minecraft_observations` alias. Other adapters never receive that alias.

The observation is always `assistant_answer: false`,
`answer_authority: false`, `terminal_eligible: false`, and
`reentry_required: true`.

## Mechanics retrieval

Each mechanics collection is versioned and code-bound to one or more adapter
profiles. `docs.search` accepts `mechanics_collection_ids` together with the
current `adapter_profile_id`. Helix resolves those IDs to an allowlisted
document scope and ignores caller-supplied broader paths for that call.
Unknown and cross-profile collections fail closed.

The first source documents are:

- `docs/game-mechanics/minecraft-java-v1.md`
- `docs/game-mechanics/synthetic-game-fixture-v1.md`

Queries operate on body text, so the caller need not mention a document title.
Returned mechanics material describes game rules; it does not establish
current world state. Current-state claims still require a fresh
`room.evidence.read_bound` observation in the same solver turn.

## Adding another game

Adding a production game requires a code-reviewed profile and mechanics
collection, not a producer-supplied manifest alone:

1. Define exact adapter IDs, world prefixes, protocol and schema compatibility.
2. Set the minimum modalities/sections, allowlisted read-only probes,
   freshness, and payload ceilings.
3. Add a server-owned normalizer and versioned mechanics collection with
   bounded docs paths.
4. Add cross-adapter, cross-room, stale, replay, rotation, revocation, malformed
   schema, mechanics mismatch, and nonterminal re-entry tests.
5. Enable the profile only after deterministic and keyed live acceptance.

Action execution remains a separate future capability with a separate
credential, allowlist, approval and idempotency policy, and typed result
receipt. The observation credential always returns
`command_execution_not_enabled` for command requests.

## Typed failures

Registry and admission failures include:

- `environment_adapter_unknown`
- `environment_adapter_disabled`
- `environment_adapter_identity_mismatch`
- `environment_adapter_protocol_unsupported`
- `environment_adapter_manifest_incompatible`
- `environment_adapter_admission_required`
- `environment_adapter_contract_changed`
- `environment_adapter_observation_schema_invalid`
- `environment_adapter_mechanics_incompatible`
- `environment_mechanics_collection_unknown`
- `environment_mechanics_collection_not_admitted`

These are diagnostics, not assistant answers or terminal products.
