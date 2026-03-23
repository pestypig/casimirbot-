import assert from "node:assert/strict";
import { __testHelixAskReliabilityGuards } from "./server/routes/agi.plan";
const formatted = __testHelixAskReliabilityGuards.formatHelixAskAnswer([
  "Definition:",
  "- In this codebase, warp bubble is grounded in docs/knowledge/warp/warp-bubble.md.",
  "",
  "Repo anchors:",
  "- modules/warp/natario-warp.ts",
  "- modules/warp/warp-module.ts",
  "",
  "Open Gaps:",
  "- Current evidence is incomplete for mechanism.",
  "",
  "Sources: docs/knowledge/warp/warp-bubble.md, modules/warp/natario-warp.ts"
].join("\n"));
assert.match(formatted, /^Definition:/m);
assert.match(formatted, /^Repo anchors:/m);
assert.match(formatted, /^Open Gaps:/m);
assert.match(formatted, /^Sources:/m);
console.log('structured-ok');
