# O4 status recovery and expiry — component evidence

Classification: presentation. Inspection found the new rendered component kept
the request ID across reload but discarded the pairing ID, leaving accepted
grants dependent on another invitation POST to recover visible status. This was
a source-inspected gap; no pre-patch failing test is claimed.

The component now persists the nonsecret pairing ID scoped by owner/chat and
restores it through authenticated GET. Registration listing failure does not
block status recovery. Status must match the expected pairing ID, reviewed chat
and optional room/run before display. Pending/accepted grants receive a bounded
read-only status request every five seconds while the component is mounted;
each request retains the transport timeout and overlapping requests are skipped.
This is UI status observation, not model sampling or automatic invitation retry.
Terminal states stop polling. The local deadline hides Copy while server status
remains authoritative for expiry and eligibility to start a new invitation.
Accepted/terminal results no longer show the invitation reconciliation POST.

Verification on 2026-09-08, approximately 21:24–21:25 local:

- `npx vitest run client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`: 6 passed.
- After the final reconciliation-control change,
  `npx vitest run client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`: 45 passed.

New assertions cover accepted GET recovery despite registration-list failure,
wrong-chat rejection, pending-to-expired polling without a POST, and permitting
new review only after a server terminal result. Earlier selection/account/unknown
write tests also pass. These fixtures mock HTTP responses; they do not establish
joined handler persistence, real host delivery, native input or O6 acceptance.

Outstanding identity integration includes verifying the accepted destination
against the reviewed task, not just pairing/chat/run IDs, and linking the durable
grant to the current runtime binding before Ready up. The full O5 rendered
real-handler matrix, ordinary packaged flow, original CS1–CS4 exits and final
CS5 handoff remain incomplete. No original ET6 or NAV acceptance is claimed.
