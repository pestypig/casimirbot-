import { Router, type Request, type Response } from "express";
import {
  DOCS_PRINT_PDF_FEATURE_FLAG,
  DOCS_PRINT_PDF_SCHEMA,
} from "@shared/docs-print-pdf";
import { HELIX_USER_ACCOUNT_POLICY } from "@shared/helix-account-session";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  DocsPrintPdfError,
  renderDocsPrintPdf,
  type DocsPrintPdfResult,
} from "../services/docs-print-pdf";

type SessionResult = Awaited<ReturnType<typeof getAccountSessionById>>;

export type DocsPrintPdfRouteDependencies = {
  getSession: (request: Request) => Promise<SessionResult>;
  render: (input: unknown) => Promise<DocsPrintPdfResult>;
};

const defaultDependencies: DocsPrintPdfRouteDependencies = {
  getSession: (request) =>
    getAccountSessionById(readHelixSessionCookie(request.headers.cookie)),
  render: renderDocsPrintPdf,
};

export function createDocsPrintPdfRouter(
  dependencies: DocsPrintPdfRouteDependencies = defaultDependencies,
): Router {
  const router = Router();
  router.post("/print-pdf", async (request: Request, response: Response) => {
    const session = await dependencies.getSession(request);
    const accountPolicy = session?.account_policy ?? HELIX_USER_ACCOUNT_POLICY;
    if (
      !accountPolicy.feature_flags.includes(DOCS_PRINT_PDF_FEATURE_FLAG) ||
      accountPolicy.locked_features.includes(DOCS_PRINT_PDF_FEATURE_FLAG)
    ) {
      return response.status(403).json({
        ok: false,
        schema: DOCS_PRINT_PDF_SCHEMA,
        error: "pdf_export_unavailable",
        message: "Print-ready PDF export is unavailable for this account policy.",
      });
    }
    try {
      const result = await dependencies.render(request.body);
      response.setHeader("Content-Type", "application/pdf");
      response.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("X-Docs-PDF-Schema", DOCS_PRINT_PDF_SCHEMA);
      response.setHeader("X-Docs-PDF-Filename", result.filename);
      response.setHeader("X-Docs-PDF-SHA256", result.sha256);
      response.setHeader("X-Docs-PDF-Page-Count", String(result.page_count));
      response.setHeader("X-Docs-PDF-Equation-Count", String(result.equation_count));
      response.setHeader("X-Docs-PDF-Table-Count", String(result.table_count));
      response.setHeader("X-Docs-PDF-Validation", "pass");
      return response.status(200).send(result.pdf);
    } catch (error) {
      const known = error instanceof DocsPrintPdfError
        ? error
        : new DocsPrintPdfError("render_failed", "Docs Viewer PDF rendering failed.", 500);
      return response.status(known.status).json({
        ok: false,
        schema: DOCS_PRINT_PDF_SCHEMA,
        error: known.code,
        message: known.message,
      });
    }
  });
  return router;
}

export const docsPrintPdfRouter = createDocsPrintPdfRouter();
