import { createHash } from "node:crypto";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
} from "../../../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING } from "../../../shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v2";

export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_DOMAINS =
  Object.freeze({
    boundary:
      "nhm2-spherical-boson-star-v2-independent-si-linux-runtime-admission-boundary/v1\n",
    manifest:
      "nhm2-spherical-boson-star-v2-independent-si-linux-runtime-manifest/v1\n",
    sourceClosure:
      "nhm2-spherical-boson-star-v2-independent-si-linux-source-closure/v1\n",
    dependencyClosure:
      "nhm2-spherical-boson-star-v2-independent-si-linux-dependency-closure/v1\n",
    toolchainClosure:
      "nhm2-spherical-boson-star-v2-independent-si-linux-toolchain-closure/v1\n",
    buildClosure:
      "nhm2-spherical-boson-star-v2-independent-si-linux-build-closure/v1\n",
    executableClosure:
      "nhm2-spherical-boson-star-v2-independent-si-linux-executable-closure/v1\n",
    runtimeClosure:
      "nhm2-spherical-boson-star-v2-independent-si-linux-runtime-closure/v1\n",
    lineage: "nhm2-spherical-boson-star-v2-si-lane-lineage-record/v1\n",
    disjointness:
      "nhm2-spherical-boson-star-v2-si-lane-disjointness-evidence/v1\n",
    receipt:
      "nhm2-spherical-boson-star-v2-independent-si-linux-runtime-admission-receipt/v1\n",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS =
  Object.freeze({
    candidateFreezeV2: Object.freeze({
      semanticSha256:
        "a8e4d9cb4b07efc053fddc72339b8c3db464129a992731453059d3e160ca2ce2",
      canonicalSizeBytes: 20_843,
      relativePath:
        "shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v2.ts",
      rawSha256:
        "c0a1a39efa0beb0cc13ac2517fb97f6c2b1ff18242e4d8329008fd85b6a3b057",
      rawSizeBytes: 35_998,
    }),
    siOutputNormalizationV2: Object.freeze({
      semanticSha256:
        "6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb",
      canonicalSizeBytes: 15_246,
      relativePath:
        "shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v2.ts",
      rawSha256:
        "6d5d539b5c93409b6a0afefe0afdf9c32aa27f98fb1d133efb8c6d19e66a86cc",
      rawSizeBytes: 26_854,
    }),
    codata2022: Object.freeze({
      relativePath: "configs/constants/codata-2022.v1.json",
      rawSha256:
        "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61",
      rawSizeBytes: 6_180,
    }),
    independentProgram: Object.freeze({
      relativePath:
        "tools/nhm2-spherical-boson-star-v2-independent/si_normalization_native.c",
      rawSha256:
        "1f581520c8ec6e5af3e2ce875afa6dd35f5b673f5feb7188cdddab3e513bd489",
      rawSizeBytes: 57_282,
    }),
    independentOracle: Object.freeze({
      relativePath:
        "tools/nhm2-spherical-boson-star-v2-independent/test_si_normalization_native.py",
      rawSha256:
        "dde0586c79e2e1edb9adf22a9d755ae15e398bb50f2cbf0d5b4240ee9371e0d1",
      rawSizeBytes: 45_733,
    }),
  } as const);

const ARTIFACT_IDS = Object.freeze({
  boundary:
    "nhm2.spherical_boson_star_v2.independent_si_linux_runtime_admission_boundary",
  manifest:
    "nhm2.spherical_boson_star_v2.independent_si_linux_runtime_manifest",
  lineage: "nhm2.spherical_boson_star_v2.si_lane_lineage_record",
  receipt:
    "nhm2.spherical_boson_star_v2.independent_si_linux_runtime_admission_receipt",
} as const);

const CONTRACT_VERSIONS = Object.freeze({
  boundary:
    "nhm2_spherical_boson_star_v2_independent_si_linux_runtime_admission_boundary/v1",
  manifest:
    "nhm2_spherical_boson_star_v2_independent_si_linux_runtime_manifest/v1",
  lineage: "nhm2_spherical_boson_star_v2_si_lane_lineage_record/v1",
  receipt:
    "nhm2_spherical_boson_star_v2_independent_si_linux_runtime_admission_receipt/v1",
  closureLedger:
    "nhm2_spherical_boson_star_v2_independent_si_linux_closure_ledger/v1",
} as const);

const CLOSURE_KINDS = Object.freeze([
  "source",
  "dependency",
  "toolchain",
  "build",
  "executable",
  "runtime",
] as const);
type ClosureKind = (typeof CLOSURE_KINDS)[number];

export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_PROGRAM_PROTOCOL =
  Object.freeze({
    platform: "linux",
    mpfrVersion: "4.2.2",
    gmpVersion: "6.3.0",
    precisionBits: 256,
    exponentMinimum: -1_000_000,
    exponentMaximum: 1_000_000,
    exactArgc: 2,
    exactArgv1:
      "--emit-nhm2-spherical-boson-star-v2-si-normalization-receipt-v2",
    stdinContract:
      "exactly_6180_frozen_CODATA_bytes_followed_by_EOF_hash_checked_before_MPFR_initialization",
    successContract:
      "exit_0_one_canonical_JSON_object_one_bounded_stdout_write_no_newline_empty_stderr",
    failureContract:
      "exit_1_empty_stdout_one_E_code_LF_stderr_line_maximum_32_bytes",
    maximumStdoutBytes: 262_144,
    maximumFailureStderrBytes: 32,
    exactTraceEntryCount: 139,
    callerConfigurationInputsAccepted: false,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_DISJOINTNESS_PREDICATE_IDS =
  Object.freeze([
    "registry_subjects_distinct_and_server_authenticated",
    "authorship_session_distinct_with_primary_read_exclusion",
    "source_closures_and_origins_independent",
    "trusted_roots_non_nested_and_file_identity_sets_disjoint",
    "regular_files_non_symlink_single_link_and_stable",
    "copied_bytes_rejected_without_independent_authorship_origin",
    "signed_dependency_acquisitions_distinct_with_equal_upstream_versions",
    "dependency_closure_seals_distinct",
    "toolchain_origins_build_ids_roots_and_closures_distinct",
    "build_processes_read_sets_and_build_closures_distinct",
    "executable_derivations_traces_and_file_identities_distinct",
    "runtime_closures_and_stopped_process_namespaces_distinct",
    "process_identity_tuples_distinct",
    "mpfr_destination_storage_namespaces_distinct",
    "receipt_storage_identity_namespaces_distinct",
    "independent_runtime_proves_primary_roots_inaccessible",
    "numerical_contract_versions_codata_graph_and_rounding_equal",
  ] as const);

const AUTHORITY_LOCKS = Object.freeze({
  candidateAccepted: false,
  candidateExecutionAuthorized: false,
  candidateExecutionObserved: false,
  scienceReplayAuthorized: false,
  primaryReplayReady: false,
  independentReplayReady: false,
  pairAgreementObserved: false,
  stressNoiseLamp: false,
  constraintAlgebraLamp: false,
  diagnosticPass: false,
  theoryGraphPromoted: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
  casimirVerdict: null,
  certificateSha256: null,
} as const);

const CURRENT_BLOCKERS = Object.freeze([
  "server_private_enrollment_registry_not_installed",
  "server_authenticated_independent_authorship_receipt_absent",
  "server_observed_primary_read_exclusion_receipt_absent",
  "independent_signed_gmp_mpfr_acquisition_receipts_absent",
  "independent_linux_source_dependency_toolchain_build_executable_runtime_closures_absent",
  "authenticated_primary_linux_lineage_record_absent",
  "linux_openat2_statx_monotonic_raw_fsync_observer_absent",
  "stopped_exec_loader_maps_observer_absent",
  "syscall_access_exclusion_trace_absent",
  "admission_receipt_persistence_evidence_absent",
  "single_use_private_release_capability_absent",
] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_VALIDATOR_BUDGETS =
  Object.freeze({
    wire: Object.freeze({
      maximumUtf16CodeUnits: 262_144,
      maximumUtf8Bytes: 262_144,
    }),
    preParse: Object.freeze({
      maximumNestingDepth: 128,
      maximumNodes: 65_536,
      maximumArrayEntries: 32_768,
      maximumObjectProperties: 32_768,
      maximumStringUtf16CodeUnits: 65_536,
      maximumStringUtf8Bytes: 131_072,
      maximumKeyUtf16CodeUnits: 512,
      maximumKeyUtf8Bytes: 1_024,
      maximumTotalStringUtf16CodeUnits: 131_072,
      maximumTotalStringUtf8Bytes: 262_144,
    }),
    postParse: Object.freeze({
      maximumNestingDepth: 128,
      maximumNodes: 65_536,
      maximumArrayEntries: 32_768,
      maximumObjectProperties: 32_768,
      maximumStringUtf16CodeUnits: 65_536,
      maximumStringUtf8Bytes: 131_072,
      maximumKeyUtf16CodeUnits: 512,
      maximumKeyUtf8Bytes: 1_024,
      maximumTotalStringUtf16CodeUnits: 131_072,
      maximumTotalStringUtf8Bytes: 262_144,
    }),
  } as const);

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value === null || typeof value !== "object") return value as Readonly<T>;
  const seen = new Set<object>();
  const pending: object[] = [value as object];
  while (pending.length > 0) {
    const current = pending.pop() as object;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const child of Object.values(current as Record<string, unknown>)) {
      if (child !== null && typeof child === "object") pending.push(child);
    }
    Object.freeze(current);
  }
  return value as Readonly<T>;
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

const isWellFormedUnicode = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
};

type PreParseFrame = { kind: "array" | "object"; expectingArrayValue: boolean };

const preParseBudgetIssue = (wire: string): string | null => {
  const budget =
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_VALIDATOR_BUDGETS.preParse;
  const frames: PreParseFrame[] = [];
  let nodes = 0;
  let arrayEntries = 0;
  let objectProperties = 0;
  let totalStringUtf16 = 0;
  let totalStringUtf8 = 0;

  const checkCounters = (): string | null => {
    if (frames.length > budget.maximumNestingDepth)
      return "wire:preparse_nesting_depth_limit_exceeded";
    if (nodes > budget.maximumNodes) return "wire:preparse_node_limit_exceeded";
    if (arrayEntries > budget.maximumArrayEntries)
      return "wire:preparse_array_entry_limit_exceeded";
    if (objectProperties > budget.maximumObjectProperties)
      return "wire:preparse_object_property_limit_exceeded";
    if (totalStringUtf16 > budget.maximumTotalStringUtf16CodeUnits)
      return "wire:preparse_total_string_UTF16_limit_exceeded";
    if (totalStringUtf8 > budget.maximumTotalStringUtf8Bytes)
      return "wire:preparse_total_string_UTF8_limit_exceeded";
    return null;
  };

  const beginValue = (): string | null => {
    nodes += 1;
    const parent = frames.at(-1);
    if (parent?.kind === "array" && parent.expectingArrayValue) {
      arrayEntries += 1;
      parent.expectingArrayValue = false;
    }
    return checkCounters();
  };

  for (let index = 0; index < wire.length; index += 1) {
    const character = wire[index];
    if (/\s/.test(character)) continue;
    if (character === '"') {
      const contentStart = index + 1;
      let escaped = false;
      let closed = false;
      for (index += 1; index < wire.length; index += 1) {
        const current = wire[index];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (current === "\\") {
          escaped = true;
          continue;
        }
        if (current === '"') {
          closed = true;
          break;
        }
      }
      if (!closed) return "wire:preparse_unterminated_string";
      const rawContent = wire.slice(contentStart, index);
      let lookahead = index + 1;
      while (lookahead < wire.length && /\s/.test(wire[lookahead]))
        lookahead += 1;
      const isKey = wire[lookahead] === ":";
      const rawUtf8Bytes = Buffer.byteLength(rawContent, "utf8");
      if (isKey) {
        if (rawContent.length > budget.maximumKeyUtf16CodeUnits)
          return "wire:preparse_key_UTF16_limit_exceeded";
        if (rawUtf8Bytes > budget.maximumKeyUtf8Bytes)
          return "wire:preparse_key_UTF8_limit_exceeded";
      } else {
        const issue = beginValue();
        if (issue) return issue;
        if (rawContent.length > budget.maximumStringUtf16CodeUnits)
          return "wire:preparse_string_UTF16_limit_exceeded";
        if (rawUtf8Bytes > budget.maximumStringUtf8Bytes)
          return "wire:preparse_string_UTF8_limit_exceeded";
      }
      totalStringUtf16 += rawContent.length;
      totalStringUtf8 += rawUtf8Bytes;
      const issue = checkCounters();
      if (issue) return issue;
      continue;
    }
    if (character === "{" || character === "[") {
      const issue = beginValue();
      if (issue) return issue;
      frames.push({
        kind: character === "[" ? "array" : "object",
        expectingArrayValue: character === "[",
      });
      const depthIssue = checkCounters();
      if (depthIssue) return depthIssue;
      continue;
    }
    if (character === "}" || character === "]") {
      frames.pop();
      continue;
    }
    if (character === ":") {
      objectProperties += 1;
      const issue = checkCounters();
      if (issue) return issue;
      continue;
    }
    if (character === ",") {
      const parent = frames.at(-1);
      if (parent?.kind === "array") parent.expectingArrayValue = true;
      continue;
    }
    if (character === "-" || /[0-9tfn]/.test(character)) {
      const issue = beginValue();
      if (issue) return issue;
      while (index + 1 < wire.length && !/[\s,\]}]/.test(wire[index + 1]))
        index += 1;
    }
  }
  return checkCounters();
};

const canonicalValueIssue = (value: unknown): string | null => {
  const budget =
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_VALIDATOR_BUDGETS.postParse;
  const pending: { value: unknown; path: string; depth: number }[] = [
    { value, path: "$", depth: 0 },
  ];
  const seen = new Set<object>();
  let nodes = 0;
  let arrayEntries = 0;
  let objectProperties = 0;
  let totalStringUtf16 = 0;
  let totalStringUtf8 = 0;

  while (pending.length > 0) {
    const current = pending.pop() as {
      value: unknown;
      path: string;
      depth: number;
    };
    nodes += 1;
    if (nodes > budget.maximumNodes)
      return "wire:postparse_node_limit_exceeded";
    if (current.depth > budget.maximumNestingDepth)
      return "wire:postparse_nesting_depth_limit_exceeded";
    const entry = current.value;
    if (entry === null || typeof entry === "boolean") continue;
    if (typeof entry === "string") {
      const utf8Bytes = Buffer.byteLength(entry, "utf8");
      totalStringUtf16 += entry.length;
      totalStringUtf8 += utf8Bytes;
      if (entry.length > budget.maximumStringUtf16CodeUnits)
        return "wire:postparse_string_UTF16_limit_exceeded";
      if (utf8Bytes > budget.maximumStringUtf8Bytes)
        return "wire:postparse_string_UTF8_limit_exceeded";
      if (totalStringUtf16 > budget.maximumTotalStringUtf16CodeUnits)
        return "wire:postparse_total_string_UTF16_limit_exceeded";
      if (totalStringUtf8 > budget.maximumTotalStringUtf8Bytes)
        return "wire:postparse_total_string_UTF8_limit_exceeded";
      if (!isWellFormedUnicode(entry) || entry.normalize("NFC") !== entry)
        return `${current.path}:canonical_NFC_string_required`;
      continue;
    }
    if (typeof entry === "number") {
      if (!Number.isSafeInteger(entry) || Object.is(entry, -0))
        return `${current.path}:safe_integer_required`;
      continue;
    }
    if (typeof entry !== "object") return `${current.path}:JSON_value_required`;
    if (seen.has(entry)) return `${current.path}:cycle_forbidden`;
    seen.add(entry);
    if (Array.isArray(entry)) {
      arrayEntries += entry.length;
      if (arrayEntries > budget.maximumArrayEntries)
        return "wire:postparse_array_entry_limit_exceeded";
      for (let index = entry.length - 1; index >= 0; index -= 1)
        pending.push({
          value: entry[index],
          path: `${current.path}[${index}]`,
          depth: current.depth + 1,
        });
      continue;
    }
    if (!isPlainRecord(entry)) return `${current.path}:plain_object_required`;
    const keys = Object.keys(entry);
    objectProperties += keys.length;
    if (objectProperties > budget.maximumObjectProperties)
      return "wire:postparse_object_property_limit_exceeded";
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index];
      const keyUtf8Bytes = Buffer.byteLength(key, "utf8");
      if (key.length > budget.maximumKeyUtf16CodeUnits)
        return "wire:postparse_key_UTF16_limit_exceeded";
      if (keyUtf8Bytes > budget.maximumKeyUtf8Bytes)
        return "wire:postparse_key_UTF8_limit_exceeded";
      totalStringUtf16 += key.length;
      totalStringUtf8 += keyUtf8Bytes;
      if (totalStringUtf16 > budget.maximumTotalStringUtf16CodeUnits)
        return "wire:postparse_total_string_UTF16_limit_exceeded";
      if (totalStringUtf8 > budget.maximumTotalStringUtf8Bytes)
        return "wire:postparse_total_string_UTF8_limit_exceeded";
      if (!isWellFormedUnicode(key) || key.normalize("NFC") !== key)
        return `${current.path}:canonical_NFC_key_required`;
      pending.push({
        value: entry[key],
        path: `${current.path}.${key}`,
        depth: current.depth + 1,
      });
    }
  }
  return null;
};

type CanonicalFrame =
  { kind: "value"; value: unknown } | { kind: "text"; text: string };

const canonicalJson = (value: unknown): string => {
  const output: string[] = [];
  const pending: CanonicalFrame[] = [{ kind: "value", value }];
  while (pending.length > 0) {
    const frame = pending.pop() as CanonicalFrame;
    if (frame.kind === "text") {
      output.push(frame.text);
      continue;
    }
    const entry = frame.value;
    if (entry === null || typeof entry !== "object") {
      const encoded = JSON.stringify(entry);
      if (encoded === undefined)
        throw new Error("canonical_JSON_value_required");
      output.push(encoded);
      continue;
    }
    if (Array.isArray(entry)) {
      pending.push({ kind: "text", text: "]" });
      for (let index = entry.length - 1; index >= 0; index -= 1) {
        pending.push({ kind: "value", value: entry[index] });
        if (index > 0) pending.push({ kind: "text", text: "," });
      }
      pending.push({ kind: "text", text: "[" });
      continue;
    }
    const record = entry as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    pending.push({ kind: "text", text: "}" });
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index];
      pending.push({ kind: "value", value: record[key] });
      pending.push({ kind: "text", text: ":" });
      pending.push({ kind: "text", text: JSON.stringify(key) });
      if (index > 0) pending.push({ kind: "text", text: "," });
    }
    pending.push({ kind: "text", text: "{" });
  }
  return output.join("");
};

const u64le = (value: number): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error("safe_nonnegative_length_required");
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
};

const semanticHash = (domain: string, unsigned: unknown): string => {
  const canonical = canonicalJson(unsigned);
  const bytes = Buffer.from(canonical, "utf8");
  return createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(bytes.length))
    .update(bytes)
    .digest("hex");
};

const staticContractHash = (domain: string, contract: unknown): string =>
  createHash("sha256")
    .update(domain, "utf8")
    .update(canonicalJson(contract), "utf8")
    .digest("hex");

const exactKeys = (
  value: unknown,
  keys: readonly string[],
  path: string,
  issues: string[],
): value is Record<string, unknown> => {
  if (!isPlainRecord(value)) {
    issues.push(`${path}:exact_object_required`);
    return false;
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, i) => key !== expected[i])
  ) {
    issues.push(`${path}:exact_keys_required`);
    return false;
  }
  return true;
};

const isHash = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const isCanonicalDecimal = (value: unknown): value is string =>
  typeof value === "string" && /^(0|[1-9][0-9]{0,38})$/.test(value);
const isId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 128 &&
  Buffer.byteLength(value, "utf8") <= 256 &&
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value) &&
  value.normalize("NFC") === value;
const isBoundedToken = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 128 &&
  Buffer.byteLength(value, "utf8") <= 256 &&
  /^[A-Za-z0-9][A-Za-z0-9._:+/-]{0,127}$/.test(value) &&
  value.normalize("NFC") === value;
const isRelativePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 512 &&
  Buffer.byteLength(value, "utf8") <= 1_024 &&
  !value.startsWith("/") &&
  !value.includes("\\") &&
  !value
    .split("/")
    .some((part) => part === "" || part === "." || part === "..") &&
  value.normalize("NFC") === value;
const isWallUtc = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value;

type ParseResult = Readonly<{
  ok: boolean;
  issues: readonly string[];
  value: Readonly<Record<string, unknown>> | null;
}>;

const parseCanonicalWire = (
  wire: unknown,
  maximumBytes: number,
): ParseResult => {
  if (typeof wire !== "string")
    return deepFreeze({
      ok: false,
      issues: ["wire:primitive_string_required"],
      value: null,
    });
  const wireBudget =
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_VALIDATOR_BUDGETS.wire;
  if (wire.length > Math.min(maximumBytes, wireBudget.maximumUtf16CodeUnits))
    return deepFreeze({
      ok: false,
      issues: ["wire:UTF16_limit_exceeded"],
      value: null,
    });
  if (
    Buffer.byteLength(wire, "utf8") >
    Math.min(maximumBytes, wireBudget.maximumUtf8Bytes)
  )
    return deepFreeze({
      ok: false,
      issues: ["wire:UTF8_limit_exceeded"],
      value: null,
    });
  let value: unknown;
  try {
    const preParseIssue = preParseBudgetIssue(wire);
    if (preParseIssue)
      return deepFreeze({
        ok: false,
        issues: [preParseIssue],
        value: null,
      });
    value = JSON.parse(wire);
  } catch {
    return deepFreeze({
      ok: false,
      issues: ["wire:JSON_parse_failed"],
      value: null,
    });
  }
  try {
    const canonicalIssue = canonicalValueIssue(value);
    if (canonicalIssue)
      return deepFreeze({ ok: false, issues: [canonicalIssue], value: null });
    if (!isPlainRecord(value))
      return deepFreeze({
        ok: false,
        issues: ["wire:root_object_required"],
        value: null,
      });
    if (canonicalJson(value) !== wire)
      return deepFreeze({
        ok: false,
        issues: ["wire:canonical_encoding_required_duplicate_keys_forbidden"],
        value: null,
      });
  } catch {
    return deepFreeze({
      ok: false,
      issues: ["wire:postparse_walk_failed"],
      value: null,
    });
  }
  return deepFreeze({ ok: true, issues: [], value });
};

const bindingKeys = Object.freeze([
  "artifactId",
  "contractVersion",
  "semanticSha256",
  "canonicalSizeBytes",
  "relativePath",
  "rawSha256",
  "rawSizeBytes",
] as const);
const rawBindingKeys = Object.freeze([
  "relativePath",
  "rawSha256",
  "rawSizeBytes",
] as const);
const closureReferenceKeys = Object.freeze([
  "artifactId",
  "contractVersion",
  "closureKind",
  "relativePath",
  "ledgerRawSha256",
  "ledgerSemanticSha256",
  "sizeBytes",
  "entryCount",
  "aggregateBytes",
] as const);
const receiptReferenceKeys = Object.freeze([
  "artifactId",
  "contractVersion",
  "receiptId",
  "relativePath",
  "rawSha256",
  "semanticSha256",
  "sizeBytes",
] as const);

const validateExactLiteral = (
  value: unknown,
  expected: unknown,
  path: string,
  issues: string[],
): void => {
  if (canonicalJson(value) !== canonicalJson(expected))
    issues.push(`${path}:literal_binding_mismatch`);
};

const validateClosureReference = (
  value: unknown,
  expectedKind: ClosureKind,
  path: string,
  issues: string[],
): void => {
  if (!exactKeys(value, closureReferenceKeys, path, issues)) return;
  if (value.contractVersion !== CONTRACT_VERSIONS.closureLedger)
    issues.push(`${path}.contractVersion:mismatch`);
  if (value.closureKind !== expectedKind)
    issues.push(`${path}.closureKind:mismatch`);
  if (!isId(value.artifactId))
    issues.push(`${path}.artifactId:canonical_id_required`);
  if (!isRelativePath(value.relativePath))
    issues.push(`${path}.relativePath:relative_path_required`);
  for (const key of ["ledgerRawSha256", "ledgerSemanticSha256"] as const)
    if (!isHash(value[key])) issues.push(`${path}.${key}:sha256_required`);
  for (const key of ["sizeBytes", "entryCount", "aggregateBytes"] as const)
    if (!Number.isSafeInteger(value[key]) || (value[key] as number) <= 0)
      issues.push(`${path}.${key}:positive_safe_integer_required`);
};

const validateReceiptReference = (
  value: unknown,
  path: string,
  issues: string[],
): void => {
  if (!exactKeys(value, receiptReferenceKeys, path, issues)) return;
  if (
    !isId(value.artifactId) ||
    !isBoundedToken(value.contractVersion) ||
    !isId(value.receiptId)
  )
    issues.push(`${path}:canonical_receipt_identity_required`);
  if (!isRelativePath(value.relativePath))
    issues.push(`${path}.relativePath:relative_path_required`);
  if (!isHash(value.rawSha256) || !isHash(value.semanticSha256))
    issues.push(`${path}:receipt_hashes_required`);
  if (
    !Number.isSafeInteger(value.sizeBytes) ||
    (value.sizeBytes as number) <= 0
  )
    issues.push(`${path}.sizeBytes:positive_safe_integer_required`);
};

const manifestKeys = Object.freeze([
  "artifactId",
  "contractVersion",
  "manifestId",
  "enrollmentId",
  "candidateBinding",
  "frozenAt",
  "semanticBindings",
  "programProtocol",
  "closureBindings",
  "provenanceBindings",
  "executionEnvelope",
  "primaryComparisonPolicy",
  "authorityLocks",
  "manifestSha256",
] as const);

const validateManifestRecord = (
  record: Record<string, unknown>,
): readonly string[] => {
  const issues: string[] = [];
  if (!exactKeys(record, manifestKeys, "$", issues)) return issues;
  if (record.artifactId !== ARTIFACT_IDS.manifest)
    issues.push("$.artifactId:mismatch");
  if (record.contractVersion !== CONTRACT_VERSIONS.manifest)
    issues.push("$.contractVersion:mismatch");
  if (!isId(record.manifestId))
    issues.push("$.manifestId:canonical_id_required");
  if (!isId(record.enrollmentId))
    issues.push("$.enrollmentId:canonical_id_required");

  if (
    exactKeys(
      record.candidateBinding,
      [...bindingKeys, "candidateId"],
      "$.candidateBinding",
      issues,
    )
  ) {
    const candidate = record.candidateBinding;
    validateExactLiteral(
      candidate.artifactId,
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING.artifactId,
      "$.candidateBinding.artifactId",
      issues,
    );
    validateExactLiteral(
      candidate.contractVersion,
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING.contractVersion,
      "$.candidateBinding.contractVersion",
      issues,
    );
    validateExactLiteral(
      candidate.candidateId,
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.selectedCandidateIdentity
        .candidateId,
      "$.candidateBinding.candidateId",
      issues,
    );
    validateExactLiteral(
      candidate.semanticSha256,
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
        .candidateFreezeV2.semanticSha256,
      "$.candidateBinding.semanticSha256",
      issues,
    );
    validateExactLiteral(
      candidate.canonicalSizeBytes,
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
        .candidateFreezeV2.canonicalSizeBytes,
      "$.candidateBinding.canonicalSizeBytes",
      issues,
    );
    validateExactLiteral(
      candidate.relativePath,
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
        .candidateFreezeV2.relativePath,
      "$.candidateBinding.relativePath",
      issues,
    );
    validateExactLiteral(
      candidate.rawSha256,
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
        .candidateFreezeV2.rawSha256,
      "$.candidateBinding.rawSha256",
      issues,
    );
    validateExactLiteral(
      candidate.rawSizeBytes,
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
        .candidateFreezeV2.rawSizeBytes,
      "$.candidateBinding.rawSizeBytes",
      issues,
    );
  }

  if (
    exactKeys(
      record.frozenAt,
      ["wallUtc", "bootIdentitySha256", "monotonicNanoseconds"],
      "$.frozenAt",
      issues,
    )
  ) {
    if (!isWallUtc(record.frozenAt.wallUtc))
      issues.push("$.frozenAt.wallUtc:canonical_UTC_required");
    if (!isHash(record.frozenAt.bootIdentitySha256))
      issues.push("$.frozenAt.bootIdentitySha256:sha256_required");
    if (!isCanonicalDecimal(record.frozenAt.monotonicNanoseconds))
      issues.push("$.frozenAt.monotonicNanoseconds:canonical_decimal_required");
  }

  if (
    exactKeys(
      record.semanticBindings,
      [
        "siOutputNormalizationV2",
        "codata2022",
        "independentProgram",
        "independentOracle",
      ],
      "$.semanticBindings",
      issues,
    )
  ) {
    const semantic = record.semanticBindings;
    if (
      exactKeys(
        semantic.siOutputNormalizationV2,
        bindingKeys,
        "$.semanticBindings.siOutputNormalizationV2",
        issues,
      )
    ) {
      validateExactLiteral(
        semantic.siOutputNormalizationV2,
        {
          artifactId:
            NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING.artifactId,
          contractVersion:
            NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING.contractVersion,
          semanticSha256:
            NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
              .siOutputNormalizationV2.semanticSha256,
          canonicalSizeBytes:
            NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
              .siOutputNormalizationV2.canonicalSizeBytes,
          relativePath:
            NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
              .siOutputNormalizationV2.relativePath,
          rawSha256:
            NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
              .siOutputNormalizationV2.rawSha256,
          rawSizeBytes:
            NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
              .siOutputNormalizationV2.rawSizeBytes,
        },
        "$.semanticBindings.siOutputNormalizationV2",
        issues,
      );
    }
    for (const key of [
      "codata2022",
      "independentProgram",
      "independentOracle",
    ] as const) {
      if (
        exactKeys(
          semantic[key],
          rawBindingKeys,
          `$.semanticBindings.${key}`,
          issues,
        )
      )
        validateExactLiteral(
          semantic[key],
          NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS[
            key
          ],
          `$.semanticBindings.${key}`,
          issues,
        );
    }
  }
  validateExactLiteral(
    record.programProtocol,
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_PROGRAM_PROTOCOL,
    "$.programProtocol",
    issues,
  );

  if (
    exactKeys(
      record.closureBindings,
      CLOSURE_KINDS,
      "$.closureBindings",
      issues,
    )
  )
    for (const kind of CLOSURE_KINDS)
      validateClosureReference(
        record.closureBindings[kind],
        kind,
        `$.closureBindings.${kind}`,
        issues,
      );
  if (
    exactKeys(
      record.provenanceBindings,
      [
        "authorshipNoPrimaryReadReceipt",
        "dependencyAcquisitionReceipt",
        "buildReadTraceReceipt",
        "nativeConformanceReceipt",
      ],
      "$.provenanceBindings",
      issues,
    )
  )
    for (const key of Object.keys(record.provenanceBindings))
      validateReceiptReference(
        record.provenanceBindings[key],
        `$.provenanceBindings.${key}`,
        issues,
      );

  validateExactLiteral(
    record.executionEnvelope,
    {
      serverOwnedEnrollmentResolutionRequired: true,
      serverObservedLinuxRuntimeRequired: true,
      stoppedBeforeFirstStdinReadRequired: true,
      exactCodataBytesSuppliedOnlyAfterAdmissionPersistence: true,
      callerPathsManifestsReceiptsProvidersExecutorsTimestampsEnvironmentsCapabilitiesAccepted: false,
      executionPerformedByThisContract: false,
    },
    "$.executionEnvelope",
    issues,
  );
  validateExactLiteral(
    record.primaryComparisonPolicy,
    {
      primaryAndIndependentLineagesMustBeServerAuthenticated: true,
      exactSiV2SemanticContractRequired: true,
      exactCodataBytesRequired: true,
      exactOperationGraphAndRoundingRequired: true,
      zeroUlpComparisonRequired: true,
      numericalEqualityIsNotLineageEvidence: true,
      failureRequiresNewEnrollmentAndCandidateVersion: true,
      inPlaceRetuneAllowed: false,
    },
    "$.primaryComparisonPolicy",
    issues,
  );
  validateExactLiteral(
    record.authorityLocks,
    AUTHORITY_LOCKS,
    "$.authorityLocks",
    issues,
  );
  if (!isHash(record.manifestSha256))
    issues.push("$.manifestSha256:sha256_required");
  else {
    const { manifestSha256: _self, ...unsigned } = record;
    if (
      record.manifestSha256 !==
      semanticHash(
        NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_DOMAINS.manifest,
        unsigned,
      )
    )
      issues.push("$.manifestSha256:self_hash_mismatch");
  }
  return issues;
};

const lineageKeys = Object.freeze([
  "artifactId",
  "contractVersion",
  "lineageId",
  "enrollmentId",
  "manifestSha256",
  "lane",
  "registrySubject",
  "authorship",
  "sourceOrigin",
  "trustedRoot",
  "closureSeals",
  "dependencyAcquisition",
  "toolchain",
  "buildObservation",
  "executableIdentity",
  "runtimeIdentity",
  "storageIdentity",
  "accessExclusion",
  "chronology",
  "authorityLocks",
  "lineageSha256",
] as const);

const validateLineageRecord = (
  record: Record<string, unknown>,
): readonly string[] => {
  const issues: string[] = [];
  if (!exactKeys(record, lineageKeys, "$", issues)) return issues;
  if (record.artifactId !== ARTIFACT_IDS.lineage)
    issues.push("$.artifactId:mismatch");
  if (record.contractVersion !== CONTRACT_VERSIONS.lineage)
    issues.push("$.contractVersion:mismatch");
  if (!isId(record.lineageId) || !isId(record.enrollmentId))
    issues.push("$:canonical_identity_required");
  if (!isHash(record.manifestSha256))
    issues.push("$.manifestSha256:sha256_required");
  if (record.lane !== "primary" && record.lane !== "independent")
    issues.push("$.lane:lane_required");

  const shapes: readonly [string, readonly string[]][] = [
    ["registrySubject", ["subjectId", "authenticated"]],
    [
      "authorship",
      ["sessionId", "receiptSha256", "primaryReadExclusionObserved"],
    ],
    [
      "sourceOrigin",
      ["originId", "authorshipEventId", "independentlyEvidenced"],
    ],
    [
      "trustedRoot",
      [
        "rootIdentitySha256",
        "mountIdentitySha256",
        "nonNestedWithPeerObserved",
        "fileIdentitySetDisjointObserved",
        "allRegularFilesNonSymlinkObserved",
        "allRegularFilesSingleLinkObserved",
        "allFilesStableAcrossOpenReadObserved",
      ],
    ],
    ["closureSeals", CLOSURE_KINDS],
    [
      "dependencyAcquisition",
      [
        "eventId",
        "signedReceiptSha256",
        "gmpArchiveSha256",
        "mpfrArchiveSha256",
        "gmpVersion",
        "mpfrVersion",
      ],
    ],
    ["toolchain", ["originId", "buildId", "rootIdentitySha256"]],
    [
      "buildObservation",
      ["processIdentitySha256", "inputReadSetSha256", "primaryRootsExcluded"],
    ],
    [
      "executableIdentity",
      ["derivationSha256", "buildTraceSha256", "device", "inode", "mountId"],
    ],
    [
      "runtimeIdentity",
      [
        "bootIdentitySha256",
        "pidNamespaceSha256",
        "userNamespaceSha256",
        "mountNamespaceSha256",
        "processStartMonotonicNanoseconds",
        "executableDevice",
        "executableInode",
        "stoppedBeforeFirstStdinRead",
      ],
    ],
    [
      "storageIdentity",
      ["mpfrDestinationNamespaceSha256", "receiptStorageNamespaceSha256"],
    ],
    [
      "accessExclusion",
      [
        "policySha256",
        "syscallTraceSha256",
        "peerSourceRuntimeReceiptRootsInaccessible",
      ],
    ],
    [
      "chronology",
      [
        "manifestPersistedMonotonicNanoseconds",
        "closureCompletedMonotonicNanoseconds",
        "lineagePersistedMonotonicNanoseconds",
        "wallUtc",
        "bootIdentitySha256",
      ],
    ],
  ];
  for (const [key, keys] of shapes)
    exactKeys(record[key], keys, `$.${key}`, issues);
  if (issues.length) return issues;

  const r = record as Record<string, Record<string, unknown>>;
  if (
    !isId(r.registrySubject.subjectId) ||
    r.registrySubject.authenticated !== true
  )
    issues.push("$.registrySubject:authenticated_subject_required");
  if (
    !isId(r.authorship.sessionId) ||
    !isHash(r.authorship.receiptSha256) ||
    typeof r.authorship.primaryReadExclusionObserved !== "boolean"
  )
    issues.push("$.authorship:invalid");
  if (
    !isId(r.sourceOrigin.originId) ||
    !isId(r.sourceOrigin.authorshipEventId) ||
    typeof r.sourceOrigin.independentlyEvidenced !== "boolean"
  )
    issues.push("$.sourceOrigin:invalid");
  for (const key of ["rootIdentitySha256", "mountIdentitySha256"])
    if (!isHash(r.trustedRoot[key]))
      issues.push(`$.trustedRoot.${key}:sha256_required`);
  for (const key of [
    "nonNestedWithPeerObserved",
    "fileIdentitySetDisjointObserved",
    "allRegularFilesNonSymlinkObserved",
    "allRegularFilesSingleLinkObserved",
    "allFilesStableAcrossOpenReadObserved",
  ])
    if (typeof r.trustedRoot[key] !== "boolean")
      issues.push(`$.trustedRoot.${key}:boolean_required`);
  for (const kind of CLOSURE_KINDS)
    if (!isHash(r.closureSeals[kind]))
      issues.push(`$.closureSeals.${kind}:sha256_required`);
  for (const key of ["eventId", "gmpVersion", "mpfrVersion"])
    if (!isId(r.dependencyAcquisition[key]))
      issues.push(`$.dependencyAcquisition.${key}:canonical_id_required`);
  for (const key of [
    "signedReceiptSha256",
    "gmpArchiveSha256",
    "mpfrArchiveSha256",
  ])
    if (!isHash(r.dependencyAcquisition[key]))
      issues.push(`$.dependencyAcquisition.${key}:sha256_required`);
  for (const key of ["originId", "buildId"])
    if (!isId(r.toolchain[key]))
      issues.push(`$.toolchain.${key}:canonical_id_required`);
  if (!isHash(r.toolchain.rootIdentitySha256))
    issues.push("$.toolchain.rootIdentitySha256:sha256_required");
  for (const key of ["processIdentitySha256", "inputReadSetSha256"])
    if (!isHash(r.buildObservation[key]))
      issues.push(`$.buildObservation.${key}:sha256_required`);
  if (typeof r.buildObservation.primaryRootsExcluded !== "boolean")
    issues.push("$.buildObservation.primaryRootsExcluded:boolean_required");
  for (const key of ["derivationSha256", "buildTraceSha256"])
    if (!isHash(r.executableIdentity[key]))
      issues.push(`$.executableIdentity.${key}:sha256_required`);
  for (const key of ["device", "inode", "mountId"])
    if (!isCanonicalDecimal(r.executableIdentity[key]))
      issues.push(`$.executableIdentity.${key}:canonical_decimal_required`);
  for (const key of [
    "bootIdentitySha256",
    "pidNamespaceSha256",
    "userNamespaceSha256",
    "mountNamespaceSha256",
  ])
    if (!isHash(r.runtimeIdentity[key]))
      issues.push(`$.runtimeIdentity.${key}:sha256_required`);
  for (const key of [
    "processStartMonotonicNanoseconds",
    "executableDevice",
    "executableInode",
  ])
    if (!isCanonicalDecimal(r.runtimeIdentity[key]))
      issues.push(`$.runtimeIdentity.${key}:canonical_decimal_required`);
  if (typeof r.runtimeIdentity.stoppedBeforeFirstStdinRead !== "boolean")
    issues.push(
      "$.runtimeIdentity.stoppedBeforeFirstStdinRead:boolean_required",
    );
  for (const group of [r.storageIdentity, r.accessExclusion])
    for (const [key, value] of Object.entries(group))
      if (key.endsWith("Sha256") && !isHash(value))
        issues.push(`$.${key}:sha256_required`);
  if (
    typeof r.accessExclusion.peerSourceRuntimeReceiptRootsInaccessible !==
    "boolean"
  )
    issues.push(
      "$.accessExclusion.peerSourceRuntimeReceiptRootsInaccessible:boolean_required",
    );
  const chronology = r.chronology;
  const times = [
    "manifestPersistedMonotonicNanoseconds",
    "closureCompletedMonotonicNanoseconds",
    "lineagePersistedMonotonicNanoseconds",
  ].map((key) => chronology[key]);
  if (
    !times.every(isCanonicalDecimal) ||
    !(
      BigInt(times[0] as string) < BigInt(times[1] as string) &&
      BigInt(times[1] as string) < BigInt(times[2] as string)
    )
  )
    issues.push("$.chronology:strict_monotonic_order_required");
  if (
    !isWallUtc(chronology.wallUtc) ||
    !isHash(chronology.bootIdentitySha256) ||
    chronology.bootIdentitySha256 !== r.runtimeIdentity.bootIdentitySha256
  )
    issues.push("$.chronology:wall_and_boot_identity_invalid");
  validateExactLiteral(
    record.authorityLocks,
    AUTHORITY_LOCKS,
    "$.authorityLocks",
    issues,
  );
  if (!isHash(record.lineageSha256))
    issues.push("$.lineageSha256:sha256_required");
  else {
    const { lineageSha256: _self, ...unsigned } = record;
    if (
      record.lineageSha256 !==
      semanticHash(
        NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_DOMAINS.lineage,
        unsigned,
      )
    )
      issues.push("$.lineageSha256:self_hash_mismatch");
  }
  return issues;
};

const receiptKeys = Object.freeze([
  "artifactId",
  "contractVersion",
  "receiptId",
  "enrollmentId",
  "manifestSha256",
  "primaryLineageSha256",
  "independentLineageSha256",
  "disjointnessEvidence",
  "disjointnessEvidenceSha256",
  "chronology",
  "admission",
  "authorityLocks",
  "receiptSha256",
] as const);

const validateReceiptRecord = (
  record: Record<string, unknown>,
): readonly string[] => {
  const issues: string[] = [];
  if (!exactKeys(record, receiptKeys, "$", issues)) return issues;
  if (
    record.artifactId !== ARTIFACT_IDS.receipt ||
    record.contractVersion !== CONTRACT_VERSIONS.receipt
  )
    issues.push("$:artifact_contract_mismatch");
  if (!isId(record.receiptId) || !isId(record.enrollmentId))
    issues.push("$:canonical_identity_required");
  for (const key of [
    "manifestSha256",
    "primaryLineageSha256",
    "independentLineageSha256",
    "disjointnessEvidenceSha256",
    "receiptSha256",
  ] as const)
    if (!isHash(record[key])) issues.push(`$.${key}:sha256_required`);
  if (
    !Array.isArray(record.disjointnessEvidence) ||
    record.disjointnessEvidence.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_DISJOINTNESS_PREDICATE_IDS.length
  )
    issues.push("$.disjointnessEvidence:exact_17_predicates_required");
  else {
    record.disjointnessEvidence.forEach((entry, index) => {
      const path = `$.disjointnessEvidence[${index}]`;
      if (
        !exactKeys(
          entry,
          ["predicateId", "observed", "passed", "evidenceSha256"],
          path,
          issues,
        )
      )
        return;
      if (
        entry.predicateId !==
        NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_DISJOINTNESS_PREDICATE_IDS[
          index
        ]
      )
        issues.push(`${path}.predicateId:order_mismatch`);
      if (
        typeof entry.observed !== "boolean" ||
        typeof entry.passed !== "boolean"
      )
        issues.push(`${path}:boolean_results_required`);
      if (!isHash(entry.evidenceSha256))
        issues.push(`${path}.evidenceSha256:sha256_required`);
    });
    if (
      isHash(record.disjointnessEvidenceSha256) &&
      record.disjointnessEvidenceSha256 !==
        semanticHash(
          NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_DOMAINS.disjointness,
          record.disjointnessEvidence,
        )
    )
      issues.push("$.disjointnessEvidenceSha256:mismatch");
  }
  if (
    exactKeys(
      record.chronology,
      [
        "manifestPersistedMonotonicNanoseconds",
        "primaryLineagePersistedMonotonicNanoseconds",
        "primarySiReceiptPersistedMonotonicNanoseconds",
        "independentFilesRehashedMonotonicNanoseconds",
        "independentChildStoppedMonotonicNanoseconds",
        "runtimeObservedMonotonicNanoseconds",
        "admissionEvidencePersistedMonotonicNanoseconds",
        "wallUtc",
        "bootIdentitySha256",
      ],
      "$.chronology",
      issues,
    )
  ) {
    const chronology = record.chronology;
    const names = [
      "manifestPersistedMonotonicNanoseconds",
      "primaryLineagePersistedMonotonicNanoseconds",
      "primarySiReceiptPersistedMonotonicNanoseconds",
      "independentFilesRehashedMonotonicNanoseconds",
      "independentChildStoppedMonotonicNanoseconds",
      "runtimeObservedMonotonicNanoseconds",
      "admissionEvidencePersistedMonotonicNanoseconds",
    ] as const;
    const values = names.map((name) => chronology[name]);
    if (
      !values.every(isCanonicalDecimal) ||
      values.some(
        (value, index) =>
          index > 0 &&
          BigInt(value as string) <= BigInt(values[index - 1] as string),
      )
    )
      issues.push("$.chronology:strict_monotonic_order_required");
    if (
      !isWallUtc(chronology.wallUtc) ||
      !isHash(chronology.bootIdentitySha256)
    )
      issues.push("$.chronology:wall_and_boot_required");
  }
  if (
    exactKeys(
      record.admission,
      [
        "status",
        "blockers",
        "siNormalizationReleaseEligible",
        "releaseConsumed",
        "failureRequiresNewEnrollmentAndCandidateVersion",
        "inPlaceRetuneAllowed",
      ],
      "$.admission",
      issues,
    )
  ) {
    const admission = record.admission;
    if (admission.status !== "admitted" && admission.status !== "rejected")
      issues.push("$.admission.status:invalid");
    if (
      !Array.isArray(admission.blockers) ||
      !admission.blockers.every((entry) => isId(entry))
    )
      issues.push("$.admission.blockers:canonical_ids_required");
    if (
      typeof admission.siNormalizationReleaseEligible !== "boolean" ||
      admission.releaseConsumed !== false ||
      admission.failureRequiresNewEnrollmentAndCandidateVersion !== true ||
      admission.inPlaceRetuneAllowed !== false
    )
      issues.push("$.admission:no_retune_or_release_state_invalid");
    const allPredicatesPassed =
      Array.isArray(record.disjointnessEvidence) &&
      record.disjointnessEvidence.every(
        (entry) =>
          isPlainRecord(entry) &&
          entry.observed === true &&
          entry.passed === true,
      );
    if (
      admission.status === "admitted" &&
      (!allPredicatesPassed ||
        !Array.isArray(admission.blockers) ||
        admission.blockers.length !== 0 ||
        admission.siNormalizationReleaseEligible !== true)
    )
      issues.push("$.admission:admitted_state_not_supported");
    if (
      admission.status === "rejected" &&
      (!Array.isArray(admission.blockers) ||
        admission.blockers.length === 0 ||
        admission.siNormalizationReleaseEligible !== false)
    )
      issues.push("$.admission:rejected_state_not_supported");
  }
  validateExactLiteral(
    record.authorityLocks,
    AUTHORITY_LOCKS,
    "$.authorityLocks",
    issues,
  );
  if (isHash(record.receiptSha256)) {
    const { receiptSha256: _self, ...unsigned } = record;
    if (
      record.receiptSha256 !==
      semanticHash(
        NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_DOMAINS.receipt,
        unsigned,
      )
    )
      issues.push("$.receiptSha256:self_hash_mismatch");
  }
  return issues;
};

const finishParse = (
  parsed: ParseResult,
  validate: (record: Record<string, unknown>) => readonly string[],
): ParseResult => {
  if (!parsed.ok || !parsed.value) return parsed;
  try {
    const issues = validate(parsed.value as Record<string, unknown>);
    return deepFreeze({
      ok: issues.length === 0,
      issues,
      value: issues.length === 0 ? parsed.value : null,
    });
  } catch {
    return deepFreeze({
      ok: false,
      issues: ["wire:schema_walk_failed"],
      value: null,
    });
  }
};

export const parseNhm2SphericalBosonStarV2IndependentSiLinuxRuntimeManifestCanonicalWire =
  (wire: unknown): ParseResult =>
    finishParse(parseCanonicalWire(wire, 262_144), validateManifestRecord);
export const parseNhm2SphericalBosonStarV2SiLaneLineageRecordCanonicalWire = (
  wire: unknown,
): ParseResult =>
  finishParse(parseCanonicalWire(wire, 262_144), validateLineageRecord);
export const parseNhm2SphericalBosonStarV2IndependentSiLinuxRuntimeAdmissionReceiptCanonicalWire =
  (wire: unknown): ParseResult =>
    finishParse(parseCanonicalWire(wire, 262_144), validateReceiptRecord);

const computeClosureLedgerSha256Unsafe = (
  kind: ClosureKind,
  canonicalEntriesWire: unknown,
): string | null => {
  if (!CLOSURE_KINDS.includes(kind)) return null;
  const parsed = parseCanonicalWire(canonicalEntriesWire, 262_144);
  if (!parsed.ok || !parsed.value) return null;
  const entries = parsed.value.entries;
  if (
    !exactKeys(parsed.value, ["entries"], "$", []) ||
    !Array.isArray(entries) ||
    entries.length === 0
  )
    return null;
  let previousPath: string | null = null;
  const issues: string[] = [];
  entries.forEach((entry, index) => {
    if (
      !exactKeys(
        entry,
        [
          "ordinal",
          "role",
          "relativePath",
          "mediaType",
          "rawSha256",
          "sizeBytes",
        ],
        `$[${index}]`,
        issues,
      )
    )
      return;
    if (
      entry.ordinal !== index ||
      !isId(entry.role) ||
      !isRelativePath(entry.relativePath) ||
      !isBoundedToken(entry.mediaType) ||
      !isHash(entry.rawSha256) ||
      !Number.isSafeInteger(entry.sizeBytes) ||
      (entry.sizeBytes as number) <= 0
    )
      issues.push(`$[${index}]:invalid_closure_entry`);
    if (
      previousPath !== null &&
      Buffer.compare(
        Buffer.from(previousPath, "utf8"),
        Buffer.from(entry.relativePath as string, "utf8"),
      ) >= 0
    )
      issues.push(`$[${index}]:strict_raw_UTF8_path_order_required`);
    previousPath = entry.relativePath as string;
  });
  if (issues.length) return null;
  const domain =
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_DOMAINS[
      `${kind}Closure` as keyof typeof NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_DOMAINS
    ];
  return semanticHash(domain, parsed.value);
};

export const computeNhm2SphericalBosonStarV2IndependentSiLinuxClosureLedgerSha256 =
  (kind: ClosureKind, canonicalEntriesWire: unknown): string | null => {
    try {
      return computeClosureLedgerSha256Unsafe(kind, canonicalEntriesWire);
    } catch {
      return null;
    }
  };

type TrustedLineage = Record<string, any>;
export const __TEST_ONLY_evaluateNhm2SphericalBosonStarV2SiLaneDisjointness = (
  primary: TrustedLineage,
  independent: TrustedLineage,
): Readonly<{ predicateId: string; passed: boolean }[]> => {
  const p = primary;
  const i = independent;
  const fileTuple = (x: TrustedLineage) =>
    `${x.executableIdentity.mountId}:${x.executableIdentity.device}:${x.executableIdentity.inode}`;
  const processTuple = (x: TrustedLineage) =>
    [
      x.runtimeIdentity.bootIdentitySha256,
      x.runtimeIdentity.pidNamespaceSha256,
      x.runtimeIdentity.userNamespaceSha256,
      x.runtimeIdentity.mountNamespaceSha256,
      x.runtimeIdentity.processStartMonotonicNanoseconds,
      x.runtimeIdentity.executableDevice,
      x.runtimeIdentity.executableInode,
    ].join(":");
  const pass = [
    p.registrySubject.authenticated === true &&
      i.registrySubject.authenticated === true &&
      p.registrySubject.subjectId !== i.registrySubject.subjectId,
    p.authorship.sessionId !== i.authorship.sessionId &&
      i.authorship.primaryReadExclusionObserved === true,
    p.closureSeals.source !== i.closureSeals.source &&
      p.sourceOrigin.originId !== i.sourceOrigin.originId &&
      p.sourceOrigin.authorshipEventId !== i.sourceOrigin.authorshipEventId &&
      i.sourceOrigin.independentlyEvidenced === true,
    p.trustedRoot.rootIdentitySha256 !== i.trustedRoot.rootIdentitySha256 &&
      p.trustedRoot.mountIdentitySha256 !== i.trustedRoot.mountIdentitySha256 &&
      p.trustedRoot.nonNestedWithPeerObserved === true &&
      i.trustedRoot.nonNestedWithPeerObserved === true &&
      p.trustedRoot.fileIdentitySetDisjointObserved === true &&
      i.trustedRoot.fileIdentitySetDisjointObserved === true,
    [p, i].every(
      (x) =>
        x.trustedRoot.allRegularFilesNonSymlinkObserved === true &&
        x.trustedRoot.allRegularFilesSingleLinkObserved === true &&
        x.trustedRoot.allFilesStableAcrossOpenReadObserved === true,
    ),
    p.sourceOrigin.originId !== i.sourceOrigin.originId &&
      p.sourceOrigin.authorshipEventId !== i.sourceOrigin.authorshipEventId &&
      i.sourceOrigin.independentlyEvidenced === true,
    p.dependencyAcquisition.eventId !== i.dependencyAcquisition.eventId &&
      p.dependencyAcquisition.signedReceiptSha256 !==
        i.dependencyAcquisition.signedReceiptSha256 &&
      p.dependencyAcquisition.gmpArchiveSha256 ===
        i.dependencyAcquisition.gmpArchiveSha256 &&
      p.dependencyAcquisition.mpfrArchiveSha256 ===
        i.dependencyAcquisition.mpfrArchiveSha256 &&
      p.dependencyAcquisition.gmpVersion === "6.3.0" &&
      i.dependencyAcquisition.gmpVersion === "6.3.0" &&
      p.dependencyAcquisition.mpfrVersion === "4.2.2" &&
      i.dependencyAcquisition.mpfrVersion === "4.2.2",
    p.closureSeals.dependency !== i.closureSeals.dependency,
    p.toolchain.originId !== i.toolchain.originId &&
      p.toolchain.buildId !== i.toolchain.buildId &&
      p.toolchain.rootIdentitySha256 !== i.toolchain.rootIdentitySha256 &&
      p.closureSeals.toolchain !== i.closureSeals.toolchain,
    p.buildObservation.processIdentitySha256 !==
      i.buildObservation.processIdentitySha256 &&
      p.buildObservation.inputReadSetSha256 !==
        i.buildObservation.inputReadSetSha256 &&
      p.closureSeals.build !== i.closureSeals.build &&
      i.buildObservation.primaryRootsExcluded === true,
    p.executableIdentity.derivationSha256 !==
      i.executableIdentity.derivationSha256 &&
      p.executableIdentity.buildTraceSha256 !==
        i.executableIdentity.buildTraceSha256 &&
      fileTuple(p) !== fileTuple(i) &&
      p.closureSeals.executable !== i.closureSeals.executable,
    p.closureSeals.runtime !== i.closureSeals.runtime &&
      p.runtimeIdentity.mountNamespaceSha256 !==
        i.runtimeIdentity.mountNamespaceSha256 &&
      p.runtimeIdentity.stoppedBeforeFirstStdinRead === true &&
      i.runtimeIdentity.stoppedBeforeFirstStdinRead === true,
    processTuple(p) !== processTuple(i),
    p.storageIdentity.mpfrDestinationNamespaceSha256 !==
      i.storageIdentity.mpfrDestinationNamespaceSha256,
    p.storageIdentity.receiptStorageNamespaceSha256 !==
      i.storageIdentity.receiptStorageNamespaceSha256,
    i.accessExclusion.peerSourceRuntimeReceiptRootsInaccessible === true &&
      i.accessExclusion.syscallTraceSha256 !==
        p.accessExclusion.syscallTraceSha256,
    p.dependencyAcquisition.gmpVersion === i.dependencyAcquisition.gmpVersion &&
      p.dependencyAcquisition.mpfrVersion ===
        i.dependencyAcquisition.mpfrVersion &&
      p.manifestSha256 === i.manifestSha256,
  ];
  return deepFreeze(
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_DISJOINTNESS_PREDICATE_IDS.map(
      (predicateId, index) => ({ predicateId, passed: pass[index] === true }),
    ),
  );
};

const BOUNDARY = {
  artifactId: ARTIFACT_IDS.boundary,
  contractVersion: CONTRACT_VERSIONS.boundary,
  phase:
    "deterministically_blocked_no_server_enrollment_or_native_observer_evidence",
  scope: "server_owned_independent_Linux_SI_normalization_admission_only",
  canonicalWireSchemas: {
    manifest: ARTIFACT_IDS.manifest,
    lineage: ARTIFACT_IDS.lineage,
    receipt: ARTIFACT_IDS.receipt,
    canonicalEncoding:
      "recursive_lexicographic_object_keys_preserved_array_order_compact_UTF8_NFC_safe_integers_exact_keys",
    selfHashRecipe:
      "SHA256(domain_utf8||u64le(canonical_unsigned_length)||canonical_unsigned_bytes)",
  },
  validatorBudgets:
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_VALIDATOR_BUDGETS,
  exactDomains:
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_DOMAINS,
  exactPins:
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS,
  selectedCandidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.selectedCandidateIdentity
      .candidateId,
  programProtocol:
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_PROGRAM_PROTOCOL,
  publicIngress: {
    exactArity: 1,
    onlyField: "enrollmentId",
    primitiveStringOnly: true,
    maximumUtf16CodeUnits: 128,
    maximumUtf8Bytes: 256,
    grammar: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$",
    callerPathsManifestsReceiptsProvidersExecutorsTimestampsEnvironmentsCapabilitiesAccepted: false,
  },
  disjointnessPredicateIds:
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_DISJOINTNESS_PREDICATE_IDS,
  chronology: [
    "candidate_freeze_v2_final",
    "manifest_create_only_persist_fsync_readback",
    "manifest_included_in_static_closure_A",
    "A_S_SR_P_PR_F_FR_O_OR_E_ER_complete",
    "primary_lineage_authenticated",
    "primary_SI_receipt_persisted_and_server_rehashed",
    "independent_files_reopened_and_rehashed",
    "independent_child_stopped_before_first_stdin_read",
    "runtime_namespaces_mappings_and_access_trace_observed",
    "disjointness_and_admission_receipt_persisted_fsynced_readback",
    "one_shot_release_supplies_exact_CODATA_and_EOF",
    "independent_receipt_persisted_and_server_rehashed",
    "both_receipts_independently_validated_then_zero_ULP_compared",
    "later_science_replay_pair_gate_alone_may_control_diagnostic_lamp",
  ],
  clockPolicy:
    "CLOCK_MONOTONIC_RAW_orders_within_one_boot_wall_UTC_is_provenance_only_never_numerically_compared",
  noRetunePolicy:
    "any_failure_requires_new_enrollment_and_candidate_version_no_in_place_retune",
  currentProductionAssessment: {
    status: "blocked",
    blockers: CURRENT_BLOCKERS,
    serverEnrollmentInstances: 0,
    nativeObservationInstances: 0,
    runtimeExecutionCount: 0,
    outputInstanceCount: 0,
    sideEffectCount: 0,
  },
  authorityLocks: AUTHORITY_LOCKS,
} as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY =
  deepFreeze(BOUNDARY);
export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_CANONICAL_JSON =
  canonicalJson(
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_SEMANTIC_SHA256 =
  staticContractHash(
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_DOMAINS.boundary,
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_CANONICAL_JSON,
    "utf8",
  );

// Frozen only after independent root recomputation and explicit acknowledgement
// of the successor boundary with its advertised totality budgets.
export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_EXPECTED_SEMANTIC_SHA256:
  string | null =
  "53838849abe95d00d819ec89dd5278b7604771edd0306bb75adbb6022473f4d0";
export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_EXPECTED_CANONICAL_SIZE_BYTES:
  number | null = 7_963;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_LITERAL_SEAL_STATUS =
  "SEALED_AFTER_INDEPENDENT_ROOT_ACKNOWLEDGEMENT_AFTER_TOTALITY_BUDGET_REPAIR_BEFORE_RUNTIME_ENROLLMENT" as const;

type EnrollmentBlocker =
  | "exactly_one_enrollment_id_argument_required"
  | "enrollment_id_primitive_string_required"
  | "enrollment_id_empty"
  | "enrollment_id_UTF16_limit_exceeded"
  | "enrollment_id_UTF8_limit_exceeded"
  | "enrollment_id_not_NFC"
  | "enrollment_id_not_canonical"
  | (typeof CURRENT_BLOCKERS)[number];

const enrollmentInputBlocker = (
  value: unknown,
  arity: number,
): EnrollmentBlocker | null => {
  if (arity !== 1) return "exactly_one_enrollment_id_argument_required";
  if (typeof value !== "string")
    return "enrollment_id_primitive_string_required";
  if (value.length === 0) return "enrollment_id_empty";
  if (value.length > 128) return "enrollment_id_UTF16_limit_exceeded";
  if (Buffer.byteLength(value, "utf8") > 256)
    return "enrollment_id_UTF8_limit_exceeded";
  if (!isWellFormedUnicode(value) || value.normalize("NFC") !== value)
    return "enrollment_id_not_NFC";
  if (!isId(value)) return "enrollment_id_not_canonical";
  return null;
};

export function assessNhm2SphericalBosonStarV2IndependentSiLinuxRuntimeAdmission(
  ...inputs: readonly unknown[]
): Readonly<{
  enrollmentId: string | null;
  status: "blocked";
  blockers: readonly EnrollmentBlocker[];
  manifest: null;
  primaryLineage: null;
  independentLineage: null;
  admissionReceipt: null;
  siNormalizationReleaseEligible: false;
  sideEffectCount: 0;
  authorityLocks: typeof AUTHORITY_LOCKS;
}> {
  const enrollmentId = inputs[0];
  const blocker = enrollmentInputBlocker(enrollmentId, inputs.length);
  return deepFreeze({
    enrollmentId: blocker === null ? (enrollmentId as string) : null,
    status: "blocked" as const,
    blockers: blocker === null ? CURRENT_BLOCKERS : [blocker],
    manifest: null,
    primaryLineage: null,
    independentLineage: null,
    admissionReceipt: null,
    siNormalizationReleaseEligible: false as const,
    sideEffectCount: 0 as const,
    authorityLocks: AUTHORITY_LOCKS,
  });
}

const assertFrozenPins = (): void => {
  const sealPending =
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_EXPECTED_SEMANTIC_SHA256 ===
      null &&
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_EXPECTED_CANONICAL_SIZE_BYTES ===
      null;
  const sealMatches =
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_SEMANTIC_SHA256 ===
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_EXPECTED_SEMANTIC_SHA256 &&
    NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_CANONICAL_SIZE_BYTES ===
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_BOUNDARY_EXPECTED_CANONICAL_SIZE_BYTES;
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING.semanticSha256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
        .candidateFreezeV2.semanticSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING.canonicalSizeBytes !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
        .candidateFreezeV2.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING.sha256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
        .siOutputNormalizationV2.semanticSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING.canonicalSizeBytes !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INDEPENDENT_SI_LINUX_RUNTIME_ADMISSION_PINS
        .siOutputNormalizationV2.canonicalSizeBytes ||
    (!sealPending && !sealMatches)
  )
    throw new Error(
      "nhm2_independent_si_linux_runtime_admission_semantic_pin_drift",
    );
};

assertFrozenPins();
