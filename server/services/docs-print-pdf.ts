import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import katex from "katex";
import { Marked, type Tokens } from "marked";
import { z } from "zod";
import {
  DOCS_PRINT_PDF_MAX_MARKDOWN_CHARS,
  DOCS_PRINT_PDF_MAX_SOURCE_PATH_CHARS,
  DOCS_PRINT_PDF_MAX_TITLE_CHARS,
  DOCS_PRINT_PDF_SCHEMA,
  sanitizeDocsPrintPdfFilename,
  type DocsPrintPdfRequest,
} from "@shared/docs-print-pdf";

const requestSchema = z.object({
  schema: z.literal(DOCS_PRINT_PDF_SCHEMA),
  title: z.string().trim().min(1).max(DOCS_PRINT_PDF_MAX_TITLE_CHARS),
  source_path: z.string().trim().min(1).max(DOCS_PRINT_PDF_MAX_SOURCE_PATH_CHARS),
  source_kind: z.enum(["canonical_docs", "private_research"]),
  source_markdown: z.string().min(1).max(DOCS_PRINT_PDF_MAX_MARKDOWN_CHARS),
}).strict();

export type DocsPrintPdfDiagnostics = {
  headings: number;
  toc_links: number;
  tables: number;
  display_math: number;
  inline_math: number;
  katex_errors: number;
  broken_images: number;
  overflow_count: number;
  omitted_remote_images: number;
};

export type DocsPrintPdfResult = {
  pdf: Buffer;
  filename: string;
  sha256: string;
  source_sha256: string;
  page_count: number;
  equation_count: number;
  table_count: number;
  diagnostics: DocsPrintPdfDiagnostics;
};

export class DocsPrintPdfError extends Error {
  constructor(
    public readonly code:
      | "invalid_request"
      | "renderer_unavailable"
      | "render_failed"
      | "render_validation_failed",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "DocsPrintPdfError";
  }
}

export function parseDocsPrintPdfRequest(input: unknown): DocsPrintPdfRequest {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    throw new DocsPrintPdfError(
      "invalid_request",
      parsed.error.issues[0]?.message ?? "Invalid Docs Viewer PDF request.",
      400,
    );
  }
  return parsed.data;
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const safeLinkHref = (value: string): string | null => {
  const href = value.trim();
  if (!href) return null;
  if (href.startsWith("#")) return href;
  if (/^(https?:|mailto:)/i.test(href)) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null;
  if (/^(?:\.{0,2}\/|[a-zA-Z0-9_-])/.test(href) && !href.includes("\0")) return href;
  return null;
};

const imageMime = (extension: string): string | null => {
  switch (extension.toLowerCase()) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".gif": return "image/gif";
    case ".webp": return "image/webp";
    case ".svg": return "image/svg+xml";
    default: return null;
  }
};

const pathWithin = (parent: string, candidate: string): boolean => {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
};

function localImageDataUri(href: string, sourcePath: string): string | null {
  if (/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(href)) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) return null;
  const repoRoot = path.resolve(process.cwd());
  const normalizedSource = sourcePath.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalizedSource.startsWith("docs/")) return null;
  const sourceDirectory = path.resolve(repoRoot, path.dirname(normalizedSource));
  const candidate = path.resolve(sourceDirectory, href.split(/[?#]/, 1)[0]);
  if (!pathWithin(repoRoot, candidate)) return null;
  const mime = imageMime(path.extname(candidate));
  if (!mime || !fs.existsSync(candidate)) return null;
  const stat = fs.statSync(candidate);
  if (!stat.isFile() || stat.size > 5 * 1024 * 1024) return null;
  return `data:${mime};base64,${fs.readFileSync(candidate).toString("base64")}`;
}

let cachedKatexCss: string | null = null;

function inlineKatexCss(): string {
  if (cachedKatexCss) return cachedKatexCss;
  const katexDirectory = path.resolve(process.cwd(), "node_modules", "katex", "dist");
  const source = fs.readFileSync(path.join(katexDirectory, "katex.min.css"), "utf8");
  cachedKatexCss = source.replace(/url\(fonts\/([^)]+)\)/g, (_match, filename: string) => {
    const clean = filename.replace(/["']/g, "");
    const fontPath = path.join(katexDirectory, "fonts", clean);
    if (!pathWithin(path.join(katexDirectory, "fonts"), fontPath) || !fs.existsSync(fontPath)) {
      return `url(fonts/${clean})`;
    }
    const extension = path.extname(clean).toLowerCase();
    const mime = extension === ".woff2"
      ? "font/woff2"
      : extension === ".woff"
        ? "font/woff"
        : "font/ttf";
    return `url(data:${mime};base64,${fs.readFileSync(fontPath).toString("base64")})`;
  });
  return cachedKatexCss;
}

function renderMath(latex: string, displayMode: boolean): string {
  return katex.renderToString(latex.trim(), {
    displayMode,
    output: "html",
    strict: "ignore",
    throwOnError: false,
    trust: false,
  });
}

function buildMarkdownRenderer(input: DocsPrintPdfRequest): {
  html: string;
  omittedRemoteImages: number;
} {
  let omittedRemoteImages = 0;
  const parser = new Marked({
    gfm: true,
    breaks: false,
    pedantic: false,
  });
  parser.use({
    extensions: [
      {
        name: "docsPrintDisplayMath",
        level: "block",
        start(src: string) {
          const bracket = src.indexOf("\\[");
          const dollar = src.indexOf("$$");
          if (bracket < 0) return dollar;
          if (dollar < 0) return bracket;
          return Math.min(bracket, dollar);
        },
        tokenizer(src: string) {
          const bracket = /^\\\[\s*([\s\S]+?)\s*\\\](?:\n+|$)/.exec(src);
          const dollar = /^\$\$\s*([\s\S]+?)\s*\$\$(?:\n+|$)/.exec(src);
          const match = bracket ?? dollar;
          if (!match) return undefined;
          return { type: "docsPrintDisplayMath", raw: match[0], text: match[1] };
        },
        renderer(token: Tokens.Generic) {
          return `<div class="math-display">${renderMath(String(token.text ?? ""), true)}</div>`;
        },
      },
      {
        name: "docsPrintInlineMath",
        level: "inline",
        start(src: string) {
          return src.indexOf("\\(");
        },
        tokenizer(src: string) {
          const match = /^\\\(([\s\S]+?)\\\)/.exec(src);
          if (!match) return undefined;
          return { type: "docsPrintInlineMath", raw: match[0], text: match[1] };
        },
        renderer(token: Tokens.Generic) {
          return `<span class="math-inline">${renderMath(String(token.text ?? ""), false)}</span>`;
        },
      },
    ],
    renderer: {
      html(token) {
        const raw = token.text.trim();
        if (/^<!--\s*docs-print-page-break\s*-->$/i.test(raw)) {
          return '<div class="docs-print-page-break" aria-hidden="true"></div>';
        }
        if (/^<!--[\s\S]*-->$/.test(raw)) return "";
        if (/^<br\s*\/?>$/i.test(raw)) return "<br>";
        if (/^<\/?details(?:\s+open)?>$/i.test(raw)) return "";
        const summary = /^<summary>([\s\S]*?)<\/summary>$/i.exec(raw);
        if (summary) return `<p class="details-summary">${escapeHtml(summary[1])}</p>`;
        return `<code class="escaped-raw-html">${escapeHtml(token.text)}</code>`;
      },
      link(token) {
        const label = this.parser.parseInline(token.tokens);
        const href = safeLinkHref(token.href);
        if (!href) return label;
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        return `<a href="${escapeHtml(href)}"${title}>${label}</a>`;
      },
      image(token) {
        const dataUri = localImageDataUri(token.href, input.source_path);
        const alt = escapeHtml(token.text || "Document image");
        if (!dataUri) {
          omittedRemoteImages += 1;
          return `<span class="print-image-placeholder">[Image omitted from offline export: ${alt}]</span>`;
        }
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        return `<img src="${dataUri}" alt="${alt}"${title}>`;
      },
    },
  });
  return {
    html: String(parser.parse(input.source_markdown)),
    omittedRemoteImages,
  };
}

const PRINT_CSS = `
@page{size:Letter;margin:.72in .68in .72in .78in}
@page:first{margin:.55in .68in .62in .78in}
*{box-sizing:border-box}
html{background:#fff;color:#18202b;font-family:Cambria,"Times New Roman",serif;font-size:10.6pt;line-height:1.46;text-rendering:optimizeLegibility;print-color-adjust:exact;-webkit-print-color-adjust:exact}
body{margin:0;background:#fff}
main{margin:0 auto;max-width:7.05in}
.cover{min-height:8.8in;display:flex;flex-direction:column;justify-content:center;break-after:page;page-break-after:always}
.cover-rule{width:1.15in;height:4px;background:#163b68;margin:0 0 .34in}
.edition{color:#163b68;font-family:"Segoe UI",Arial,sans-serif;font-size:9.5pt;font-weight:650;letter-spacing:.075em;text-transform:uppercase}
.cover h1{color:#163b68;font-family:"Segoe UI",Arial,sans-serif;font-size:25pt;font-weight:650;letter-spacing:-.02em;line-height:1.12;margin:.12in 0 0}
.cover .source{color:#586474;font-family:Consolas,"Courier New",monospace;font-size:7.1pt;line-height:1.45;margin-top:.38in;overflow-wrap:anywhere}
.cover .notice{background:#e9f0f7;border-left:4px solid #163b68;color:#26384d;font-family:"Segoe UI",Arial,sans-serif;font-size:9.3pt;line-height:1.45;margin-top:.35in;padding:.16in .2in}
.toc{break-after:page;page-break-after:always}
.toc h1{border:0;color:#163b68;font-family:"Segoe UI",Arial,sans-serif;font-size:21pt;margin:0 0 .25in;padding:0}
.toc-list,.toc-list ol{list-style:none;margin:0;padding:0}
.toc-list>li{border-bottom:.5px solid #d7dde4;margin:.055in 0;padding:.035in 0}
.toc-list li li{border:0;margin:.025in 0 .025in .2in;padding:0}
.toc-list a{color:#18202b;display:flex;font-family:"Segoe UI",Arial,sans-serif;font-size:8.3pt;justify-content:space-between;text-decoration:none}
.toc-list li li a{color:#586474;font-size:7.7pt}
.paper>h1:first-child{display:none}
h1,h2,h3,h4,h5,h6{color:#163b68;font-family:"Segoe UI",Arial,sans-serif;font-weight:650;line-height:1.22;break-after:avoid-page;page-break-after:avoid}
h1{border-bottom:1.5px solid #163b68;font-size:21pt;margin:0 0 .26in;padding-bottom:.08in}
h2{border-bottom:1px solid #95a9be;break-before:auto;page-break-before:auto;font-size:16.5pt;margin:.25in 0 0;padding:0 0 .07in}
h3{font-size:12.5pt;margin:.24in 0 .08in}
h4{color:#294f79;font-size:10.7pt;margin:.2in 0 .06in}
h5,h6{font-size:9.8pt;margin:.16in 0 .05in}
p{margin:.075in 0 .11in;orphans:3;widows:3}
strong{color:#142d49}
a{color:#174f88;text-decoration:none;overflow-wrap:anywhere}
ul,ol{margin:.06in 0 .13in .26in;padding-left:.18in}
li{break-inside:avoid-page;margin:.025in 0;orphans:2;page-break-inside:avoid;widows:2}
blockquote{background:#f3f6f8;border-left:3px solid #8399b0;color:#33465a;margin:.14in 0;padding:.08in .16in}
blockquote p{margin:.03in 0}
hr{border:0;border-top:1px solid #b9c2ce;margin:.23in 0}
code{background:#eef1f4;border-radius:2px;font-family:Consolas,"Courier New",monospace;font-size:.82em;overflow-wrap:anywhere;padding:.02em .16em;word-break:break-word}
pre{background:#f3f5f7;border:1px solid #d2d8df;border-radius:3px;break-inside:avoid-page;color:#1d2a38;font-family:Consolas,"Courier New",monospace;font-size:7.2pt;line-height:1.32;margin:.12in 0;overflow-wrap:anywhere;padding:.11in .13in;white-space:pre-wrap;word-break:break-word}
pre code{background:transparent;font-size:inherit;padding:0}
table{border-collapse:collapse;break-inside:auto;font-family:"Segoe UI",Arial,sans-serif;font-size:7.8pt;line-height:1.28;margin:.13in 0 .19in;table-layout:fixed;width:100%}
thead{display:table-header-group}
tr{break-inside:avoid-page;page-break-inside:avoid}
th,td{border:.65px solid #aeb8c4;overflow-wrap:anywhere;padding:.05in .055in;vertical-align:top;word-break:break-word}
th{background:#e7edf3;color:#193650;font-weight:650;text-align:left}
tbody tr:nth-child(even) td{background:#f8f9fa}
table.cols-4{font-size:7.25pt}
table.cols-5,table.cols-6{font-size:6.65pt;line-height:1.22}
table.cols-7,table.cols-8,table.cols-9,table.cols-many{font-size:5.95pt;line-height:1.17}
.math-inline{white-space:nowrap}
.math-display{break-inside:avoid-page;page-break-inside:avoid;margin:.12in 0 .16in;max-width:100%;text-align:center}
.math-display .katex-display{break-inside:avoid-page;page-break-inside:avoid;margin:0;max-width:100%}
.docs-print-page-break{break-before:page;page-break-before:always;height:.38in;margin:0;padding:0}
.docs-print-page-break+ol{margin-top:.55in}
.math-display .katex{font-size:1em}
.katex-error{color:#821b1b!important;font-family:Consolas,"Courier New",monospace;font-size:7pt;white-space:pre-wrap}
img{display:block;height:auto;margin:.15in auto;max-height:8in;max-width:100%}
.print-image-placeholder,.escaped-raw-html{background:#fff7e8;border-left:3px solid #b87824;color:#7b4c12;display:block;font-family:"Segoe UI",Arial,sans-serif;font-size:8pt;margin:.12in 0;padding:.08in .12in}
.details-summary{color:#163b68;font-family:"Segoe UI",Arial,sans-serif;font-weight:650}
@media print{html,body{width:auto}main{max-width:none}}
`;

export function buildDocsPrintPdfHtml(input: DocsPrintPdfRequest): {
  html: string;
  sourceSha256: string;
  omittedRemoteImages: number;
} {
  const sourceSha256 = crypto.createHash("sha256").update(input.source_markdown).digest("hex");
  const rendered = buildMarkdownRenderer(input);
  const exportedOn = new Date().toISOString().slice(0, 10);
  return {
    sourceSha256,
    omittedRemoteImages: rendered.omittedRemoteImages,
    html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(input.title)} - Print Edition</title><style>${inlineKatexCss()}${PRINT_CSS}</style></head>
<body><main>
<section class="cover"><div class="cover-rule"></div><div class="edition">Private print export - ${exportedOn}</div>
<h1>${escapeHtml(input.title)}</h1>
<div class="notice">This export reproduces the loaded Docs Viewer source. PDF validation confirms rendering integrity only; it does not certify the document's scientific or factual claims.</div>
<div class="source">Source: ${escapeHtml(input.source_path)}<br>Source kind: ${escapeHtml(input.source_kind)}<br>Source SHA-256: ${sourceSha256}</div></section>
<nav class="toc" aria-label="Table of contents"><h1>Contents</h1><ol class="toc-list"></ol></nav>
<article class="paper">${rendered.html}</article>
</main></body></html>`,
  };
}

let activeRender = false;

export async function renderDocsPrintPdf(inputValue: unknown): Promise<DocsPrintPdfResult> {
  const input = parseDocsPrintPdfRequest(inputValue);
  if (activeRender) {
    throw new DocsPrintPdfError(
      "render_failed",
      "Another Docs Viewer PDF export is already running. Try again when it finishes.",
      429,
    );
  }
  activeRender = true;
  let browser: Awaited<ReturnType<(typeof import("playwright"))["chromium"]["launch"]>> | null = null;
  try {
    let chromium: (typeof import("playwright"))["chromium"];
    try {
      ({ chromium } = await import("playwright"));
    } catch {
      throw new DocsPrintPdfError(
        "renderer_unavailable",
        "The server PDF renderer is unavailable. Install Playwright and its Chromium runtime.",
        503,
      );
    }
    const built = buildDocsPrintPdfHtml(input);
    try {
      browser = await chromium.launch({ headless: true });
    } catch {
      throw new DocsPrintPdfError(
        "renderer_unavailable",
        "The server PDF browser is unavailable. Run `npx playwright install chromium`.",
        503,
      );
    }
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1800 },
      deviceScaleFactor: 1,
    });
    page.setDefaultTimeout(30_000);
    await page.route("**/*", (route) => route.abort("blockedbyclient"));
    await page.setContent(built.html, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      const usedIds = new Set<string>();
      const headings = Array.from(document.querySelectorAll<HTMLElement>(".paper h2,.paper h3"));
      const toc = document.querySelector<HTMLOListElement>(".toc-list");
      let parent: HTMLLIElement | null = null;
      for (const heading of headings) {
        const value = heading.textContent || "section";
        const base = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
          .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
        let slug = base;
        let index = 2;
        while (usedIds.has(slug)) slug = `${base}-${index++}`;
        usedIds.add(slug);
        heading.id = slug;
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent || "Section";
        item.append(link);
        if (heading.tagName === "H2" || !parent) {
          toc?.append(item);
          parent = item;
        } else {
          let nested = parent.querySelector<HTMLOListElement>(":scope > ol");
          if (!nested) {
            nested = document.createElement("ol");
            parent.append(nested);
          }
          nested.append(item);
        }
      }
      for (const table of document.querySelectorAll<HTMLTableElement>("table")) {
        const columns = table.querySelectorAll("thead th").length
          || table.querySelectorAll("tr:first-child>*").length;
        table.classList.add(columns >= 10 ? "cols-many" : `cols-${columns}`);
      }
      for (const display of document.querySelectorAll<HTMLElement>(".math-display")) {
        let size = 10.6;
        display.style.fontSize = `${size}pt`;
        while (display.scrollWidth > display.clientWidth + 2 && size > 6.2) {
          size -= 0.35;
          display.style.fontSize = `${size}pt`;
        }
      }
    });
    await page.emulateMedia({ media: "print" });
    const diagnostics = await page.evaluate((omittedRemoteImages): DocsPrintPdfDiagnostics => {
      const documentWidth = document.documentElement.clientWidth;
      const overflow = Array.from(document.querySelectorAll<HTMLElement>("main *"))
        .filter((element) => !element.closest("svg"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.right > documentWidth + 2 || rect.left < -2;
        });
      return {
        headings: document.querySelectorAll(".paper h1,.paper h2,.paper h3,.paper h4,.paper h5,.paper h6").length,
        toc_links: document.querySelectorAll(".toc-list a").length,
        tables: document.querySelectorAll("table").length,
        display_math: document.querySelectorAll(".math-display").length,
        inline_math: document.querySelectorAll(".math-inline").length,
        katex_errors: document.querySelectorAll(".katex-error").length,
        broken_images: Array.from(document.images).filter((image) => !image.complete || image.naturalWidth === 0).length,
        overflow_count: overflow.length,
        omitted_remote_images: omittedRemoteImages,
      };
    }, built.omittedRemoteImages);
    if (diagnostics.katex_errors || diagnostics.broken_images || diagnostics.overflow_count) {
      throw new DocsPrintPdfError(
        "render_validation_failed",
        `PDF render validation failed (math=${diagnostics.katex_errors}, images=${diagnostics.broken_images}, overflow=${diagnostics.overflow_count}).`,
        422,
      );
    }
    const pdfBytes = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="box-sizing:border-box;width:100%;padding:0 .68in 0 .78in;color:#5d6875;font-family:Arial,sans-serif;font-size:7px"><span>${escapeHtml(input.title)}</span><span style="float:right">Docs Viewer print export</span></div>`,
      footerTemplate: `<div style="box-sizing:border-box;width:100%;padding:0 .68in 0 .78in;color:#5d6875;font-family:Arial,sans-serif;font-size:7px;text-align:center"><span class="pageNumber"></span></div>`,
      margin: { top: ".72in", right: ".68in", bottom: ".72in", left: ".78in" },
      tagged: true,
      outline: true,
    });
    const pdf = Buffer.from(pdfBytes);
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdf), disableWorker: true });
    const parsedPdf = await loadingTask.promise;
    const pageCount = parsedPdf.numPages;
    await parsedPdf.destroy();
    if (pageCount < 2 || !pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new DocsPrintPdfError(
        "render_validation_failed",
        "The rendered artifact is not a valid multi-page PDF.",
        422,
      );
    }
    return {
      pdf,
      filename: sanitizeDocsPrintPdfFilename(input.title),
      sha256: crypto.createHash("sha256").update(pdf).digest("hex"),
      source_sha256: built.sourceSha256,
      page_count: pageCount,
      equation_count: diagnostics.display_math + diagnostics.inline_math,
      table_count: diagnostics.tables,
      diagnostics,
    };
  } catch (error) {
    if (error instanceof DocsPrintPdfError) throw error;
    throw new DocsPrintPdfError(
      "render_failed",
      error instanceof Error ? error.message : "Docs Viewer PDF rendering failed.",
      500,
    );
  } finally {
    await browser?.close().catch(() => undefined);
    activeRender = false;
  }
}
