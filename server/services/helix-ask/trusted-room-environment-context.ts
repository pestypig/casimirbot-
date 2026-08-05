import type { ExplicitCapabilityExtractionContext } from "./explicit-capability-contract";
import {
  readHelixSharedRoomIdFromAskSession,
  resolveHelixSharedRoomAskSessionAccess,
} from "./shared-room-ask-session";
import type { HelixWorkstationGatewayAccountContext } from "./workstation-tool-gateway/account-policy";
import { listRoomEnvironmentParticipantSubjectContexts } from "../environment-connectors/subjects";
import { listEnvironmentAdapterProfiles } from "../situation-room/environment-adapter-registry";

export type TrustedRoomEnvironmentIntentContext =
  ExplicitCapabilityExtractionContext & {
    schema: "helix.trusted_room_environment_intent_context.v1";
    room_id: string;
    participant_id: string;
    environment_binding_ref: string;
    environment_label: string;
    domain_adapter: string;
    subject_kind: string;
    subject_label: string;
    source: "authenticated_room_environment_subject";
    terminal_eligible: false;
    assistant_answer: false;
    raw_content_included: false;
  };

export const isRegisteredMinecraftDomainAdapter = (
  domainAdapter: string,
): boolean =>
  listEnvironmentAdapterProfiles().some(
    ({ profile }) =>
      profile.domain === "minecraft" &&
      profile.accepted_domain_adapters.includes(domainAdapter.trim()),
  );

export type TrustedRoomEnvironmentIntentContextAudit = {
  schema: "helix.trusted_room_environment_intent_context_audit.v1";
  status:
    | "resolved"
    | "not_shared_room"
    | "account_session_untrusted"
    | "room_access_denied"
    | "selected_minecraft_subject_missing"
    | "selected_minecraft_subject_ambiguous";
  room_id: string | null;
  participant_id: string | null;
  active_subject_count: number;
  active_minecraft_subject_count: number;
  context_admitted: boolean;
  answer_authority: false;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type TrustedRoomEnvironmentIntentContextResolution = {
  context: TrustedRoomEnvironmentIntentContext | null;
  audit: TrustedRoomEnvironmentIntentContextAudit;
};

const audit = (input: Omit<
  TrustedRoomEnvironmentIntentContextAudit,
  "schema" | "answer_authority" | "terminal_eligible" | "assistant_answer" | "raw_content_included"
>): TrustedRoomEnvironmentIntentContextAudit => ({
  schema: "helix.trusted_room_environment_intent_context_audit.v1",
  ...input,
  answer_authority: false,
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});

/**
 * Resolves omitted game scope only from current server authority. Conversation
 * text, model output, request arguments, and stale connector projections cannot
 * create this context. Ambiguous multi-Minecraft bindings fail closed so the
 * user must name the environment explicitly.
 */
export const resolveTrustedRoomEnvironmentIntentContextWithAudit = async (input: {
  conversationThreadId: string | null | undefined;
  accountContext: HelixWorkstationGatewayAccountContext;
}): Promise<TrustedRoomEnvironmentIntentContextResolution> => {
  const roomId = readHelixSharedRoomIdFromAskSession(
    input.conversationThreadId,
  );
  const profileId = input.accountContext.profile_id?.trim() ?? "";
  const session = input.accountContext.account_session;
  if (!roomId) {
    return {
      context: null,
      audit: audit({
        status: "not_shared_room",
        room_id: null,
        participant_id: null,
        active_subject_count: 0,
        active_minecraft_subject_count: 0,
        context_admitted: false,
      }),
    };
  }
  if (
    !profileId ||
    !input.accountContext.trusted_account_session ||
    !session ||
    session.status !== "active" ||
    session.profile.profile_id !== profileId
  ) {
    return {
      context: null,
      audit: audit({
        status: "account_session_untrusted",
        room_id: roomId,
        participant_id: null,
        active_subject_count: 0,
        active_minecraft_subject_count: 0,
        context_admitted: false,
      }),
    };
  }

  const access = await resolveHelixSharedRoomAskSessionAccess({
    sessionId: input.conversationThreadId,
    profileId,
    accountPolicy: input.accountContext.account_policy,
  });
  if (!access.scoped || !access.admitted || access.roomId !== roomId) {
    return {
      context: null,
      audit: audit({
        status: "room_access_denied",
        room_id: roomId,
        participant_id: access.participantId,
        active_subject_count: 0,
        active_minecraft_subject_count: 0,
        context_admitted: false,
      }),
    };
  }

  const trustedVoiceActor = input.accountContext.trusted_turn_actor_context;
  const participantId =
    trustedVoiceActor?.resolution === "resolved" &&
    trustedVoiceActor.room_id === roomId &&
    trustedVoiceActor.participant_id
      ? trustedVoiceActor.participant_id
      : access.participantId;
  const subjectContexts =
    await listRoomEnvironmentParticipantSubjectContexts(roomId);
  const activeMinecraftSubjects = subjectContexts.filter((subject) => {
    if (
      subject.participant_id !== participantId ||
      subject.status !== "active"
    ) {
      return false;
    }
    return isRegisteredMinecraftDomainAdapter(subject.domain_adapter);
  });
  if (activeMinecraftSubjects.length !== 1) {
    return {
      context: null,
      audit: audit({
        status:
          activeMinecraftSubjects.length === 0
            ? "selected_minecraft_subject_missing"
            : "selected_minecraft_subject_ambiguous",
        room_id: roomId,
        participant_id: participantId,
        active_subject_count: subjectContexts.filter(
          (subject) =>
            subject.participant_id === participantId &&
            subject.status === "active",
        ).length,
        active_minecraft_subject_count: activeMinecraftSubjects.length,
        context_admitted: false,
      }),
    };
  }

  const subject = activeMinecraftSubjects[0];
  const context: TrustedRoomEnvironmentIntentContext = {
      schema: "helix.trusted_room_environment_intent_context.v1",
      trusted_environment_domain: "minecraft",
      room_id: roomId,
      participant_id: participantId,
      environment_binding_ref: subject.environment_binding_ref,
      environment_label: subject.environment_label,
      domain_adapter: subject.domain_adapter,
      subject_kind: subject.subject_kind,
      subject_label: subject.subject_label,
      source: "authenticated_room_environment_subject",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
  };
  return {
    context,
    audit: audit({
      status: "resolved",
      room_id: roomId,
      participant_id: participantId,
      active_subject_count: subjectContexts.filter(
        (candidate) =>
          candidate.participant_id === participantId &&
          candidate.status === "active",
      ).length,
      active_minecraft_subject_count: 1,
      context_admitted: true,
    }),
  };
};

export const resolveTrustedRoomEnvironmentIntentContext = async (input: {
  conversationThreadId: string | null | undefined;
  accountContext: HelixWorkstationGatewayAccountContext;
}): Promise<TrustedRoomEnvironmentIntentContext | null> =>
  (await resolveTrustedRoomEnvironmentIntentContextWithAudit(input)).context;
