import { describe, expect, it } from "vitest";

import {
  RESEARCH_LIBRARY_PRIVATE_MAILBOX_THREAD_PREFIX,
  researchLibraryDocumentViewerRef,
  researchLibraryPrivateMailboxThreadId,
} from "../research-library-store";
import {
  researchLibraryDocumentRefFromDocViewerPath,
  researchLibraryDocViewerPath,
} from "../../../../shared/helix-research-library";

describe("Research Library private translation scope", () => {
  it("derives stable opaque account and document identities without exposing raw database ids", () => {
    const profileId = "profile:private-user@example.test";
    const firstDocumentId = "research:raw-document-id-one";
    const secondDocumentId = "research:raw-document-id-two";
    const firstRef = researchLibraryDocumentViewerRef(profileId, firstDocumentId);
    const repeatedRef = researchLibraryDocumentViewerRef(profileId, firstDocumentId);
    const secondRef = researchLibraryDocumentViewerRef(profileId, secondDocumentId);
    const otherAccountRef = researchLibraryDocumentViewerRef("profile:other-user", firstDocumentId);
    const mailboxThreadId = researchLibraryPrivateMailboxThreadId(profileId);
    const docPath = researchLibraryDocViewerPath(firstRef);

    expect(firstRef).toBe(repeatedRef);
    expect(secondRef).not.toBe(firstRef);
    expect(otherAccountRef).not.toBe(firstRef);
    expect(firstRef).toMatch(/^private-research:[A-Za-z0-9_-]{24}:[A-Za-z0-9_-]{24}$/);
    expect(mailboxThreadId).toMatch(new RegExp(`^${RESEARCH_LIBRARY_PRIVATE_MAILBOX_THREAD_PREFIX}[A-Za-z0-9_-]{24}$`));
    for (const identity of [firstRef, secondRef, otherAccountRef, mailboxThreadId, docPath]) {
      expect(identity).not.toContain(profileId);
      expect(identity).not.toContain(firstDocumentId);
      expect(identity).not.toContain(secondDocumentId);
    }
    expect(researchLibraryDocumentRefFromDocViewerPath(docPath)).toBe(firstRef);
    expect(researchLibraryDocumentRefFromDocViewerPath(`${docPath}/extra`)).toBeNull();
    expect(researchLibraryDocumentRefFromDocViewerPath("research-library/%E0%A4%A")).toBeNull();
  });
});
