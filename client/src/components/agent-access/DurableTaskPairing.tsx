import React, { useEffect, useRef, useState } from "react";
import { inspectPairing, inspectPairedRuntimeBinding, issuePairingInvitation, listPairingDestinations, revokePairing, reconcilePairingInvitation,
  pairingInvitationRequestSchema, type PairingInvitationRequest, type PairingStatus,
  type RegisteredPairingDestination } from "../../lib/agent-access/durablePairing";
import ReasoningClaimHandle from "./ReasoningClaimHandle";
import type { BrowserReasoningBinding } from "../../lib/agent-access/reasoningTaskBinding";

type Props = { profileId: string; chatId: string; environment?: { roomId: string; runId: string } | null;
  onRuntimeBinding?: (binding: BrowserReasoningBinding | null, pairingId: string) => void };
// Remount on owner/chat changes so an old asynchronous response cannot enter a
// different account's UI. Storage contains reviewed metadata, never the secret.
export default function DurableTaskPairing(props: Props) {
  return <PairingControls key={JSON.stringify([props.profileId, props.chatId])} {...props} />;
}
function PairingControls({ profileId, chatId, environment, onRuntimeBinding }: Props) {
  const storageKey = `helix.pairing.review.v1:${JSON.stringify([profileId, chatId])}`;
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
  const [submitted, setSubmitted] = useState(() => {
    try {
      const saved = pairingInvitationRequestSchema.safeParse(JSON.parse(localStorage.getItem(storageKey) ?? "null"));
      return saved.success && saved.data.chatId === chatId;
    } catch { return false; }
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [invitation, setInvitation] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now);
  const [runtimeMessage, setRuntimeMessage] = useState("");
  const alive = useRef(true);
  const destinationDigest = useRef<string | null>(null);
  if (destinationDigest.current === null) {
    try { destinationDigest.current = localStorage.getItem(`${storageKey}:destination`); } catch { /* Fail closed below. */ }
  }
  const inFlight = useRef(false);
  useEffect(() => {
    if (!review.registrationId || submitted) return;
    try { localStorage.setItem(`${storageKey}:draft`, JSON.stringify(review)); }
    catch { setMessage("Browser storage is unavailable. This selection cannot survive a reload."); }
  }, [review, submitted, storageKey]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = async (operation: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try { await operation(); }
    catch { if (alive.current) setMessage("The request could not be confirmed. Keep this selection and reconcile the same invitation before creating another."); }
    finally { inFlight.current = false; if (alive.current) setBusy(false); }
  };
  const refreshTasks = () => run(async () => {
    const result = await listPairingDestinations();
    if (alive.current) setDestinations(result.destinations.filter(item => item.destination.profileId === profileId));
  });
  const acceptStatus = (value: PairingStatus, expectedId?: string) => {
    if (!destinationDigest.current || value.destinationDigest !== destinationDigest.current ||
        (expectedId && value.id !== expectedId) || value.chatId !== chatId ||
        JSON.stringify(value.environment) !== JSON.stringify(review.environment)) throw new Error("pairing_scope_mismatch");
    if (!alive.current) return;
    setPairing(value);
    if (value.state !== "pending") setInvitation(null);
    if (value.state === "revoked" || value.state === "expired") onRuntimeBinding?.(null, value.id);
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
      if (alive.current) setRuntimeMessage("Pairing accepted; the matching runtime binding is not available yet. The same AI task must recover this pairing through the harness.");
    }
  };
  useEffect(() => {
    void run(async () => {
      // A registration can expire independently of an accepted grant. Recover
      // the owner's pairing status even if listing registrations fails.
      const results = await Promise.allSettled([
        (async () => {
          const result = await listPairingDestinations();
          if (alive.current) setDestinations(result.destinations.filter(item => item.destination.profileId === profileId));
        })(),
        (async () => {
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
      if (results.some(result => result.status === "rejected")) throw new Error("pairing_recovery_unavailable");
    });
  }, []);
  useEffect(() => {
    if (!pairing || !["pending", "accepted"].includes(pairing.state)) return;
    const timer = setInterval(() => {
      setClock(Date.now());
      void run(async () => { await refreshPairing(pairing.id); });
    }, 5000);
    return () => clearInterval(timer);
  }, [pairing?.id, pairing?.state]);
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
  const issue = () => run(async () => {
    // Persist before sending: a reload can reconcile this exact reviewed request.
    if (!destinationDigest.current) throw new Error("pairing_reviewed_destination_missing");
    if (submitted) {
      const prior = (await reconcilePairingInvitation(review.requestId)).pairing;
      if (prior) {
        acceptStatus(prior);
        if (!alive.current) return;
        localStorage.setItem(`${storageKey}:pairing`, prior.id);
        if (prior.state !== "pending") { await refreshPairing(prior.id); return; }
      }
    }
    localStorage.setItem(`${storageKey}:destination`, destinationDigest.current);
    localStorage.setItem(storageKey, JSON.stringify(review));
    setSubmitted(true);
    const result = await issuePairingInvitation(review);
    if (!alive.current) return;
    acceptStatus(result.pairing);
    localStorage.setItem(`${storageKey}:pairing`, result.pairing.id);
    setInvitation(result.invitation ? JSON.stringify(result.invitation) : null);
    if (result.pairing.state === "accepted") await refreshPairing(result.pairing.id);
  });
  const selected = destinations.find(item => item.registrationId === review.registrationId);
  const runChoice = review.environment ?? environment;
  const invitationElapsed = pairing && clock >= Math.min(Date.parse(pairing.invitationExpiresAt), Date.parse(pairing.pairingExpiresAt));
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
    <label className="block mt-3"><input type="checkbox" checked={approved} disabled={busy || submitted}
      onChange={e => setApproved(e.target.checked)} /> I approve pairing this exact task and chat for the selected duration.</label>
    {(!pairing || pairing.state === "pending") && <button type="button" disabled={busy || (!submitted && (!approved || !selected))} onClick={() => void issue()}>
      {submitted ? "Reconcile invitation" : "Approve pairing and create invitation"}
    </button>}
    <p>Automatic delivery to this AI application has not been verified. Use Copy invitation and send it to the selected task for authenticated acceptance.</p>
    {invitation && !invitationElapsed && <ReasoningClaimHandle value={invitation} id="durable-pairing-invitation" label="Pairing invitation" />}
    {pairing?.state === "pending" && invitationElapsed && <p>The invitation deadline has elapsed on this device. Checking server status; copying is unavailable.</p>}
    {pairing && <>
      <p role="status">Pairing: {pairing.state}. Current task availability has not been verified.</p>
      {pairing.state === "accepted" && runtimeMessage && <p>{runtimeMessage}</p>}
      <p>Invitation deadline: {pairing.invitationExpiresAt}. Pairing deadline: {pairing.pairingExpiresAt}.</p>
      <button type="button" disabled={busy} onClick={() => void run(async () => {
        await refreshPairing(pairing.id);
      })}>Check acceptance</button>
      <button type="button" disabled={busy || pairing.state === "revoked"} onClick={() => void run(async () => {
        const result = await revokePairing(pairing.id);
        acceptStatus(result.pairing, pairing.id);
      })}>Revoke pairing</button>
      {(pairing.state === "revoked" || pairing.state === "expired") && <button type="button" disabled={busy} onClick={() => {
        try { localStorage.removeItem(storageKey); localStorage.removeItem(`${storageKey}:pairing`); }
        catch { setMessage("Browser storage is unavailable. Restore storage before starting another invitation."); return; }
        setReview(current => ({ ...current, requestId: crypto.randomUUID() }));
        setPairing(null); setInvitation(null); setSubmitted(false); setApproved(false);
      }}>Review a new invitation</button>}
    </>}
    {message && <p role="alert">{message}</p>}
  </section>;
}
