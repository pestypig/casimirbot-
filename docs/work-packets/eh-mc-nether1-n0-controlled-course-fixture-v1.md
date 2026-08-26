Program gate: G8 — environment-harness release evaluation; bounded N0 setup lane that cannot advance N1–N4
Workstream: Minecraft Player Embodiment deterministic capability course
Capability or component: EH-MC-NETHER1 N0 controlled-course fixture planner
Lifecycle stage: pre-course provisioning, verification, authority release, and snapshot restoration
Reaction timescale: operator-triggered setup before tick-local Player Embodiment execution
Authority owner: a separately admitted World Authority owns setup only; Player Embodiment owns every course postcondition; the server operator owns snapshot restoration
Current maturity: implemented
Target maturity: deterministically verified
Required evidence: validated credential-free plan input; bounded course region; pre-course snapshot; deterministic plan hash; setup-only authority receipt; read-only fixture verification; released setup authority; independent Player Embodiment course receipts; and snapshot restoration before N1
Explicit non-goals: no authentic-journey item grants, teleportation, portal completion, command-driven Player Embodiment postconditions, World Authority substitution, hidden planner, automatic command execution, or N1–N4 acceptance evidence
Downstream gate unlocked: reproducible N0 furnace, portal-ignition, and portal-transition courses without contaminating legitimate survival evidence

# EH-MC-NETHER1 N0 controlled-course fixture v1

The N0 course needs deterministic starting state, while N1 and later stages
must begin from ordinary survival state and prove every resource, construction,
ignition, and transition through Player Embodiment. The fixture therefore has a
hard authority seam:

1. an operator snapshots a dedicated disposable test world or region;
2. the credential-free planner validates exact server, dimension, player,
   origin, snapshot reference, and the disposable-region acknowledgement;
3. a separately authorized World Authority may submit the emitted setup
   commands and the read-only verification commands;
4. that authority is released before any N0 Player Embodiment course begins;
5. setup receipts are labeled ineligible for N1–N4 acceptance; and
6. the declared server-world snapshot restores both dimensions before N1.

The planner deliberately does not execute commands, handle a credential, call
Helix Ask, admit a Player Embodiment action, or write a terminal answer. It
produces a deterministic SHA-256-bound command plan suitable for the existing
command-authority review and execution boundary. Requiring snapshot restoration
instead of cleanup commands matters because ordinary portal mechanics may
create a Nether-side return portal outside the Overworld course region.

## Inputs and outputs

The request is supplied through stdin as
`helix.minecraft.nether1_n0_course_plan_request.v1`. Player names cannot be
selectors, the dimension must be a resource location, coordinates are bounded,
the snapshot reference is mandatory, and the disposable-region acknowledgement
must be literal `true`.

The output is `helix.minecraft.nether1_n0_course_plan.v1`. It contains:

- the exact fixture, server, dimension, player, origin, and snapshot identity;
- setup commands for an empty bounded platform, furnace, crafting table, unlit
  obsidian frame, controlled inventory, collection item, survival mode, and
  starting position;
- the furnace, portal-ignition, and portal-transition composition templates
  materialized to the admitted course origin, including exact mutation regions;
- read-only block/player verification commands;
- the canonical command category and effect declaration for every setup and
  verification command, with generation failing on an unknown root or a
  non-read-only verification form;
- the required setup-authority release boundary;
- the snapshot restoration obligation before N1–N4;
- explicit evidence-ineligibility and secret-exclusion fields; and
- a deterministic plan hash.

The setup may establish N0 preconditions, but it cannot satisfy a furnace,
ignition, dimension, return-portal, guardian, durable-goal, or terminal-answer
postcondition. Those require later independently admitted and measured Player
Embodiment evidence.

## Implementation evidence — 2026-08-24

The deterministic planner tests prove stable plan hashing, origin-relative
portal composition and mutation-region materialization, selector/snapshot/
acknowledgement rejection, setup-versus-verification risk declarations, unlit
portal setup, and snapshot restoration obligations. The expanded N0 readiness
audit passes 174 checks across 12 contract files. The canonical TypeScript
command-risk suite passes 33 cases, and the Fabric connector classifier's
focused test passes the exact nested setup and verification command roots used
by the sample course.

The planner remains `implemented`, not `deterministically verified`, until one
separately authorized setup produces a hash-bound receipt, read-only fixture
verification succeeds, setup authority is released, and the snapshot restore
is observed. Neither the guest browser session nor the MCP connector was used
to weaken that boundary: the former lacked an owner session and the latter
required OAuth reauthorization.

## Installed owner-surface readiness checkpoint — 2026-08-25

The static readiness audit again passed all 174 checks with
`ready_for_n0=true`. OAuth was repaired independently and the installed external
Codex monitor trace passed its four-scope readiness, bounded observation,
fresh-snapshot, cursor, reconnect, deduplication and revocation checks. Those
results do not grant World Authority.

The signed-in Account-panel browser profile is
`qte-demo-dev@casimirbot.local` and its selected Shared Live Room is
`shared_realtime_room:35926025-da62-4c05-bfe7-1b6846bca7d1`, which has no bound
Minecraft environment. The exact OAuth-owned Minecraft acceptance room is
`shared_realtime_room:1ac9e158-c650-4644-8485-29974d406ef7`. Older Minecraft
chat selection still projected the unrelated `3592...` room, and the
least-scope MCP catalog correctly withheld room enumeration and owner-only
source-management controls.

N0 therefore stops before authority creation or fixture mutation. The next
accepted step is a profile-coherent owner surface that projects the exact
`1ac9...` room and separately records the pre-course snapshot, disposable-region
acknowledgement and bounded World Authority grant. Expanding the MCP client,
using the unrelated local room, or bypassing owner UI would weaken the required
authority seam and is not accepted evidence.

## Auth0 profile-session convergence checkpoint — 2026-08-25

The persisted identity rows confirm that the mismatch was an account seam, not
a room-selector defect. The OAuth principal and exact Minecraft room are owned
by `profile:g2-a1-codex`; the earlier Account-panel profile is a distinct
developer account that owns only the unrelated Robinhood room. No room or MCP
enumeration expansion is accepted as a repair.

The Account panel now exposes a first-party Auth0 web-session entry point. Its
server starts Authorization Code with PKCE, retains the verifier only in the
bounded server process, exchanges and verifies the access token server-side,
resolves an existing explicit `helix_account_linked_providers` row before it may
derive a new profile, and returns only the ordinary HttpOnly Casimir session
cookie. The browser, room, model and MCP response receive no bearer, client
secret or provider subject. An adversarial return target is reduced to the
fixed Account-panel path and callback state is single-use.

Focused identity, callback, replay and UI tests pass (32 checks), and the
compiled-client production build passes. Live owner-surface promotion remains
unclaimed until the exact loopback callback
`http://127.0.0.1:1522/api/auth/auth0/callback` is registered on the first-party
`CasimirBot Desktop Account Link` public client and one real login proves that
the resulting Account/Shared Room projection is `profile:g2-a1-codex` /
`shared_realtime_room:1ac9e158-c650-4644-8485-29974d406ef7`. N0 still performs
no snapshot, World Authority grant or fixture mutation before that proof.
