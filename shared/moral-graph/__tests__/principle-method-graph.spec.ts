import { describe, expect, it } from "vitest";
import { loadIdeologyGraphFromFile } from "../load-ideology-graph";
import { reflectIdeologyContext } from "../reflect-ideology-context";

describe("Principle and Method Review graph composition", () => {
  it("extends the existing value/identity branches and preserves their root and safety boundaries", async () => {
    const graph = await loadIdeologyGraphFromFile();
    expect(graph.rootId).toBe("wisdom-first-principles");
    expect(graph.nodeById.has("principle-method-review")).toBe(false);
    const values = graph.nodeById.get("values-over-images")!;
    expect(values.aliases).toContain("principle and method review");
    expect(values.links?.filter((link) => link.rel === "see-also").map((link) => link.to)).toEqual(
      expect.arrayContaining([
        "identity-view-and-non-attachment", "non-harm-and-compassionate-constraint",
        "autonomy-proven-equality", "adherence-legitimacy-separation",
        "leadership-as-capacity-transfer", "goalpost-integrity",
        "spiritual-friendship-mirror", "cost-to-power-conversion-ledger",
      ]),
    );
    for (const link of values.links ?? []) expect(graph.nodeById.has(link.to)).toBe(true);
    expect(values.bodyMD).toContain("Keep separate decisions and their evidence separate");
    expect(values.bodyMD).toContain("principle itself also remains open to ethical examination");
    expect(values.bodyMD).toContain("A person does not have to die");
    const dream = graph.nodeById.get("dream-integrity")!;
    expect(dream.bodyMD).not.toContain("Safety bought by abandoning purpose is false safety");
    expect(dream.bodyMD).toContain("does not by itself abandon conscience");

    const reflection = reflectIdeologyContext(graph, {
      kind: "user_prompt", text: "principle and method review",
    });
    expect(reflection.matches.exact).toEqual(expect.arrayContaining([
      expect.objectContaining({ nodeId: "values-over-images", pathToRoot: expect.arrayContaining(["wisdom-first-principles"]) }),
    ]));
  });
});
