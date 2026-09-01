```text
Program gate: G8 — environment-harness release evaluation
Workstream: Parallel desktop presentation and navigation lane; this design does not perturb an open G8 release prerequisite.
Capability or component: Casimir Guide overlay menu for the installed EXE and web workstation
Lifecycle stage: presentation
Reaction timescale: none — the Guide renders governed state and dispatches admitted navigation; it is not a controller.
Authority owner: Existing Helix account, room, workstation, execution-arbiter, and terminal-authority contracts
Current maturity: implemented for the base overlay/navigation shell and Friends & Parties Live Room projection; deeper non-social blade content remains specified
Target maturity: deterministically verified for the accessible Guide shell and every supported governed projection
Required evidence: Reviewed interaction contract, account-policy mapping, room/media and social-party contract mapping, accessible prototype, focused UI tests, and documentation audit
Explicit non-goals: New execution authority, a second panel system, a private agent loop, an overlay-owned social or media runtime, raw credential display, or a G8 release-ready claim
Downstream gate unlocked: A bounded Casimir Guide UI implementation packet; no environment-harness gate is closed by this document.
```

# Casimir Guide Menu v1

Status: design specification with an implemented base overlay and social/party
projection. Focused tests are implementation evidence only; this document does
not claim physical cross-device live acceptance, integrated acceptance, or
release readiness.

## Purpose

The Casimir Guide is a compact, controller-friendly overlay that can be opened
without leaving the user's current CasimirBot context. It provides an
alternative route into the workstation, Shared Live Room, mission, source, and
system surfaces while preserving the existing panel registry and authority
boundaries.

The intended interaction is inspired by the Xbox 360 New Xbox Experience
Guide: the screen dims, a small centered element expands into a blade-style
menu, adjacent categories remain visible at the edges, and a persistent action
legend explains the available controls.

The Guide is not a miniature copy of the entire workstation. It organizes
high-frequency user intents and points into the full panels when a workflow
needs more space, detail, consent, or authority.

## Governing contracts

This design is subordinate to:

- `docs/helix-environment-harness-work-program-v1.md` for the active gate,
  dependency order, maturity, and required evidence;
- `docs/architecture/casimirbot-environment-harness-product-goal-v1.md` for the
  installed-node and Shared Live Room product boundary;
- `docs/architecture/helix-environment-agent-reasoning-v1.md` for Codex, Helix,
  resident-controller, interruption, and presentation authority;
- `docs/architecture/helix-minecraft-dual-plane-adapter-v1.md` for the
  independently governed World Authority, Player Embodiment, and companion
  actor boundaries;
- `docs/architecture/helix-minecraft-companion-embodiment-v1.md` for companion
  identity, lifecycle, observation origin, release, and EH-RCC3 semantics;
- `docs/work-packets/eh-mc-companion-survival-party-v1.md` for the active
  companion research/acceptance ladder and its explicit stop boundaries;
- `shared/helix-account-session.ts` for developer and user account policy;
- `shared/helix-shared-realtime-room.ts` and
  `shared/helix-shared-realtime-room-media.ts` for room membership, participant
  consent, speaker-floor, GPT Live topology, and browser-to-browser signaling;
- `server/services/helix-ask/realtime-room/README.md` for the implemented
  two-account, one-model media boundary and its deployment limitations;
- `docs/work-packets/eh-g8-shared-live-room-mcp-configuration-v1.md` for
  Shared Live Room discovery, consent, floor, runtime, and media ownership;
- `docs/work-packets/eh-g8-shared-room-multi-host-capability-federation-v1.md`
  for same-device dual-EXE evidence and the deferred physical second-device
  boundary;
- `docs/architecture/mission-go-board-spec.md` for mission state, evidence,
  certainty, replay, and operator-action semantics; and
- `docs/architecture/voice-service-contract.md` for text/voice certainty parity
  and presentation-only voice behavior.

If this document conflicts with one of those contracts, the governing contract
wins.

## Reference findings

### Best interaction reference: the NXE Guide

The NXE Guide is the best reference for this surface because it provides:

- an overlay that is available without abandoning the current application;
- visible neighboring blades that make the menu's hierarchy legible;
- a narrow central list with predictable vertical movement;
- compact status information in the header; and
- a persistent button legend that supports controller use without training.

The broader Xbox dashboard history also shows why the Guide should stay
compact. The full dashboard can support deeper discovery, while the overlay is
most effective as a shortcut and status surface.

Reference:

- [Architecture of Consoles — Xbox 360 interface history](https://github.com/flipacholas/Architecture-of-consoles/blob/master/articles/xbox-360.Rmd.md)

### Best open-source behavioral reference: DashX360

DashX360 is the closest contemporary open-source reference. It implements a
controller-first dashboard and Guide overlay with keyboard support, friends,
party, profile, media, achievements, and search. Its WPF/XAML implementation is
not a direct architectural base for CasimirBot's React workstation, but its
input model, navigation consistency, overlay persistence, and transition feel
are useful behavioral references.

Reference:

- [DashX360 repository](https://github.com/ZivvoZ/dashx360)
- [DashX360 GuideWindow XAML](https://github.com/ZivvoZ/dashx360/blob/main/views/GuideWindow.xaml)

### Secondary references

Aurora and Freestyle Dash are stronger references for full-screen libraries,
content discovery, scanning, skins, and plugin-oriented customization. XeXMenu
is a useful reference for a deliberately simple all-items launcher. None is as
close to the desired contextual overlay behavior as the NXE Guide or
DashX360.

Reference:

- [ConsoleMods Xbox 360 dashboards overview](https://consolemods.org/wiki/Xbox_360:Dashboards_Overview)

## Product principles

1. **Tasks before panels.** The first level names user intents such as resuming
   work, checking a room, or viewing mission status. Panel names appear only
   where they clarify the destination.
2. **Context before catalog.** The central blade reflects the active panel,
   room, mission, source, and run when those facts are available.
3. **Progressive disclosure.** The Guide handles short, safe interactions and
   opens the full workstation surface for advanced configuration or governed
   actions.
4. **One navigation system.** Guide destinations use the existing panel
   registry, layout store, account policy, and room surfaces. The Guide does not
   maintain a competing panel catalog or window state.
5. **No authority promotion.** Visibility is not permission. A Guide row cannot
   grant consent, widen a capability, acquire mutation authority, or turn a
   receipt into an answer.
6. **Controller, keyboard, mouse, and touch parity.** Hover may enhance the
   presentation but can never be required to discover or operate a control.
7. **Honest state.** Unknown, stale, locked, degraded, and unavailable states
   remain visible and typed. Animation and color cannot imply readiness or
   success that the underlying contract does not support.
8. **Developer remains the superset.** The Guide must preserve all existing
   developer panel access while applying the user account policy to the public
   surface.
9. **Hierarchy before control.** Environment controls are displayed beneath
   their exact environment, embodiment, actor/incarnation, controller profile,
   lease, and capability binding. The Guide must not flatten these identities
   into a generic `AI companion` switch.
10. **Relationship is not authority.** A remembered profile, accepted friend,
    party invitation, room membership, and environment capability are separate
    grants. None implies another.
11. **Human voice works without the model.** A voice party is a human media
    session. GPT Live may be explicitly attached to it, but party audio must not
    depend on a provider session and microphone-to-room consent must not imply
    microphone-to-model consent.

## Information architecture

The Guide contains six top-level blades:

| Blade | Primary question | Scope |
| --- | --- | --- |
| Workspace | Where was I, and where can I go? | Resume, recent panels, favorites, search, and the full panel launcher |
| Mission | What is happening and what needs attention? | Current objective, phase, risk, latest supported result, actions, timeline, and replay links |
| Casimir Guide | What should I do next from this context? | Contextual default actions, room summary, notifications, Ask Helix, and return to work |
| Live Room | Who can I connect with, and who or what is connected here? | Friends, invitations, voice party, room, participants, GPT Live attachment, shared sources, results, and full social/room controls |
| Environment | What environment and embodied actors are bound, active, or blocked? | Environment, embodiment, companion presence, resident mode, leases, evidence, release, and full environment controls |
| System | Is my installed node and account ready? | Device Check, Local Harness, account/session, connections/security, updates, and preferences |

The ordering keeps navigation and mission awareness to the left of the default
blade, and collaboration, embodied environment state, and installed-node health
to the right. The shell may show five blades at once and reveal the sixth through
the same horizontal blade motion; it must not shrink labels below the accessible
target size merely to display every blade simultaneously.

## Default composition

```text
┌─────────┬─────────┬────────────────────────┬─────────┬────────────┬────────┐
│Workspace│ Mission │     Casimir Guide      │Live Room│Environment │ System │
│         │         ├────────────────────────┤         │            │        │
│         │         │ Resume: Live Answer  > │         │            │        │
│         │         │ Ask Helix            > │         │            │        │
│         │         │ Party       2 members > │         │            │        │
│         │         │ Minecraft   1 actor   > │         │            │        │
│         │         │ Open Main Menu       > │         │            │        │
│         │         │ Return to Workstation  │         │            │        │
└─────────┴─────────┴────────────────────────┴─────────┴────────────┴────────┘
  A Select       B Close       X Search       Y Main Menu
```

The final visual language should use CasimirBot typography, colors, icons, and
status semantics. It should inherit the clarity and spatial model of the
reference without copying Xbox branding or assets.

## Blade contracts

### Workspace

The Workspace blade is the alternative entrance to the existing panel system.
It does not replace the panel registry.

Recommended initial rows:

1. **Resume `<active panel>`** — closes the Guide and restores focus.
2. **Recent panels** — opens a short nested list sourced from real workstation
   history.
3. **Favorites** — opens user-pinned panel destinations when favorites exist.
4. **Search panels** — searches only panels discoverable under the active
   account policy.
5. **Open Main Menu** — opens the existing complete launcher.

The nested recent and favorite lists should show no more than five rows before
scrolling. They must preserve the panel title localization already used by the
workstation.

### Mission

The Mission blade projects supported mission state. It must not synthesize a
mission from unrelated panel text or infer completion from an execution
receipt.

Recommended initial rows:

1. **Current objective** — a one-line supported mission title or `No active
   mission`.
2. **Phase and status** — one of the canonical Mission Go Board phases and a
   freshness indicator when a board is bound.
3. **Attention** — the highest-priority unresolved risk or action, with its
   certainty class preserved.
4. **Latest result** — only a terminal-eligible supported result; otherwise an
   explicit pending, failed, stale, or unavailable state.
5. **Open mission board** — opens the applicable full mission surface when that
   surface exists and is allowed.
6. **Team and assignments** — when a canonical team mission exists, shows
   `team_id`, mission/objective, companion role/assignment, dependency, and
   resource-reservation summaries without turning an assignment into execution
   authority.
7. **Task History** — opens `agi-task-history` when permitted.
8. **Process Graph** — opens `workstation-process-graph` when permitted.

This blade is read-mostly in v1. Acknowledgments, action selection, mission
phase changes, cancellation, or Emergency Stop require the exact governing
control and must not be simulated as local Guide state.

Noble Team-style coordination remains one Runtime Codex semantic plan with one
Helix authority/arbitration path, not one planner per companion. Dottie or
mission-overwatch projections may surface salience, acknowledgments, evidence,
and debriefs, but the Guide must never present them as tactical assignment,
execution, or answer authority.

### Casimir Guide

This is the initial blade on open. Its rows are ranked from the current
workstation context, not permanently hardcoded.

Baseline rows:

1. **Resume `<active context>`**.
2. **Ask Helix** — focuses the existing composer with no fabricated prompt.
3. **Live Room summary** — shows the active party/room, online friend or member
   count, and honest unavailable/locked state.
4. **Environment summary** — shows the bound environment, admitted source
   freshness, and embodied actor count without exposing raw credentials,
   unadmitted private content, or action authority.
5. **Open Main Menu**.
6. **Return to Workstation**.

Contextual rows may be inserted when their source contract exists. Examples:

- a document context may offer `Ask about this`, `Workstation Notes`, and
  `Image Lens`;
- an environment context may offer `Device Check`, `Live Answer`, and the
  bound room summary; and
- a calculator context may offer the latest visible result and
  `Scientific Calculator`.

Contextual rows are navigation or local configuration only unless they pass
through an existing governed action contract.

### Live Room

The Live Room blade is the compact social and collaboration entry point. It
shows remembered people, invitations, human voice-party state, Shared Live Room
state, and optional GPT Live attachment without treating them as one authority:

```text
Live Room
──────────────
Friends online                      3 >
Voice party                 2 members >
Microphone                       Muted
GPT Live                    Not attached
Shared room                Nether Course >
Invitations                          1 >
Friends & parties                    >
```

Recommended behavior:

- **Friends online** opens the friends list at its online section. It reports
  only presence the viewer is permitted to see.
- **Voice party** opens the active party or the party invitation flow. In v1,
  the design target is a two-person party so it can reuse the proven room media
  shape without claiming group-call scalability.
- **Microphone** reports the actual human-to-human media state. `Live` must
  never be inferred from a requested state alone; mute, deafen, connecting,
  reconnecting, relayed, stopped, and failed remain distinct.
- **GPT Live** reports whether the model is detached, being invited, connected,
  listening under explicit consent, speaking, or degraded. Attaching GPT is a
  separate governed action, not a side effect of joining the party.
- **Shared room** opens room selection or setup only through the existing Shared
  Live Room flow. A party may exist without a shared room and a shared room may
  exist without an active voice party.
- **Invitations** distinguishes friend requests, party invites, and room invites
  rather than presenting a single ambiguous acceptance action.
- **Shared sources** opens the existing source-binding surface, respecting
  ownership and account policy.
- **Public results** opens results that are already eligible for the member.
- **Friends & parties** opens the developer social surface for discovery,
  requests, blocks, invitations, device selection, party controls, and advanced
  connection diagnostics. Guide rows are navigation and status projections;
  the full panel and server still own every mutation.
- **Room controls**, when reached from a selected room, still opens the existing
  Shared Live Room dialog for consent, bindings, runtime details, and advanced
  controls.

Room membership never grants access to a host credential, private source,
environment action, Player Embodiment, World Authority, or workstation
capability.

When an environment or companion is shared into the room, the Room blade shows
only the room's narrowed reference and the participant's own role. It must not
union the owner's profile connection with room permissions. Companion owner,
beneficiary, target, observer, floor holder, and mutation-authorized participant
remain distinct identities.

#### Social identity and friendship

The installed EXE already has the foundation for remembered identity:
`HelixAccountSessionProfile.profile_id` is durable account identity, and the
desktop active-account session can bind an installed node to that profile.
Shared Live Room memberships and invitations are also persisted in the server
repository. They must not be promoted into a friendship model, however.

Friendship now uses a separately governed durable social graph. Its projection
distinguishes `incoming`, `outgoing`, `accepted`, and `blocked_by_self`; removal
deletes the relationship projection, while block takes precedence over
discovery, presence, invitations, and reconnection. A user-facing handle or
invite code resolves to a server-authenticated `profile_id`; clients cannot
choose or assert another profile's identity.

The implemented contracts are:

- `helix.social_profile.v1` — public/discoverable handle, display name,
  avatar projection, and discovery policy;
- `helix.friendship.v1` — requester, recipient, state, timestamps, and privacy
  enforcement; and
- `helix.social_presence.v1` — coarse online, away, in-party, and offline state
  with freshness and viewer eligibility.

Friend discovery should be opt-in and initially use an exact handle, signed
invite link/code, or QR exchange. Address-book upload, ambient nearby discovery,
and exposure of account email addresses are outside this design.

#### Voice party and GPT Live attachment

A voice party is an ephemeral human-to-human session with a durable audit-safe
identity. Its lifecycle should remain explicit:

```text
created -> inviting -> connecting -> active
                         |             |
                         v             v
                      degraded -> reconnecting
                         |             |
                         +-------> ended
```

The party contract should carry party ID, member profile IDs, invitation and
membership state, connection state, mute/deafen state, active-speaker
projection, and media diagnostics safe for users. Raw audio is not persisted by
default. Party membership does not grant room membership, source access,
environment authority, or model consent.

The Shared Live Room implementation supplied the reusable media components.
The Friends & Parties foundation now provides an independent party lifecycle,
party-scoped bounded signaling, and a provider-detached WebRTC controller so
the humans can talk before, after, or without GPT.

GPT Live is an optional attachment to an active party. Each member's existing
`microphone_to_room` and `microphone_to_model` consent remains independent. A
member may talk to the other person while withholding their microphone from the
model. Model audio, transcript sharing, screen input, and room thumbnails retain
their own explicit consents. Adding the model must never silently enable
transcription, recording, or source sharing.

The implemented party contracts are:

- `helix.voice_party.v1` — party lifecycle, owner, capacity, and optional room
  and GPT attachment references; and
- `helix.voice_party_member.v1` — member lifecycle, media state, consent
  references, and safe connection diagnostics.

Their governing implementation packet is
`docs/work-packets/eh-g8-friends-voice-party-foundation-v1.md`. The Guide
consumes their projections; it does not own the friend store, presence service,
signaling mailbox, WebRTC peer, audio mixer, or GPT session.

#### Domain and media topology

The production feature should use the CasimirBot domain as a control plane:

```text
installed EXE A                       installed EXE B
       |                                     |
       +---- authenticated HTTPS / WSS ------+
                         |
                  CasimirBot domain
          accounts, friends, presence, invites,
          party membership, signaling, TURN grants

installed EXE A <---- WebRTC direct or TURN relay ----> installed EXE B
       |
       +---- optional host-owned GPT Live provider peer
```

The domain does not need to carry the audio payload when a direct WebRTC path
succeeds. It is needed for authenticated discovery, durable social state,
online-presence heartbeats, invitation delivery, party coordination, signaling,
and issuance of short-lived relay credentials. Installed clients reach that
control plane through scoped native account proof and an Electron-main-process
broker. The broker retains the domain session only in memory, binds it to the
exact local profile/session, and allowlists only Friends & Parties routes. This
trust path is deterministically verified; live domain/Auth0 deployment and
physical two-device acceptance remain open.

Both EXEs being online does not guarantee direct peer reachability. The current
default STUN-only configuration therefore needs a production TURN service for
restrictive or symmetric NATs. TURN may use a dedicated domain such as
`turn.casimirbot.com`; credentials must be short-lived and must never enter the
Guide, model context, transcript, normal debug export, or durable client state.
A future party size above two or requirements such as server-side moderation,
recording, or quality routing would trigger a separate SFU evaluation; those are
not v1 assumptions.

#### Current maturity boundary

The Guide must label these capabilities according to what actually exists:

- stable account profile identity and durable two-member room, membership,
  invite, and consent records: implemented;
- two-browser human audio plus a single host-owned GPT Live peer: implemented in
  the current client/runtime boundary, but not evidence of production
  cross-network or physical dual-EXE acceptance;
- same-device dual-EXE federation: active/preflight evidence only under the
  multi-host work packet;
- the authenticated EXE-to-domain Friends & Parties coordination path and
  shared-service signaling semantics: deterministically verified, but not yet
  live accepted against the production Auth0/domain deployment;
- physical second-device acceptance, production TURN allocation, real RTP, and
  restrictive-network recovery: deferred or not yet evidenced;
- durable friendship, privacy-aware friend presence, independent voice-party
  lifecycle, the developer Friends & Parties interface, and the Guide Live Room
  projection: deterministically verified under the dedicated work packet;
  physical-device and production-network acceptance remain open.

### Environment

The Environment blade is the Guide's compact projection of the environment
harness. It provides status and safe entry points without becoming a new
connector, resident controller, or execution arbiter.

Recommended root rows:

1. **Environment** — selected environment, world/session identity, connector
   epoch, and source freshness.
2. **Embodiments** — independently lists `player_proxy` and
   `companion_entity` actors that the current principal may observe.
3. **Companion** — selected durable companion, current actor incarnation, and
   presence state.
4. **Resident mode** — exact controller profile and current admitted mode, or
   an honest planned/not-exposed/unavailable state.
5. **Authority and safety** — actor/effect lease status, expiry, manual
   override, and Emergency Stop/release availability from the governing
   control surface.
6. **Evidence and activity** — latest observation origin, revision, receipt,
   cleanup state, blocker, or typed abstention.
7. **Environment controls** — opens the full applicable environment panel.
8. **Device Check** — opens `device-check` for connection and freshness detail.

The Environment blade follows this navigation hierarchy:

```text
environment and world/session binding
  -> embodiment kind
    -> durable companion or selected player identity
      -> current actor entity and incarnation
        -> resident controller profile and artifact
          -> presence state and fresh observation revision
            -> finite actor/effect leases and admitted repertoire
              -> current mode, proposal, effect, or abstention
                -> measured postcondition, cleanup, and evidence references
```

Skipping a level is prohibited when it would obscure which actor, incarnation,
lease, observation, or authority a control applies to.

#### Companion presence projection

The companion detail may project the canonical presence states:

```text
registered -> spawned -> bound -> admitted -> active
                                      |         |
                                      v         v
                                  suspended -> releasing -> released -> despawned

Any pre-release state may become invalidated when identity, integrity, or
authority cannot be repaired in place.
```

The display must preserve these distinctions:

- `registered` is durable identity without a controllable Minecraft body;
- `spawned` is observed presence, not a bound or authorized actor;
- `bound` permits capability discovery, not action;
- `admitted` has finite leases but is not yet active;
- only `active` may assert the profile's admitted controls;
- `suspended` may hold or release safely but may not start a new effect;
- `released`, `despawned`, and `invalidated` require complete cleanup evidence
  and cannot retain controls; and
- death, respawn, replacement, restart, or reconstruction rotates
  `actor_incarnation_id`; stale observations, proposals, and leases must not be
  projected as controls for the new body.

The compact row should show a human-readable label, while a detail view may
show the exact identity and revision needed for operator trust.

#### `resident.minecraft.companion-follow.v1`

The first planned EH-RCC3 controller profile is
`resident.minecraft.companion-follow.v1`. Its bounded repertoire is:

- observe;
- follow one explicitly admitted target;
- hold position;
- look at one explicitly admitted target;
- navigate to one nearby admitted waypoint;
- return to the bound owner or beneficiary;
- release navigation and presentation resources; and
- abstain with a typed reason and request semantic replanning.

The Guide may render those controls only when the authoritative capability
declaration exposes them, execution is enabled, the exact actor/incarnation and
target are bound, observations are fresh, finite leases are current, and the
current account/room principal is admitted. Chat text, proximity, display name,
the nearest player, room membership, or a previous incarnation cannot select
the target or grant authority.

`Follow` represents one admitted resident semantic mode, not repeated
model-authored movement commands. The row may display target, start/stop
distance band, maximum radius, expiry, and current blocker, but the local
controller owns tick-rate navigation and hysteresis. The Guide does not poll or
steer each movement tick.

Combat, mining, crafting, container access, inventory transfer, item custody,
teleportation, summoning, commands, and broader World Authority are absent from
this profile. They must not appear as disabled `coming soon` actions under the
follow profile because that presentation would imply the wrong authority
family. Later accepted profiles receive separate capability rows and detail.

#### Current maturity boundary

The companion-survival packet records private C0 A0/A1/B identity-and-presence
evidence and an explicit stop before C1/EH-RCC3. The canonical work program
still classifies the optional companion-entity embodiment as `projected`, and
the current schemas mark the companion action surface as not publicly exposed
and not execution-enabled.

Therefore the v1 Guide specification may:

- reserve the hierarchy, labels, presence-state renderer, evidence detail, and
  locked/planned presentations;
- expose private developer evidence only through its already governed
  developer route; and
- show that follow/hold is planned or unavailable with the exact maturity or
  admission reason.

It may not advertise, enable, or simulate public follow/hold controls until the
work program and EH-RCC3 evidence permit that exact capability to advance.

#### Evidence origins and one-actor boundary

Companion-local, player-proxy, server-authoritative, and room-projected
observations must retain visible origin labels and exact source references.
The Guide must not silently substitute one viewpoint for another.

For a server-native companion, the visible companion remains canonical for its
location, health, equipment, inventory, XP, damage, death, and persistence. A
bounded player-semantics backend is implementation detail and cannot appear as
a second actor, inventory, health pool, pickup owner, or authority in the Guide.
The user-facing rule is one visible actor and one economy.

### System

The System blade offers stable entry points into installed-node and account
health:

1. **Device Check** — `device-check`.
2. **Local Harness** — `local-harness`.
3. **Account & Sessions** — `account-session`.
4. **Connections, Billing & Security** —
   `connections-billing-security` when permitted.
5. **Desktop Updates** — `desktop-updates`.
6. **Guide preferences** — local appearance, input, audio cue, and reduced
   motion settings only.
7. **Open full settings** — the existing settings surface.

Readiness must remain component-specific. A healthy local service cannot be
presented as proof that a provider, MCP client, room, connector, environment,
or mutation path is ready.

## Interaction model

### Open and close

The Guide should open from:

- a dedicated Casimir Guide button in the desktop taskbar;
- `Ctrl+Shift+G` as the initial keyboard shortcut;
- a native controller Guide-button binding when the installed host exposes a
  reliable binding; and
- a future touch affordance that does not cover primary mobile navigation.

The same Guide command toggles the overlay. `Escape` or controller `B` closes
the top nested level; at the root it closes the Guide. Closing restores focus
to the exact element that had focus before opening whenever that element still
exists.

### Directional navigation

- Left/right changes blades.
- Up/down changes rows.
- `A` or `Enter` selects the focused row.
- `B` or `Escape` goes back or closes.
- `X` opens search when search is available in the current context.
- `Y` opens the full Main Menu.
- Pointer click selects a row.
- Pointer hover may move visual emphasis but must not execute or be required.

Button prompts are contextual. A prompt must disappear or change when its
action is unavailable; disabled prompts must not advertise actions that cannot
be performed.

### Nested depth

The Guide should support at most two nested levels below a blade in v1. Deeper
workflows open their full panel or dialog. This preserves the Guide's role as a
quick overlay and prevents it from becoming a second workstation.

## Motion and visual behavior

### Opening sequence

1. The underlying application dims toward approximately 70 percent black with
   a slight blur.
2. A compact Casimir mark and `Casimir Guide` label appear at screen center.
3. The compact element expands into the central blade over approximately
   180–220 ms using a restrained ease-out curve.
4. Adjacent blades slide outward and expose their vertical labels.
5. Focus lands on the first useful enabled row, normally `Resume`.

Closing reverses the spatial sequence without replaying unnecessary status
animations.

### Recommended desktop geometry

- Width: `clamp(560px, 52vw, 760px)`.
- Height: `clamp(360px, 50vh, 520px)`.
- Row height: 44–48 px.
- Five primary rows visible before scrolling.
- Outer blades remain partially visible even when inactive.
- Header contains the Casimir identity, current account/room status, and local
  time only when each value is available from an admitted source.
- Footer contains the current action legend.

Casimir cyan may identify navigation and focus. Fuchsia may identify Live Room
context. Amber and rose remain reserved for warning, degraded, blocked, and
critical states. Color alone cannot communicate state.

### Reduced motion

When reduced motion is enabled, replace scale and slide transitions with a
short opacity transition. Focus order, backdrop semantics, and state changes
must remain identical.

## State and authority model

Every row must have a typed presentation state:

| State | Meaning | Presentation |
| --- | --- | --- |
| `available` | The destination or local action is admitted | Normal selectable row |
| `locked` | Discoverable but outside the current account/capability policy | Lock icon, reason, no bypass |
| `unavailable` | The feature exists but required state is absent | Disabled row with stable explanation |
| `degraded` | The surface is usable with a known limitation | Warning indicator and concise blocker |
| `stale` | The last known observation exceeds its freshness contract | Age and refresh/open-detail action |
| `pending` | An authoritative request has not completed | Progress state without success wording |
| `failed` | The authoritative request failed | Stable fail reason and admitted recovery route |
| `planned` | The work program specifies or reserves the capability but the current maturity/admission does not expose it | Non-actionable roadmap label with canonical boundary |
| `read_only` | Exact evidence is visible but grants no execution or mutation authority | Evidence row with origin and no action affordance |

The Guide may dispatch:

- local overlay navigation;
- focus restoration;
- panel open/focus through the existing workstation store;
- opening an existing dialog or settings surface; and
- a governed action only through the action's existing contract.

The Guide may not:

- edit account policy;
- reinterpret `locked` as `available`;
- infer consent or room ownership;
- infer companion ownership, beneficiary, target, actor incarnation, or
  observation origin;
- acquire or manufacture an authority lease;
- retry a mutation outside its governing lifecycle;
- project a receipt, classifier result, or live-card summary as an answer;
- speak with certainty stronger than the corresponding text state; or
- claim readiness from the overlay's own successful render.

## Account policy behavior

The Guide must resolve destinations through the same account policy as the
workstation:

- Developer accounts retain the superset of current panels, controls, and
  experimental features.
- User and unauthenticated sessions see the public launch policy plus any
  deliberately discoverable locked entries.
- A hidden panel remains absent.
- A locked panel remains non-launchable and includes the policy reason where it
  is safe to display.
- Server-side tool and action enforcement remains the access boundary.

Guide preferences must not become a separate account mode or a second panel
allowlist.

## Accessibility requirements

- Render the Guide as a modal dialog with a labeled title and description.
- Trap focus while open and restore prior focus on close.
- Give every blade and row an accessible name independent of iconography.
- Announce blade changes and material live-state changes without narrating every
  directional move.
- Maintain a visible focus ring at controller and keyboard distances.
- Meet WCAG AA text and non-text contrast targets.
- Support 200 percent zoom without losing the current row or action legend.
- Preserve full operation without hover, sound, animation, or color.
- Ensure live audio and microphone labels distinguish requested, connected,
  sending, receiving, muted, stopped, and failed states when the underlying
  contract exposes them.

## Proposed implementation seams

The first implementation should reuse these existing surfaces:

- `client/src/lib/desktop/panelRegistry.ts` for panel definitions;
- `client/src/store/useWorkstationLayoutStore.ts` for panel open and focus;
- `client/src/components/workstation/WorkstationPanelTabs.tsx` for existing
  panel-picker and policy behavior;
- `client/src/components/desktop/DesktopTaskbar.tsx` for the Guide launch
  affordance;
- `shared/helix-account-session.ts` and
  `client/src/lib/workstation/launchPanelPolicy.ts` for account access;
- `client/src/components/helix/ask-console/shared-live-room/SharedLiveRoomDialog.tsx`
  and its controller for full room workflows; and
- `shared/helix-shared-realtime-room.ts` and
  `shared/helix-shared-realtime-room-media.ts` for existing room consent,
  topology, floor, and WebRTC signaling types;
- `apps/desktop/src/active-account-session.ts` for the installed EXE's active,
  server-authenticated profile binding;
- `shared/helix-resident-controller.ts`,
  `shared/helix-minecraft-companion-presence.ts`,
  `shared/helix-minecraft-companion.ts`, and
  `shared/helix-minecraft-companion-mcp.ts` for typed companion identity,
  presence, action, cleanup, evidence, and exposure boundaries; and
- the existing workstation action dispatch path for any future governed action.

Suggested new UI modules:

```text
client/src/components/workstation/guide/
  CasimirGuideOverlay.tsx
  CasimirGuideShell.tsx
  CasimirGuideBlade.tsx
  CasimirGuideRow.tsx
  CasimirGuideActionLegend.tsx
  CasimirGuideContext.ts
  CasimirGuideSocialProjection.ts
  CasimirGuideEnvironmentProjection.ts
  CasimirGuidePolicy.ts
  useCasimirGuideController.ts
```

The controller should own only overlay state: open/closed, active blade,
focused row, nested depth, prior focus, and presentation preferences. It should
derive external state from existing stores and controllers rather than copying
room, friend, presence, party, media, mission, source, account, or runtime
authority into a new store.

## Delivery slices

### Slice 1 — shell and navigation

- Add the taskbar Guide button and keyboard shortcut.
- Implement the backdrop, expansion, six blades, focus trap, action legend,
  reduced motion, and focus restoration.
- Populate Casimir Guide, Workspace, and System with existing panel routes.
- Apply current account policy to every destination.

### Slice 2 — contextual projection

- Add active panel, recent panels, and safe contextual shortcuts.
- Add typed available, locked, unavailable, degraded, stale, pending, and
  failed row presentations.
- Add localized labels and search.

### Slice 3 — Live Room projection

- Project selected room, participants, floor, microphone, GPT attachment,
  sources, and public results from the existing room controller.
- Route advanced workflows into the full Shared Live Room dialog.
- Verify that Guide state does not grant room, source, floor, or environment
  authority.

### Slice 4 — social and voice-party foundation

- Implemented and deterministically verified under
  `docs/work-packets/eh-g8-friends-voice-party-foundation-v1.md`: shared
  contracts, durable state, authenticated social/party APIs, privacy-aware
  presence, party-scoped signaling, provider-detached human media, optional
  server-projected GPT attachment, the full developer panel, and Guide status
  navigation.
- F5.0–F5.3 are implemented under
  `docs/work-packets/eh-g8-friends-voice-party-f5-deployment-acceptance-v1.md`:
  authenticated database-backed signaling, typed cursor recovery, short-lived
  TURN credentials outside model/debug state, and honest direct/relay
  projection. The Guide continues to receive only safe party status and links.
- Keep installed two-EXE media, real restrictive-NAT TURN allocation, and
  physical cross-device acceptance as the explicit F5.4 boundary; do not infer
  them from same-process ingress or mocked candidate-pair tests. The EXE-local
  loopback service/database also requires a separately authenticated domain
  coordination path before Friends & Parties can span installed nodes; the
  Guide must show that boundary as unavailable rather than implying that a
  node-local party is globally reachable.

### Slice 5 — Environment and companion projection

- Add the environment → embodiment → actor/incarnation → controller profile →
  presence/lease → mode/evidence hierarchy.
- Render exact presence states, observation origins, freshness, cleanup, and
  planned/read-only/actionable distinctions from typed contracts.
- Keep `resident.minecraft.companion-follow.v1` non-actionable until its
  authoritative declaration and EH-RCC3 maturity permit execution.
- Route all admitted controls through the existing environment capability and
  arbiter path; do not add local Guide execution state.

### Slice 6 — Mission projection

- Bind a real mission identifier and supported Mission Go Board projection.
- Preserve phase, certainty, evidence, freshness, fail reason, and replay links.
- Add action and acknowledgment controls only through their canonical API and
  only in a separately reviewed implementation packet.

### Slice 7 — native controller integration

- Bind the installed EXE's reliable controller Guide-button event.
- Verify keyboard, controller, mouse, and touch parity.
- Confirm no collision with the operating system, Steam, or accessibility
  shortcuts on the supported installed surface.

## Acceptance criteria

The design target is satisfied when this document is reviewed and the
environment-harness documentation audit passes. A later implementation may be
called `deterministically verified` only when focused evidence demonstrates:

1. The Guide opens and closes from every supported input without losing the
   prior workstation context.
2. Focus order, focus trap, back behavior, nested depth, and restoration are
   deterministic.
3. Every panel destination uses the existing registry and workstation store.
4. Developer and user account fixtures produce the expected available, locked,
   and hidden destinations.
5. A Guide row cannot bypass a server-side panel, tool, room, source, or action
   policy.
6. Live Room summaries match the existing controller and expose no credential
   or ungranted private source.
7. Friend identity survives an authenticated EXE restart without exposing an
   email address or allowing a client to assert another profile ID; removal and
   blocking have deterministic precedence over presence and invitations.
8. A two-person voice party can connect, mute, deafen, disconnect, and recover
   without starting GPT Live; direct and TURN-relayed test paths report honest
   connection state.
9. GPT Live can be explicitly attached to and detached from an active party,
   and no participant audio reaches the model without that participant's
   independent `microphone_to_model` consent.
10. Friend acceptance, party membership, room membership, microphone-to-room,
    microphone-to-model, transcript sharing, source access, and environment
    authority remain independent in server-enforced tests.
11. Physical dual-EXE acceptance covers invitation delivery, presence
    freshness, reconnect, sign-out, process loss, and expired TURN credentials
    before the feature is described as production-ready.
12. Mission summaries preserve canonical phase, evidence, certainty, freshness,
   terminal eligibility, and fail reasons.
13. Environment summaries preserve environment, embodiment, actor/incarnation,
   controller profile, presence, observation origin, lease, capability, and
   evidence identities without inference.
14. Projected or non-exposed companion controls remain non-actionable, including
   `resident.minecraft.companion-follow.v1` before EH-RCC3 promotion.
15. Active companion controls, when separately admitted in the future, stop or
     release through the governing arbiter, rotate safely on incarnation change,
     and never imply Player Embodiment or World Authority.
16. Pending and receipt states are never labeled as completed answers or heard
   audio.
17. Reduced motion, 200 percent zoom, keyboard-only, controller-only, and
   screen-reader journeys remain usable.
18. Closing the Guide releases its event listeners and leaves no duplicate
     global shortcut or gamepad polling loop.

Casimir verification is not required for this presentation-only design or its
ordinary UI implementation. It becomes applicable only if a later patch touches
warp/GR physics, adapter contracts, constraint packs, training traces,
certificate semantics, CI/release verification, or proof-maturity claims.

## Explicit non-goals for v1

- Replacing the Start launcher, workstation tabs, or mobile navigation.
- Listing every developer panel in the root Guide.
- Reimplementing Shared Live Room setup or runtime controllers.
- Treating the Guide as the durable friend graph, presence server, signaling
  service, WebRTC engine, audio mixer, or GPT session owner.
- Treating friendship, party membership, room membership, model consent, source
  access, or environment authority as interchangeable.
- Requiring GPT Live for human voice chat, automatically sending party audio to
  GPT, or recording/transcribing party audio by default.
- Assuming the application domain must proxy all audio, or claiming STUN-only
  success is production cross-network acceptance.
- Supporting parties larger than two, an SFU, public matchmaking, or moderation
  and recording infrastructure in v1.
- Adding a private model, retry, execution, approval, or terminal loop.
- Treating the Guide as a Mission Go Board database.
- Performing environment mutations directly from local overlay state.
- Presenting companion presence evidence as follow, mining, inventory, combat,
  World Authority, or answer authority.
- Collapsing `player_proxy` and `companion_entity`, or presenting a hidden
  player-semantics backend as a second user-visible actor.
- Adding voice narration merely because the Guide opened.
- Copying Xbox logos, sounds, fonts, artwork, or proprietary assets.
- Claiming that an attractive or responsive overlay proves installed-node,
  provider, MCP, room, connector, environment, or release readiness.

## Open design decisions

The following choices should be resolved during the visual prototype rather
than assumed by this document:

1. Whether `Environment` or `Live Room` should occupy the immediately adjacent
   right blade after controller testing, while both remain distinct top-level
   destinations.
2. Whether the compact opening mark contains only the Casimir glyph or also the
   current account avatar.
3. Whether recent panels are persisted per profile or limited to the current
   installed session.
4. Whether the `X` action is always search or becomes a blade-specific safe
   secondary action.
5. Which local sound cues, if any, remain pleasant, accessible, and legally
   distinct from the reference interface.
6. The exact minimum dimensions for the installed EXE's supported window sizes.
7. Whether the blade retains the familiar `Live Room` name or becomes
   `People & Rooms` after prototype testing.
8. The public handle format, rename policy, discoverability default, and signed
   invite-link lifetime.
9. Whether coarse friend presence exposes only online/offline or also away,
   joinable, and in-party states.
10. Whether v1 formally fixes party capacity at two or designs the contract for
    future group capacity while accepting only two-person media.
11. The production TURN provider/deployment, credential issuer, regional
    routing, and cost/abuse controls.
12. The evidence threshold that would justify evaluating an SFU instead of the
    direct-plus-TURN two-person topology.

These decisions may change the presentation but must not change the authority,
account-policy, lifecycle, or evidence rules above.
