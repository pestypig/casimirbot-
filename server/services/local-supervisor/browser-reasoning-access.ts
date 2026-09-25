import crypto from "node:crypto";
import { DurableReasoningBindingAccess } from "./durable-reasoning-binding-access";
import { HelixReasoningTaskBindingError, type HelixReasoningTaskBindingStore } from "./reasoning-task-binding-store";
import { createNativePairingLedgerRepository, type PairingLedgerRepository } from "./pairing-ledger-repository";
import type { DurableSteeringRepository } from "./durable-steering-repository";
import { resolvePairingAccountIssuer } from "./pairing-account-authority";
import { installedSecurityStore } from "../helix-account/installed-security-store";
import { helixAgentAccountLinkStore } from "../helix-account/agent-account-link-store";
import { getAccountSessionById } from "../helix-account/account-session-store";

type Session = { session_id: string; profile: { profile_id: string } };

/** Browser source reads use the same installed-device and account-link boundary
 * as browser steering. Never derive task or installation authority from HTTP fields. */
export function createBrowserDurableReasoningAccess(session: Session,
  store: HelixReasoningTaskBindingStore, dependencies: {
    readPairingDeviceTrust?: typeof installedSecurityStore.inspectFullHarnessTrust;
    bindingStore?: Pick<typeof helixAgentAccountLinkStore, "listBindings">;
    resolveSession?: (sessionId?: string | null) => Promise<Session | null>;
    pairingLedgerRepository?: PairingLedgerRepository;
    durableSteeringRepository?: DurableSteeringRepository;
  } = {}): DurableReasoningBindingAccess {
  return new DurableReasoningBindingAccess(store, async destination => {
    const profileId = session.profile.profile_id;
    const deviceId = process.env.HELIX_DESKTOP_DEVICE_ID?.trim();
    const installationId = deviceId
      ? `installation:${crypto.createHash("sha256").update(deviceId).digest("hex")}` : null;
    if (destination.profileId !== profileId || !deviceId || destination.installationId !== installationId) {
      throw new HelixReasoningTaskBindingError("pairing_device_identity_mismatch", 403);
    }
    const trust = await (dependencies.readPairingDeviceTrust ??
      installedSecurityStore.inspectFullHarnessTrust.bind(installedSecurityStore))({ profileId, deviceId });
    if (!trust.trusted) throw new HelixReasoningTaskBindingError("pairing_device_trust_required", 403);
    const linked = await (dependencies.bindingStore ?? helixAgentAccountLinkStore).listBindings({
      session: { sessionId: session.session_id, profileId },
    });
    if (!await resolvePairingAccountIssuer({ destination, profileId, deviceId, bindings: linked.bindings,
      delegatedAccountSessionId: trust.delegated_account_session_id,
      resolveSession: dependencies.resolveSession ?? getAccountSessionById })) {
      throw new HelixReasoningTaskBindingError("pairing_account_link_required", 403);
    }
  }, async () => dependencies.pairingLedgerRepository ?? await createNativePairingLedgerRepository(),
  undefined, dependencies.durableSteeringRepository ? async () => dependencies.durableSteeringRepository! : undefined);
}
