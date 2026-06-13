import React from "react";
import { Archive, ChevronDown, Database, KeyRound, Languages, Link2, LogIn, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import { getInterfaceLanguageOption, INTERFACE_LANGUAGE_OPTIONS } from "@/lib/i18n/interfaceLanguage";
import { useInterfaceText } from "@/lib/i18n/interfaceText";
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
  const [localPassword, setLocalPassword] = React.useState("");
  const [ingressLabel, setIngressLabel] = React.useState("Profile ingress");
  const [newTokenValue, setNewTokenValue] = React.useState<string | null>(null);
  const [discordSessions, setDiscordSessions] = React.useState<DiscordSessionView[]>([]);
  const [profileArchives, setProfileArchives] = React.useState<ProfileArchiveView[]>([]);
  const [categorizationJobs, setCategorizationJobs] = React.useState<CategorizationJobView[]>([]);
  const { userSettings, updateSettings } = useHelixStartSettings();
  const memoryRegistrySnapshot = useWorkspaceMemoryRegistryStore((state) =>
    state.buildRegistrySnapshot(),
  );

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
        body: JSON.stringify({ label: ingressLabel, scopes: ["source_event", "live_environment_event"] }),
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
  }, [ingressLabel, refresh]);

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
  const interfaceLanguage = getInterfaceLanguageOption(userSettings.interfaceLanguage);
  const interfaceText = useInterfaceText(interfaceLanguage.code);
  const showLocalDevSignIn = import.meta.env.DEV;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <UserCircle className="h-4 w-4 text-cyan-300" />
              Account & Sessions
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Profile, linked sources, memory scope, and usage for the current workstation.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,360px)_1fr]">
          <section className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Session
            </div>
            {session ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-medium text-white">{session.profile.display_name}</p>
                <p className="break-all text-xs text-slate-400">{session.profile.profile_id}</p>
                {session.profile.email ? <p className="break-all text-xs text-slate-500">{session.profile.email}</p> : null}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="rounded bg-white/5 px-2 py-1">status {session.status}</span>
                  <span className="rounded bg-white/5 px-2 py-1">memory {session.memory_scope}</span>
                  <span className="rounded bg-white/5 px-2 py-1">auth {session.profile.auth_mode}</span>
                  <span className="rounded bg-white/5 px-2 py-1">
                    provider {session.profile.provider ?? "local"}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-1">agent passwords off</span>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-2 inline-flex items-center gap-2 rounded border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-500/20"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            ) : showLocalDevSignIn ? (
              <div className="mt-3 space-y-3">
                <label className="block text-xs text-slate-300">
                  Local admin username
                  <input
                    value={localUsername}
                    onChange={(event) => setLocalUsername(event.target.value)}
                    autoComplete="username"
                    className="mt-1 w-full rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-xs text-slate-300">
                  Password
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
                  Sign in local admin
                </button>
                <p className="text-[11px] text-slate-500">
                  Development-only password profile for local profile-storage experiments.
                  {status.auth_boundary.local_password_profile_dev_default
                    ? " Default credentials are admin/password until HELIX_LOCAL_PROFILE_PASSWORD_HASH is configured."
                    : null}
                </p>
                <div className="border-t border-white/10 pt-3">
                  <p className="mb-2 text-xs text-slate-400">
                    Use Google when you want this workstation profile and remembered procedures attached to your account.
                  </p>
                  <GoogleSignInButton redirectTarget={null} onSignedIn={refresh} />
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-400">
                  No profile session is active. You can keep using the workstation as a guest; sign in only when you want
                  profile-scoped memory and remembered procedures.
                </p>
                <div className="rounded border border-cyan-400/20 bg-cyan-500/10 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-100">
                    <LogIn className="h-3.5 w-3.5" />
                    Save to your CasimirBot profile
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
                    onChange={(event) =>
                      updateSettings({ interfaceLanguage: getInterfaceLanguageOption(event.target.value).code })
                    }
                    className="mt-1 h-9 w-full rounded border border-white/15 bg-slate-900 px-2 text-sm text-white outline-none focus:border-cyan-400"
                  >
                    {INTERFACE_LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label} ({option.nativeLabel})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <details className="group rounded-lg border border-white/10 bg-black/20 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                <span>Usage</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
                <Metric label="Threads" value={usage.thread_count} />
                <Metric label="Items" value={usage.item_count} />
                <Metric label="Answers" value={usage.answer_count} />
                <Metric label="Observations" value={usage.tool_observation_count} />
                <Metric label="Est. tokens" value={usage.estimated_token_count} />
              </div>
              <div className="mt-4 text-xs text-slate-400">
                Window: {usage.window_started_at || "none"} {"->"} {usage.window_ended_at || "none"}
              </div>
            </details>
          </div>
        </div>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Link2 className="h-3.5 w-3.5" />
            Linked Accounts & Sessions
          </div>
          <div className="mt-3 space-y-2">
            {status.linked_accounts.length === 0 ? (
              <p className="text-xs text-slate-500">No linked accounts yet.</p>
            ) : (
              status.linked_accounts.map((account: HelixAccountLinkedAccount) => (
                <div
                  key={`${account.provider}:${account.external_id}`}
                  className="grid gap-2 rounded border border-white/10 bg-slate-950/60 p-2 text-xs md:grid-cols-[120px_1fr_120px_120px]"
                >
                  <span className="font-medium text-slate-200">{account.provider}</span>
                  <span className="break-all text-slate-400">{account.display_name || account.external_id}</span>
                  <span className="text-slate-300">{account.status}</span>
                  <span className="text-slate-300">{account.authority ?? "viewer"}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Database className="h-3.5 w-3.5" />
            Workspace Memory
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Local registry for notes, Helix Ask chats, layout snapshots, and browser-session drafts.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <Metric label="Artifacts" value={memoryRegistrySnapshot.artifacts.length} />
            <Metric label="Profile-ready" value={memoryRegistrySnapshot.profile_ready_artifact_count} />
            <Metric label="Local only" value={memoryRegistrySnapshot.local_only_artifact_count} />
            <Metric label="Session only" value={memoryRegistrySnapshot.session_only_artifact_count} />
          </div>
          <div className="mt-3 space-y-1.5">
            {memoryRegistrySnapshot.artifacts.length === 0 ? (
              <p className="text-xs text-slate-500">No workspace memory artifacts have been registered yet.</p>
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
                    <div className="mt-1 truncate text-slate-500">{artifact.artifact_type}</div>
                  </div>
                  <span className="rounded bg-white/5 px-2 py-1 text-slate-300">
                    {artifact.owner_scope}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-1 text-slate-300">
                    {artifact.storage_backend}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-1 text-slate-300">
                    {artifact.sync_status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Link2 className="h-3.5 w-3.5" />
            Discord Companion Sessions
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Linked Discord sessions use web profile linking. The bot never collects account passwords.
          </p>
          <div className="mt-3 space-y-2">
            {discordSessions.length === 0 ? (
              <p className="text-xs text-slate-500">No Discord companion sessions are active.</p>
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
                      <div className="mt-1 truncate text-slate-500">thread {discordSession.thread_id ?? "unbound"}</div>
                    </div>
                    <span className="rounded bg-white/5 px-2 py-1 text-center text-slate-300">
                      {discordSession.status}
                    </span>
                    <div className="text-slate-300">
                      <div>profile {discordSession.linked_profile_id ?? "unlinked"}</div>
                      <div className="mt-1">commander {commander?.display_name ?? "none"}</div>
                      <div className="mt-1">live envs {discordSession.live_environment_ids.length}</div>
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
            Profile Situation Archives
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Durable session summaries and evidence indexes saved from continuous categorization jobs.
          </p>
          <div className="mt-3 space-y-2">
            {profileArchives.length === 0 ? (
              <p className="text-xs text-slate-500">No profile situation archives have been saved yet.</p>
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
                    <div>source {archive.source_family}</div>
                    <div>evidence {archive.evidence_index.length}</div>
                    <div>patterns {archive.learned_pattern_candidates.length}</div>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    <div>raw logs {String(archive.raw_logs_included)}</div>
                    <div>assistant answer {String(archive.assistant_answer)}</div>
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
            Active Categorization Jobs
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Background evidence builders attached to Helix threads. These are observations and validations, not assistant answers.
          </p>
          <div className="mt-3 space-y-2">
            {categorizationJobs.length === 0 ? (
              <p className="text-xs text-slate-500">No categorization jobs are active for helix-ask:desktop.</p>
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
                      <span className="rounded bg-white/5 px-2 py-1">{job.status}</span>
                      <span className="rounded bg-white/5 px-2 py-1">{job.source_family}</span>
                      <span className="rounded bg-white/5 px-2 py-1">{job.room_id ?? "no room"}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-slate-300">
                    <span>events {job.counters.source_events_seen}</span>
                    <span>categories {job.counters.categorization_events}</span>
                    <span>evidence {job.counters.synthetic_evidence}</span>
                    <span>patterns {job.counters.pattern_candidates}</span>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    <div>archive on stop {String(job.policy.archive_on_stop)}</div>
                    <div>raw logs {String(job.raw_logs_included)}</div>
                    <div>{job.last_event_ts ?? "waiting for events"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <KeyRound className="h-3.5 w-3.5" />
            Profile Ingress
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Per-profile API links for live sources. Secrets are shown once and only a hash is retained server-side.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              value={ingressLabel}
              onChange={(event) => setIngressLabel(event.target.value)}
              disabled={!session}
              className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
              placeholder="Token label"
            />
            <button
              type="button"
              onClick={createIngressToken}
              disabled={!session || loading}
              className="rounded border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create ingress token
            </button>
          </div>
          {newTokenValue ? (
            <div className="mt-3 rounded border border-amber-300/30 bg-amber-400/10 p-2 text-xs text-amber-100">
              <div className="font-medium">Token shown once</div>
              <div className="mt-1 break-all font-mono text-[11px]">{newTokenValue}</div>
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <Metric label="Ingress requests" value={status.profile_ingress_usage.request_count} />
            <Metric label="Accepted" value={status.profile_ingress_usage.accepted_count} />
            <Metric label="Rejected" value={status.profile_ingress_usage.rejected_count} />
            <Metric label="Ingress tokens" value={status.profile_ingress_tokens.length} />
          </div>
          <div className="mt-3 space-y-2">
            {status.profile_ingress_tokens.length === 0 ? (
              <p className="text-xs text-slate-500">No profile ingress tokens yet.</p>
            ) : (
              status.profile_ingress_tokens.map((token: HelixProfileIngressTokenSummary) => (
                <div
                  key={token.token_id}
                  className="grid gap-2 rounded border border-white/10 bg-slate-950/60 p-2 text-xs lg:grid-cols-[160px_1fr_100px_90px]"
                >
                  <div>
                    <div className="font-medium text-slate-200">{token.label}</div>
                    <div className="mt-1 text-[10px] text-slate-500">{token.status}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="break-all text-slate-400">{token.public_ingress_url}</div>
                    <div className="mt-1 text-[10px] text-slate-500">prefix {token.token_prefix}...</div>
                  </div>
                  <div className="text-slate-300">{token.request_count} requests</div>
                  <button
                    type="button"
                    onClick={() => revokeIngressToken(token.token_id)}
                    disabled={token.status !== "active" || loading}
                    className="rounded border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-rose-100 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
          <div className="font-semibold uppercase tracking-[0.12em] text-slate-400">Boundary</div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <span className="rounded bg-white/5 px-2 py-1">
              agent credentials: {String(status.auth_boundary.credential_collection_allowed_in_agents)}
            </span>
            <span className="rounded bg-white/5 px-2 py-1">
              raw passwords stored: {String(status.auth_boundary.raw_password_stored)}
            </span>
            <span className="rounded bg-white/5 px-2 py-1">
              Discord password collection: {String(status.auth_boundary.discord_bot_password_collection_allowed)}
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
