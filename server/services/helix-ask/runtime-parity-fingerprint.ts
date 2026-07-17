import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { buildNhm2TheoryBadgeGraphV1 } from "@shared/theory/nhm2-theory-badges";
import { listWorkstationGatewayCapabilities } from "./workstation-tool-gateway/registry";

export const HELIX_RUNTIME_PARITY_FINGERPRINT_SCHEMA =
  "helix.runtime_parity_fingerprint.v1" as const;

type JsonRecord = Record<string, unknown>;

type WorkstationGatewayCapabilityForFingerprint = {
  capability_id: string;
  panel_id: string;
  action_id: string;
  mode: string;
  permission_profile_required: string;
  input_schema: unknown;
};

type WorkstationGatewayForFingerprint = {
  manifest_version: string;
  capabilities: WorkstationGatewayCapabilityForFingerprint[];
};

type EnvironmentEntry = [string, string | undefined];

const SENSITIVE_ENVIRONMENT_NAME =
  /(?:^|_)(?:API_KEY|SECRET|PASSWORD|PASSCODE|CREDENTIAL|TOKEN|AUTH|PRIVATE_KEY|SIGNING_KEY|COOKIE|SESSION_ID|DSN)(?:_|$)/i;

type ReplitBuildMeta = {
  schema?: string;
  node_version?: string;
  built_at?: string;
  artifact_contract_sha256?: string;
  git_authority?: {
    strict?: boolean;
    verified?: boolean;
    worktree_clean_at_authority_check?: boolean;
  };
  client_experience_configuration?: {
    values?: Record<string, string>;
    sha256?: string;
  };
  source?: {
    commit?: string;
    build_id?: string;
    source_tree?: {
      file_count?: number;
      total_bytes?: number;
      sha256?: string;
      line_endings?: string;
    } | null;
    package_lock?: { sha256?: string } | null;
    theory_sources?: { sha256?: string } | null;
    parity_fixture?: { sha256?: string } | null;
  };
  reasoning_materials?: {
    docs_metadata?: { sha256?: string } | null;
    code_lattice?: { sha256?: string } | null;
  };
  artifacts?: {
    server_bundle?: { sha256?: string } | null;
    server_build_identity?: { commit?: string; verified?: boolean } | null;
    client_index?: { sha256?: string } | null;
    client_tree?: { sha256?: string; file_count?: number; total_bytes?: number } | null;
    client_build_identity?: { build_id?: string; verified?: boolean } | null;
    runtime_data?: Record<string, { sha256?: string } | null>;
    parity_static_result?: { sha256?: string } | null;
  };
};

type RuntimeSourceTreeDescriptor = {
  file_count: number;
  total_bytes: number;
  sha256: string;
  line_endings: "lf_normalized_text_v1";
};

const SOURCE_TREE_EXCLUSIONS = [
  /^(?:dist|node_modules|artifacts|reports)\//,
  /^(?:\.local|\.tmp|\.codex-tmp|external|checkpoints|output)\//,
  /^simulations\/(?!tsn-sim\.ts$)/,
  /^server\/_generated\//,
  /^(?:tmp|temp|\.tmp|_tmp|resp\.json$|adapter-(?:run|payload)\.json$|FETCH_HEAD$|nohup\.out$|server-pid\.txt$|tmp_dev_run\.pid$|test-results\.txt$|playwright-debug\.png$|%TEMP%\/)/i,
  /^\.codex-.*(?:cache|tmp)/i,
  /^client\/src\/lib\/docs\/docMetadata\.generated\.ts$/,
];

const TEXT_SOURCE_PATTERN = /(?:^\.replit$|\.(?:c|cc|cjs|cpp|css|csv|cts|d\.ts|graphql|h|hpp|html|ini|js|json|jsx|mjs|md|mts|py|rs|scss|sh|sql|svg|toml|ts|tsx|txt|xml|ya?ml))$/i;

const stableValue = (value: unknown, omittedKeys: ReadonlySet<string> = new Set()): unknown => {
  if (Array.isArray(value)) return value.map((entry: unknown) => stableValue(entry, omittedKeys));
  if (!value || typeof value !== "object") return value;
  const record = value as JsonRecord;
  const keys = Object.keys(record) as string[];
  return Object.fromEntries(
    keys
      .sort()
      .filter((key: string) => !omittedKeys.has(key) && record[key] !== undefined)
      .map((key: string) => [key, stableValue(record[key], omittedKeys)]),
  );
};

export const runtimeParityHash = (
  value: unknown,
  omittedKeys: ReadonlySet<string> = new Set(),
): string => {
  const payload = Buffer.isBuffer(value)
    ? value
    : JSON.stringify(stableValue(value, omittedKeys));
  return `sha256:${crypto.createHash("sha256").update(payload).digest("hex")}`;
};

const readBuildMeta = (): ReplitBuildMeta | null => {
  const configured = process.env.HELIX_BUILD_META_PATH?.trim();
  const candidates = configured
    ? [path.resolve(process.cwd(), configured)]
    : [path.resolve(process.cwd(), "dist", "build-meta.json")];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, "utf8"));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as ReplitBuildMeta;
      }
    } catch {
      // Development/source mode legitimately has no production build metadata.
    }
  }
  return null;
};

const sortedStrings = (value: readonly string[]): string[] => [...value].sort();

const accountPolicyContract = (policy: HelixAccountCapabilityPolicy) => ({
  schema: policy.schema,
  account_type: policy.account_type,
  max_workstation_permission: policy.max_workstation_permission,
  allowed_panels: sortedStrings(policy.allowed_panels),
  locked_panels: sortedStrings(policy.locked_panels),
  locked_features: sortedStrings(policy.locked_features),
  allowed_runtime_agents: sortedStrings(policy.allowed_runtime_agents),
  allowed_workstation_capabilities: sortedStrings(policy.allowed_workstation_capabilities),
  locked_workstation_capabilities: sortedStrings(policy.locked_workstation_capabilities),
  feature_flags: sortedStrings(policy.feature_flags),
  quotas: policy.quotas,
});

const safeHttpOrigin = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
};

const readGitCommitBestEffort = (): string | null => {
  try {
    const commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2_000,
    }).trim();
    return commit || null;
  } catch {
    return null;
  }
};

const readGitWorktreeBestEffort = (): {
  available: boolean;
  dirty: boolean | null;
  change_count: number | null;
  status_sha256: string | null;
} => {
  try {
    const status = execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5_000,
    })
      .replace(/\r\n/g, "\n")
      .trim();
    const entries = status ? status.split("\n") : [];
    return {
      available: true,
      dirty: entries.length > 0,
      change_count: entries.length,
      status_sha256: runtimeParityHash(entries),
    };
  } catch {
    return {
      available: false,
      dirty: null,
      change_count: null,
      status_sha256: null,
    };
  }
};

const runtimeMaterialHashCache = new Map<string, {
  size: number;
  mtimeMs: number;
  sha256: string;
}>();

const hashRuntimeMaterial = (relativePath: string): string | null => {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  try {
    const stat = fs.statSync(absolutePath);
    const cached = runtimeMaterialHashCache.get(absolutePath);
    if (cached && cached.size === stat.size && cached.mtimeMs === stat.mtimeMs) {
      return cached.sha256;
    }
    const sha256 = runtimeParityHash(fs.readFileSync(absolutePath));
    runtimeMaterialHashCache.set(absolutePath, {
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      sha256,
    });
    return sha256;
  } catch {
    return null;
  }
};

const hashRuntimeTree = (
  relativeDirectory: string,
  include: (absolutePath: string) => boolean,
): string | null => {
  const directory = path.resolve(process.cwd(), relativeDirectory);
  try {
    const pending = [directory];
    const files: string[] = [];
    while (pending.length > 0) {
      const current = pending.pop()!;
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const absolute = path.join(current, entry.name);
        if (entry.isDirectory()) pending.push(absolute);
        else if (entry.isFile() && include(absolute)) files.push(absolute);
      }
    }
    files.sort((left: string, right: string) => left.localeCompare(right));
    const hash = crypto.createHash("sha256");
    for (const file of files) {
      const bytes = fs.readFileSync(file);
      const relative = path.relative(directory, file).split(path.sep).join("/");
      const fileHash = crypto.createHash("sha256").update(bytes).digest("hex");
      hash.update(relative);
      hash.update("\0");
      hash.update(String(bytes.byteLength));
      hash.update("\0");
      hash.update(fileHash);
      hash.update("\n");
    }
    return `sha256:${hash.digest("hex")}`;
  } catch {
    return null;
  }
};

let runtimeSourceTreeCache: {
  stateKey: string | null;
  descriptor: RuntimeSourceTreeDescriptor | null;
} | null = null;

const sourceTreePathIncluded = (relativePath: string): boolean =>
  !SOURCE_TREE_EXCLUSIONS.some((pattern: RegExp) => pattern.test(relativePath));

const canonicalRuntimeSourceBytes = (relativePath: string, bytes: Buffer): Buffer =>
  TEXT_SOURCE_PATTERN.test(relativePath)
    ? Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
    : bytes;

const readRuntimeSourceTreeStateKey = (): string | null => {
  try {
    const head = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2_000,
    }).trim();
    const statusOutput = execFileSync(
      "git",
      ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 10_000,
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    const hash = crypto.createHash("sha256");
    hash.update(head);
    hash.update("\n");
    const tokens = statusOutput.split("\0").filter(Boolean);
    const appendPath = (status: string, rawPath: string): void => {
      const relativePath = rawPath.split(path.sep).join("/").replace(/^\.\//, "");
      if (!sourceTreePathIncluded(relativePath)) return;
      hash.update(status);
      hash.update("\0");
      hash.update(relativePath);
      hash.update("\0");
      try {
        const bytes = canonicalRuntimeSourceBytes(
          relativePath,
          fs.readFileSync(path.resolve(process.cwd(), relativePath)),
        );
        hash.update(String(bytes.byteLength));
        hash.update("\0");
        hash.update(crypto.createHash("sha256").update(bytes).digest("hex"));
      } catch {
        hash.update("missing");
      }
      hash.update("\n");
    };
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      const status = token.slice(0, 2);
      appendPath(status, token.slice(3));
      if ((status.includes("R") || status.includes("C")) && tokens[index + 1]) {
        index += 1;
        appendPath(`${status}:source`, tokens[index]);
      }
    }
    return `sha256:${hash.digest("hex")}`;
  } catch {
    return null;
  }
};

const describeRuntimeSourceTree = (): RuntimeSourceTreeDescriptor | null => {
  const stateKey = readRuntimeSourceTreeStateKey();
  if (runtimeSourceTreeCache && stateKey && runtimeSourceTreeCache.stateKey === stateKey) {
    return runtimeSourceTreeCache.descriptor;
  }
  try {
    const output = execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 10_000,
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    const relativePaths = output
      .split("\0")
      .map((entry: string) => entry.split(path.sep).join("/").replace(/^\.\//, ""))
      .filter((entry: string) => Boolean(entry))
      .filter(sourceTreePathIncluded)
      .filter((entry: string) => {
        try {
          return fs.statSync(path.resolve(process.cwd(), entry)).isFile();
        } catch {
          return false;
        }
      })
      .sort((left: string, right: string) => left.localeCompare(right));
    const hash = crypto.createHash("sha256");
    let totalBytes = 0;
    for (const relativePath of relativePaths) {
      const bytes = canonicalRuntimeSourceBytes(
        relativePath,
        fs.readFileSync(path.resolve(process.cwd(), relativePath)),
      );
      const fileHash = crypto.createHash("sha256").update(bytes).digest("hex");
      totalBytes += bytes.byteLength;
      hash.update(relativePath);
      hash.update("\0");
      hash.update(String(bytes.byteLength));
      hash.update("\0");
      hash.update(fileHash);
      hash.update("\n");
    }
    const descriptor: RuntimeSourceTreeDescriptor = {
      file_count: relativePaths.length,
      total_bytes: totalBytes,
      sha256: `sha256:${hash.digest("hex")}`,
      line_endings: "lf_normalized_text_v1",
    };
    runtimeSourceTreeCache = { stateKey, descriptor };
    return descriptor;
  } catch {
    runtimeSourceTreeCache = { stateKey, descriptor: null };
    return null;
  }
};

export const buildTheoryGraphRuntimeFingerprint = () => {
  const graph = buildNhm2TheoryBadgeGraphV1();
  const canonicalGraph = stableValue(graph, new Set(["generatedAt"]));
  const badges = graph.badges as Array<{ id: string }>;
  const badgeIds = badges.map((badge: { id: string }) => badge.id).sort();
  return {
    graph_id: graph.graphId,
    schema_version: graph.schemaVersion,
    badge_count: graph.badges.length,
    edge_count: graph.edges.length,
    badge_ids: badgeIds,
    badge_ids_sha256: runtimeParityHash(badgeIds),
    graph_sha256: runtimeParityHash(canonicalGraph),
  };
};

const buildToolSurfaceFingerprint = () => {
  const gateway = listWorkstationGatewayCapabilities({
    agentRuntime: "parity",
  }) as WorkstationGatewayForFingerprint;
  const capabilities = gateway.capabilities
    .map((capability: WorkstationGatewayCapabilityForFingerprint) => ({
      capability_id: capability.capability_id,
      panel_id: capability.panel_id,
      action_id: capability.action_id,
      mode: capability.mode,
      permission_profile_required: capability.permission_profile_required,
      input_schema: capability.input_schema,
    }))
    .sort(
      (left: { capability_id: string }, right: { capability_id: string }) =>
        left.capability_id.localeCompare(right.capability_id),
    );
  return {
    manifest_version: gateway.manifest_version,
    capability_count: capabilities.length,
    capability_ids: capabilities.map((capability: { capability_id: string }) => capability.capability_id),
    tool_surface_sha256: runtimeParityHash(capabilities),
  };
};

const buildRuntimeConfiguration = () => {
  const hosting = {
    node_env: process.env.NODE_ENV?.trim() || null,
    fast_boot: process.env.FAST_BOOT === "1",
    skip_vite_middleware: process.env.SKIP_VITE_MIDDLEWARE === "1",
    replit_deployment:
      process.env.REPLIT_DEPLOYMENT === "1" ||
      process.env.REPLIT_DEPLOYMENT === "true",
  };
  const environmentEntries = Object.entries(process.env) as EnvironmentEntry[];
  const behaviorEnvironment = Object.fromEntries(
    environmentEntries
      .filter(([key, value]: EnvironmentEntry) =>
        typeof value === "string" &&
        (
          key.startsWith("HELIX_ASK_") ||
          key.startsWith("VITE_HELIX_ASK_") ||
          [
            "ENABLE_AGI",
            "ENABLE_ESSENCE",
            "LLM_POLICY",
            "LLM_RUNTIME",
            "LLM_HTTP_MODEL",
            "HULL_MODE",
          ].includes(key)
        ) &&
        !SENSITIVE_ENVIRONMENT_NAME.test(key),
      )
      .sort(([left]: EnvironmentEntry, [right]: EnvironmentEntry) => left.localeCompare(right))
      .map(([key, value]: EnvironmentEntry) => [key, value!.trim()]),
  );
  const reasoning = {
    enable_agi: process.env.ENABLE_AGI?.trim() || null,
    enable_essence: process.env.ENABLE_ESSENCE?.trim() || null,
    helix_ask_golden_path_runtime:
      process.env.HELIX_ASK_GOLDEN_PATH_RUNTIME?.trim() || null,
    agent_runtime_default: process.env.HELIX_ASK_AGENT_RUNTIME?.trim() || "helix",
    llm_policy: process.env.LLM_POLICY?.trim() || null,
    llm_runtime: process.env.LLM_RUNTIME?.trim() || null,
    llm_http_origin: safeHttpOrigin(process.env.LLM_HTTP_BASE),
    llm_http_model: process.env.LLM_HTTP_MODEL?.trim() || null,
    interpreter_model: process.env.HELIX_ASK_INTERPRETER_MODEL?.trim() || null,
    codex_args_sha256: process.env.CODEX_ARGS?.trim()
      ? runtimeParityHash(process.env.CODEX_ARGS.trim())
      : null,
    codex_bin_mode: process.env.CODEX_BIN?.trim() ? "configured" : "package_resolution",
    hull_mode: process.env.HULL_MODE?.trim() || null,
    behavior_environment: behaviorEnvironment,
    behavior_environment_sha256: runtimeParityHash(behaviorEnvironment),
  };
  return {
    hosting,
    reasoning,
    hosting_configuration_sha256: runtimeParityHash(hosting),
    reasoning_configuration_sha256: runtimeParityHash(reasoning),
  };
};

const buildMetadataProjection = (meta: ReplitBuildMeta | null) => {
  const executionMode =
    process.env.NODE_ENV === "production" && process.env.SKIP_VITE_MIDDLEWARE === "1"
      ? "compiled_production"
      : "source_development";
  const runtimeSourceCommit =
    process.env.REPLIT_GIT_COMMIT?.trim() ??
    process.env.GIT_COMMIT?.trim() ??
    process.env.SOURCE_VERSION?.trim() ??
    readGitCommitBestEffort();
  const artifactSourceCommit = meta?.source?.commit ?? null;
  const worktree = readGitWorktreeBestEffort();
  const runtimeSourceTree =
    executionMode === "source_development" || !meta?.source?.source_tree?.sha256
      ? describeRuntimeSourceTree()
      : null;
  const runtimePackageLockSha256 = hashRuntimeMaterial("package-lock.json");
  const runtimeTheorySourcesSha256 = hashRuntimeTree(
    "shared/theory",
    (file: string) => /\.(?:ts|json)$/i.test(file),
  );
  const environmentEntries = Object.entries(process.env) as EnvironmentEntry[];
  const runtimeClientExperienceConfiguration = Object.fromEntries(
    environmentEntries
      .filter(
        ([key, value]: EnvironmentEntry) =>
          key.startsWith("VITE_HELIX_ASK_") &&
          typeof value === "string" &&
          !SENSITIVE_ENVIRONMENT_NAME.test(key),
      )
      .sort(([left]: EnvironmentEntry, [right]: EnvironmentEntry) => left.localeCompare(right))
      .map(([key, value]: EnvironmentEntry) => [key, value!.trim()]),
  );
  return {
    execution_mode: executionMode,
    metadata_available: Boolean(meta),
    schema: meta?.schema ?? null,
    source_commit:
      executionMode === "compiled_production"
        ? artifactSourceCommit ?? runtimeSourceCommit
        : runtimeSourceCommit ?? artifactSourceCommit,
    runtime_source_commit: runtimeSourceCommit,
    artifact_source_commit: artifactSourceCommit,
    source_commit_matches_artifact:
      runtimeSourceCommit && artifactSourceCommit
        ? runtimeSourceCommit === artifactSourceCommit
        : null,
    runtime_worktree: worktree,
    build_id: meta?.source?.build_id ?? process.env.VITE_BUILD_ID?.trim() ?? null,
    built_at: meta?.built_at ?? null,
    node_version: meta?.node_version ?? process.version,
    artifact_contract_sha256:
      meta?.artifact_contract_sha256 ??
      process.env.HELIX_BUILD_ARTIFACT_CONTRACT_SHA256?.trim() ??
      null,
    git_authority_strict: meta?.git_authority?.strict ?? null,
    git_authority_verified: meta?.git_authority?.verified ?? null,
    git_worktree_clean_at_authority_check:
      meta?.git_authority?.worktree_clean_at_authority_check ?? null,
    package_lock_sha256:
      executionMode === "source_development"
        ? runtimePackageLockSha256
        : meta?.source?.package_lock?.sha256 ?? runtimePackageLockSha256,
    source_tree_sha256:
      executionMode === "compiled_production"
        ? meta?.source?.source_tree?.sha256 ?? runtimeSourceTree?.sha256 ?? null
        : runtimeSourceTree?.sha256 ?? meta?.source?.source_tree?.sha256 ?? null,
    source_tree_file_count:
      executionMode === "compiled_production"
        ? meta?.source?.source_tree?.file_count ?? runtimeSourceTree?.file_count ?? null
        : runtimeSourceTree?.file_count ?? meta?.source?.source_tree?.file_count ?? null,
    source_tree_line_endings:
      meta?.source?.source_tree?.line_endings ?? runtimeSourceTree?.line_endings ?? null,
    theory_sources_sha256:
      executionMode === "source_development"
        ? runtimeTheorySourcesSha256
        : meta?.source?.theory_sources?.sha256 ?? runtimeTheorySourcesSha256,
    parity_fixture_sha256:
      meta?.source?.parity_fixture?.sha256 ??
      hashRuntimeMaterial("scripts/fixtures/helix-replit-parity.v1.json"),
    client_experience_configuration_sha256:
      executionMode === "compiled_production"
        ? meta?.client_experience_configuration?.sha256 ??
          runtimeParityHash(runtimeClientExperienceConfiguration)
        : runtimeParityHash(runtimeClientExperienceConfiguration),
    build_docs_metadata_sha256: meta?.reasoning_materials?.docs_metadata?.sha256 ?? null,
    build_code_lattice_sha256: meta?.reasoning_materials?.code_lattice?.sha256 ?? null,
    runtime_docs_metadata_sha256: hashRuntimeMaterial(
      "client/src/lib/docs/docMetadata.generated.ts",
    ),
    runtime_code_lattice_sha256: hashRuntimeMaterial(
      "server/_generated/code-lattice.json",
    ),
    server_bundle_sha256: meta?.artifacts?.server_bundle?.sha256 ?? null,
    server_bundle_commit:
      meta?.artifacts?.server_build_identity?.commit ??
      ((globalThis as typeof globalThis & { __CASIMIR_SERVER_BUILD_COMMIT__?: string })
        .__CASIMIR_SERVER_BUILD_COMMIT__ ?? null),
    server_build_identity_verified:
      meta?.artifacts?.server_build_identity?.verified ?? null,
    client_index_sha256: meta?.artifacts?.client_index?.sha256 ?? null,
    client_tree_sha256: meta?.artifacts?.client_tree?.sha256 ?? null,
    client_file_count: meta?.artifacts?.client_tree?.file_count ?? null,
    client_total_bytes: meta?.artifacts?.client_tree?.total_bytes ?? null,
    client_bundle_build_id: meta?.artifacts?.client_build_identity?.build_id ?? null,
    client_build_identity_verified:
      meta?.artifacts?.client_build_identity?.verified ?? null,
    runtime_data_sha256: Object.fromEntries(
      (Object.entries(meta?.artifacts?.runtime_data ?? {}) as Array<
        [string, { sha256?: string } | null]
      >)
        .sort(
          ([left]: [string, { sha256?: string } | null], [right]: [string, { sha256?: string } | null]) =>
            left.localeCompare(right),
        )
        .map(([key, descriptor]: [string, { sha256?: string } | null]) => [
          key,
          descriptor?.sha256 ?? null,
        ]),
    ),
    parity_static_result_sha256: meta?.artifacts?.parity_static_result?.sha256 ?? null,
  };
};

export const buildHelixRuntimeParityFingerprint = (input: {
  accountPolicy: HelixAccountCapabilityPolicy;
}) => {
  const build = buildMetadataProjection(readBuildMeta());
  const theory_graph = buildTheoryGraphRuntimeFingerprint();
  const tool_surface = buildToolSurfaceFingerprint();
  const runtime_configuration = buildRuntimeConfiguration();
  const reasoning_materials = {
    docs_metadata_sha256: build.runtime_docs_metadata_sha256,
    code_lattice_sha256: build.runtime_code_lattice_sha256,
  };
  const source_identity = {
    source_commit: build.source_commit,
    source_tree_sha256: build.source_tree_sha256,
    package_lock_sha256: build.package_lock_sha256,
    theory_sources_sha256: build.theory_sources_sha256,
    parity_fixture_sha256: build.parity_fixture_sha256,
    client_experience_configuration_sha256:
      build.client_experience_configuration_sha256,
    reasoning_materials_sha256: runtimeParityHash(reasoning_materials),
  };
  const account_policy = {
    account_type: input.accountPolicy.account_type,
    policy_sha256: runtimeParityHash(accountPolicyContract(input.accountPolicy)),
  };
  const experienceContract = {
    theory_graph,
    tool_surface: {
      manifest_version: tool_surface.manifest_version,
      capability_count: tool_surface.capability_count,
      tool_surface_sha256: tool_surface.tool_surface_sha256,
    },
    reasoning_configuration: runtime_configuration.reasoning,
    reasoning_configuration_sha256:
      runtime_configuration.reasoning_configuration_sha256,
    source_identity,
    account_policy,
  };
  const deploymentContract = { build, experience_contract_sha256: runtimeParityHash(experienceContract) };

  return {
    schema: HELIX_RUNTIME_PARITY_FINGERPRINT_SCHEMA,
    build,
    theory_graph,
    tool_surface,
    runtime_configuration,
    reasoning_materials: {
      ...reasoning_materials,
      reasoning_materials_sha256: runtimeParityHash(reasoning_materials),
    },
    source_identity: {
      ...source_identity,
      source_identity_sha256: runtimeParityHash(source_identity),
    },
    account_policy,
    experience_contract_sha256: runtimeParityHash(experienceContract),
    deployment_contract_sha256: runtimeParityHash(deploymentContract),
    secret_values_included: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
