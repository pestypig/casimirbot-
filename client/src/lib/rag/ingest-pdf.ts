type PdfJsModule = typeof import("pdfjs-dist/build/pdf");

let loading: Promise<PdfJsModule> | null = null;

async function loadPdfJs() {
  if (typeof window === "undefined") {
    throw new Error("PDF ingestion is only available in the browser");
  }
  if (!loading) {
    loading = (async () => {
      const pdfjs = await import("pdfjs-dist/build/pdf");
      const workerSrc = await import("pdfjs-dist/build/pdf.worker.mjs?url");
      const resolvedWorker =
        (workerSrc as { default?: string }).default ?? (workerSrc as unknown as string);
      pdfjs.GlobalWorkerOptions.workerSrc = resolvedWorker;
      return pdfjs;
    })().catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

export async function extractTextFromPDF(file: File) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  let text = "";
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => (typeof item.str === "string" ? item.str : ""))
      .filter(Boolean);
    text += strings.join(" ") + "\n\n";
  }
  doc.cleanup();
  return text.trim();
}
