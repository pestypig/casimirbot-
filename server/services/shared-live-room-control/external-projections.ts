import {
  HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_RUN_BIND_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_RUN_BIND_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_RECEIPT_SCHEMA,
  type HelixSharedLiveRoomChatBindingUnbindReceipt,
  type HelixSharedLiveRoomChatBindingClaimReceipt,
  type HelixSharedLiveRoomRunBindReceipt,
  type HelixSharedLiveRoomRunUnbindReceipt,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import type {
  SharedLiveRoomBindingRevocationResult,
  SharedLiveRoomRunChatBinding,
  SharedLiveRoomRunRoomBinding,
} from "./binding-store";
import { SharedLiveRoomControlError } from "./service";

export const projectSharedLiveRoomRunBindingReceipt = (
  binding: SharedLiveRoomRunRoomBinding,
): HelixSharedLiveRoomRunBindReceipt => {
  if (binding.status !== "active") {
    throw new SharedLiveRoomControlError(
      500,
      "internal_error",
      "The durable run-room binding is not active.",
    );
  }
  return {
    schema: HELIX_SHARED_LIVE_ROOM_RUN_BIND_RECEIPT_SCHEMA,
    api_version: HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
    ok: true,
    operation: HELIX_SHARED_LIVE_ROOM_RUN_BIND_CAPABILITY,
    content_role: "room_control_receipt_not_assistant_answer",
    binding_ref: binding.bindingId,
    run_id: binding.runId,
    room_id: binding.roomId,
    binding_status: "active",
    version: binding.version,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const projectSharedLiveRoomChatBindingClaimReceipt = (
  binding: SharedLiveRoomRunChatBinding,
): HelixSharedLiveRoomChatBindingClaimReceipt => {
  if (binding.status !== "active" || !binding.runId) {
    throw new SharedLiveRoomControlError(
      500,
      "internal_error",
      "The durable run-chat binding is not active.",
    );
  }
  return {
    schema: HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_RECEIPT_SCHEMA,
    api_version: HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
    ok: true,
    operation: HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_CAPABILITY,
    content_role: "room_control_receipt_not_assistant_answer",
    binding_ref: binding.bindingId,
    run_id: binding.runId,
    binding_status: "active",
    context_snapshot_ref: binding.contextSnapshotRef,
    context_message_count: binding.contextMessageCount,
    context_char_count: binding.contextCharCount,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const revocationReceiptBase = {
  api_version: HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
  ok: true,
  content_role: "room_control_receipt_not_assistant_answer",
  binding_status: "revoked",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
} as const;

export const projectSharedLiveRoomRunUnbindReceipt = (
  result: SharedLiveRoomBindingRevocationResult<SharedLiveRoomRunRoomBinding>,
): HelixSharedLiveRoomRunUnbindReceipt => ({
  ...revocationReceiptBase,
  schema: HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_RECEIPT_SCHEMA,
  operation: HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_CAPABILITY,
  binding_ref: result.binding.bindingId,
  revocation_status: result.revocationStatus,
});

export const projectSharedLiveRoomChatBindingUnbindReceipt = (
  result: SharedLiveRoomBindingRevocationResult<SharedLiveRoomRunChatBinding>,
): HelixSharedLiveRoomChatBindingUnbindReceipt => ({
  ...revocationReceiptBase,
  schema: HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_RECEIPT_SCHEMA,
  operation: HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_CAPABILITY,
  binding_ref: result.binding.bindingId,
  revocation_status: result.revocationStatus,
});
