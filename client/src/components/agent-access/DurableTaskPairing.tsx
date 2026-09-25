import React, { useEffect, useRef, useState } from "react";
import { PAIRING_STORAGE_ERRORS, isPairingStorageErrorCode } from "../../../../shared/helix-pairing-storage-error";
import { cancelPairingInvitation, deliverPairingInvitation, inspectPairing, inspectPairedRuntimeBinding, issuePairingInvitation, listPairingDestinations, revokePairing, reconcilePairingInvitation,
  pairingInvitationRequestSchema, pairingStatusSchema, type PairingInvitationRequest, type PairingStatus,
  type RegisteredPairingDestination } from "../../lib/agent-access/durablePairing";
import ReasoningClaimHandle from "./ReasoningClaimHandle";
import { usePairingRecoveryStorage } from "../../lib/agent-access/pairingRecoveryStorage";
import type { BrowserReasoningBinding } from "../../lib/agent-access/reasoningTaskBinding";

type Props = { profileId: string; chatId: string; environment?: { roomId: string; runId: string } | null;
  onRuntimeBinding?: (binding: BrowserReasoningBinding | null, pairingId: string) => void };
type PreviousPairing = { review: PairingInvitationRequest; pairing: PairingStatus };
// Remount on owner/chat changes so an old asynchronous response cannot enter a
// different account's UI. Storage contains reviewed metadata, never the secret.
export default function DurableTaskPairing(props: Props) {
  return <PairingControls key={JSON.stringify([props.profileId, props.chatId])} {...props} />;
}
function PairingControls({ profileId, chatId, environment, onRuntimeBinding }: Props) {
  const storageKey = `helix.pairing.review.v1:${JSON.stringify([profileId, chatId])}`;
  // Owner/chat-scoped display only; invitation issuance revalidates the run.
  const [lastOfferedEnvironment, setLastOfferedEnvironment] = useState(environment ?? null);
  useEffect(() => {
    if (environment) setLastOfferedEnvironment(environment);
  }, [environment?.roomId, environment?.runId]);
  const [review, setReview] = useState<PairingInvitationRequest>(() => {
    try {
      const parsed = pairingInvitationRequestSchema.safeParse(JSON.parse(localStorage.getItem(storageKey)
        ?? localStorage.getItem(`${storageKey}:draft`) ?? "null"));
      if (parsed.success && parsed.data.chatId === chatId) return parsed.data;
    } catch { /* Storage is optional until the operator approves. */ }
    return { requestId: crypto.randomUUID(), registrationId: "", chatId, environment: null,
      invitationSeconds: 900, pairingSeconds: 28800 };
  });
  const [destinations, setDestinations] = useState<RegisteredPairingDestination[]>([]);
  const [approved, setApproved] = useState(false);
  const [automaticAvailable, setAutomaticAvailable] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [submitted, setSubmitted] = useState(() => {
    try {
      const saved = pairingInvitationRequestSchema.safeParse(JSON.parse(localStorage.getItem(storageKey) ?? "null"));
      return saved.success && saved.data.chatId === chatId;
    } catch { return false; }
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [previous, setPrevious] = useState<PreviousPairing | null>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(`${storageKey}:previous`) ?? "null");
      const savedReview = pairingInvitationRequestSchema.parse(raw?.review);
      const savedPairing = pairingStatusSchema.parse(raw?.pairing);
      if (savedReview.chatId === chatId && savedPairing.chatId === chatId &&
          savedPairing.id === review.replacement?.pairingId) return { review: savedReview, pairing: savedPairing };
    } catch { /* Stored metadata cannot establish current grant status. */ }
    return null;
  });
  const [previousChecked, setPreviousChecked] = useState(false);
  const [invitation, setInvitation] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now);
  const [runtimeMessage, setRuntimeMessage] = useState("");
  const alive = useRef(true);
  const destinationDigest = useRef<string | null>(null);
  if (destinationDigest.current === null) {
    try { destinationDigest.current = localStorage.getItem(`${storageKey}:destination`); } catch { /* Fail closed below. */ }
  }
  const inFlight = useRef(false);
  const backgroundRead = useRef<Promise<void> | null>(null);
  useEffect(() => {
    if (!review.registrationId || submitted) return;
    try { localStorage.setItem(`${storageKey}:draft`, JSON.stringify(review)); }
    catch { setMessage("Browser storage is unavailable. This selection cannot survive a reload."); }
  }, [review, submitted, storageKey]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = async (operation: () => Promise<void>, background = false) => {
    if (inFlight.current || (background && backgroundRead.current)) return;
    if (!background) { inFlight.current = true; setBusy(true); }
    const perform = async () => {
    try {
      // Polling must not close selectors or drop an explicit click. Reserve
      // one foreground operation while the bounded read finishes; do not retry
      // mutations or carry a queued operation into another owner/chat mount.
      if (!background && backgroundRead.current) await backgroundRead.current;
      if (!alive.current) return;
      if (!background) setMessage("");
      await operation();
    }
    catch (error) {
      if (alive.current) {
        const storageFailure = error instanceof Error && isPairingStorageErrorCode(error.message) ? error.message : null;
        if (storageFailure && pairing) onRuntimeBinding?.(null, pairing.id);
        if (storageFailure && previous) { setPreviousChecked(false); onRuntimeBinding?.(null, previous.pairing.id); }
        setMessage(storageFailure ? PAIRING_STORAGE_ERRORS[storageFailure]
          : error instanceof Error && error.message === "pairing_account_link_required"
            ? "The account link for this exact task could not be verified. Keep this request while account and delegation status is checked, then reconcile it."
          : error instanceof Error && error.message === "pairing_device_identity_mismatch"
            ? "This request does not match the installed device. Keep it until the device and task identity are checked, or cancel it to review again."
          : error instanceof Error && error.message === "pairing_device_trust_required"
            ? "Device trust is not current. Review device trust in Agent Access, then reconcile this same request."
          : error instanceof Error && error.message === "pairing_registration_expired"
            ? "This task's registration expired. Ask the same task to refresh its registration, then use Cancel request and review again, refresh registered tasks, and approve the reviewed task again. Registration expiry does not revoke device trust."
          : error instanceof Error && error.message === "pairing_environment_unavailable"
            ? "The selected run is no longer available. Cancel this request to review another run."
            : error instanceof Error && error.message === "pairing_request_cancelled"
              ? "This request was cancelled. Use Cancel request and review again to confirm recovery."
              : "The request could not be confirmed. Keep this selection and reconcile the same invitation before creating another.");
      }
    }
    finally { if (!background) { inFlight.current = false; if (alive.current) setBusy(false); } }
    };
    const pending = perform();
    if (background) backgroundRead.current = pending;
    try { await pending; }
    finally { if (background && backgroundRead.current === pending) backgroundRead.current = null; }
  };
  const refreshTasks = () => run(async () => {
    const result = await listPairingDestinations();
    if (alive.current) { setDestinations(result.destinations.filter(item => item.destination.profileId === profileId));
      setAutomaticAvailable(result.automatic_delivery_available === true); }
  });
  const acceptStatus = (value: PairingStatus, expectedId?: string) => {
    if (!destinationDigest.current || value.destinationDigest !== destinationDigest.current ||
        (expectedId && value.id !== expectedId) || value.chatId !== chatId ||
        JSON.stringify(value.environment) !== JSON.stringify(review.environment) ||
        JSON.stringify(value.replacement) !== JSON.stringify(review.replacement)) throw new Error("pairing_scope_mismatch");
    if (!alive.current) return;
    setPairing(value);
    if (value.state !== "pending") setInvitation(null);
    if (["revoked", "expired", "superseded"].includes(value.state)) onRuntimeBinding?.(null, value.id);
    if (value.state === "accepted" && value.replacement) onRuntimeBinding?.(null, value.replacement.pairingId);
  };
  const refreshPrevious = async () => {
    if (!previous || !review.replacement) return;
    let value: PairingStatus;
    try { value = (await inspectPairing(previous.pairing.id)).pairing; }
    catch (error) {
      if (alive.current) { setPreviousChecked(false); onRuntimeBinding?.(null, previous.pairing.id); }
      throw error;
    }
    if (value.id !== review.replacement.pairingId || value.chatId !== chatId ||
        value.destinationDigest !== previous.pairing.destinationDigest ||
        JSON.stringify(value.environment) !== JSON.stringify(previous.review.environment) ||
        JSON.stringify(value.replacement) !== JSON.stringify(previous.review.replacement)) throw new Error("pairing_previous_scope_mismatch");
    if (!alive.current) return;
    setPrevious({ ...previous, pairing: value }); setPreviousChecked(true);
    if (value.state !== "accepted") onRuntimeBinding?.(null, value.id);
    else if (!pairing?.acceptedAt) {
      try {
        const binding = await inspectPairedRuntimeBinding(value, profileId);
        if (alive.current) onRuntimeBinding?.(binding, value.id);
      } catch { if (alive.current) onRuntimeBinding?.(null, value.id); }
    }
    return value;
  };
  const refreshPairing = async (id: string) => {
    const value = (await inspectPairing(id)).pairing;
    acceptStatus(value, id);
    if (!alive.current || value.state !== "accepted") return;
    try {
      const binding = await inspectPairedRuntimeBinding(value, profileId);
      if (!alive.current) return;
      setRuntimeMessage(binding.continuation_transport === "unavailable"
        ? "Session binding recovered. The AI task is currently unavailable."
        : "Session binding recovered. Ready up can check the environment prerequisites.");
      onRuntimeBinding?.(binding, value.id);
    } catch {
      if (alive.current) {
        onRuntimeBinding?.(null, value.id);
        setRuntimeMessage("Pairing accepted; the matching runtime binding is not available yet. The same AI task must recover this pairing through the harness.");
      }
    }
  };
  useEffect(() => {
    void run(async () => {
      // A registration can expire independently of an accepted grant. Recover
      // the owner's pairing status even if listing registrations fails.
      const results = await Promise.allSettled([
        (async () => {
          const result = await listPairingDestinations();
          if (alive.current) { setDestinations(result.destinations.filter(item => item.destination.profileId === profileId));
      setAutomaticAvailable(result.automatic_delivery_available === true); }
        })(),
        (async () => {
          await refreshPrevious();
          if (!submitted) return;
          let id = localStorage.getItem(`${storageKey}:pairing`);
          if (!id) {
            const recovered = (await reconcilePairingInvitation(review.requestId)).pairing;
            if (!recovered) return;
            acceptStatus(recovered);
            id = recovered.id;
            if (!alive.current) return;
            localStorage.setItem(`${storageKey}:pairing`, id);
          }
          await refreshPairing(id);
        })(),
      ]);
      const storageFailure = results.find(result => result.status === "rejected" &&
        result.reason instanceof Error && isPairingStorageErrorCode(result.reason.message));
      if (storageFailure?.status === "rejected") throw storageFailure.reason;
      if (results.some(result => result.status === "rejected")) throw new Error("pairing_recovery_unavailable");
    });
  }, []);
  useEffect(() => {
    if ((!pairing || !["pending", "accepted"].includes(pairing.state)) && !previous) return;
    const timer = setInterval(() => {
      setClock(Date.now());
      void run(async () => { await refreshPrevious(); if (pairing) await refreshPairing(pairing.id); }, true);
    }, 5000);
    return () => clearInterval(timer);
  }, [pairing?.id, pairing?.state, previous?.pairing.id, review.replacement?.pairingId]);
  const beginReplacement = () => run(async () => {
    if (!pairing || pairing.state !== "accepted") return;
    const value = (await inspectPairing(pairing.id)).pairing;
    acceptStatus(value, pairing.id);
    if (!alive.current || value.state !== "accepted") return;
    const saved = { review, pairing: value };
    const next = { ...review, requestId: crypto.randomUUID(), replacement: { pairingId: value.id, revision: value.revision } };
    // Save recovery metadata first. If interrupted before removing the original
    // review, its normal request reconciliation still recovers the old grant.
    localStorage.setItem(`${storageKey}:previous`, JSON.stringify(saved));
    localStorage.setItem(`${storageKey}:draft`, JSON.stringify(next));
    localStorage.removeItem(`${storageKey}:pairing`);
    localStorage.removeItem(storageKey);
    setPrevious(saved); setPreviousChecked(true); setReview(next); setPairing(null);
    setSubmitted(false); setApproved(false); setInvitation(null); setRuntimeMessage("");
  });
  const returnToPrevious = () => run(async () => {
    if (!previous || (submitted && (!pairing || ["pending", "accepted"].includes(pairing.state)))) return;
    const value = await refreshPrevious();
    if (!value || !alive.current) return;
    localStorage.setItem(`${storageKey}:destination`, value.destinationDigest);
    localStorage.setItem(storageKey, JSON.stringify(previous.review));
    localStorage.setItem(`${storageKey}:pairing`, value.id);
    localStorage.removeItem(`${storageKey}:draft`); localStorage.removeItem(`${storageKey}:previous`);
    destinationDigest.current = value.destinationDigest;
    setReview(previous.review); setPairing(value); setPrevious(null); setPreviousChecked(false);
    setSubmitted(true); setApproved(false); setInvitation(null); setRuntimeMessage("");
  });
  const reviewAfterPreviousEnded = () => run(async () => {
    if (submitted || !previous || !review.replacement) return;
    // A displayed deadline is not authority. Reinspect the exact prior grant
    // before releasing only this unsubmitted local replacement review.
    const value = await refreshPrevious();
    if (!alive.current || !value || !["expired", "revoked", "superseded"].includes(value.state)) return;
    const next = { ...review, replacement: undefined, requestId: crypto.randomUUID() };
    localStorage.setItem(storageKey + ":draft", JSON.stringify(next));
    localStorage.removeItem(storageKey + ":previous");
    setReview(next); setPrevious(null); setPreviousChecked(false); setApproved(false);
    setInvitation(null); setRuntimeMessage(""); setDeliveryMessage("");
    setMessage("The previous pairing has ended. Review this selection and approve a new invitation when ready.");
  });
  const change = (patch: Partial<PairingInvitationRequest>) => {
    if (submitted) return;
    if (patch.registrationId !== undefined) {
      const digest = destinations.find(item => item.registrationId === patch.registrationId)?.destinationDigest ?? null;
      destinationDigest.current = digest;
      try {
        if (digest) localStorage.setItem(`${storageKey}:destination`, digest);
        else localStorage.removeItem(`${storageKey}:destination`);
      } catch { setMessage("Browser storage is unavailable. This task selection cannot be recovered."); }
    }
    setReview(current => ({ ...current, ...patch, requestId: crypto.randomUUID() })); setApproved(false);
  };
  const deliver = async (value: PairingStatus) => {
    if (!alive.current || value.state !== "pending" || review.invitationDelivery !== "automatic") return;
    setDeliveryMessage("Delivering the approved invitation…");
    try {
      const result = await deliverPairingInvitation(value);
      if (!alive.current) return;
      setDeliveryMessage(result.state === "delivered"
        ? "Invitation delivered. Waiting for authenticated task acceptance."
        : "Delivery is not confirmed. Reconcile delivery or use Copy invitation.");
    } catch {
      if (alive.current) setDeliveryMessage("Delivery is not confirmed. Reconcile delivery or use Copy invitation.");
    }
  };
  const issue = () => run(async () => {
    // Persist before sending: a reload can reconcile this exact reviewed request.
    if (!destinationDigest.current) throw new Error("pairing_reviewed_destination_missing");
    if (submitted) {
      const prior = (await reconcilePairingInvitation(review.requestId)).pairing;
      // Owner/chat changes unmount this review. Even an absent lookup must not
      // continue into issuance using the browser's now-current account cookie.
      if (!alive.current) return;
      if (prior) {
        acceptStatus(prior);
        if (!alive.current) return;
        localStorage.setItem(`${storageKey}:pairing`, prior.id);
        if (prior.state !== "pending") { await refreshPairing(prior.id); return; }
      }
    }
    localStorage.setItem(`${storageKey}:destination`, destinationDigest.current);
    if (!submitted) localStorage.removeItem(`${storageKey}:pairing`);
    localStorage.setItem(storageKey, JSON.stringify(review));
    setSubmitted(true);
    const result = await issuePairingInvitation(review);
    if (!alive.current) return;
    acceptStatus(result.pairing);
    localStorage.setItem(`${storageKey}:pairing`, result.pairing.id);
    setInvitation(result.invitation ? JSON.stringify(result.invitation) : null);
    if (result.pairing.state === "accepted") await refreshPairing(result.pairing.id);
    else await deliver(result.pairing);
  });
  const cancelRequest = () => run(async () => {
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
  usePairingRecoveryStorage(profileId, chatId);
  const selected = destinations.find(item => item.registrationId === review.registrationId);
  useEffect(() => {
    if (submitted || !review.registrationId || selected || !destinationDigest.current) return;
    const replacements = destinations.filter(item => item.destinationDigest === destinationDigest.current);
    if (replacements.length !== 1) return;
    const replacement = replacements[0];
    setReview(current => ({ ...current, registrationId: replacement.registrationId, requestId: crypto.randomUUID() }));
    setApproved(false);
    setMessage("The same authenticated AI task refreshed its registration. Review it again, then approve pairing when ready.");
  }, [destinations, review.registrationId, selected, submitted]);
  const runChoice = review.environment ?? environment ?? lastOfferedEnvironment;
  const currentEnvironment = environment ?? lastOfferedEnvironment;
  const differentRunAvailable = review.environment && currentEnvironment &&
    (review.environment.roomId !== currentEnvironment.roomId || review.environment.runId !== currentEnvironment.runId);
  const invitationElapsed = pairing && clock >= Math.min(Date.parse(pairing.invitationExpiresAt), Date.parse(pairing.pairingExpiresAt));
  const approvalBlocker = submitted || busy ? null
    : !selected
      ? review.registrationId
        ? "The selected registration is no longer current. Refresh registered tasks; a matching refreshed task will be selected for a new review."
        : "Choose the exact registered AI task first."
      : !approved
        ? "Review the task and check the pairing approval box."
        : Boolean(review.replacement) && (!previousChecked || previous?.pairing.state !== "accepted" || previous.pairing.revision !== review.replacement?.revision)
          ? "The previous pairing must be checked and still accepted before this replacement can be approved."
          : null;
  return <section aria-label="Durable task pairing" className="mt-4 rounded border border-cyan-300/20 p-4 text-xs">
    <h3 className="font-semibold">Pair an existing AI task</h3>
    <p>Pairing permits exact-chat steering. Environment action permission is separate. Task registration does not mean the AI is currently active.</p>
    <label className="block mt-3">Registered AI task
      <select value={review.registrationId} disabled={busy || submitted} onChange={e => change({ registrationId: e.target.value })}>
        <option value="">Choose an exact task</option>
        {review.registrationId && !selected && <option value={review.registrationId}>Previously selected task — refresh registration</option>}
        {destinations.map(item => <option key={item.registrationId} value={item.registrationId}>{item.destination.taskId} · {item.destination.clientId}</option>)}
      </select>
    </label>
    <button type="button" disabled={busy} onClick={() => void refreshTasks()}>Refresh registered tasks</button>
    {!destinations.length && <p>No current registration found. The intended AI task must register through the harness before you approve.</p>}
    <p>Helix chat: {chatId}</p>
    {review.replacement && <div className="my-3 rounded border border-amber-300/30 p-3" aria-label="Replacement review">
      <p>Replace pairing {review.replacement.pairingId}, reviewed revision {review.replacement.revision}.</p>
      <p>The previous pairing stops working only when the selected task accepts this replacement. Revoking or expiring the replacement will not restore it.</p>
      <p>Previous pairing: {pairing?.acceptedAt ? "superseded by this pairing" : previousChecked && previous ? previous.pairing.state : "status not yet checked"}.</p>
      {previous && <p>Previous pairing deadline: {previous.pairing.pairingExpiresAt}.</p>}
      {!submitted && previousChecked && previous && ["expired", "revoked", "superseded"].includes(previous.pairing.state) && <div>
        <p>The previous pairing has ended, so this replacement cannot be approved. Start a new review to continue.</p>
        <button type="button" disabled={busy}
          className="my-2 min-h-11 rounded-md border border-cyan-300/40 px-3 py-2 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
          onClick={() => void reviewAfterPreviousEnded()}>Review a new invitation</button>
      </div>}
      {previous && (!submitted || (pairing && !["pending", "accepted"].includes(pairing.state))) &&
        <button type="button" disabled={busy} onClick={() => void returnToPrevious()}>Return to previous pairing</button>}
    </div>}
    {selected && <p>Task identity declared by the authenticated client: {selected.destination.taskId}</p>}
    <label className="block">Invitation expires after
      <select value={review.invitationSeconds} disabled={busy || submitted} onChange={e => change({ invitationSeconds: Number(e.target.value) as 300 | 900 | 3600 })}>
        <option value={300}>5 minutes</option><option value={900}>15 minutes</option><option value={3600}>60 minutes</option>
      </select>
    </label>
    <label className="block">Pairing duration
      <select value={review.pairingSeconds} disabled={busy || submitted} onChange={e => change({ pairingSeconds: Number(e.target.value) as 3600 | 28800 | 86400 })}>
        <option value={3600}>1 hour</option><option value={28800}>8 hours</option><option value={86400}>24 hours</option>
      </select>
    </label>
    {runChoice && <label className="block"><input type="checkbox" checked={Boolean(review.environment)} disabled={busy || submitted}
      onChange={e => change({ environment: e.target.checked ? runChoice : null })} /> Include environment run {runChoice.runId} in room {runChoice.roomId}</label>}
    {runChoice && !environment && <p>Last verified run; availability is checked again when you approve. Keeping this choice does not grant permission.</p>}
    {!submitted && differentRunAvailable && <button type="button" disabled={busy}
      className="my-2 min-h-11 rounded-md border border-cyan-300/40 px-3 py-2 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
      onClick={() => change({ environment: null })}>
      Review current environment run {currentEnvironment.runId}
    </button>}
    {(automaticAvailable || review.invitationDelivery === "automatic") && <label className="block">Invitation delivery
      <select value={review.invitationDelivery ?? "copy"} disabled={busy || submitted}
        onChange={e => change({ invitationDelivery: e.target.value === "automatic" ? "automatic" : undefined })}>
        <option value="copy">Copy invitation</option>
        <option value="automatic" disabled={!automaticAvailable}>Send to the selected task automatically</option>
      </select>
    </label>}
    <label className="block mt-3"><input type="checkbox" checked={approved} disabled={busy || submitted}
      data-helix-control-id="workstation.panel.agent-access.durable-task-pairing.approve-exact-task"
      data-helix-interaction-kind="human_only" data-helix-authority-state="client_local"
      onChange={e => setApproved(e.target.checked)} /> I approve pairing this exact task and chat for the selected duration.</label>
    {approvalBlocker && <p id="pairing-approval-blocker" className="mt-3 text-amber-100">{approvalBlocker}</p>}
    {(!pairing || pairing.state === "pending") && <button type="button"
      data-helix-control-id="workstation.panel.agent-access.durable-task-pairing.issue-invitation"
      data-helix-interaction-kind="human_only" data-helix-authority-state="client_local"
      className="my-3 inline-flex min-h-11 items-center justify-center rounded-md border border-cyan-200 bg-cyan-300 px-4 py-2 text-left text-sm font-semibold text-slate-950 shadow-sm hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:opacity-50" aria-describedby={approvalBlocker ? "pairing-approval-blocker" : undefined} disabled={busy || (!submitted && (!approved || !selected ||
      (Boolean(review.replacement) && (!previousChecked || previous?.pairing.state !== "accepted" || previous.pairing.revision !== review.replacement?.revision))))} onClick={() => void issue()}>
      {submitted ? "Reconcile invitation" : "Approve pairing and create invitation"}
    </button>}
    {submitted && (!pairing || pairing.state === "pending") && <div>
      <p>Canceling also revokes any pairing already created by this request. A replacement does not restore an earlier superseded pairing.</p>
      <button type="button" className="my-2 min-h-11 rounded-md border border-slate-400 px-3 py-2 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
        disabled={busy} onClick={() => void cancelRequest()}>Cancel request and review again</button>
    </div>}
    {review.invitationDelivery === "automatic"
      ? <p>You approve sending this invitation to the exact selected task. The server verifies that destination before issuance. Delivery does not accept the pairing.</p>
      : <p>Use Copy invitation and send it to the selected task for authenticated acceptance.{!automaticAvailable && " Automatic delivery is unavailable for this connection."}</p>}
    {pairing?.state === "pending" && review.invitationDelivery === "automatic" && <>
      {deliveryMessage && <p>{deliveryMessage}</p>}
      <button type="button" disabled={busy || Boolean(invitationElapsed)} onClick={() => void run(async () => { await deliver(pairing); })}>Reconcile delivery</button>
    </>}
    {invitation && !invitationElapsed && <ReasoningClaimHandle value={invitation} id="durable-pairing-invitation" label="Pairing invitation" />}
    {pairing?.state === "pending" && invitationElapsed && <p>The invitation deadline has elapsed on this device. Checking server status; copying is unavailable.</p>}
    {pairing && <>
      <p role="status">Pairing: {pairing.state}. Current task availability has not been verified.</p>
      {pairing.state === "accepted" && runtimeMessage && <p>{runtimeMessage}</p>}
      <p>Invitation deadline: {pairing.invitationExpiresAt}. Pairing deadline: {pairing.pairingExpiresAt}.</p>
      {pairing.state === "accepted" && <button type="button" disabled={busy} onClick={() => void beginReplacement()}>Review replacement pairing</button>}
      <button type="button" disabled={busy} onClick={() => void run(async () => {
        await refreshPairing(pairing.id);
      })}>Check acceptance</button>
      <button type="button" disabled={busy || pairing.state === "revoked"} onClick={() => void run(async () => {
        const result = await revokePairing(pairing.id);
        acceptStatus(result.pairing, pairing.id);
      })}>Revoke pairing</button>
      {(["revoked", "expired", "superseded"].includes(pairing.state)) && <button type="button" disabled={busy} onClick={() => {
        try { localStorage.removeItem(storageKey); localStorage.removeItem(`${storageKey}:pairing`); }
        catch { setMessage("Browser storage is unavailable. Restore storage before starting another invitation."); return; }
        setReview(current => ({ ...current, replacement: undefined, requestId: crypto.randomUUID() }));
        setPrevious(null); setPreviousChecked(false);
        setPairing(null); setInvitation(null); setSubmitted(false); setApproved(false);
      }}>Review a new invitation</button>}
    </>}
    {message && <p role="alert">{message}</p>}
  </section>;
}
