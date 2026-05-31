# Live Environment Safety Pattern

This package demonstrates the live-environment safety pattern with a concrete Minecraft End-return route monitor and a small cross-domain evidence substrate. It does not implement full browser, translation, workstation, research, or support producers/reducers.

The core rule is:

```txt
The live environment may change what Helix Ask can see.
It must not secretly tell Helix Ask what to say.
```

## Implemented In This Package

- Minecraft route objective
- End-return rehearsal
- Route drift detection
- Route lifecycle receipts for death, stale-route, and End-to-Overworld completion
- Ask evidence-pack safety filtering
- Schema-allowlisted Ask evidence filtering for route objective, rehearsal, drift, lifecycle, visual, and thin cross-domain evidence contracts
- Schema-allowlisted Ask evidence filtering for environment snapshots, route-state pointers, chunk/local cells, container memory, and risk/resource ledgers
- Operator referral isolation
- D.O.T/operator referral enrichment for player death, stale route, missing gateway/home evidence, void-risk routes, low confidence, identity binding, and wrong-direction drift
- Ambient transcript does not create Ask turns
- Route drift contains no `surface_text`
- Recommendation remains policy-gated
- Paper plugin snapshot enrichment for compact entity state, local traversability cells, chunk snapshot summaries, block-event bursts, and container memory
- Current-world block delta overlay persistence
- Durable risk/resource ledger for snapshot hazards, resources, damage events, and inventory/container transitions

## Implemented By This Follow-Up Patch

- Generic live scenario evidence substrate
- Cross-domain evidence layer/trust unions
- Schema-allowlisted Ask-pack builder
- Real Ask-turn sink test harness
- Generic D.O.T referral union
- Route lifecycle/dimension guards wired into the live loop and world-event ingest path
- Thin cross-domain evidence stubs
- Live-loop safety validator
- Poisoning regression tests
- Ask-pack sanitizer coverage for route lifecycle receipts
- Ask-pack sanitizer coverage for environment state snapshots, container memory, and risk/resource ledgers
- World-event ingest wiring for risk/resource ledger updates
- Minecraft route-assist referral reason selection with operator-only Ask policy

## Not Implemented Yet

- Browser audio capture producer
- Browser claim reducer
- Translation reducer
- Speaker diarization
- Workstation process producer
- Workstation objective extractor
- Research source reducer
- Support procedure reducer
- Domain-specific anomaly monitors
- Domain-specific policy renderers
- Route-corridor-specific chunk sampling beyond bounded local chunk summaries
- Full Paper plugin compile/runtime verification in this workspace
