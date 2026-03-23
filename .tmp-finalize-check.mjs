import { __testHelixAskReliabilityGuards } from "./server/routes/agi.plan.ts";
const input = `Definition:\n- In this codebase, warp bubble is grounded in modules/warp/natario-warp.ts, with primary implementation surfaces in modules/warp/natario-warp.ts and modules/warp/warp-module.ts.\n\nRepo anchors:\n- modules/warp/natario-warp.ts\n- modules/warp/warp-module.ts\n- server/energy-pipeline.ts\n\nOpen Gaps:\n- Current evidence is incomplete for State what remains uncertain or under-evidenced in this turn.; missing slots: mechanism, failure-path.\n\nSources: modules/warp/natario-warp.ts, modules/warp/warp-module.ts, server/energy-pipeline.ts, scripts/warp-evidence-pack.ts, shared/warp-promoted-profile.ts, client/src/hooks/useelectronorbitsim.ts, client/src/lib/warp-theta.ts, client/public/warp-engine.js`;
const out = __testHelixAskReliabilityGuards.finalizePinnedHelixAskDeterministicAnswer({
  answer: input,
  allowedSourcePaths: [
    "modules/warp/natario-warp.ts",
    "modules/warp/warp-module.ts",
    "server/energy-pipeline.ts",
    "scripts/warp-evidence-pack.ts",
    "shared/warp-promoted-profile.ts",
    "client/src/hooks/useelectronorbitsim.ts",
    "client/src/lib/warp-theta.ts",
    "client/public/warp-engine.js",
  ],
  citationTokens: [],
});
console.log(out);
