export const HELIX_SOCIAL_PROFILE_SCHEMA = "helix.social_profile.v1" as const;
export const HELIX_FRIENDSHIP_SCHEMA = "helix.friendship.v1" as const;
export const HELIX_SOCIAL_PRESENCE_SCHEMA = "helix.social_presence.v1" as const;
export const HELIX_VOICE_PARTY_SCHEMA = "helix.voice_party.v1" as const;
export const HELIX_VOICE_PARTY_MEMBER_SCHEMA = "helix.voice_party_member.v1" as const;
export const HELIX_FRIENDS_PARTIES_RESPONSE_SCHEMA =
  "helix.friends_parties.response.v1" as const;
export const HELIX_VOICE_PARTY_MEDIA_SIGNAL_SCHEMA =
  "helix.voice_party.media_signal.v1" as const;
export const HELIX_VOICE_PARTY_MEDIA_SIGNAL_RESPONSE_SCHEMA =
  "helix.voice_party.media_signal.response.v1" as const;
export const HELIX_VOICE_PARTY_ICE_CONFIGURATION_SCHEMA =
  "helix.voice_party.ice_configuration.v1" as const;
export const HELIX_VOICE_PARTY_ICE_CONFIGURATION_RESPONSE_SCHEMA =
  "helix.voice_party.ice_configuration.response.v1" as const;
export const HELIX_FRIENDS_PARTIES_COORDINATION_SESSION_SCHEMA =
  "helix.friends_parties.coordination_session.v1" as const;
export const HELIX_FRIENDS_PARTIES_COORDINATION_SCOPE =
  "helix.friends_parties" as const;

export type HelixSocialDiscoveryPolicy = "exact_handle" | "invite_only" | "hidden";
export type HelixSocialPresenceVisibility = "friends" | "party_members" | "nobody";

export type HelixSocialProfile = {
  schema: typeof HELIX_SOCIAL_PROFILE_SCHEMA;
  profile_id: string;
  handle: string;
  display_name: string;
  picture_url: string | null;
  discovery_policy: HelixSocialDiscoveryPolicy;
  presence_visibility: HelixSocialPresenceVisibility;
  updated_at: string;
};

export type HelixFriendshipState =
  | "incoming"
  | "outgoing"
  | "accepted"
  | "blocked_by_self";

export type HelixFriendship = {
  schema: typeof HELIX_FRIENDSHIP_SCHEMA;
  friendship_id: string;
  peer: HelixSocialProfile;
  state: HelixFriendshipState;
  created_at: string;
  updated_at: string;
};

export type HelixSocialPresenceState = "online" | "away" | "in_party" | "offline";

export type HelixSocialPresence = {
  schema: typeof HELIX_SOCIAL_PRESENCE_SCHEMA;
  profile_id: string;
  state: HelixSocialPresenceState;
  observed_at: string;
  expires_at: string;
};

export type HelixVoicePartyState =
  | "created"
  | "inviting"
  | "connecting"
  | "active"
  | "degraded"
  | "reconnecting"
  | "ended";

export type HelixVoicePartyMemberState =
  | "invited"
  | "joining"
  | "connected"
  | "reconnecting"
  | "left";

export type HelixVoicePartyMediaState =
  | "idle"
  | "connecting"
  | "connected"
  | "direct"
  | "relayed"
  | "degraded"
  | "failed"
  | "stopped";

export type HelixVoicePartyGptAttachmentState =
  | "detached"
  | "attaching"
  | "connected"
  | "degraded";

export type HelixVoicePartyMediaSignalKind =
  | "offer"
  | "answer"
  | "ice_candidate"
  | "hangup";

export type HelixVoicePartyMediaSignal = {
  schema: typeof HELIX_VOICE_PARTY_MEDIA_SIGNAL_SCHEMA;
  signal_id: string;
  party_id: string;
  negotiation_id: string;
  sender_participant_id: string;
  target_participant_id: string;
  kind: HelixVoicePartyMediaSignalKind;
  description: RTCSessionDescriptionInit | null;
  candidate: RTCIceCandidateInit | null;
  created_at: string;
  expires_at: string;
};

export type HelixVoicePartyMediaSignalResponse = {
  schema: typeof HELIX_VOICE_PARTY_MEDIA_SIGNAL_RESPONSE_SCHEMA;
  ok: boolean;
  error: HelixFriendsPartiesErrorCode | null;
  message: string | null;
  signal: HelixVoicePartyMediaSignal | null;
  signals: HelixVoicePartyMediaSignal[];
};

export type HelixVoicePartyIceConfiguration = {
  schema: typeof HELIX_VOICE_PARTY_ICE_CONFIGURATION_SCHEMA;
  party_id: string;
  participant_id: string;
  ice_servers: RTCIceServer[];
  ice_transport_policy: "all" | "relay";
  relay_available: boolean;
  issued_at: string;
  expires_at: string | null;
  model_visible: false;
  debug_exportable: false;
  persistable: false;
  answer_authority: false;
};

export type HelixVoicePartyIceConfigurationResponse = {
  schema: typeof HELIX_VOICE_PARTY_ICE_CONFIGURATION_RESPONSE_SCHEMA;
  ok: boolean;
  error: HelixFriendsPartiesErrorCode | null;
  message: string | null;
  configuration: HelixVoicePartyIceConfiguration | null;
};

export type HelixFriendsPartiesCoordinationSession = {
  schema: typeof HELIX_FRIENDS_PARTIES_COORDINATION_SESSION_SCHEMA;
  ok: boolean;
  error: "coordination_auth_required" | "coordination_scope_required" |
    "coordination_native_client_required" | "coordination_session_failed" | null;
  message: string;
  expires_at: string | null;
  profile_ref: string | null;
  bearer_included: false;
  session_cookie_included: false;
  model_visible: false;
  debug_exportable: false;
  persistable: false;
  answer_authority: false;
};

export type HelixVoicePartyMember = {
  schema: typeof HELIX_VOICE_PARTY_MEMBER_SCHEMA;
  participant_id: string;
  profile: HelixSocialProfile;
  role: "owner" | "participant";
  state: HelixVoicePartyMemberState;
  media_state: HelixVoicePartyMediaState;
  muted: boolean;
  deafened: boolean;
  joined_at: string | null;
  last_seen_at: string;
};

export type HelixVoiceParty = {
  schema: typeof HELIX_VOICE_PARTY_SCHEMA;
  party_id: string;
  owner_profile_id: string;
  state: HelixVoicePartyState;
  max_members: 2;
  room_id: string | null;
  gpt_attachment_state: HelixVoicePartyGptAttachmentState;
  members: HelixVoicePartyMember[];
  created_at: string;
  updated_at: string;
  ended_at: string | null;
};

export type HelixFriendsPartiesErrorCode =
  | "friends_parties_auth_required"
  | "friends_parties_locked_by_account_policy"
  | "friends_parties_coordination_unavailable"
  | "social_profile_invalid"
  | "social_handle_unavailable"
  | "social_profile_not_found"
  | "friendship_invalid"
  | "friendship_blocked"
  | "friendship_conflict"
  | "voice_party_not_found"
  | "voice_party_forbidden"
  | "voice_party_conflict"
  | "voice_party_full"
  | "voice_party_ended"
  | "voice_party_invite_invalid"
  | "voice_party_invite_expired"
  | "voice_party_signal_cursor_expired"
  | "voice_party_relay_unavailable"
  | "voice_party_ice_configuration_invalid"
  | "voice_party_unavailable";

export type HelixFriendsPartiesResponse = {
  schema: typeof HELIX_FRIENDS_PARTIES_RESPONSE_SCHEMA;
  ok: boolean;
  error: HelixFriendsPartiesErrorCode | null;
  message: string | null;
  profile: HelixSocialProfile | null;
  profiles: HelixSocialProfile[];
  friendships: HelixFriendship[];
  presence: HelixSocialPresence[];
  party: HelixVoiceParty | null;
  parties: HelixVoiceParty[];
  invite_code: string | null;
  invite_expires_at: string | null;
};
