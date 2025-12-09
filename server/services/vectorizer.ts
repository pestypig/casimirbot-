// Lightweight wrapper around vectorizer.ai with env-provided Basic auth.
// Required env: VECTORIZER_USER, VECTORIZER_PASS; optional: VECTORIZER_BASE.
type VectorizeMode = "preview" | "full";

export type VectorizeOptions = {
  mode?: VectorizeMode;
  retentionDays?: number;
  filename?: string;
};

export type VectorizeResult = {
  svg: string;
  imageToken?: string;
  receipt?: string;
};

const baseUrl = (process.env.VECTORIZER_BASE ?? "https://vectorizer.ai/api/v1").replace(/\/+$/, "");

const requireCreds = (): { user: string; pass: string; auth: string } => {
  const user = process.env.VECTORIZER_USER?.trim();
  const pass = process.env.VECTORIZER_PASS?.trim();
  if (!user || !pass) {
    throw new Error("missing_vectorizer_credentials");
  }
  const auth = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  return { user, pass, auth };
};

export async function vectorizeBuffer(image: Buffer, opts?: VectorizeOptions): Promise<VectorizeResult> {
  const { auth } = requireCreds();
  const form = new FormData();
  const filename = opts?.filename || "garment.png";
  form.append("image", new Blob([image]), filename);

  if (opts?.mode === "preview") {
    form.append("mode", "preview");
  }
  if (opts?.retentionDays != null) {
    form.append("policy.retention_days", String(opts.retentionDays));
  }

  const res = await fetch(`${baseUrl}/vectorize`, {
    method: "POST",
    headers: {
      Authorization: auth,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`vectorizer_failed_${res.status}: ${text}`);
  }

  const svg = await res.text();
  const imageToken = res.headers.get("x-image-token") ?? undefined;
  const receipt = res.headers.get("x-receipt") ?? undefined;
  return { svg, imageToken, receipt };
}

export async function downloadVectorized(
  imageToken: string,
  format: "svg" | "png" | "pdf" = "svg",
): Promise<Buffer> {
  const token = imageToken?.trim();
  if (!token) {
    throw new Error("image_token_required");
  }
  const { auth } = requireCreds();
  const url = `${baseUrl}/image/${encodeURIComponent(token)}?format=${encodeURIComponent(format)}`;
  const res = await fetch(url, { headers: { Authorization: auth } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`vectorizer_download_failed_${res.status}: ${text}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}
