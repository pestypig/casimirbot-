import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { accountSessionRouter } from "../routes/account-session";
import { researchLibraryRouter } from "../routes/research-library";
import { getPool } from "../db/client";
import { resetAccountSessionStore } from "../services/helix-account/account-session-store";
import {
  listResearchLibraryDocuments,
  readResearchLibraryDocument,
  saveResearchLibraryExtraction,
} from "../services/helix-account/research-library-store";
import { runScholarlyFullTextFetch } from "../services/helix-ask/retrieval/scholarly-full-text-fetch";

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/account", accountSessionRouter);
  app.use("/api/research-library", researchLibraryRouter);
  return app;
};

const sampleExtraction = (profileId: string) => saveResearchLibraryExtraction({
  profile_id: profileId,
  title: "A private extracted paper",
  source_url: "https://arxiv.org/pdf/2401.12345",
  source_kind: "pdf",
  source_pdf_ref: "artifact://scholarly-pdf/test.pdf",
  source_integrity_hash: "abc123",
  paper_result_id: "arxiv:2401.12345",
  query: "test paper",
  extraction_status: "full_text_usable",
  pages: [
    { page: 1, text: "page one private text", text_char_count: 21, extraction_status: "text", source_text_ref: "artifact://paper#page=1&text" },
    { page: 2, text: "page two private text", text_char_count: 21, extraction_status: "text", source_text_ref: "artifact://paper#page=2&text" },
  ],
});

describe("profile research library", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
  });

  it("encrypts page text, deduplicates by source hash, and omits raw text from list records", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent.post("/api/account/session/sign-in").send({ profile_id: "profile:research-a", display_name: "Research A" }).expect(200);

    const first = await sampleExtraction("profile:research-a");
    const second = await sampleExtraction("profile:research-a");
    expect(second.document_id).toBe(first.document_id);

    const list = await listResearchLibraryDocuments("profile:research-a");
    expect(list.documents).toHaveLength(1);
    expect(JSON.stringify(list)).not.toContain("page one private text");

    const { rows } = await getPool().query<{ encrypted_content: string }>(
      `SELECT encrypted_content FROM helix_research_library_documents WHERE document_id = $1`,
      [first.document_id],
    );
    expect(rows[0].encrypted_content).toMatch(/^v1:/);
    expect(rows[0].encrypted_content).not.toContain("page one private text");

    const response = await agent.get(`/api/research-library/${encodeURIComponent(first.document_id)}`).expect(200);
    expect(response.body.document.pages).toEqual(expect.arrayContaining([
      expect.objectContaining({ page: 1, text: "page one private text" }),
    ]));
  });

  it("isolates records by signed-in profile and rejects anonymous reads", async () => {
    const app = createApp();
    const profileA = request.agent(app);
    const profileB = request.agent(app);
    await profileA.post("/api/account/session/sign-in").send({ profile_id: "profile:research-a", display_name: "Research A" }).expect(200);
    await profileB.post("/api/account/session/sign-in").send({ profile_id: "profile:research-b", display_name: "Research B" }).expect(200);
    const saved = await sampleExtraction("profile:research-a");

    await profileB.get(`/api/research-library/${encodeURIComponent(saved.document_id)}`).expect(404);
    await request(app).get("/api/research-library").expect(401);
    expect((await readResearchLibraryDocument("profile:research-b", saved.document_id))).toBeNull();
  });

  it("persists all extracted pages while keeping the scholarly observation compact", async () => {
    const agent = request.agent(createApp());
    await agent.post("/api/account/session/sign-in").send({ profile_id: "profile:research-a", display_name: "Research A" }).expect(200);
    const bytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]);
    const observation = await runScholarlyFullTextFetch({
      turnId: "ask:research-library-save",
      callId: "call:research-library-save",
      query: "test extraction",
      sourceUrl: "https://arxiv.org/pdf/2401.12345.pdf",
      cachePdf: false,
      researchLibraryProfileId: "profile:research-a",
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        headers: { get: () => "application/pdf" },
        arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      }),
      extractPdfTextImpl: async () => ({
        totalPages: 2,
        pages: [
          { page: 1, text: "first complete extracted page with enough machine-readable prose to establish a usable bounded scholarly text observation for testing" },
          { page: 2, text: "second complete extracted page with enough machine-readable prose to remain durable in the private page-aligned research library" },
        ],
      }),
    });

    expect(observation).toMatchObject({
      evidence_state: "full_text_usable",
      research_library_persistence_status: "saved",
      research_library_document_ref: expect.stringMatching(/^research:/),
      raw_content_included: false,
    });
    expect(observation.page_text_refs.every((page) => !("text" in page))).toBe(true);
    const saved = await readResearchLibraryDocument(
      "profile:research-a",
      observation.research_library_document_ref!,
    );
    expect(saved?.pages.map((page) => page.text)).toEqual([
      "first complete extracted page with enough machine-readable prose to establish a usable bounded scholarly text observation for testing",
      "second complete extracted page with enough machine-readable prose to remain durable in the private page-aligned research library",
    ]);
  });

  it("retires private research content when the owning profile is deleted", async () => {
    const agent = request.agent(createApp());
    await agent.post("/api/account/session/sign-in").send({ profile_id: "profile:research-a", display_name: "Research A" }).expect(200);
    const saved = await sampleExtraction("profile:research-a");

    await agent.delete("/api/account/profile").expect(200);
    expect(await readResearchLibraryDocument("profile:research-a", saved.document_id)).toBeNull();
  });
});
