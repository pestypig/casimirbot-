import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import {
  SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS,
  validateSharedAuthoritySocialRenewalReflectionV1,
  type SharedAuthoritySocialRenewalReflectionV1,
} from "@shared/contracts/shared-authority-social-renewal.v1";
import { HELIX_ASK_MORAL_GRAPH_REFLECTION_TOOL_NAME } from "../../skills/helix-ask.moral-graph-reflection";
import { createMoralGraphReflectionMcpHarnessServer } from "../testing/moral-graph-reflection-mcp-harness";

const scenario = [
  "An outsider rises because inherited rank is poorly aligned with demonstrated competence.",
  "His earned military expertise deserves authority within its domain, but not exclusive sovereignty over the future it helped produce.",
  "A princess inherits legitimacy and knowledge of dynastic constraints while being politically valued and personally restricted.",
  "The protected person must have agency, decision access, education, independent counsel, and freedom to contradict the role assigned to her.",
  "Shared leadership must distribute knowledge, permit contestation, and develop succession so people do not become material for one objective.",
  "Love must allow independent purpose and must not automatically treat dissent, departure, or separation as betrayal.",
].join(" ");

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(closers.splice(0).map((close) => close()));
});

async function connectHarness() {
  const server = createMoralGraphReflectionMcpHarnessServer();
  const client = new Client({ name: "moral-graph-harness-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  closers.push(async () => {
    await client.close();
    await server.close();
  });
  return client;
}

describe("Moral Graph MCP reflection harness", () => {
  it("exposes the real handler as a read-only tool and focuses the renewal scenario", async () => {
    const client = await connectHarness();
    const catalog = await client.listTools();
    const tool = catalog.tools.find((entry) => entry.name === HELIX_ASK_MORAL_GRAPH_REFLECTION_TOOL_NAME);
    expect(tool?.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });

    const result = await client.callTool({
      name: HELIX_ASK_MORAL_GRAPH_REFLECTION_TOOL_NAME,
      arguments: {
        inputKind: "user_prompt",
        text: scenario,
        options: { includeLocator: false, includeSharedAuthoritySocialRenewal: true },
      },
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).not.toHaveProperty("locator");

    const composition = result.structuredContent?.sharedAuthoritySocialRenewal as SharedAuthoritySocialRenewalReflectionV1;
    expect(validateSharedAuthoritySocialRenewalReflectionV1(composition)).toEqual([]);
    expect(composition.reflectionSequence).toEqual([...SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS]);
    expect(composition.prioritizedBadgeIds).toEqual(expect.arrayContaining([
      "leadership-as-capacity-transfer",
      "mandate-bounded-hierarchy",
      "protection-without-possession",
      "cost-to-power-conversion-ledger",
      "autonomy-proven-equality",
      "love-without-projection",
    ]));
    expect(composition.domains.filter((domain) => domain.status === "in_scope").length).toBeGreaterThanOrEqual(8);
    expect(composition.deprioritizedCandidateCount).toBeGreaterThan(0);
    expect(composition.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
      diagnostic_only: true,
      no_moral_verdict: true,
      no_legitimacy_inference: true,
    });
  });

  it("does not turn quoted or negated authority language into execution authority", async () => {
    const client = await connectHarness();
    const result = await client.callTool({
      name: HELIX_ASK_MORAL_GRAPH_REFLECTION_TOOL_NAME,
      arguments: {
        text: 'The narrator rejects the claim "only my understanding may govern" and says departure is not automatically betrayal.',
        options: { includeSharedAuthoritySocialRenewal: true },
      },
    });
    const composition = result.structuredContent?.sharedAuthoritySocialRenewal as SharedAuthoritySocialRenewalReflectionV1;
    expect(composition.authority.agent_executable).toBe(false);
    expect(composition.authority.terminal_eligible).toBe(false);
    expect(composition.authority.no_moral_verdict).toBe(true);
  });
});
