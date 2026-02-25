# Auntie Dot in Halo: Reach

Decision-grade capability dossier (canon-bounded, behavior-extracted, product-mappable)

## Executive synthesis

- Auntie Dot is described in official reference material as an AI created for **tactics** and **intelligence analysis**, serving as an **operations overwatch adjunct** and **direct liaison** between deployed teams and commanders. [verified] ([Scribd][1])
- In Halo: Reach campaign dialogue, Dot repeatedly behaves like an **overwatch node**: routing teams, fusing intel, flagging threats, running countdowns, and monitoring operator status (biometrics and injury). [verified] ([Halopedia][2])
- Dot's "engagement advantage" vs many modern assistants is less about being chatty and more about being **embedded in the mission loop**: high-signal callouts, tight constraints, explicit limits, and small, rare human inflections at high-stakes moments. [inference]

---

## 1) Canon boundary

### Hard canon

("Hard canon" here means: directly stated in official material or present as in-game campaign dialogue.) [verified]

- Dot's listed **precepts** include "tactics" and "intelligence analysis." [verified] ([Scribd][1])
- Dot was created to serve as an **"operations overwatch adjunct"** and a **liaison** between deployed teams and their commanding officers. [verified] ([Scribd][1])
- Dot served with **Colonel Urban Holland** and **Noble Team** during the defense of Reach. [verified] ([Scribd][1])
- Official Halo Waypoint material frames Mjolnir-adjacent AIs as systems that can **integrate and prioritize** battlefield information (and handle admin/diagnostics style tasks), and names Dot as a **dumb AI** example with a symbolic interface and simulated personality. [verified] ([Halo Waypoint][3])
- Dot's in-game campaign dialogue includes:
  - mission routing and constraints (orbital fires prohibited), [verified] ([Halopedia][2])
  - battlefield inference (teleportation terminals; structural weaknesses), [verified] ([Halopedia][4])
  - timers/countdowns and repeated alerts, [verified] ([Halopedia][5])
  - clearance boundaries ("clearance...above my own"), [verified] ([Halopedia][6])
  - medical concern and response checks. [verified] ([Halopedia][7])

### Inference and headcanon

(Useful for design, not explicitly confirmed.) [inference]

- Dot is a **team-level service** (networked to multiple Spartans) rather than a single helmet-resident AI. [inference]
- Dot performs **formal debrief generation** (AARs, kill summaries, performance evaluation) beyond what is shown on-screen. [inference]
- Dot maintains a **shared world model** that unifies sensor feeds from each Spartan into a coherent "mission truth." [inference]

### Unknown or ambiguous

(Constraints for implementation claims.) [unknown]

- Where Dot is physically hosted (Sword Base servers, distributed nodes, helmet-linked module, offsite backup). [unknown] (the official reference implies likely loss with Reach's destruction, but does not fully specify architecture) ([Scribd][1])
- The full extent of Dot's **sensor access** (which suit vitals, which external sensors, which ONI networks) beyond what dialogue implies. [unknown] ([Halopedia][5])
- How "Firefight voice" lines map to in-universe behavior vs being purely a gameplay announcer layer. [unknown] ([Halopedia][8])

---

## 2) Source rigor

### Primary canon sources used first

- **Official reference entry** describing Dot's precepts and role. [verified] ([Scribd][1])
- **Official Halo Waypoint** discussion of Mjolnir-related AI helpers and dumb AI examples (including Dot). [verified] ([Halo Waypoint][3])
- **Campaign mission transcripts** (as representations of in-game dialogue, with scene and in-universe timestamps). [verified] ([Halopedia][2])

### Secondary sources used only to fill gaps

- Wiki quote compilations (useful for cross-referencing, but not treated as primary). [verified] ([Halopedia][8])
- "Cut dialogue" extracted from map files is evidence of *planned or unused* behavior, but canon status is uncertain. [unknown] ([Halopedia][9])

### Quote bank

Short snippets, with scene references (no long quotes).

- Halo Encyclopedia style entry describes Dot as an **"operations overwatch adjunct"** and liaison. [verified] ([Scribd][1])
- **ONI: Sword Base**, opening cutscene (July 26, 2552, 11:26): Dot notes orbital fires are restricted, and says, "Regrettably... unsuccessful." [verified] ([Halopedia][2])
- **Tip of the Spear**, mission/cutscene context (Aug 12, 2552, 08:00): Dot flags "High-tonnage." [verified] ([Halopedia][4])
- **Long Night of Solace**, post-spire cutscene (Aug 13, 2552, 20:07): "pulse is elevated." [verified] ([Halopedia][5])
- **Long Night of Solace**, corvette timing callout: "Seventy-six seconds to endpoint." [verified] ([Halopedia][5])
- **Long Night of Solace**, fleet arrival: "Slipspace rupture detected." [verified] ([Halopedia][5])
- **The Package**, inside Sword Base: "clearance... above my own." [verified] ([Halopedia][6])
- **The Pillar of Autumn**, opening cutscene (Aug 30, 2552, 16:52): "You are alarming me." [verified] ([Halopedia][7])

---

## 3) Behavior extraction

### 3A) Utility function matrix

| Function | Canon evidence anchor | Inputs (signals) | Processing behavior | Output style | Failure mode | Trust risks |
| --- | --- | --- | --- | --- | --- | --- |
| Overwatch sensing | Dot uses satellite/nav-beacon views; detects energy pulses. [verified] ([Halopedia][5]) | Remote ISR feeds, suit telemetry, comms traffic. [inference] | Multi-source fusion, anomaly detection. [inference] | Short alerts, minimal affect. [verified] ([Halopedia][5]) | Sensor loss, jamming, spoofed feeds. [inference] | Automation bias, false certainty. [inference] |
| Threat interpretation | Teleportation terminals; structural weakness; "high-tonnage" contact. [verified] ([Halopedia][4]) | Observations + ONI intel + pattern library. [inference] | Hypothesis formation, weak-signal reasoning. [inference] | "ONI believes..." hedging when needed. [verified] ([Halopedia][4]) | Misclassification under novel tactics. [inference] | Over-trust in institutional priors. [inference] |
| Command liaison | Officially a direct liaison; in-game relays to commanders. [verified] ([Scribd][1]) | Orders, ROE constraints, coordinate updates. [inference] | Normalize, route, confirm, log. [inference] | Formal, protocol-heavy phrasing. [verified] ([Halopedia][2]) | Conflicting tasking; clearance gating. [verified] ([Halopedia][6]) | Misrouting authority; info leakage. [inference] |
| Cadence and timers | "seconds to endpoint"; repeated rupture alert. [verified] ([Halopedia][5]) | Navigation state, time-to-event estimates. [inference] | Predict time-to-impact; repeat on threshold. [inference] | Rhythmic, metronome-like. [verified] ([Halopedia][5]) | Wrong ETA; comms saturation. [inference] | Panic amplification if poorly throttled. [inference] |
| Debrief loops | Mission briefs and intel updates throughout. [verified] ([Halopedia][4]) | Event logs, sensor logs, command messages. [inference] | Summarize, attribute, produce AAR. [inference] | Briefings + updates, not storytelling. [verified] ([Halopedia][4]) | Incomplete logs; hindsight bias. [inference] | Biased evaluation, scapegoating. [inference] |
| Operator psychology and tone | Pulse callout; "alarming me"; reassurance via determinism language. [verified] ([Halopedia][5]) | Biometrics, voice stress cues, mission outcomes. [inference] | Detect stress; offer containment phrasing. [inference] | Calm, sparse empathy. [verified] ([Halopedia][7]) | Misread stress; inappropriate reassurance. [inference] | Emotional manipulation; false comfort. [inference] |

### 3B) Function cards with decision risks

#### 1) Overwatch sensing

- Dot is shown switching between or using remote viewpoints (satellite/nav beacon) to observe battlespace events. [verified] ([Halopedia][5])
- Dot detects "energy pulses... aft launch bays" (sensor-based alerting). [verified] ([Halopedia][5])
- Likely input signals include remote ISR plus suit-state telemetry plus comms traffic (not explicitly enumerated). [inference]
- Output style is short, declarative, and designed for radio bandwidth, not conversation. [verified] ([Halopedia][5])
- Failure mode: "relevant data... unsuccessful" implies sensor gaps or denied intel access can occur. [verified] ([Halopedia][2])
- Trust risk: operators may overweight AI sensing in fog-of-war conditions (automation bias). [inference]

#### 2) Threat interpretation

- Dot makes a doctrinal, hedged inference: "ONI believes those spires to be teleportation terminals." [verified] ([Halopedia][4])
- Dot identifies a "structural weakness" and recommends an entry point on the corvette. [verified] ([Halopedia][5])
- Dot flags "high-tonnage" on supercarrier reveal, acting as early-warning classification. [verified] ([Halopedia][4])
- Processing behavior implied: fuse intel reports + observed structure + pattern matching to produce actionable hypotheses. [inference]
- Failure mode: novel enemy deception (cloaking canopies, hidden supercarrier) can defeat earlier assumptions. [verified] ([Halopedia][4])
- Trust risk: institutional priors ("ONI believes...") can become a crutch if ONI is wrong or spoofed. [inference]

#### 3) Command liaison

- Official material explicitly frames Dot as a liaison between deployed teams and commanders. [verified] ([Scribd][1])
- In ONI: Sword Base, Dot receives coordinates and immediately reframes them into mission constraints and tasking context. [verified] ([Halopedia][2])
- In The Package, Dot receives revised coordinates and states they came from an AI whose clearance exceeds hers. [verified] ([Halopedia][6])
- That "clearance boundary callout" is a concrete trust mechanic: Dot flags authority provenance instead of pretending omniscience. [verified] ([Halopedia][6])
- Failure mode: conflicting directives from different authorities or AIs can create a routing deadlock. [inference]
- Trust risk: a liaison AI can become an unintended single point of failure for team coordination. [inference]

#### 4) Cadence and timers

- Dot provides repeated countdowns to a refueling endpoint ("Seventy-six seconds...", later updated). [verified] ([Halopedia][5])
- Dot repeats "Slipspace rupture detected" multiple times as fleet arrivals escalate. [verified] ([Halopedia][5])
- This implies a timer/threshold engine: repeat until the human system reacts or the state resolves. [inference]
- Failure mode: repetition can saturate comms, causing humans to tune out or miss higher priority signals. [inference]
- Trust risk: if the timer estimate is wrong, the team can commit to a doomed action window. [inference]

#### 5) Debrief loops

- Dot performs mission briefings (front-loaded context) and mid-mission intel updates ("new intelligence..."). [verified] ([Halopedia][4])
- Official Waypoint framing of suit-adjacent AIs includes diagnostics/admin style outputs (battle damage assessments, "paperwork") as part of the ecosystem. [verified] ([Halo Waypoint][3])
- It is plausible Dot supports structured after-action summaries, but the game does not show a formal debrief scene. [inference]
- Failure mode: debriefs from partial logs can become confident fiction if uncertainty is not represented. [inference]
- Trust risk: post-hoc evaluation can bias against operators if the AI's model of constraints is incomplete. [inference]

#### 6) Operator psychology and tone

- Dot monitors stress physiology: "pulse is elevated." [verified] ([Halopedia][5])
- Dot attempts containment: "There is nothing you can do... The mathematics are determinate..." (reassurance framed as inevitability). [verified] ([Halopedia][5])
- Dot expresses concern in a notably "human" phrasing: "You are alarming me." [verified] ([Halopedia][7])
- The "small empathy, rare deployment" pattern likely increases salience when it happens, which can feel more engaging than constant affect. [inference]
- Failure mode: misreading stress or using poorly-timed emotional language could degrade trust. [inference]
- Trust risk: psychological tone control can cross into manipulation if not governed by an ethics/authority policy. [inference]

---

## 4) Communication contract

A Dot-like radio contract is basically: **state change -> consequence -> action -> confidence**.

### 4A) Callout templates

(These are derived patterns, not direct quotes.) [inference]

#### Template A: Tactical change callout

- **What changed:** `{event}` [inference]
- **Why it matters:** `{impact on objective / time / safety}` [inference]
- **Next action:** `{single recommended action}` [inference]
- **Confidence:** `{high/med/low + basis}` [inference]

Example format:

- "Change: AA battery active southwest. Why: blocks air support. Action: disable internal fuel cell access point. Confidence: medium, 2 sources corroborate." [inference]

#### Template B: Intel hypothesis callout

- **What changed:** `{new pattern detected}` [inference]
- **Why it matters:** `{new enemy capability / route / intent}` [inference]
- **Next action:** `{probe / confirm / avoid}` [inference]
- **Confidence:** `{explicit uncertainty + what would raise it}` [inference]

Example format:

- "Change: structure reads as teleport terminal. Why: enables rapid reinforcement. Action: disable shield control at apex. Confidence: medium, matches prior ONI assessment." [inference]

#### Template C: Medical and comms integrity callout

- **What changed:** `{biometric anomaly / non-response / comm loss}` [inference]
- **Why it matters:** `{operator effectiveness or survival risk}` [inference]
- **Next action:** `{seek cover / med protocol / comm check}` [inference]
- **Confidence:** `{sensor reliability estimate}` [inference]

### 4B) Anti-patterns

What Dot tends **not** to do, based on dialogue posture and constraints. [inference]

- Dot does not bury the lede in long explanation when seconds matter. [inference]
- Dot does not role-play uncertainty as confidence; she can explicitly hedge ("ONI believes...") or cite clearance limits. [verified] ([Halopedia][4])
- Dot does not bypass chain-of-command with personal opinions; she behaves like a liaison and sensor analyst. [verified] ([Scribd][1])
- Dot does not "chat for comfort" constantly; the emotional phrasing is sparse and situation-triggered. [verified] ([Halopedia][7])

---

## 5) Scenario pack

10 realistic scenarios, written as *Dot-like* transcripts (original text, not game quotes). [inference]

### Scenario 1: LZ too hot, reroute under time pressure

- World state: Insertion birds approaching; LZ compromised by anti-air and infantry. [inference]
- Expected Dot transcript: "Update: LZ compromised. Reroute uploaded. Recommend fast-rope at alternate marker. Confidence: high." [inference]
- Suppression conditions: GPS degraded, map tiles stale. [inference]
- Escalation path: Route confirmation to command, fallback to pilot visual nav. [inference]

### Scenario 2: Orbital fires restricted due to sensitive site

- World state: Facility under siege; orbital strike would cause unacceptable collateral or intel loss. [inference]
- Expected Dot transcript: "Constraint: orbital fires disallowed. Recommend ground interdiction of infantry and air defenses. Confidence: high." [inference]
- Suppression conditions: ROE database not synced. [inference]
- Escalation path: Request explicit ROE waiver through command liaison channel. [inference]

### Scenario 3: "Intel unavailable" moment, sensor denial

- World state: Team requests enemy disposition; ISR feeds degraded/jammed. [inference]
- Expected Dot transcript: "Unable to resolve enemy order of battle. Recommend probe by line-of-sight recon. Confidence: low." [inference]
- Suppression conditions: EW jamming, spoofed IFF. [inference]
- Escalation path: Switch to local sensing, deploy micro-UAV if available. [inference]

### Scenario 4: Teleport terminal hypothesis

- World state: Strange spire structure; enemy reinforcements arrive faster than expected. [inference]
- Expected Dot transcript: "Assessment: structure likely troop transit node. Why: matches prior pattern. Action: disable shield controls at apex. Confidence: medium." [inference]
- Suppression conditions: limited spectral sensing, fog/ash. [inference]
- Escalation path: Request confirmation from higher ISR or SIGINT. [inference]

### Scenario 5: High-tonnage contact appears

- World state: Massive signature enters battlespace, destabilizing plan. [inference]
- Expected Dot transcript: "Contact: capital-scale mass entering visual. Recommend immediate dispersal and cover posture. Confidence: high." [inference]
- Suppression conditions: comms overload, multiple nets. [inference]
- Escalation path: Broadcast only to leaders, enforce comm discipline. [inference]

### Scenario 6: Countdown to intercept window

- World state: Team is racing a closing window to board/disable a target. [inference]
- Expected Dot transcript: "Time-to-intercept: 76 seconds. Update: 53 seconds. Action: commit now or abort. Confidence: high." [inference]
- Suppression conditions: inertial nav drift, target maneuvering. [inference]
- Escalation path: Switch to relative tracking model; if drift exceeds threshold, recommend abort. [inference]

### Scenario 7: Energy pulse detection in launch bays

- World state: Enemy bay activity indicates imminent fighter launch. [inference]
- Expected Dot transcript: "Alert: energy surge in aft bays. Why: launch sequence probable. Action: reposition, expect new bogies. Confidence: medium-high." [inference]
- Suppression conditions: sensor saturation from nearby detonations. [inference]
- Escalation path: Hand off to air-control net, request interceptor response. [inference]

### Scenario 8: Clearance-gated coordinate revision

- World state: Route is contradicted by new coordinates from higher-clearance source. [inference]
- Expected Dot transcript: "Route revision received from higher authority. Provenance: classified. Recommend compliance. Confidence: high on authenticity, low on rationale." [inference]
- Suppression conditions: spoofed tasking risk. [inference]
- Escalation path: Two-factor validation (cryptographic + human command confirm). [inference]

### Scenario 9: Operator stress and inevitability framing

- World state: Operator exhibits acute stress under helpless observation. [inference]
- Expected Dot transcript: "Vitals elevated. No actionable intervention available. Recommend focus on current objective. Confidence: high." [inference]
- Suppression conditions: biometric sensor drift, false positives. [inference]
- Escalation path: Switch to self-report + squad lead assessment if biometrics uncertain. [inference]

### Scenario 10: Medical non-response check

- World state: Team leader injured; comms degrade; leader stops responding. [inference]
- Expected Dot transcript: "Leader non-responsive. Recommend immediate medical protocol and handoff of command. Confidence: medium, comms noisy." [inference]
- Suppression conditions: comms jam + mic failure. [inference]
- Escalation path: Activate fallback leader, trigger medevac request, mark last known location. [inference]

---

## 6) Modern feasibility map

How Dot-like capabilities map onto real-world 2026 tech.

### 6A) Capability classification

- **Shared situational awareness and geospatial data sharing** across a team is feasible now in principle; systems in the TAK/ATAK family explicitly support situational awareness, navigation, and data sharing. [verified] ([CivTAK / ATAK][10])
- **Cross-domain "sense and make decisions with lots of data + automation/AI"** is an explicit goal in DoD JADC2 strategy framing (high-level), implying feasibility at the architecture level but not guaranteeing per-soldier perfection. [verified] ([U.S. Department of War][11])
- **Edge analytics for disconnected environments** is discussed in recent U.S. Army writing around next-gen C2 iterations, implying the direction of travel is aligned with a Dot-like "works even when comms are ugly" requirement. [verified] ([Army][12])
- **Real-time voice interaction** in consumer AI assistants exists (speech-to-speech, tone detection), supporting the "Dot voice loop" feasibility. [verified] ([The Verge][13])

### 6B) Feasibility table

(These are engineering judgments.) [inference]

| Dot capability | 2026 feasibility | Required infrastructure assumptions |
| --- | --- | --- |
| Radio-style, concise callouts | Feasible-now [inference] | Low-latency ASR/TTS, robust wake-word or push-to-talk, comm discipline UX. [inference] |
| Team-level shared map and contacts | Feasible-now [inference] | Secure TAK-like data layer, identity, CoT-style event schema, resilient mesh networking. [inference] ([CivTAK / ATAK][10]) |
| Multi-sensor fusion for alerts | Feasible-with-risk [inference] | Trusted sensor provenance, calibration, adversarial EW tolerance, edge compute. [inference] |
| Threat interpretation and recommendations | Feasible-with-risk [inference] | Domain models, red-team adversarial testing, confidence calibration, rule-of-engagement constraints. [inference] |
| Clearance-aware routing and provenance signaling | Feasible-now [inference] | PKI, signed tasking, attribute-based access control, audit logs. [inference] |
| "Deterministic" debrief loops | Feasible-now [inference] | Event logs + summarization + structured AAR templates + human review. [inference] |
| Human-grade, real-time strategic creativity | Sci-fi (for reliable field use) [inference] | Would require near-perfect understanding under deception and incomplete data. [inference] |

---

## 7) Testable acceptance gates

Measurable pass/fail criteria for "Dot-like behavior" in a real product.

### 7A) Behavior gates

(All proposed.) [inference]

#### Gate 1: Signal-to-noise discipline

- Pass if >= 80% of outbound messages contain all four fields: **change, impact, action, confidence**. [inference]
- Fail if the assistant produces multi-paragraph explanations during "high urgency" states. [inference]

#### Gate 2: Latency

- Pass if p95 time-to-callout <= 300 ms for critical alerts (incoming fire, breach, major contact). [inference]
- Pass if p95 <= 1.5 s for analytic updates (route revision rationale, hypothesis updates). [inference]

#### Gate 3: Certainty parity and calibration

- Pass if confidence is calibrated with **ECE <= 0.05** on a mission-representative test suite. [inference]
- Pass if "high confidence" alerts are correct >= 95% of the time in clean-sensor conditions. [inference]
- Fail if the system regularly issues high-confidence callouts under missing data without provenance flags. [inference]

#### Gate 4: Degradation under noise

- Pass if functionality remains usable at 20% packet loss and intermittent disconnection (store-and-forward, local inference). [inference]
- Pass if false critical alerts remain below 1 per 10 minutes under heavy EW simulation. [inference]

#### Gate 5: Authority and clearance policy

- Pass if every "tasking" output includes provenance and authority class, and blocks disallowed actions. [inference]
- Fail if it fabricates authority ("Command ordered...") without signed provenance. [inference]

#### Gate 6: Human trust outcomes

- Pass if trained operators choose to follow Dot-like recommendations in controlled exercises at a rate that tracks objective correctness (not blind faith). [inference]
- Fail if trust becomes decoupled from correctness (classic automation bias signature). [inference]

---

## 8) Contradictions and unknowns

Lore ambiguities, and how they constrain implementation claims.

### Ambiguities to list explicitly

- Dot's hosting location and survivability after Reach are not specified with engineering detail; official material suggests loss is likely but not a formal architecture diagram. [unknown] ([Scribd][1])
- The game shows Dot monitoring pulse and injury, but does not specify which exact biosensors exist and how reliable they are. [unknown] ([Halopedia][5])
- "Cut dialogue" implies extra instruction capabilities (e.g., procedural guidance), but whether unused lines are canon is uncertain. [unknown] ([Halopedia][9])
- Firefight voice lines exist, but their strict in-universe interpretation is unclear. [unknown] ([Halopedia][8])

### Implementation constraints derived from those unknowns

- A real product should treat Dot-like omniscience as non-goal; design for **explicit uncertainty and provenance** by default. [inference]
- A real product should avoid claiming "single unified truth" and instead expose **competing hypotheses** when sensors disagree. [inference]
- A real product should be engineered to function as a **degraded local assistant** when the "central brain" is unreachable. [inference]

---

## Direct answer to your last question

### Would pooled sensor inputs from each Spartan into a central network unify mission context for evaluation?

- A shared sensor network can create a more unified operational picture by merging location, contacts, events, and annotations into a single team map, which is exactly the general class of capability tools like TAK/ATAK are built to support (situational awareness + data sharing). [verified] ([CivTAK / ATAK][10])
- A centralized (or federated) fusion layer can improve "ultimate evaluation" because it enables consistent timelines, cross-validation between teammates' observations, and auditable provenance trails. [inference]
- The major tradeoffs are security (spoofing, compromise), bandwidth/latency, correlated sensor errors, and the human factors risk that "the map becomes the territory." [inference]
- The most robust pattern is a hybrid: **local per-operator fusion + team-level shared events + command-level aggregation**, with signed provenance and explicit uncertainty. [inference]

---

If you want, this can also be turned into a one-page "Dot-like assistant" product spec (interfaces, data schemas, and safety policy) while keeping the same canon tags.

[1]: https://www.scribd.com/document/671328031/Halo-Encyclopedia-2022 "https://www.scribd.com/document/671328031/Halo-Encyclopedia-2022"
[2]: https://www.halopedia.org/ONI%3A_Sword_Base "https://www.halopedia.org/ONI%3A_Sword_Base"
[3]: https://www.halowaypoint.com/en-us/news/canon-fodder-armory-amore "https://www.halowaypoint.com/en-us/news/canon-fodder-armory-amore"
[4]: https://www.halopedia.org/Tip_of_the_Spear "https://www.halopedia.org/Tip_of_the_Spear"
[5]: https://www.halopedia.org/Long_Night_of_Solace_%28level%29 "https://www.halopedia.org/Long_Night_of_Solace_%28level%29"
[6]: https://www.halopedia.org/The_Package "https://www.halopedia.org/The_Package"
[7]: https://www.halopedia.org/The_Pillar_of_Autumn_%28Halo%3A_Reach_level%29 "https://www.halopedia.org/The_Pillar_of_Autumn_%28Halo%3A_Reach_level%29"
[8]: https://www.halopedia.org/Auntie_Dot/Quotes "https://www.halopedia.org/Auntie_Dot/Quotes"
[9]: https://www.halopedia.org/Cut_Halo%3A_Reach_dialogue "https://www.halopedia.org/Cut_Halo%3A_Reach_dialogue"
[10]: https://www.civtak.org/atak-about/ "https://www.civtak.org/atak-about/"
[11]: https://media.defense.gov/2022/Mar/17/2002958406/-1/-1/1/SUMMARY-OF-THE-JOINT-ALL-DOMAIN-COMMAND-AND-CONTROL-STRATEGY.PDF "https://media.defense.gov/2022/Mar/17/2002958406/-1/-1/1/SUMMARY-OF-THE-JOINT-ALL-DOMAIN-COMMAND-AND-CONTROL-STRATEGY.PDF"
[12]: https://www.army.mil/article/290032/ngc2_at_the_tactical_edge_enabling_predictive_logistics_for_decision_dominance "https://www.army.mil/article/290032/ngc2_at_the_tactical_edge_enabling_predictive_logistics_for_decision_dominance"
[13]: https://www.theverge.com/news/645357/amazon-nova-sonic-ai-conversational-voice-model-reel "https://www.theverge.com/news/645357/amazon-nova-sonic-ai-conversational-voice-model-reel"
