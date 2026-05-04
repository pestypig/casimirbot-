import type {
  HelixCaptureSource,
  HelixSpeakerAuthority,
  HelixSpeakerAuthoritySource,
  HelixSpeakerLabel,
  HelixSpeakerPolicyMode,
  HelixSpeakerRole,
  HelixUnknownSpeakerBehavior,
} from "../../../shared/helix-audio-identity";

export type ResolvedSpeakerAuthorityPolicy = {
  claimed_role?: HelixSpeakerRole;
  role: HelixSpeakerRole;
  authority: HelixSpeakerAuthority;
  authority_source: HelixSpeakerAuthoritySource;
  authority_reason: string;
};

const isDeviceAudioSource = (source: HelixCaptureSource): boolean => source !== "mic";

const isSessionAuthority = (speaker: HelixSpeakerLabel | null | undefined): boolean =>
  speaker?.authority_source === "session_registry" || speaker?.enrollment_state === "session";

const isProfileAuthority = (speaker: HelixSpeakerLabel | null | undefined): boolean =>
  speaker?.authority_source === "profile_enrollment" || speaker?.enrollment_state === "profile";

const resolveUnknownAuthority = (
  unknownSpeakerBehavior: HelixUnknownSpeakerBehavior,
): HelixSpeakerAuthority =>
  unknownSpeakerBehavior === "ignore" ? "ignored" : "transcribe_only";

const resolveUntrustedRole = (
  rawRole: HelixSpeakerRole | null | undefined,
): HelixSpeakerRole => {
  if (rawRole === "unknown") return "unknown";
  if (rawRole === "device_audio") return "device_audio";
  return "guest";
};

const canUsePolicyModeForAuthority = (
  policyMode: HelixSpeakerPolicyMode,
  policyModeSource: HelixSpeakerAuthoritySource,
): boolean =>
  policyMode === "any_speaker" &&
  (policyModeSource === "server_policy" ||
    policyModeSource === "session_registry" ||
    policyModeSource === "profile_enrollment");

export function resolveSpeakerAuthorityPolicy(args: {
  captureSource: HelixCaptureSource;
  rawRole?: HelixSpeakerRole | null;
  rawAuthority?: HelixSpeakerAuthority | null;
  sessionSpeaker?: HelixSpeakerLabel | null;
  policyMode: HelixSpeakerPolicyMode;
  policyModeSource?: HelixSpeakerAuthoritySource | null;
  unknownSpeakerBehavior: HelixUnknownSpeakerBehavior;
}): ResolvedSpeakerAuthorityPolicy {
  const claimedRole = args.rawRole ?? undefined;
  const policyModeSource = args.policyModeSource ?? "client_hint";
  if (isDeviceAudioSource(args.captureSource)) {
    return {
      claimed_role: claimedRole,
      role: "device_audio",
      authority: "transcribe_only",
      authority_source: "device_audio_policy",
      authority_reason: "device_audio_sources_are_transcribe_only",
    };
  }

  if (isProfileAuthority(args.sessionSpeaker)) {
    const role = args.sessionSpeaker?.role ?? "owner";
    return {
      claimed_role: claimedRole,
      role,
      authority:
        role === "owner"
          ? "command_allowed"
          : args.sessionSpeaker?.authority ?? "command_confirm",
      authority_source: "profile_enrollment",
      authority_reason: "profile_enrollment_confirmed_speaker_authority",
    };
  }

  if (isSessionAuthority(args.sessionSpeaker)) {
    const role = args.sessionSpeaker?.role ?? "trusted_guest";
    return {
      claimed_role: claimedRole,
      role,
      authority:
        args.sessionSpeaker?.authority ??
        (role === "owner" ? "command_allowed" : "command_confirm"),
      authority_source: "session_registry",
      authority_reason: "session_registry_confirmed_speaker_authority",
    };
  }

  if (args.policyMode === "transcribe_only") {
    return {
      claimed_role: claimedRole,
      role: resolveUntrustedRole(args.rawRole),
      authority: "transcribe_only",
      authority_source: "server_policy",
      authority_reason: "speaker_policy_mode_transcribe_only",
    };
  }

  if (args.rawRole === "unknown") {
    return {
      claimed_role: claimedRole,
      role: "unknown",
      authority: resolveUnknownAuthority(args.unknownSpeakerBehavior),
      authority_source: args.rawAuthority ? "client_hint" : "server_policy",
      authority_reason: "unknown_speaker_has_no_command_authority",
    };
  }

  if (canUsePolicyModeForAuthority(args.policyMode, policyModeSource)) {
    return {
      claimed_role: claimedRole,
      role: "guest",
      authority: "command_confirm",
      authority_source: policyModeSource,
      authority_reason: "trusted_room_policy_allows_any_speaker_with_confirmation",
    };
  }

  if (args.rawRole || args.rawAuthority) {
    return {
      claimed_role: claimedRole,
      role: resolveUntrustedRole(args.rawRole),
      authority: "transcribe_only",
      authority_source: "client_hint",
      authority_reason: "client_hints_do_not_grant_command_authority",
    };
  }

  return {
    claimed_role: claimedRole,
    role: "guest",
    authority: "transcribe_only",
    authority_source: "absent",
    authority_reason: "no_confirmed_speaker_authority",
  };
}
