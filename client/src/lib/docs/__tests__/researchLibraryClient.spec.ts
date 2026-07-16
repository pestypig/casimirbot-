import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteResearchLibraryDocument } from "../researchLibraryClient";

describe("researchLibraryClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes an encoded profile-library document through the scoped API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await deleteResearchLibraryDocument("research:paper/one");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/research-library/research%3Apaper%2Fone",
      expect.objectContaining({
        method: "DELETE",
        credentials: "same-origin",
      }),
    );
  });

  it("preserves the server error when deletion fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "research_library_document_not_found" }),
    }));

    await expect(deleteResearchLibraryDocument("research:missing")).rejects.toThrow(
      "research_library_document_not_found",
    );
  });
});
