# AR-2B2 room transcript identity progress — 2026-09-24

The real Realtime HTTP event caller now derives the room `transcript.final`
hash and character count from the text it admits. It rejects a conflicting
client hash/count and text longer than the handoff's 16,000-character limit
before building a transcript observation or Stage Play handoff. Its rejection
returns no transcript content and no handoff.

`npx vitest run server/services/helix-ask/realtime-room/__tests__/voice-handoff-authority.test.ts --pool=forks`
passed **20/20**, including real HTTP denial for a forged hash, forged count,
and text that the handoff would truncate. This proves the HTTP ingress check in
the deterministic fixture; it does not establish acoustic speaker identity,
Live mission dispatch, durable mission-aware pickup, task-authenticated return,
or installed/domain acceptance. The room mission selection remains preparation
only. No paid provider call was made.

`npm run build:server` passed with four unrelated duplicate-key/case warnings.
The broader Realtime route test passed **24/24** with
`npx vitest run server/services/helix-ask/realtime-session/__tests__/route.test.ts --pool=forks`.
`npm run helix:environment-harness:docs-audit` passed with G8 active.
`npm run helix:ask:discipline:quick` passed its static check; its broad-worktree
warnings concern existing provider changes and the test classifier.
