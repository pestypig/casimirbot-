import { Router, type Request, type Response } from "express";
import {
  HELIX_FRIENDS_PARTIES_RESPONSE_SCHEMA,
  HELIX_VOICE_PARTY_ICE_CONFIGURATION_RESPONSE_SCHEMA,
  HELIX_VOICE_PARTY_MEDIA_SIGNAL_RESPONSE_SCHEMA,
  type HelixFriendsPartiesResponse,
  type HelixSocialDiscoveryPolicy,
  type HelixSocialPresenceVisibility,
  type HelixVoicePartyIceConfigurationResponse,
  type HelixVoicePartyMediaSignalKind,
  type HelixVoicePartyMediaSignalResponse,
} from "@shared/helix-friends-voice-party";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import { resolveWorkstationGatewayAccountContext } from
  "../services/helix-ask/workstation-tool-gateway/account-policy";
import {
  findHelixSocialProfileByExactHandle,
  heartbeatHelixSocialPresence,
  HelixFriendsDomainError,
  listHelixFriendPresence,
  listHelixFriendships,
  requestHelixFriendship,
  readOwnHelixSocialProfile,
  setHelixFriendshipDecision,
  setHelixSocialBlock,
  upsertHelixSocialProfile,
} from "../services/helix-social/friends-store";
import {
  createHelixVoiceParty,
  createHelixVoicePartyInvite,
  heartbeatHelixVoicePartyMember,
  HelixVoicePartyDomainError,
  joinHelixVoiceParty,
  leaveHelixVoiceParty,
  listHelixVoiceParties,
  readHelixVoiceParty,
  setHelixVoicePartyGptAttachment,
  updateOwnHelixVoicePartyMedia,
} from "../services/helix-social/voice-party-store";
import {
  listHelixVoicePartyMediaSignals,
  publishHelixVoicePartyMediaSignal,
} from "../services/helix-social/voice-party-signal-store";
import { issueHelixVoicePartyIceConfiguration } from
  "../services/helix-social/voice-party-ice-configuration";
import {
  isDesktopFriendsPartiesCoordinationRequired,
  proxyDesktopFriendsPartiesRequest,
} from "../services/helix-social/friends-parties-coordination-client";

export const friendsPartiesRouter = Router();

const response = (
  patch: Partial<HelixFriendsPartiesResponse>,
): HelixFriendsPartiesResponse => ({
  schema: HELIX_FRIENDS_PARTIES_RESPONSE_SCHEMA,
  ok: false,
  error: null,
  message: null,
  profile: null,
  profiles: [],
  friendships: [],
  presence: [],
  party: null,
  parties: [],
  invite_code: null,
  invite_expires_at: null,
  ...patch,
});

const requireAccountIdentity = async (req: Request): Promise<{
  profileId: string;
  sessionId: string;
}> => {
  const sessionId = readHelixSessionCookie(req.headers.cookie);
  const context = await resolveWorkstationGatewayAccountContext(sessionId);
  if (!context.trusted_account_session || !context.profile_id) {
    const error = new Error("Sign in before using Friends & Parties.");
    Object.assign(error, { code: "friends_parties_auth_required", statusCode: 401 });
    throw error;
  }
  if (
    !context.account_policy.feature_flags.includes("friends_parties") ||
    context.account_policy.locked_features.includes("friends_parties")
  ) {
    const error = new Error("Friends & Parties is unavailable for this account.");
    Object.assign(error, { code: "friends_parties_locked_by_account_policy", statusCode: 403 });
    throw error;
  }
  return { profileId: context.profile_id, sessionId: sessionId! };
};

const requireProfileId = async (req: Request): Promise<string> =>
  (await requireAccountIdentity(req)).profileId;

const route = (
  handler: (req: Request, res: Response) => Promise<void>,
) => (req: Request, res: Response): void => {
  void handler(req, res).catch((error: unknown) => {
    const known = error instanceof HelixFriendsDomainError ||
      error instanceof HelixVoicePartyDomainError ||
      (error instanceof Error && "statusCode" in error && "code" in error);
    const statusCode = known
      ? Number((error as { statusCode: number }).statusCode)
      : 503;
    const code = known
      ? String((error as { code: string }).code)
      : "voice_party_unavailable";
    res.status(statusCode).json(response({
      error: code as HelixFriendsPartiesResponse["error"],
      message: error instanceof Error ? error.message : "Friends & Parties is unavailable.",
    }));
  });
};

const signalResponse = (
  patch: Partial<HelixVoicePartyMediaSignalResponse>,
): HelixVoicePartyMediaSignalResponse => ({
  schema: HELIX_VOICE_PARTY_MEDIA_SIGNAL_RESPONSE_SCHEMA,
  ok: false,
  error: null,
  message: null,
  signal: null,
  signals: [],
  ...patch,
});

const signalRoute = (
  handler: (req: Request, res: Response) => Promise<void>,
) => (req: Request, res: Response): void => {
  void handler(req, res).catch((error: unknown) => {
    const known = error instanceof HelixVoicePartyDomainError ||
      (error instanceof Error && "statusCode" in error && "code" in error);
    res.status(known ? Number((error as { statusCode: number }).statusCode) : 503)
      .json(signalResponse({
        error: (known ? String((error as { code: string }).code) : "voice_party_unavailable") as
          HelixVoicePartyMediaSignalResponse["error"],
        message: error instanceof Error ? error.message : "Voice party signaling is unavailable.",
      }));
  });
};

const iceResponse = (
  patch: Partial<HelixVoicePartyIceConfigurationResponse>,
): HelixVoicePartyIceConfigurationResponse => ({
  schema: HELIX_VOICE_PARTY_ICE_CONFIGURATION_RESPONSE_SCHEMA,
  ok: false,
  error: null,
  message: null,
  configuration: null,
  ...patch,
});

const iceRoute = (
  handler: (req: Request, res: Response) => Promise<void>,
) => (req: Request, res: Response): void => {
  void handler(req, res).catch((error: unknown) => {
    const known = error instanceof HelixVoicePartyDomainError ||
      (error instanceof Error && "statusCode" in error && "code" in error);
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Pragma", "no-cache");
    res.status(known ? Number((error as { statusCode: number }).statusCode) : 503)
      .json(iceResponse({
        error: (known ? String((error as { code: string }).code) : "voice_party_unavailable") as
          HelixVoicePartyIceConfigurationResponse["error"],
        message: error instanceof Error ? error.message : "Voice party ICE admission is unavailable.",
      }));
  });
};

const signalKinds = new Set<HelixVoicePartyMediaSignalKind>([
  "offer", "answer", "ice_candidate", "hangup",
]);

const parseSignalDescription = (
  value: unknown,
  kind: HelixVoicePartyMediaSignalKind,
): RTCSessionDescriptionInit | null => {
  if (kind !== "offer" && kind !== "answer") return null;
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const sdp = typeof record.sdp === "string" ? record.sdp.trim() : "";
  if (!sdp || sdp.length > 96_000) {
    throw new HelixVoicePartyDomainError("voice_party_conflict", 400, "A bounded SDP description is required.");
  }
  return { type: kind, sdp };
};

const parseSignalCandidate = (
  value: unknown,
  kind: HelixVoicePartyMediaSignalKind,
): RTCIceCandidateInit | null => {
  if (kind !== "ice_candidate") return null;
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const candidate = typeof record.candidate === "string" ? record.candidate.trim() : "";
  if (!candidate || candidate.length > 8_000) {
    throw new HelixVoicePartyDomainError("voice_party_conflict", 400, "A bounded ICE candidate is required.");
  }
  return {
    candidate,
    sdpMid: typeof record.sdpMid === "string" ? record.sdpMid : null,
    sdpMLineIndex: typeof record.sdpMLineIndex === "number"
      ? Math.trunc(record.sdpMLineIndex)
      : null,
    usernameFragment: typeof record.usernameFragment === "string"
      ? record.usernameFragment
      : undefined,
  };
};

friendsPartiesRouter.use(
  "/friends-parties",
  (req: Request, res: Response, next): void => {
    if (!isDesktopFriendsPartiesCoordinationRequired()) {
      next();
      return;
    }
    void (async () => {
      try {
        const identity = await requireAccountIdentity(req);
        const proxied = await proxyDesktopFriendsPartiesRequest({
          localProfileId: identity.profileId,
          localSessionId: identity.sessionId,
          method: req.method,
          path: req.originalUrl,
          body: req.body ?? null,
        });
        if (proxied.headers.cacheControl) {
          res.setHeader("Cache-Control", proxied.headers.cacheControl);
        } else {
          res.setHeader("Cache-Control", "no-store, private");
        }
        if (proxied.headers.pragma) res.setHeader("Pragma", proxied.headers.pragma);
        if (proxied.headers.referrerPolicy) {
          res.setHeader("Referrer-Policy", proxied.headers.referrerPolicy);
        }
        res.status(proxied.status).json(proxied.body);
      } catch {
        res.setHeader("Cache-Control", "no-store, private");
        const error = "friends_parties_coordination_unavailable" as const;
        const message = "Connect this installed profile to the CasimirBot domain before using Friends & Parties.";
        if (req.path.includes("/media/ice-configuration")) {
          res.status(503).json(iceResponse({ error, message }));
        } else if (req.path.includes("/media/signals")) {
          res.status(503).json(signalResponse({ error, message }));
        } else {
          res.status(503).json(response({ error, message }));
        }
      }
    })();
  },
);

friendsPartiesRouter.get("/friends-parties", route(async (req, res) => {
  const profileId = await requireProfileId(req);
  const [profile, friendships, presence, parties] = await Promise.all([
    readOwnHelixSocialProfile(profileId),
    listHelixFriendships(profileId),
    listHelixFriendPresence(profileId),
    listHelixVoiceParties(profileId),
  ]);
  res.json(response({
    ok: true,
    message: "Friends and parties listed.",
    profile,
    friendships,
    presence,
    parties,
    party: parties[0] ?? null,
  }));
}));

friendsPartiesRouter.put("/friends-parties/profile", route(async (req, res) => {
  const profileId = await requireProfileId(req);
  const profile = await upsertHelixSocialProfile({
    profileId,
    handle: String(req.body?.handle ?? ""),
    discoveryPolicy: req.body?.discovery_policy as HelixSocialDiscoveryPolicy | undefined,
    presenceVisibility: req.body?.presence_visibility as
      HelixSocialPresenceVisibility | undefined,
  });
  res.json(response({ ok: true, message: "Social profile updated.", profile }));
}));

friendsPartiesRouter.get("/friends-parties/profiles/exact", route(async (req, res) => {
  const viewerProfileId = await requireProfileId(req);
  const profile = await findHelixSocialProfileByExactHandle({
    viewerProfileId,
    handle: String(req.query.handle ?? ""),
  });
  res.json(response({ ok: true, message: "Profile found.", profile }));
}));

friendsPartiesRouter.post("/friends-parties/friendships", route(async (req, res) => {
  const requesterProfileId = await requireProfileId(req);
  const friendship = await requestHelixFriendship({
    requesterProfileId,
    recipientHandle: String(req.body?.handle ?? ""),
  });
  res.status(201).json(response({ ok: true, message: "Friend request sent.", friendships: [friendship] }));
}));

friendsPartiesRouter.post(
  "/friends-parties/friendships/:friendshipId/decision",
  route(async (req, res) => {
    const actorProfileId = await requireProfileId(req);
    const decision = String(req.body?.decision ?? "") as "accept" | "decline" | "remove";
    if (!(["accept", "decline", "remove"] as string[]).includes(decision)) {
      throw new HelixFriendsDomainError("friendship_invalid", 400, "Invalid friendship decision.");
    }
    await setHelixFriendshipDecision({
      actorProfileId,
      friendshipId: req.params.friendshipId,
      decision,
    });
    res.json(response({
      ok: true,
      message: "Friendship updated.",
      friendships: await listHelixFriendships(actorProfileId),
    }));
  }),
);

friendsPartiesRouter.post(
  "/friends-parties/parties/:partyId/media/signals",
  signalRoute(async (req, res) => {
    const profileId = await requireProfileId(req);
    const party = await readHelixVoiceParty({ partyId: req.params.partyId, viewerProfileId: profileId });
    if (party.state === "ended") {
      throw new HelixVoicePartyDomainError("voice_party_ended", 409, "Voice party has ended.");
    }
    const self = party.members.find((member) => member.profile.profile_id === profileId && member.state !== "left");
    const targetParticipantId = typeof req.body?.target_participant_id === "string"
      ? req.body.target_participant_id.trim()
      : "";
    const target = party.members.find(
      (member) => member.participant_id === targetParticipantId && member.state !== "left",
    );
    const kind = String(req.body?.kind ?? "") as HelixVoicePartyMediaSignalKind;
    const negotiationId = String(req.body?.negotiation_id ?? "").trim();
    if (
      !self || !target || target.participant_id === self.participant_id ||
      !signalKinds.has(kind) || !negotiationId || negotiationId.length > 200
    ) {
      throw new HelixVoicePartyDomainError(
        "voice_party_conflict",
        400,
        "An active party peer, negotiation ID, and supported signal kind are required.",
      );
    }
    const signal = await publishHelixVoicePartyMediaSignal({
      partyId: party.party_id,
      negotiationId,
      senderParticipantId: self.participant_id,
      targetParticipantId: target.participant_id,
      kind,
      description: parseSignalDescription(req.body?.description, kind),
      candidate: parseSignalCandidate(req.body?.candidate, kind),
    });
    res.json(signalResponse({ ok: true, message: "Voice party signal published.", signal }));
  }),
);

friendsPartiesRouter.get(
  "/friends-parties/parties/:partyId/media/signals",
  signalRoute(async (req, res) => {
    const profileId = await requireProfileId(req);
    const party = await readHelixVoiceParty({ partyId: req.params.partyId, viewerProfileId: profileId });
    const self = party.members.find((member) => member.profile.profile_id === profileId && member.state !== "left");
    if (!self) {
      throw new HelixVoicePartyDomainError("voice_party_not_found", 404, "Voice party not found.");
    }
    const signals = await listHelixVoicePartyMediaSignals({
      partyId: party.party_id,
      targetParticipantId: self.participant_id,
      afterSignalId: typeof req.query.after === "string" ? req.query.after : null,
    });
    res.json(signalResponse({ ok: true, message: "Voice party signals listed.", signals }));
  }),
);

friendsPartiesRouter.get(
  "/friends-parties/parties/:partyId/media/ice-configuration",
  iceRoute(async (req, res) => {
    const profileId = await requireProfileId(req);
    const transportPolicy = req.query.transport === "relay" ? "relay" : "all";
    const configuration = await issueHelixVoicePartyIceConfiguration({
      partyId: req.params.partyId,
      profileId,
      transportPolicy,
    });
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.json(iceResponse({
      ok: true,
      message: configuration.relay_available
        ? "Ephemeral voice relay admission issued."
        : "Direct-preferred voice admission issued without relay.",
      configuration,
    }));
  }),
);

friendsPartiesRouter.post("/friends-parties/blocks", route(async (req, res) => {
  const actorProfileId = await requireProfileId(req);
  await setHelixSocialBlock({
    actorProfileId,
    peerProfileId: String(req.body?.peer_profile_id ?? ""),
    blocked: req.body?.blocked === true,
  });
  res.json(response({
    ok: true,
    message: req.body?.blocked === true ? "Profile blocked." : "Profile unblocked.",
    friendships: await listHelixFriendships(actorProfileId),
  }));
}));

friendsPartiesRouter.post("/friends-parties/presence/heartbeat", route(async (req, res) => {
  const profileId = await requireProfileId(req);
  const state = req.body?.state === "away" || req.body?.state === "in_party"
    ? req.body.state
    : "online";
  const presence = await heartbeatHelixSocialPresence({ profileId, state });
  res.json(response({ ok: true, message: "Presence updated.", presence: [presence] }));
}));

friendsPartiesRouter.post("/friends-parties/parties", route(async (req, res) => {
  const profileId = await requireProfileId(req);
  const party = await createHelixVoiceParty(profileId);
  res.status(201).json(response({ ok: true, message: "Voice party created.", party }));
}));

friendsPartiesRouter.get("/friends-parties/parties/:partyId", route(async (req, res) => {
  const viewerProfileId = await requireProfileId(req);
  const party = await readHelixVoiceParty({ partyId: req.params.partyId, viewerProfileId });
  res.json(response({ ok: true, message: "Voice party loaded.", party }));
}));

friendsPartiesRouter.post(
  "/friends-parties/parties/:partyId/invites",
  route(async (req, res) => {
    const ownerProfileId = await requireProfileId(req);
    const invitation = await createHelixVoicePartyInvite({
      partyId: req.params.partyId,
      ownerProfileId,
      recipientProfileId: typeof req.body?.recipient_profile_id === "string"
        ? req.body.recipient_profile_id
        : null,
    });
    res.status(201).json(response({
      ok: true,
      message: "One-time voice party invitation created.",
      party: invitation.party,
      invite_code: invitation.invite_code,
      invite_expires_at: invitation.expires_at,
    }));
  }),
);

friendsPartiesRouter.post("/friends-parties/parties/join", route(async (req, res) => {
  const profileId = await requireProfileId(req);
  const party = await joinHelixVoiceParty({
    profileId,
    inviteCode: String(req.body?.invite_code ?? ""),
  });
  res.json(response({ ok: true, message: "Joined voice party.", party }));
}));

friendsPartiesRouter.patch(
  "/friends-parties/parties/:partyId/media",
  route(async (req, res) => {
    const profileId = await requireProfileId(req);
    const allowedMediaStates = [
      "idle", "connecting", "connected", "direct", "relayed", "degraded", "failed", "stopped",
    ];
    const mediaState = String(req.body?.media_state ?? "");
    if (!allowedMediaStates.includes(mediaState)) {
      throw new HelixVoicePartyDomainError("voice_party_conflict", 400, "Invalid media state.");
    }
    const party = await updateOwnHelixVoicePartyMedia({
      partyId: req.params.partyId,
      profileId,
      mediaState: mediaState as Parameters<typeof updateOwnHelixVoicePartyMedia>[0]["mediaState"],
      ...(typeof req.body?.muted === "boolean" ? { muted: req.body.muted } : {}),
      ...(typeof req.body?.deafened === "boolean" ? { deafened: req.body.deafened } : {}),
    });
    res.json(response({ ok: true, message: "Voice party media state updated.", party }));
  }),
);

friendsPartiesRouter.post(
  "/friends-parties/parties/:partyId/heartbeat",
  route(async (req, res) => {
    const profileId = await requireProfileId(req);
    const party = await heartbeatHelixVoicePartyMember({
      partyId: req.params.partyId,
      profileId,
    });
    res.json(response({ ok: true, message: "Voice party heartbeat recorded.", party }));
  }),
);

friendsPartiesRouter.post(
  "/friends-parties/parties/:partyId/gpt-attachment",
  route(async (req, res) => {
    const ownerProfileId = await requireProfileId(req);
    const detach = req.body?.attached === false;
    const party = await setHelixVoicePartyGptAttachment({
      partyId: req.params.partyId,
      ownerProfileId,
      roomId: detach ? null : String(req.body?.room_id ?? ""),
      state: detach ? "detached" : "attaching",
    });
    res.json(response({
      ok: true,
      message: detach ? "GPT Live detached." : "GPT Live attachment requested.",
      party,
    }));
  }),
);

friendsPartiesRouter.post(
  "/friends-parties/parties/:partyId/leave",
  route(async (req, res) => {
    const profileId = await requireProfileId(req);
    const action = await leaveHelixVoiceParty({ partyId: req.params.partyId, profileId });
    res.json(response({ ok: true, message: action === "ended" ? "Voice party ended." : "Left voice party." }));
  }),
);
