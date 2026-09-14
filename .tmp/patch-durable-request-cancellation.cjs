const fs = require('node:fs');
const file = 'client/src/components/agent-access/DurableTaskPairing.tsx';
let source = fs.readFileSync(file).toString('latin1');
const newline = source.includes('\r\n') ? '\r\n' : '\n';
function once(before, after) {
  if (source.split(before).length !== 2) throw new Error('Expected one exact target: ' + before.slice(0, 80));
  source = source.replace(before, after.replaceAll('\n', newline));
}
once('import { deliverPairingInvitation,', 'import { cancelPairingInvitation, deliverPairingInvitation,');
once('          : "The request could not be confirmed. Keep this selection and reconcile the same invitation before creating another.");',
`          : error instanceof Error && error.message === "pairing_environment_unavailable"
            ? "The selected run is no longer available. Cancel this request to review another run."
            : error instanceof Error && error.message === "pairing_request_cancelled"
              ? "This request was cancelled. Use Cancel request and review again to confirm recovery."
              : "The request could not be confirmed. Keep this selection and reconcile the same invitation before creating another.");`);
once('  const selected = destinations.find(item => item.registrationId === review.registrationId);',
`  const cancelRequest = () => run(async () => {
    const result = await cancelPairingInvitation(review.requestId);
    if (!alive.current) return;
    if (result.pairing) acceptStatus(result.pairing, pairing?.id);
    if (!alive.current) return;
    // A durable cancellation fences late issuance before this local review is
    // released. Keep the original request on any storage or response failure.
    const next = { ...review, requestId: crypto.randomUUID(), environment: null };
    localStorage.setItem(storageKey + ":draft", JSON.stringify(next));
    localStorage.removeItem(storageKey + ":pairing");
    localStorage.removeItem(storageKey);
    setReview(next); setPairing(null); setInvitation(null); setSubmitted(false);
    setApproved(false); setRuntimeMessage(""); setDeliveryMessage("");
    setMessage("The previous request is cancelled. Review the task and run, then approve the new selection.");
    await refreshPrevious();
  });
  const selected = destinations.find(item => item.registrationId === review.registrationId);`);
once('    {review.invitationDelivery === "automatic"\r\n      ? <p>'.replaceAll('\r\n', newline),
`    {submitted && (!pairing || pairing.state === "pending") && <div>
      <p>Canceling also revokes any pairing already created by this request. A replacement does not restore an earlier superseded pairing.</p>
      <button type="button" className="my-2 min-h-11 rounded-md border border-slate-400 px-3 py-2 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
        disabled={busy} onClick={() => void cancelRequest()}>Cancel request and review again</button>
    </div>}
    {review.invitationDelivery === "automatic"
      ? <p>`);
fs.writeFileSync(file, Buffer.from(source, 'latin1'));
console.log('Added scoped request cancellation UI; unrelated bytes preserved.');
