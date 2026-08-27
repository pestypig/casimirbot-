# EH-NFO-0 Network Field Observer v1

Program gate: G8 — environment-harness release evaluation
Workstream: Parallel post-G7 physical-device observation and installed-node integration
Capability or component: Network Field Observer contract, evidence-backed site graph, deterministic Block 66 fixture, and reserved developer-only field companion
Lifecycle stage: source admission → bounded probe execution → normalization → evidence re-entry → Runtime Codex synthesis → terminal eligibility
Reaction timescale: `none` for fixture and on-demand snapshots; `monitor_only` is reserved for a later finite semantic-monitor packet
Authority owner: the signed-in profile owns the site connection and grants; the field companion owns access to selected local interfaces and device sessions; Helix owns identity, admission, capability scope, freshness, provenance, monitor cursor, revocation, and terminal eligibility; Runtime Codex owns capability selection, interpretation, troubleshooting, uncertainty disclosure, and final synthesis
Current maturity: projected
Target maturity: deterministically verified on the Block 66 fixture
Required evidence: strict shared schemas; exact profile, site, session, device, source, and producer-epoch binding; canonical graph hashing; credential and private-endpoint exclusion; immutable evidence lineage; stale-evidence handling; contradiction preservation; inference support references; adversarial metadata handling; connector conformance tests; zero commands; zero side effects; zero environment mutations; and reproducible fixture answers
Explicit non-goals: no public live adapter from EH-NFO-0; no unrestricted discovery, caller-selected CIDR or port scanning, packet capture, shell, SSH, Telnet, configuration scraping, credential exposure, private-address projection, continuous monitoring, device mutation, action credential, automatic physical-topology claim, closed-task wake claim, managed MCP catalog-convergence claim, or assertion that fixture verification proves live site access
Downstream gate unlocked: none; the packet prepares EH-NFO-1 developer-only field-companion work and may later contribute post-G7 G8 integration evidence, but it does not independently close G8

## Decision

Build the Network Field Observer as a site stethoscope, not a robot hand. Its
first product is a small, persistent, evidence-backed site graph. Its first
runtime is a laptop-resident companion that reads only exact authorized targets
through reviewed drivers and sends credential-free observations outbound to the
profile-owned CasimirBot node.

The field observer is not the first second-domain transfer. G7 is closed through
the accepted Robinhood shadow-observation tripath. EH-NFO is a post-G7 physical-
device-domain adapter and a candidate representative G8 integration, subject to
its own capability-specific evidence.

## Cross-device architecture

Cross-device use has two distinct planes:

```text
remote Codex app, phone, or second computer
  → authenticated MCP or Shared Live Room
  → one profile-owned CasimirBot installed node
  → governed capability, evidence, and monitor lifecycle
  → outbound Network Field Companion on the authorized field laptop
  → local-only reviewed drivers
  → allowlisted routers, switches, UPSs, gateways, and test records
```

Northbound clients never receive a private network route. They ask the
CasimirBot node for governed capabilities. The southbound companion alone
resolves selected interfaces, private management endpoints, device credentials,
and transport details. MCP is a capability and evidence facade, not a VPN,
network tunnel, environment credential, or general remote-shell primitive.

Installing CasimirBot on a second client device is not required merely to view
or steer an authorized run. The site-owning computer hosts the installed node
and local companion; another authorized device reaches that node through MCP or
a narrowed Shared Live Room grant. A second installed node is appropriate only
when that computer independently owns a different local environment connection.

## Why installation is already useful

For real environment work, the development program has crossed the threshold
where an installed harness is more enabling than a bare Codex app. The harness
adds capabilities that prompt reasoning and broad local permissions cannot
replace:

- stable profile, client, run, room, environment, source, subject, and connector
  identity;
- local custody of provider and device credentials outside model context;
- exact capability admission instead of arbitrary host or network access;
- normalized observations with freshness, provenance, contradictions, and
  evidence references;
- immutable request, execution, observation, re-entry, and terminal lifecycle
  facts;
- finite semantic-monitor leases, resumable cursors, gap detection, reconnect,
  and revocation; and
- one execution arbiter and one terminal writer across desktop, MCP, Ask, room,
  and voice projections.

The practical dividing line is therefore:

```text
If Codex only needs repository files and ordinary development tools,
use the Codex app directly.

If Codex must observe a persistent external environment, retain identity across
turns, use local credentials without seeing them, continue across devices, or
act through authority that must survive reconnects and revocation,
use the installed harness.
```

The current recommendation is a controlled developer or field installation,
not an ordinary-user release. The opaque keyed repository launcher is approved
developer acceptance infrastructure. It is not the product credential broker
and must not become a permanent prerequisite for normal users. G8 still requires
signed native bootstrap, profile-native authorization, OS-protected renewal,
managed MCP reconnect and catalog refresh, durable one-instance supervision,
and installed-node recovery evidence.

Permissive filesystem or process permissions can help Development Codex build
and diagnose the system, but they do not grant Runtime Codex environment
authority. Environment authority must come from exact profile ownership,
consent, connector admission, capability scope, freshness, and a finite lease.
The adapter reduces procedural reasoning burden by presenting a stable typed
capability and evidence model; it must not reduce the enforceable authority
boundary.

## Product questions

The observer should answer, with evidence class and freshness visible:

- What equipment is present and currently reachable?
- Which switch ports, gateways, phone interfaces, UPS components, and WAN paths
  appear healthy?
- What observed dependency path currently supports the elevator telephone?
- Which facts are observed, measured, declared, or inferred?
- Which contradictions and unknown edges remain?
- What changed since the prior accepted snapshot?
- Which apparent single points of failure are supported by current evidence?
- What information is still required before equipment is ordered or configured?

It must answer `unknown` when digital evidence cannot establish a physical fact,
including cable routing, pair termination, power quality, emergency-call outcome,
or code compliance.

## Site graph and evidence classes

The normalized graph covers physical, link, network, communications, and power
layers. Cross-layer `critical_service` records describe a service dependency
path without manufacturing missing edges.

Every fact has exactly one class:

| Class | Meaning |
| --- | --- |
| `observed` | Reported directly by an admitted device or operating-system interface. |
| `measured` | Produced by an identified physical tester or instrument. |
| `declared` | Entered by a technician or imported from an identified drawing or record. |
| `inferred` | Derived from named supporting facts by a versioned inference profile. |

An inference never overwrites its support. A newer observation may supersede
freshness or confidence, but it does not erase prior evidence or a contradiction.

Minimum model-visible fact fields:

```text
fact_id
fact_revision
site_ref
field_session_ref
subject_ref
source_ref
producer_epoch_ref
fact_class
source_method
observed_at
freshness_deadline
value
confidence
supporting_evidence_refs
contradicting_evidence_refs
supersedes_fact_refs
redaction_receipt_ref
inference_profile_id
assistant_answer: false
answer_authority: false
terminal_eligible: false
reentry_required: true
```

Credentials, community strings, tokens, management URLs, raw addresses, raw
configuration, packet content, serial-port names, and unrestricted producer
text are local-only. Useful untrusted labels such as hostnames must be bounded,
normalized, tagged as inert data, and incapable of introducing instructions,
capabilities, identity, authority, or terminal content. Free-form banners remain
local-only or are replaced by bounded enums, hashes, and evidence references.

## Capability package reservation

Reserved identity, subject to later registry review:

```text
package_id: com.casimirbot.network.field-observer
package_version: 0.1.0
adapter_profile_id: infrastructure.network.readonly.v1
domain_adapter: network.field_observer.windows.v1
reaction_requirement: none
```

Reserved capability families:

- `com.casimirbot.network.site_snapshot.read`
- `com.casimirbot.network.device_identity.read`
- `com.casimirbot.network.device_health.read`
- `com.casimirbot.network.interface_status.read`
- `com.casimirbot.network.critical_service_path.read`

The caller supplies only opaque, already-admitted site, device, service, and
session references. No tool accepts an arbitrary CIDR, hostname, address, port,
credential, URL, shell fragment, or raw protocol request.

## Delivery sequence

### EH-NFO-0 — deterministic contract and fixture

Create:

```text
shared/helix-network-field-observer.ts
connectors/environment/examples/network-field-observer/
fixtures/environment-source/network-field/block-66-site.v1.json
server/services/environment-connectors/conformance/__tests__/network-field-observer.test.ts
docs/runbooks/network-field-observer-field-session.md
```

The fixture includes the Starlink WAN equipment, core router, managed switch,
cellular equipment, UPS and battery bank, partially known generator and ATS,
phone gateway, four ordinary phone endpoints, elevator emergency phone, 66
block, Cat6A records, utility/generator/UPS/rack dependencies, explicit unknowns,
and at least one label-versus-logical-neighbor contradiction.

EH-NFO-0 does not modify the live adapter registry, connector catalog, public
MCP catalog, or Device Check plugin. Device Check continues to report connector
readiness rather than carrying equipment-level site evidence.

### EH-NFO-1 — developer-only live field companion

After NFO-0 passes deterministic conformance, add one bounded live packet:

1. trusted local interface selection;
2. manual site inventory and exact target allowlist;
3. local-host interface observation;
4. selected-interface DNS-SD/mDNS observation;
5. one SNMPv3 standard read driver with a read-only view;
6. one on-demand normalized site snapshot;
7. local credential custody and an opaque profile-owned connection reference;
8. no public MCP publication, background monitoring, or device mutation.

This is the first increment that proves real equipment access. The NFO-0 fixture
proves only that the evidence model is strict, deterministic, and safe.

### EH-NFO-2 — governed profile and MCP read

Promote only after NFO-1 evidence exists. Reuse or generalize the G8 profile
connection broker rather than creating an NFO-specific secret store. Prove exact
profile/site/session/source/epoch identity, outbound pairing without secret
relay, current-turn evidence re-entry, revocation, expiry, wrong-profile and
wrong-site denial, and consistent sanitized status across Account, Device Check,
MCP, API, and applicable room projections.

A live catalog addition must not be described as immediately available to an
already-running Codex task. Until managed catalog re-enumeration is accepted,
the system reports `catalog_refresh_required` or uses an already-advertised
generic capability whose strict schema safely covers the request.

### EH-NFO-3 — finite monitor-only mode

Reuse the profile-scoped semantic MCP monitor rather than building a private
polling or reasoning loop. Emit deduplicated material transitions such as WAN
loss, switch-uplink loss, UPS transfer or low runtime, phone-gateway registration
loss, disappearance of a previously observed critical device, evidence staleness,
and contradiction changes.

Monitoring uses an exact finite lease, monotonic cursor, bounded wait,
deduplication, retention-gap marker, fresh-snapshot recovery, reconnect, expiry,
and revocation. It carries no mutation, answer, terminal, or hidden reasoning
authority. Native wake of a closed third-party Codex task remains unsupported
until the client supplies an admitted continuation transport.

## Deterministic conformance matrix

1. The same fixture produces the same canonical graph hash.
2. Reordered records do not change graph identity or meaning.
3. Stale evidence cannot silently become current.
4. A later observation does not erase a contradiction.
5. Similar hostnames do not merge without stable identity evidence.
6. Prompt-like metadata is rejected or retained only as bounded inert data.
7. Secrets, private endpoints, raw addresses, and raw configuration never enter model-visible output.
8. IP, MAC, DNS, or LLDP adjacency alone cannot prove a physical cable route.
9. Results report zero commands, side effects, and mutations.
10. Every inference names its support references and inference profile.
11. The elevator-phone path preserves every unknown edge.
12. Unsupported features return `unknown`, never a guessed value.
13. Wrong profile, site, session, source, device, or producer epoch fails closed.
14. Lease expiry and revocation prevent later reads.
15. Every observation is explicitly nonterminal and credential-free.
16. Repeated monitor evidence advances at most one cursor position.
17. A retention gap forces a fresh snapshot before a current-state claim.
18. Reconnect cannot duplicate an observation or physical effect.
19. A stale MCP catalog reports `catalog_refresh_required` without pretending discovery succeeded.
20. Unsupported native task wake is a typed client-transport limitation.

## Promotion acceptance journey

The eventual live cross-device acceptance is:

```text
install or start one profile-owned CasimirBot node on the field computer
→ enroll the Network Field Companion without secret relay
→ select one local interface in trusted local UI
→ allowlist exact site and target references
→ connect an authenticated Codex client from another authorized device
→ request one bounded current site snapshot
→ execute one reviewed local read driver
→ normalize and redact the result
→ re-enter the exact observation into the requesting Runtime Codex turn
→ synthesize an evidence-qualified answer
→ disconnect and reconnect without identity or cursor drift
→ revoke the site connection
→ prove subsequent reads and monitor delivery fail closed
```

The artifact must retain the exact profile, MCP client, continuation, run, room
when applicable, site, field session, source, device, producer epoch, capability,
observation, evidence, freshness, redaction, and revocation identities. It must
prove that no private route, credential, raw protocol payload, mutation authority,
or competing terminal writer crossed the boundary.

## Stop and fail criteria

Stop the packet at the first divergence if:

- a credential, private endpoint, raw address, configuration, packet, or serial
  identity enters model context, MCP output, logs, debug export, or artifacts;
- Codex or another remote caller can choose an unregistered interface, address,
  CIDR, port, driver, or device credential;
- a profile, room, site, source, subject, or producer epoch is inferred rather
  than resolved from current server-owned authority;
- a passive endpoint, physical cable, power circuit, emergency-call outcome, or
  compliance state is asserted without declared or measured evidence;
- stale or contradictory evidence is silently rewritten as current agreement;
- a connector observation, monitor event, receipt, UI projection, or role artifact
  becomes an assistant answer or terminal product;
- monitoring creates a private model loop or simulates unsupported closed-task
  wake behavior;
- a read credential reaches any command, configuration, reboot, dialing, test,
  transfer, shutdown, or other mutation path; or
- implementation work claims G8 closure, release readiness, or general device
  support from fixture or single-driver evidence.

## Governing references

- `docs/research/helix-local-first-harness-product-and-field-applicability-v1.md`
- `docs/helix-environment-harness-work-program-v1.md`
- `docs/architecture/casimirbot-environment-harness-product-goal-v1.md`
- `docs/architecture/helix-environment-agent-reasoning-v1.md`
- `docs/architecture/helix-environment-adapter-registry-v1.md`
- `docs/work-packets/eh-g8-installed-profile-connection-broker-v1.md`
- `docs/work-packets/eh-g8-profile-semantic-mcp-monitor-v1.md`
- `connectors/environment/README.md`
- `AGENTS.md`
