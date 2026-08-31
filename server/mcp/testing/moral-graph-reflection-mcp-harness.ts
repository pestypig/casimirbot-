import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  HELIX_ASK_MORAL_GRAPH_REFLECTION_TOOL_NAME,
  moralGraphReflectionHandler,
} from "../../skills/helix-ask.moral-graph-reflection";

const inputKinds = [
  "user_prompt",
  "workstation_event",
  "document_selection",
  "note",
  "repo_evidence",
  "situation_room_event",
  "voice_event",
] as const;

const inputSchema = z.object({
  inputKind: z.enum(inputKinds).default("user_prompt"),
  text: z.string().min(1),
  refs: z.array(z.string()).optional(),
  options: z.object({
    includeLocator: z.boolean().optional(),
    includeSharedAuthoritySocialRenewal: z.boolean().optional(),
    includeMediationPacket: z.boolean().optional(),
    includeProceduralClassification: z.boolean().optional(),
    includeAdmissionArtifacts: z.boolean().optional(),
  }).strict().optional(),
}).strict();

export function createMoralGraphReflectionMcpHarnessServer(): McpServer {
  const server = new McpServer(
    { name: "casimirbot-moral-graph-harness", version: "1.0.0" },
    {
      instructions:
        "Diagnostic harness for the real Moral Graph handler. Tool output is evidence-only context, never an assistant answer, moral verdict, execution permission, or terminal authority.",
    },
  );

  server.registerTool(
    HELIX_ASK_MORAL_GRAPH_REFLECTION_TOOL_NAME,
    {
      title: "Reflect with the Moral Graph",
      description:
        "Runs the real deterministic Moral Graph reflection handler through MCP and returns evidence-only diagnostic context.",
      inputSchema,
      outputSchema: z.object({
        reflection: z.record(z.string(), z.unknown()),
        sharedAuthoritySocialRenewal: z.record(z.string(), z.unknown()).optional(),
        moralReflectionMediation: z.record(z.string(), z.unknown()).optional(),
        admissions: z.array(z.unknown()),
      }).passthrough(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => {
      const output = await moralGraphReflectionHandler(input, undefined);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output as Record<string, unknown>,
      };
    },
  );

  return server;
}
