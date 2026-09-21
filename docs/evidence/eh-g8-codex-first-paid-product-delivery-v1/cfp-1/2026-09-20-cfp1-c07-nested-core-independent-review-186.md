Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.RIGHTS / CFP-1.DISTRIBUTION independent evidence review
Capability or component: C07 Fabric local development JAR and embedded-core inventory
Lifecycle stage: planned release-input review
Reaction timescale: before reserved customer build and qualified rights disposition
Authority owner: Independent read-only agent checks source/evidence; qualified rights and release owners retain their separate decisions
Current maturity: specified
Target maturity: specified with reviewed development-evidence handoff
Required evidence: [inventory 185](2026-09-20-cfp1-c07-fabric-nested-core-byte-inventory-185.md) and linked identity, C07 rights and component packets
Explicit non-goals: no signed/installed artifact, legal clearance, production mutation or stage promotion
Downstream gate unlocked: none automatically; D01/C07/D11/D12 and CFP-2/3 remain open

# Independent C07 nested-core inventory review — 2026-09-20

**Verdict: PASS for source-to-development-output accuracy and stage boundaries.** An independent read-only agent directly verified the five cited source hashes, all three local JAR sizes and hashes, ZIP entry counts of 149/74/63, the identical 101,795-byte embedded core in both mod JARs, 64 nested versus 63 standalone entries, sole additional generated `fabric.mod.json`, and byte equality of all 63 shared uncompressed entries. It confirmed no inspected archive contains a `LICENSE` or `NOTICE` named entry and that the mod outputs nest only the core, while build/mod metadata declare external Fabric/Minecraft/Java dependencies. The linked rights, identity, component and G8 wording uses these as mutable development evidence and holds reserved-build, notice, rights and installed proof open. Relative links resolved.

The local `npm run helix:environment-harness:docs-audit` returned `ok: true`, with G8 active, 40 status rows and 14 acceptance claims checked. This review accepts the **planning evidence**, not the release artifact or commercial permission. CFP-1 remains active (`specified`); CFP-2/3 remain blocked.
