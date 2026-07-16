import { describe, expect, it } from "vitest";
import { runScholarlyFullTextFetch } from "../retrieval/scholarly-full-text-fetch";
import { normalizeScholarlyFullTextSourceUrl } from "../scholarly-research-intent";

describe("scholarly full-text source normalization", () => {
  it("canonicalizes arXiv abstract and extensionless PDF URLs without changing other sources", () => {
    expect(normalizeScholarlyFullTextSourceUrl("https://arxiv.org/abs/gr-qc/9510071"))
      .toBe("https://arxiv.org/pdf/gr-qc/9510071.pdf");
    expect(normalizeScholarlyFullTextSourceUrl("http://www.arxiv.org/pdf/2401.12345v2"))
      .toBe("https://arxiv.org/pdf/2401.12345v2.pdf");
    expect(normalizeScholarlyFullTextSourceUrl("https://doi.org/10.1103/PhysRevD.53.5496"))
      .toBe("https://doi.org/10.1103/PhysRevD.53.5496");
  });

  it("fetches a direct arXiv abstract source from the canonical PDF endpoint", async () => {
    const fetchedUrls: string[] = [];
    const bytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]);
    const observation = await runScholarlyFullTextFetch({
      turnId: "ask:scholarly-arxiv-abstract-source",
      callId: "call:scholarly-arxiv-abstract-source",
      query: "fetch and parse the full text for arXiv gr-qc/9510071",
      sourceUrl: "https://arxiv.org/abs/gr-qc/9510071",
      cachePdf: false,
      fetchImpl: async (url) => {
        fetchedUrls.push(url);
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/pdf" },
          arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
        };
      },
      extractPdfTextImpl: async () => ({
        totalPages: 26,
        pages: [{
          page: 4,
          text: "Equation (1) bounds the Lorentzian time-average of negative energy density along an inertial observer worldline and states its sampling-duration assumptions.",
        }],
      }),
    });

    expect(fetchedUrls).toEqual(["https://arxiv.org/pdf/gr-qc/9510071.pdf"]);
    expect(observation).toMatchObject({
      source_url: "https://arxiv.org/pdf/gr-qc/9510071.pdf",
      source_kind: "pdf",
      total_pages: 26,
      pages_parsed: 1,
      evidence_state: "full_text_usable",
    });
  });
});
