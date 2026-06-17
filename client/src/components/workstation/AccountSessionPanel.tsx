import React from "react";
import { Archive, ChevronDown, Database, KeyRound, Languages, Link2, LogIn, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import { getInterfaceLanguageOption, getInterfaceLanguageReadiness, INTERFACE_LANGUAGE_OPTIONS } from "@/lib/i18n/interfaceLanguage";
import { writeInterfaceLanguagePreference } from "@/lib/i18n/interfaceLanguagePreference";
import { useInterfaceText, type InterfaceTextResolver } from "@/lib/i18n/interfaceText";
import type { InterfaceMessageId } from "@/lib/i18n/messages/types";
import { useWorkspaceMemoryRegistryStore } from "@/store/useWorkspaceMemoryRegistryStore";
import type { HelixAccountLinkedAccount, HelixAccountSessionStatus } from "@shared/helix-account-session";
import type { HelixProfileIngressTokenSummary } from "@shared/helix-profile-ingress";

type DiscordSessionView = {
  session_id: string;
  status: string;
  linked_profile_id?: string | null;
  commander_discord_user_id?: string | null;
  thread_id?: string | null;
  live_environment_ids: string[];
  participants: Array<{ discord_user_id: string; display_name: string; role: string; authority: string }>;
  updated_at: string;
};

type ProfileArchiveView = {
  archive_id: string;
  source_family: string;
  session_title: string;
  objective: string;
  started_at: string;
  ended_at: string;
  summary: string;
  evidence_index: Array<{ evidence_id: string; category: string; summary: string; confidence: number }>;
  subgoals: Array<{ label: string; final_status: string; evidence_ids: string[] }>;
  learned_pattern_candidates: string[];
  raw_logs_included: false;
  assistant_answer: false;
};

type CategorizationJobView = {
  job_id: string;
  thread_id: string;
  profile_id?: string | null;
  room_id?: string | null;
  source_family: string;
  source_ids: string[];
  world_id?: string | null;
  objective: string;
  status: string;
  policy: {
    mode: string;
    evidence_budget: string;
    surface_policy: string;
    archive_on_stop: boolean;
    profile_archive_policy: string;
  };
  counters: {
    source_events_seen: number;
    categorization_events: number;
    synthetic_evidence: number;
    utility_hypotheses: number;
    pattern_candidates: number;
  };
  latest_summary?: string | null;
  last_event_ts?: string | null;
  archive_id?: string | null;
  raw_logs_included: false;
  assistant_answer: false;
  updated_at: string;
};

const emptyStatus: HelixAccountSessionStatus = {
  schema: "helix.account_session_status.v1",
  ok: false,
  session: null,
  linked_accounts: [],
  profile_ingress_tokens: [],
  profile_ingress_usage: {
    request_count: 0,
    accepted_count: 0,
    rejected_count: 0,
    estimated_token_count: 0,
    last_event_at: null,
  },
  usage: {
    thread_count: 0,
    item_count: 0,
    answer_count: 0,
    tool_observation_count: 0,
    validation_count: 0,
    estimated_token_count: 0,
    window_started_at: "",
    window_ended_at: "",
  },
  auth_boundary: {
    credential_collection_allowed_in_agents: false,
    raw_password_stored: false,
    discord_bot_password_collection_allowed: false,
    recommended_flow: "web_auth_or_oauth_link",
  },
};

type Translate = InterfaceTextResolver["t"];
type DisplayMessageMap = Record<string, InterfaceMessageId>;

const sessionStatusMessages = {
  active: "account.display.sessionStatus.active",
  signed_out: "account.display.sessionStatus.signedOut",
} satisfies DisplayMessageMap;

const memoryScopeMessages = {
  profile: "account.display.memoryScope.profile",
  session_only: "account.display.memoryScope.sessionOnly",
} satisfies DisplayMessageMap;

const authModeMessages = {
  web_auth: "account.display.authMode.webAuth",
  local_dev_profile: "account.display.authMode.localDevProfile",
  local_password_profile: "account.display.authMode.localPasswordProfile",
} satisfies DisplayMessageMap;

const providerMessages = {
  google: "account.display.provider.google",
  local: "account.display.provider.local",
  discord: "account.display.provider.discord",
  minehut: "account.display.provider.minehut",
  browser: "account.display.provider.browser",
} satisfies DisplayMessageMap;

const linkedStatusMessages = {
  linked: "account.display.linkStatus.linked",
  pending: "account.display.linkStatus.pending",
  revoked: "account.display.linkStatus.revoked",
} satisfies DisplayMessageMap;

const authorityMessages = {
  owner: "account.display.authority.owner",
  commander: "account.display.authority.commander",
  participant: "account.display.authority.participant",
  viewer: "account.display.authority.viewer",
} satisfies DisplayMessageMap;

const artifactTypeMessages = {
  workstation_note: "account.display.artifactType.workstationNote",
  helix_chat_session: "account.display.artifactType.helixChatSession",
  helix_chat_layout: "account.display.artifactType.helixChatLayout",
  workstation_layout: "account.display.artifactType.workstationLayout",
  workstation_session_draft: "account.display.artifactType.workstationSessionDraft",
  workstation_panel_scroll: "account.display.artifactType.workstationPanelScroll",
} satisfies DisplayMessageMap;

const ownerScopeMessages = {
  browser_guest: "account.display.ownerScope.browserGuest",
  profile: "account.display.ownerScope.profile",
  surface_session_only: "account.display.ownerScope.surfaceSessionOnly",
} satisfies DisplayMessageMap;

const storageBackendMessages = {
  localStorage: "account.display.storageBackend.localStorage",
  sessionStorage: "account.display.storageBackend.sessionStorage",
  profile_server: "account.display.storageBackend.profileServer",
} satisfies DisplayMessageMap;

const syncStatusMessages = {
  local_only: "account.display.syncStatus.localOnly",
  profile_candidate: "account.display.syncStatus.profileCandidate",
  profile_synced: "account.display.syncStatus.profileSynced",
} satisfies DisplayMessageMap;

const tokenStatusMessages = {
  active: "account.display.tokenStatus.active",
  revoked: "account.display.tokenStatus.revoked",
} satisfies DisplayMessageMap;

const jobStatusMessages = {
  active: "account.display.jobStatus.active",
  running: "account.display.jobStatus.running",
  paused: "account.display.jobStatus.paused",
  stopped: "account.display.jobStatus.stopped",
  completed: "account.display.jobStatus.completed",
  failed: "account.display.jobStatus.failed",
} satisfies DisplayMessageMap;

const sourceFamilyMessages = {
  "helix-ask:desktop": "account.display.sourceFamily.helixAskDesktop",
  helix_ask_desktop: "account.display.sourceFamily.helixAskDesktop",
} satisfies DisplayMessageMap;

function displayMappedValue(t: Translate, value: string | null | undefined, messages: DisplayMessageMap): string {
  if (!value) return t("account.common.none");
  const messageId = messages[value];
  return messageId ? t(messageId) : value;
}

function displayBoolean(t: Translate, value: boolean): string {
  return t(value ? "account.display.boolean.true" : "account.display.boolean.false");
}

async function fetchStatus(): Promise<HelixAccountSessionStatus> {
  const response = await fetch("/api/account/session");
  if (!response.ok) throw new Error(`status ${response.status}`);
  return response.json();
}

async function fetchDiscordSessions(): Promise<DiscordSessionView[]> {
  const response = await fetch("/api/discord/sessions");
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body.sessions) ? body.sessions : [];
}

async function fetchProfileArchives(profileId: string): Promise<ProfileArchiveView[]> {
  if (!profileId.trim()) return [];
  const response = await fetch(`/api/agi/situation/profile-archives?profile_id=${encodeURIComponent(profileId.trim())}`);
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body.archives) ? body.archives : [];
}

async function fetchCategorizationJobs(): Promise<CategorizationJobView[]> {
  const response = await fetch("/api/agi/situation/categorization-jobs?thread_id=helix-ask%3Adesktop");
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body.jobs) ? body.jobs : [];
}

export default function AccountSessionPanel() {
  const [status, setStatus] = React.useState<HelixAccountSessionStatus>(emptyStatus);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fallbackProfileId = "DatDamPig";
  const [localUsername, setLocalUsername] = React.useState("admin");
  const [localPassword, setLocalPassword] = React.useState("password");
  const [ingressLabel, setIngressLabel] = React.useState("");
  const [newTokenValue, setNewTokenValue] = React.useState<string | null>(null);
  const [discordSessions, setDiscordSessions] = React.useState<DiscordSessionView[]>([]);
  const [profileArchives, setProfileArchives] = React.useState<ProfileArchiveView[]>([]);
  const [categorizationJobs, setCategorizationJobs] = React.useState<CategorizationJobView[]>([]);
  const { userSettings, updateSettings } = useHelixStartSettings();
  const memoryRegistrySnapshot = useWorkspaceMemoryRegistryStore((state) =>
    state.buildRegistrySnapshot(),
  );
  const interfaceLanguage = getInterfaceLanguageOption(userSettings.interfaceLanguage);
  const interfaceText = useInterfaceText(interfaceLanguage.code);
  const t = interfaceText.t;

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStatus, nextDiscordSessions, nextCategorizationJobs] = await Promise.all([
        fetchStatus(),
        fetchDiscordSessions(),
        fetchCategorizationJobs(),
      ]);
      setStatus(nextStatus);
      setDiscordSessions(nextDiscordSessions);
      setCategorizationJobs(nextCategorizationJobs);
      setProfileArchives(await fetchProfileArchives(nextStatus.session?.profile.profile_id ?? fallbackProfileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account session.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const signIn = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/account/session/password-sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: localUsername, password: localPassword }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message ?? `sign-in ${response.status}`);
      setLocalPassword("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in to local profile.");
    } finally {
      setLoading(false);
    }
  }, [localPassword, localUsername, refresh]);

  const signOut = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeAuthMode = status.session?.profile.auth_mode;
      const response = await fetch(
        activeAuthMode === "web_auth" ? "/api/auth/google/sign-out" : "/api/account/session/sign-out",
        { method: "POST" },
      );
      if (!response.ok) throw new Error(`sign-out ${response.status}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  }, [refresh, status.session?.profile.auth_mode]);

  const createIngressToken = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setNewTokenValue(null);
    try {
      const response = await fetch("/api/account/profile-ingress/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: ingressLabel.trim() || t("account.ingress.defaultLabel"),
          scopes: ["source_event", "live_environment_event"],
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message ?? `profile-ingress ${response.status}`);
      setNewTokenValue(body.token_value ?? null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile ingress token.");
    } finally {
      setLoading(false);
    }
  }, [ingressLabel, refresh, t]);

  const revokeIngressToken = React.useCallback(
    async (tokenId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/account/profile-ingress/${encodeURIComponent(tokenId)}/revoke`, {
          method: "POST",
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body?.message ?? `revoke ${response.status}`);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to revoke profile ingress token.");
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const session = status.session;
  const usage = status.usage;
  const showLocalDevSignIn = import.meta.env.DEV;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <UserCircle className="h-4 w-4 text-cyan-300" />
              {t("account.header.title")}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {t("account.header.description")}
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
          >
            {loading ? t("account.action.loading") : t("account.action.refresh")}
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,360px)_1fr]">
          <section className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("account.session.title")}
            </div>
            {session ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-medium text-white">{session.profile.display_name}</p>
                <p className="break-all text-xs text-slate-400">{session.profile.profile_id}</p>
                {session.profile.email ? <p className="break-all text-xs text-slate-500">{session.profile.email}</p> : null}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="rounded bg-white/5 px-2 py-1">
                    {t("account.session.statusValue", { status: displayMappedValue(t, session.status, sessionStatusMessages) })}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-1">
                    {t("account.session.memoryValue", { memory: displayMappedValue(t, session.memory_scope, memoryScopeMessages) })}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-1">
                    {t("account.session.authValue", { authMode: displayMappedValue(t, session.profile.auth_mode, authModeMessages) })}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-1">
                    {t("account.session.providerValue", {
                      provider: displayMappedValue(t, session.profile.provider ?? "local", providerMessages),
                    })}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-1">{t("account.session.agentPasswordsOff")}</span>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-2 inline-flex items-center gap-2 rounded border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-500/20"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t("account.session.signOut")}
                </button>
              </div>
            ) : showLocalDevSignIn ? (
              <div className="mt-3 space-y-3">
                <label className="block text-xs text-slate-300">
                  {t("account.signIn.username")}
                  <input
                    value={localUsername}
                    onChange={(event) => setLocalUsername(event.target.value)}
                    autoComplete="username"
                    className="mt-1 w-full rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-xs text-slate-300">
                  {t("account.signIn.password")}
                  <input
                    type="password"
                    value={localPassword}
                    onChange={(event) => setLocalPassword(event.target.value)}
                    autoComplete="current-password"
                    className="mt-1 w-full rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={signIn}
                  disabled={!localUsername.trim() || !localPassword || loading}
                  className="inline-flex items-center gap-2 rounded border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/25"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {t("account.signIn.submit")}
                </button>
                <p className="text-[11px] text-slate-500">
                  {t("account.signIn.devNote", {
                    defaultCredentialsNote: status.auth_boundary.local_password_profile_dev_default
                      ? t("account.signIn.defaultCredentialsNote")
                      : "",
                  })}
                </p>
                <div className="border-t border-white/10 pt-3">
                  <p className="mb-2 text-xs text-slate-400">
                    {t("account.signIn.googleProfileNote")}
                  </p>
                  <GoogleSignInButton redirectTarget={null} onSignedIn={refresh} />
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-400">
                  {t("account.guest.description")}
                </p>
                <div className="rounded border border-cyan-400/20 bg-cyan-500/10 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-100">
                    <LogIn className="h-3.5 w-3.5" />
                    {t("account.guest.saveProfileTitle")}
                  </div>
                  <GoogleSignInButton redirectTarget={null} onSignedIn={refresh} />
                </div>
              </div>
            )}
          </section>

          <div className="space-y-3">
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                <Languages className="h-3.5 w-3.5" />
                {interfaceText.t("account.language.title")}
              </div>
              <div className="mt-3 max-w-sm">
                <label className="block text-xs text-slate-300">
                  {interfaceText.t("account.language.interfaceLabel")}
                  <select
                    value={interfaceLanguage.code}
                    onChange={(event) => {
                      const nextLanguage = getInterfaceLanguageOption(event.target.value).code;
                      updateSettings({ interfaceLanguage: nextLanguage });
                      writeInterfaceLanguagePreference(nextLanguage, "account_session_panel");
                    }}
                    className="mt-1 h-9 w-full rounded border border-white/15 bg-slate-900 px-2 text-sm text-white outline-none focus:border-cyan-400"
                  >
                    {INTERFACE_LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.code} value={option.code}>
                        {t("account.language.optionReadiness", {
                          label: option.label,
                          nativeLabel: option.nativeLabel,
                          readiness: getInterfaceLanguageReadiness(option),
                        })}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <details className="group rounded-lg border border-white/10 bg-black/20 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                <span>{t("account.usage.title")}</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
                <Metric label={t("account.usage.threads")} value={usage.thread_count} />
                <Metric label={t("account.usage.items")} value={usage.item_count} />
                <Metric label={t("account.usage.answers")} value={usage.answer_count} />
                <Metric label={t("account.usage.observations")} value={usage.tool_observation_count} />
                <Metric label={t("account.usage.estimatedTokens")} value={usage.estimated_token_count} />
              </div>
              <div className="mt-4 text-xs text-slate-400">
                {t("account.usage.window", {
                  startedAt: usage.window_started_at || t("account.common.none"),
                  endedAt: usage.window_ended_at || t("account.common.none"),
                })}
              </div>
            </details>
          </div>
        </div>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Link2 className="h-3.5 w-3.5" />
            {t("account.linked.title")}
          </div>
          <div className="mt-3 space-y-2">
            {status.linked_accounts.length === 0 ? (
              <p className="text-xs text-slate-500">{t("account.linked.empty")}</p>
            ) : (
              status.linked_accounts.map((account: HelixAccountLinkedAccount) => (
                <div
                  key={`${account.provider}:${account.external_id}`}
                  className="grid gap-2 rounded border border-white/10 bg-slate-950/60 p-2 text-xs md:grid-cols-[120px_1fr_120px_120px]"
                >
                  <span className="font-medium text-slate-200">{displayMappedValue(t, account.provider, providerMessages)}</span>
                  <span className="break-all text-slate-400">{account.display_name || account.external_id}</span>
                  <span className="text-slate-300">{displayMappedValue(t, account.status, linkedStatusMessages)}</span>
                  <span className="text-slate-300">{displayMappedValue(t, account.authority ?? "viewer", authorityMessages)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Database className="h-3.5 w-3.5" />
            {t("account.memory.title")}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {t("account.memory.description")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <Metric label={t("account.memory.artifacts")} value={memoryRegistrySnapshot.artifacts.length} />
            <Metric label={t("account.memory.profileReady")} value={memoryRegistrySnapshot.profile_ready_artifact_count} />
            <Metric label={t("account.memory.localOnly")} value={memoryRegistrySnapshot.local_only_artifact_count} />
            <Metric label={t("account.memory.sessionOnly")} value={memoryRegistrySnapshot.session_only_artifact_count} />
          </div>
          <div className="mt-3 space-y-1.5">
            {memoryRegistrySnapshot.artifacts.length === 0 ? (
              <p className="text-xs text-slate-500">{t("account.memory.empty")}</p>
            ) : (
              memoryRegistrySnapshot.artifacts.slice(0, 8).map((artifact) => (
                <div
                  key={artifact.artifact_id}
                  className="grid gap-2 rounded border border-white/10 bg-slate-950/60 p-2 text-xs lg:grid-cols-[1fr_130px_130px_130px]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-200">
                      {artifact.title || artifact.artifact_id}
                    </div>
                    <div className="mt-1 truncate text-slate-500">
                      {displayMappedValue(t, artifact.artifact_type, artifactTypeMessages)}
                    </div>
                  </div>
                  <span className="rounded bg-white/5 px-2 py-1 text-slate-300">
                    {displayMappedValue(t, artifact.owner_scope, ownerScopeMessages)}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-1 text-slate-300">
                    {displayMappedValue(t, artifact.storage_backend, storageBackendMessages)}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-1 text-slate-300">
                    {displayMappedValue(t, artifact.sync_status, syncStatusMessages)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Link2 className="h-3.5 w-3.5" />
            {t("account.discord.title")}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {t("account.discord.description")}
          </p>
          <div className="mt-3 space-y-2">
            {discordSessions.length === 0 ? (
              <p className="text-xs text-slate-500">{t("account.discord.empty")}</p>
            ) : (
              discordSessions.map((discordSession: DiscordSessionView) => {
                const commander = discordSession.participants.find(
                  (participant: DiscordSessionView["participants"][number]) =>
                    participant.discord_user_id === discordSession.commander_discord_user_id,
                );
                return (
                  <div
                    key={discordSession.session_id}
                    className="grid gap-2 rounded border border-white/10 bg-slate-950/60 p-2 text-xs lg:grid-cols-[1fr_110px_160px]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-200">{discordSession.session_id}</div>
                      <div className="mt-1 truncate text-slate-500">
                        {t("account.discord.threadValue", {
                          threadId: discordSession.thread_id ?? t("account.common.unbound"),
                        })}
                      </div>
                    </div>
                    <span className="rounded bg-white/5 px-2 py-1 text-center text-slate-300">
                      {displayMappedValue(t, discordSession.status, sessionStatusMessages)}
                    </span>
                    <div className="text-slate-300">
                      <div>
                        {t("account.discord.profileValue", {
                          profileId: discordSession.linked_profile_id ?? t("account.common.unlinked"),
                        })}
                      </div>
                      <div className="mt-1">
                        {t("account.discord.commanderValue", {
                          commander: commander?.display_name ?? t("account.common.none"),
                        })}
                      </div>
                      <div className="mt-1">
                        {t("account.discord.liveEnvsValue", { count: discordSession.live_environment_ids.length })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Archive className="h-3.5 w-3.5" />
            {t("account.archives.title")}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {t("account.archives.description")}
          </p>
          <div className="mt-3 space-y-2">
            {profileArchives.length === 0 ? (
              <p className="text-xs text-slate-500">{t("account.archives.empty")}</p>
            ) : (
              profileArchives.slice(-6).reverse().map((archive: ProfileArchiveView) => (
                <div
                  key={archive.archive_id}
                  className="grid gap-2 rounded border border-white/10 bg-slate-950/60 p-2 text-xs lg:grid-cols-[1fr_150px_150px]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-200">{archive.session_title}</div>
                    <div className="mt-1 truncate text-slate-500">{archive.archive_id}</div>
                    <p className="mt-2 line-clamp-2 text-slate-400">{archive.summary}</p>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>
                      {t("account.archives.sourceValue", {
                        source: displayMappedValue(t, archive.source_family, sourceFamilyMessages),
                      })}
                    </div>
                    <div>{t("account.archives.evidenceValue", { count: archive.evidence_index.length })}</div>
                    <div>{t("account.archives.patternsValue", { count: archive.learned_pattern_candidates.length })}</div>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    <div>{t("account.archives.rawLogsValue", { value: displayBoolean(t, archive.raw_logs_included) })}</div>
                    <div>{t("account.archives.assistantAnswerValue", { value: displayBoolean(t, archive.assistant_answer) })}</div>
                    <div>{archive.ended_at}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Archive className="h-3.5 w-3.5" />
            {t("account.jobs.title")}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {t("account.jobs.description")}
          </p>
          <div className="mt-3 space-y-2">
            {categorizationJobs.length === 0 ? (
              <p className="text-xs text-slate-500">{t("account.jobs.empty")}</p>
            ) : (
              categorizationJobs.map((job: CategorizationJobView) => (
                <div
                  key={job.job_id}
                  className="grid gap-2 rounded border border-white/10 bg-slate-950/60 p-2 text-xs xl:grid-cols-[1fr_180px_180px]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-200">{job.objective}</div>
                    <div className="mt-1 truncate text-slate-500">{job.job_id}</div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-300">
                      <span className="rounded bg-white/5 px-2 py-1">{displayMappedValue(t, job.status, jobStatusMessages)}</span>
                      <span className="rounded bg-white/5 px-2 py-1">
                        {displayMappedValue(t, job.source_family, sourceFamilyMessages)}
                      </span>
                      <span className="rounded bg-white/5 px-2 py-1">
                        {job.room_id ?? t("account.display.room.none")}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-slate-300">
                    <span>{t("account.jobs.eventsValue", { count: job.counters.source_events_seen })}</span>
                    <span>{t("account.jobs.categoriesValue", { count: job.counters.categorization_events })}</span>
                    <span>{t("account.jobs.evidenceValue", { count: job.counters.synthetic_evidence })}</span>
                    <span>{t("account.jobs.patternsValue", { count: job.counters.pattern_candidates })}</span>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    <div>{t("account.jobs.archiveOnStopValue", { value: displayBoolean(t, job.policy.archive_on_stop) })}</div>
                    <div>{t("account.jobs.rawLogsValue", { value: displayBoolean(t, job.raw_logs_included) })}</div>
                    <div>{job.last_event_ts ?? t("account.jobs.waitingForEvents")}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <KeyRound className="h-3.5 w-3.5" />
            {t("account.ingress.title")}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {t("account.ingress.description")}
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              value={ingressLabel}
              onChange={(event) => setIngressLabel(event.target.value)}
              disabled={!session}
              className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
              placeholder={t("account.ingress.defaultLabel")}
            />
            <button
              type="button"
              onClick={createIngressToken}
              disabled={!session || loading}
              className="rounded border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("account.ingress.createToken")}
            </button>
          </div>
          {newTokenValue ? (
            <div className="mt-3 rounded border border-amber-300/30 bg-amber-400/10 p-2 text-xs text-amber-100">
              <div className="font-medium">{t("account.ingress.tokenShownOnce")}</div>
              <div className="mt-1 break-all font-mono text-[11px]">{newTokenValue}</div>
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <Metric label={t("account.ingress.requests")} value={status.profile_ingress_usage.request_count} />
            <Metric label={t("account.ingress.accepted")} value={status.profile_ingress_usage.accepted_count} />
            <Metric label={t("account.ingress.rejected")} value={status.profile_ingress_usage.rejected_count} />
            <Metric label={t("account.ingress.tokens")} value={status.profile_ingress_tokens.length} />
          </div>
          <div className="mt-3 space-y-2">
            {status.profile_ingress_tokens.length === 0 ? (
              <p className="text-xs text-slate-500">{t("account.ingress.empty")}</p>
            ) : (
              status.profile_ingress_tokens.map((token: HelixProfileIngressTokenSummary) => (
                <div
                  key={token.token_id}
                  className="grid gap-2 rounded border border-white/10 bg-slate-950/60 p-2 text-xs lg:grid-cols-[160px_1fr_100px_90px]"
                >
                  <div>
                    <div className="font-medium text-slate-200">{token.label}</div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {displayMappedValue(t, token.status, tokenStatusMessages)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="break-all text-slate-400">{token.public_ingress_url}</div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {t("account.ingress.prefixValue", { prefix: token.token_prefix })}
                    </div>
                  </div>
                  <div className="text-slate-300">
                    {t("account.ingress.requestsValue", { count: token.request_count })}
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeIngressToken(token.token_id)}
                    disabled={token.status !== "active" || loading}
                    className="rounded border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-rose-100 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("account.ingress.revoke")}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
          <div className="font-semibold uppercase tracking-[0.12em] text-slate-400">{t("account.boundary.title")}</div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <span className="rounded bg-white/5 px-2 py-1">
              {t("account.boundary.agentCredentialsValue", {
                value: displayBoolean(t, status.auth_boundary.credential_collection_allowed_in_agents),
              })}
            </span>
            <span className="rounded bg-white/5 px-2 py-1">
              {t("account.boundary.rawPasswordsValue", {
                value: displayBoolean(t, status.auth_boundary.raw_password_stored),
              })}
            </span>
            <span className="rounded bg-white/5 px-2 py-1">
              {t("account.boundary.discordPasswordCollectionValue", {
                value: displayBoolean(t, status.auth_boundary.discord_bot_password_collection_allowed),
              })}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-white/10 bg-slate-950/60 p-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value.toLocaleString()}</div>
    </div>
  );
}
