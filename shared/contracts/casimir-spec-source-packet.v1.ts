import {
  CASIMIR_SPEC_LANGUAGE_VERSION,
  buildCasimirSpecScientificClaimIrV1,
  canonicalizeCasimirSpecValueV1,
  type BuildCasimirSpecScientificClaimIrV1Input,
  type CasimirSpecScientificClaimIrV1,
} from "./casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_SPEC_SOURCE_PACKET_ARTIFACT_ID =
  "casimir_spec_source_packet" as const;
export const CASIMIR_SPEC_SOURCE_PACKET_SCHEMA_VERSION =
  "casimir_spec_source_packet/v1" as const;

type CasimirSpecSourcePacketBodyV1 = Omit<
  BuildCasimirSpecScientificClaimIrV1Input,
  "generatedAt" | "source"
>;

export type CasimirSpecSourcePacketV1 = {
  artifactId: typeof CASIMIR_SPEC_SOURCE_PACKET_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_SPEC_SOURCE_PACKET_SCHEMA_VERSION;
  languageVersion: typeof CASIMIR_SPEC_LANGUAGE_VERSION;
  sourcePacketId: string;
  body: CasimirSpecSourcePacketBodyV1;
};

export type CasimirSpecSourcePacketParseIssueV1 = {
  code:
    | "source_json_invalid"
    | "source_not_canonical"
    | "source_packet_shape_invalid"
    | "source_packet_identity_invalid"
    | "source_packet_body_shape_invalid"
    | "source_ir_admission_failed";
  path: string;
  detail: string;
};

export type ParseCasimirSpecSourcePacketV1Result =
  | {
      status: "parsed";
      sourcePacketSha256: string;
      canonicalSource: string;
      claimIr: CasimirSpecScientificClaimIrV1;
      issues: [];
    }
  | {
      status: "blocked";
      sourcePacketSha256: string | null;
      canonicalSource: string | null;
      claimIr: null;
      issues: CasimirSpecSourcePacketParseIssueV1[];
    };

const ROOT_KEYS = [
  "artifactId",
  "schemaVersion",
  "languageVersion",
  "sourcePacketId",
  "body",
] as const;

const BODY_KEYS = [
  "specId",
  "title",
  "world",
  "catalogBindings",
  "foundations",
  "provenanceLedger",
  "symbols",
  "definitions",
  "assumptions",
  "axiomLedger",
  "observables",
  "bridges",
  "blockers",
  "excludedClaims",
  "claims",
  "claimBoundary",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function exactKeys(
  value: unknown,
  expectedKeys: readonly string[],
): { missing: string[]; unexpected: string[] } | null {
  if (!isRecord(value)) return null;
  const actual = Object.keys(value);
  const expected = new Set(expectedKeys);
  return {
    missing: expectedKeys.filter(
      (key) => !Object.prototype.hasOwnProperty.call(value, key),
    ),
    unexpected: actual.filter((key) => !expected.has(key)).sort(),
  };
}

function shapeDetail(
  value: unknown,
  expectedKeys: readonly string[],
): string | null {
  const comparison = exactKeys(value, expectedKeys);
  if (!comparison) return "must be an object";
  const parts: string[] = [];
  if (comparison.missing.length > 0) {
    parts.push(`missing fields ${comparison.missing.join(",")}`);
  }
  if (comparison.unexpected.length > 0) {
    parts.push(`unexpected fields ${comparison.unexpected.join(",")}`);
  }
  return parts.length > 0 ? parts.join("; ") : null;
}

export function formatCasimirSpecSourcePacketV1(
  packet: CasimirSpecSourcePacketV1,
): string {
  return `${canonicalizeCasimirSpecValueV1(packet)}\n`;
}

async function sha256SourceBytes(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto SHA-256 is unavailable");
  const digest = await subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function parseCasimirSpecSourcePacketV1(input: {
  sourceText: string;
  sourcePath: string;
  generatedAt: string;
}): Promise<ParseCasimirSpecSourcePacketV1Result> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.sourceText);
  } catch (error) {
    return {
      status: "blocked",
      sourcePacketSha256: null,
      canonicalSource: null,
      claimIr: null,
      issues: [
        {
          code: "source_json_invalid",
          path: "$",
          detail: error instanceof Error ? error.message : "invalid JSON",
        },
      ],
    };
  }

  const canonicalSource = `${canonicalizeCasimirSpecValueV1(parsed)}\n`;
  const sourcePacketSha256 = await sha256SourceBytes(input.sourceText);
  if (input.sourceText !== canonicalSource) {
    return {
      status: "blocked",
      sourcePacketSha256,
      canonicalSource,
      claimIr: null,
      issues: [
        {
          code: "source_not_canonical",
          path: "$",
          detail:
            "source bytes must equal the deterministic canonical formatter output",
        },
      ],
    };
  }

  const rootShape = shapeDetail(parsed, ROOT_KEYS);
  if (rootShape) {
    return {
      status: "blocked",
      sourcePacketSha256,
      canonicalSource,
      claimIr: null,
      issues: [
        {
          code: "source_packet_shape_invalid",
          path: "$",
          detail: rootShape,
        },
      ],
    };
  }

  const packet = parsed as Record<string, unknown>;
  const identityIssues: CasimirSpecSourcePacketParseIssueV1[] = [];
  if (packet.artifactId !== CASIMIR_SPEC_SOURCE_PACKET_ARTIFACT_ID) {
    identityIssues.push({
      code: "source_packet_identity_invalid",
      path: "$.artifactId",
      detail: `must be ${CASIMIR_SPEC_SOURCE_PACKET_ARTIFACT_ID}`,
    });
  }
  if (packet.schemaVersion !== CASIMIR_SPEC_SOURCE_PACKET_SCHEMA_VERSION) {
    identityIssues.push({
      code: "source_packet_identity_invalid",
      path: "$.schemaVersion",
      detail: `must be ${CASIMIR_SPEC_SOURCE_PACKET_SCHEMA_VERSION}`,
    });
  }
  if (packet.languageVersion !== CASIMIR_SPEC_LANGUAGE_VERSION) {
    identityIssues.push({
      code: "source_packet_identity_invalid",
      path: "$.languageVersion",
      detail: `must be ${CASIMIR_SPEC_LANGUAGE_VERSION}`,
    });
  }
  if (
    typeof packet.sourcePacketId !== "string" ||
    packet.sourcePacketId.trim().length === 0
  ) {
    identityIssues.push({
      code: "source_packet_identity_invalid",
      path: "$.sourcePacketId",
      detail: "must be a non-empty string",
    });
  }
  if (identityIssues.length > 0) {
    return {
      status: "blocked",
      sourcePacketSha256,
      canonicalSource,
      claimIr: null,
      issues: identityIssues,
    };
  }

  const bodyShape = shapeDetail(packet.body, BODY_KEYS);
  if (bodyShape) {
    return {
      status: "blocked",
      sourcePacketSha256,
      canonicalSource,
      claimIr: null,
      issues: [
        {
          code: "source_packet_body_shape_invalid",
          path: "$.body",
          detail: bodyShape,
        },
      ],
    };
  }

  try {
    const body = packet.body as CasimirSpecSourcePacketBodyV1;
    const claimIr = await buildCasimirSpecScientificClaimIrV1({
      ...body,
      generatedAt: input.generatedAt,
      source: {
        kind: "parsed_surface",
        language: "casimir_spec",
        languageVersion: CASIMIR_SPEC_LANGUAGE_VERSION,
        artifact: {
          path: input.sourcePath,
          sha256: sourcePacketSha256,
        },
      },
    });
    return {
      status: "parsed",
      sourcePacketSha256,
      canonicalSource,
      claimIr,
      issues: [],
    };
  } catch (error) {
    return {
      status: "blocked",
      sourcePacketSha256,
      canonicalSource,
      claimIr: null,
      issues: [
        {
          code: "source_ir_admission_failed",
          path: "$.body",
          detail:
            error instanceof Error
              ? error.message
              : "canonical claim IR construction failed",
        },
      ],
    };
  }
}
