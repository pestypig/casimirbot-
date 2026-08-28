# EH-G8 installed profile connection broker v1

Program gate: G8 — Environment-harness release evaluation
Workstream: Installed-node credential separation and user-owned capability grants
Capability or component: User-facing profile connections backed by the installed desktop credential broker, with revocable read-only Shared Live Room grants for the Robinhood reference connector
Lifecycle stage: profile enrollment → protected credential retention → sanitized connection projection → room grant admission → governed read execution → credential-free normalization → revocation and recovery
Reaction timescale: none for enrollment and revocation; on-demand observation and short semantic replanning for granted reads
Authority owner: The signed-in profile owns enrollment, revocation, and room grants; the installed native host owns OS-protected key custody; Helix owns account, room, capability, expiry, revocation, provenance, and consequence policy; the connector alone may resolve provider credentials for one admitted call; Runtime Codex may select and interpret an advertised read but never receives or manages credentials
Current maturity: deterministically verified
Target maturity: live accepted
Required evidence: user and developer policy parity for profile-connection enrollment; Windows safeStorage protection of the desktop credential-encryption key; ciphertext-only durable provider records; raw-secret exclusion from browser responses, renderer state, model/tool context, logs, debug projections, room records, and process arguments; exact profile ownership; same-origin enrollment and revocation; owner-controlled room grant creation; capability narrowing; revocation and room-privacy fail-closed behavior; user denial from paper and live brokerage mutation surfaces; desktop service-boundary recovery; one-instance supervision; and a representative installed-node read-only post-G7 journey with the same connection, room, observation, evidence, and terminal identities across supported surfaces
Explicit non-goals: no raw API-key form in the web renderer; no credential collection by an agent; no secret in MCP configuration; no generic arbitrary-provider secret schema; no room ownership of credentials; no grant of order review, approval, placement, cancellation, reconciliation, paper mutation, options, margin, transfers, browser automation, shell access, or unattended trading; no claim of complete MCP catalog convergence, multi-member brokerage sharing, second-device continuation, signed-installer acceptance, or G8 closure from this slice alone
Downstream gate unlocked: G8 installed-node cross-surface convergence and release-evaluation journey

## Objective

Turn the existing developer acceptance mechanism into the first ordinary-user
profile-connection experience without weakening its credential boundary. The
reference connector is Robinhood because G7 already proved its owner-private,
read-only observation path and secret exclusion. This packet promotes only
enrollment, status, revocation, and narrow room attachment to `user` accounts.

The installed desktop generates the provider-credential encryption key and
protects it with Electron `safeStorage` for the current Windows account. SPB-1
has replaced reusable child-environment key inheritance with an authenticated
per-launch loopback broker: the private service receives only an ephemeral
broker session and requests one encryption or decryption operation at a time.
Provider authorization remains authenticated ciphertext in the desktop-local
profile database. The renderer, room, MCP client, model, and normalized
observation receive no provider credential or vault master key.

## User acceptance surface

1. A signed-in `user` or `developer` opens Account & Sessions.
2. The Profile connections card begins an allowlisted OAuth/PKCE flow in the
   system browser or trusted native external-navigation bridge.
3. The provider callback stores only an encrypted credential bundle owned by
   the exact profile and returns a sanitized status projection.
4. The profile may disconnect at any time; deletion cascades to room bindings.
5. A room owner may attach an allowlisted subset of read capabilities to one
   owner-private room. The room stores only the connection reference and
   capability consent, never credentials.
6. The admitted adapter may resolve the credential for one read call and must
   normalize and redact its result before reasoning re-entry.
7. A `user` remains denied from every paper or live brokerage mutation route.

This is the first connector-specific implementation of the profile-connection
contract. It does not yet accept a generic user-pasted API key. A later native
provider-enrollment packet must keep raw key entry in trusted native UI and
return only an opaque handle to the service.

That later expansion is now classified and staged by
`docs/work-packets/eh-g8-exe-first-subscription-provider-broker-v1.md`. It keeps
profile identity, Codex/MCP authorization, device installation, subscription
entitlement, provider connection, capability grant, and billable-session lease
separate. This Robinhood read slice retains its exact maturity and does not
inherit payment, generic provider, or public billable authority from that plan.

## Recovery and supervision evidence

The deterministic G8 slice must retain the desktop service-boundary evidence
that one native host starts exactly one private loopback service, protects the
credential-encryption key beneath the per-user `userData` root, persists the
profile database atomically, and restores sanitized connection metadata after
a service restart. A corrupted or unavailable protected key must fail closed;
the service must not silently mint a replacement that makes existing
ciphertext appear valid.

## Cross-surface identity reservation

The broader G8 installed-node journey remains open. Its acceptance artifact
must bind one durable `run_id`, lifecycle stream, execution lease, observation
and evidence references, cancellation state, and terminal product across the
desktop UI, authenticated MCP, Helix Ask, and applicable room projections. This
packet changes no answer writer, sampling loop, tool runtime, or terminal
authority.

## Verification

- account-policy tests prove the profile-connection flag is public while the
  broader brokerage mutation feature remains developer-only;
- route tests prove user enrollment/list/revocation and owner-private read
  grants, plus user denial from paper/live routes;
- credential tests prove ciphertext-only storage and response exclusion;
- Account and room component tests prove the public controls expose no secret
  field and room attachment passes only a connection ID and capability list;
- desktop host tests prove safeStorage protection and restart behavior; and
- `npm run helix:environment-harness:docs-audit` validates the selected packet
  and canonical backlinks.

## Deterministic evidence recorded 2026-08-24

- The shared policy contract exposes `profile_connections` to `user` and
  `developer` accounts while retaining `brokerage_environment` as a
  developer-only mutation feature.
- Browser route tests prove a user can list connections and begin the exact
  OAuth/PKCE flow, receives no verifier or credential, and remains denied from
  the paper-account mutation route.
- The existing ciphertext test continues to prove that access and refresh
  tokens do not enter API projections or plaintext durable rows.
- Room UI and route tests prove the grant carries only connection, room, and
  read-capability identity; user presentation omits paper/live controls; and
  the owner may revoke an active or privacy-invalidated grant independently of
  the profile connection.
- The desktop host TypeScript check passes. The rebuilt service-boundary smoke
  passes private-loopback session isolation, fail-closed release state,
  desktop-local persistence, and public-policy closure. Its readiness poll now
  waits for `/api/ready`, preventing liveness from racing API route mounting.

The broader installed multi-surface convergence capability remains
`specified`. No live provider enrollment, multi-member use, signed installer,
or G8 closure is claimed by this deterministic slice.

## Native packaging recovery checkpoint — 2026-08-27

The current Electron source already installs non-fatal stdout/stderr guards so
a closed inherited Windows pipe cannot reproduce the `write EPIPE` main-process
crash seen in the older packaged executable. Rebuilding uncovered and repaired
one additional workstation compatibility issue: the tunnel-client preparation
script now computes SHA-256 through the .NET framework when `Get-FileHash` is
unavailable. The checksum comparison remains mandatory and unchanged.

The unpacked `0.1.0-alpha.8` development artifact rebuilt at
`apps/desktop/release/win-unpacked/CasimirBot.exe`. Runtime-tree verification
passed with pinned OpenAI tunnel-client `0.0.11`, executable SHA-256
`7d3c7d492ce84b52835e11865a835a8a5bcd4a669dee84e169aa11b314dc952a`,
and runtime-manifest SHA-256
`3530b36eb2823c7a98d64b6ac056b196f726a58900292188a9cbb5f7ef6637a3`.

Packaged-launch smoke did not execute because the workstation had less than its
required 4 GiB physical headroom. Release preflight also remains incomplete
without the externally supplied `CSC_LINK` signing credential. Neither missing
condition is counted as pass evidence. The built directory is therefore a
development acceptance artifact, not a signed release or installed live
acceptance result.
