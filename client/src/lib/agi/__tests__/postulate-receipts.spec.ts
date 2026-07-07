/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EssenceProposal } from "@shared/proposals";
import {
  CLAIMABLE_POSTULATE_RECEIPTS_EVENT,
  buildClaimablePostulateReceipt,
  readClaimablePostulateReceipts,
  rememberClaimablePostulateReceipt,
  updateClaimablePostulateReceiptStatus,
} from "@/lib/agi/proposals";

const makePostulateProposal = (overrides: Partial<EssenceProposal> = {}): EssenceProposal => ({
  id: "postulate-1",
  kind: "postulate",
  status: "accepted_rewarded",
  source: "agent",
  title: "Constructive badge graph postulate",
  summary: "A constructive postulate for review.",
  explanation: "Scored as a review candidate.",
  target: {
    type: "postulate-board",
    domain: "physics",
    badgeGraphLocatorRefs: ["theory-badge-graph:/warp/qei/residual"],
  },
  patchKind: "badge-graph-suggestion",
  patch: "{}",
  rewardTokens: 250,
  ownerId: null,
  safetyStatus: "passed",
  safetyScore: 0.92,
  safetyReport: "accepted_for_structured_review",
  createdAt: "2026-07-07T04:00:00.000Z",
  updatedAt: "2026-07-07T04:00:00.000Z",
  createdForDay: "2026-07-07",
  metadata: {
    postulate: {
      receiptId: "receipt-1",
      receiptIssuedAt: "2026-07-07T04:00:00.000Z",
      receiptIntegrityHash: "abc123",
      rewardCreditStatus: "claim_pending",
      receiptClaimStatus: "unclaimed",
    },
  },
  ...overrides,
});

describe("postulate claimable receipt helpers", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("builds claimable anonymous receipts with receipt integrity fields", () => {
    const receipt = buildClaimablePostulateReceipt(makePostulateProposal());

    expect(receipt).toEqual(expect.objectContaining({
      proposalId: "postulate-1",
      receiptId: "receipt-1",
      receiptIssuedAt: "2026-07-07T04:00:00.000Z",
      receiptIntegrityHash: "abc123",
      rewardTokens: 250,
      score: 0.92,
      status: "claim_pending",
    }));
  });

  it("persists, dedupes, and broadcasts claimable receipt changes", () => {
    const listener = vi.fn();
    window.addEventListener(CLAIMABLE_POSTULATE_RECEIPTS_EVENT, listener);

    const first = buildClaimablePostulateReceipt(makePostulateProposal())!;
    rememberClaimablePostulateReceipt(first);
    rememberClaimablePostulateReceipt({ ...first, title: "Updated title" });

    expect(readClaimablePostulateReceipts()).toEqual([
      expect.objectContaining({ proposalId: "postulate-1", title: "Updated title" }),
    ]);
    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener(CLAIMABLE_POSTULATE_RECEIPTS_EVENT, listener);
  });

  it("marks stored receipts claimed without losing issued receipt metadata", () => {
    const receipt = buildClaimablePostulateReceipt(makePostulateProposal())!;
    rememberClaimablePostulateReceipt(receipt);

    updateClaimablePostulateReceiptStatus("postulate-1", "claimed", {
      receiptIssuedAt: "2026-07-07T04:00:00.000Z",
      receiptIntegrityHash: "abc123",
    });

    expect(readClaimablePostulateReceipts()).toEqual([
      expect.objectContaining({
        proposalId: "postulate-1",
        status: "claimed",
        receiptIssuedAt: "2026-07-07T04:00:00.000Z",
        receiptIntegrityHash: "abc123",
      }),
    ]);
  });

  it("does not build browser claim receipts for owned non-reward postulates", () => {
    const receipt = buildClaimablePostulateReceipt(makePostulateProposal({
      ownerId: "profile:owner",
      rewardTokens: 0,
      metadata: {
        postulate: {
          receiptId: "receipt-owned",
          rewardCreditStatus: "none",
          receiptClaimStatus: "unclaimed",
        },
      },
    }));

    expect(receipt).toBeNull();
  });
});
