import crypto from "node:crypto";
import { ensureDatabase, getPool } from "../../db/client";

export type HelixEmailTemplate = "password_reset" | "email_verification";
export type HelixEmailProvider = "local" | "resend";
export type HelixEmailStatus = "queued" | "sent" | "failed";

export type HelixEmailOutboxRecord = {
  email_id: string;
  recipient: string;
  template: HelixEmailTemplate;
  subject: string;
  text_body: string;
  html_body: string | null;
  provider: string;
  status: HelixEmailStatus;
  provider_message_id: string | null;
  error: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  sent_at: Date | string | null;
};

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizedProvider = (): HelixEmailProvider => {
  const configured = normalize(process.env.HELIX_EMAIL_PROVIDER).toLowerCase();
  return configured === "resend" ? "resend" : "local";
};

export const isLocalEmailDeliveryMode = (): boolean => normalizedProvider() === "local";

const fromAddress = (): string =>
  normalize(process.env.HELIX_EMAIL_FROM) || "CasimirBot <no-reply@localhost>";

const publicBaseUrl = (): string =>
  normalize(process.env.HELIX_PUBLIC_BASE_URL) || "http://localhost:5050";

export function buildAccountActionUrl(input: {
  path: string;
  token_value: string;
}): string {
  const base = publicBaseUrl().replace(/\/+$/, "");
  const path = input.path.startsWith("/") ? input.path : `/${input.path}`;
  return `${base}${path}?token=${encodeURIComponent(input.token_value)}`;
}

async function sendViaResend(input: {
  recipient: string;
  subject: string;
  text_body: string;
  html_body?: string | null;
}): Promise<{ status: HelixEmailStatus; provider_message_id: string | null; error: string | null }> {
  const apiKey = normalize(process.env.HELIX_EMAIL_API_KEY);
  if (!apiKey) {
    return {
      status: "failed",
      provider_message_id: null,
      error: "missing_HELIX_EMAIL_API_KEY",
    };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [input.recipient],
        subject: input.subject,
        text: input.text_body,
        html: input.html_body ?? undefined,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        status: "failed",
        provider_message_id: null,
        error: typeof body?.message === "string" ? body.message : `resend_${response.status}`,
      };
    }
    return {
      status: "sent",
      provider_message_id: typeof body?.id === "string" ? body.id : null,
      error: null,
    };
  } catch (err) {
    return {
      status: "failed",
      provider_message_id: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function enqueueAccountEmail(input: {
  recipient: string;
  template: HelixEmailTemplate;
  subject: string;
  text_body: string;
  html_body?: string | null;
}): Promise<HelixEmailOutboxRecord> {
  const provider = normalizedProvider();
  let delivery: { status: HelixEmailStatus; provider_message_id: string | null; error: string | null } = {
    status: "queued",
    provider_message_id: null,
    error: null,
  };
  if (provider === "local") {
    delivery = { status: "queued", provider_message_id: null, error: null };
  } else if (provider === "resend") {
    delivery = await sendViaResend(input);
  }
  await ensureDatabase();
  const { rows } = await getPool().query<HelixEmailOutboxRecord>(
    `
      INSERT INTO helix_email_outbox (
        email_id, recipient, template, subject, text_body, html_body, provider,
        status, provider_message_id, error, created_at, updated_at, sent_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now(), CASE WHEN $8 = 'sent' THEN now() ELSE NULL END)
      RETURNING *;
    `,
    [
      `email:${crypto.randomUUID()}`,
      input.recipient,
      input.template,
      input.subject,
      input.text_body,
      input.html_body ?? null,
      provider,
      delivery.status,
      delivery.provider_message_id,
      delivery.error,
    ],
  );
  return rows[0];
}

export async function listEmailOutboxRecords(input: {
  recipient?: string | null;
  template?: HelixEmailTemplate | null;
  limit?: number;
} = {}): Promise<HelixEmailOutboxRecord[]> {
  await ensureDatabase();
  const recipient = normalize(input.recipient).toLowerCase();
  const template = normalize(input.template);
  const limit = Math.min(Math.max(Math.round(input.limit ?? 50), 1), 200);
  const params: unknown[] = [];
  const filters: string[] = [];
  if (recipient) {
    params.push(recipient);
    filters.push(`lower(recipient) = $${params.length}`);
  }
  if (template) {
    params.push(template);
    filters.push(`template = $${params.length}`);
  }
  params.push(limit);
  const { rows } = await getPool().query<HelixEmailOutboxRecord>(
    `
      SELECT *
      FROM helix_email_outbox
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY created_at DESC
      LIMIT $${params.length};
    `,
    params,
  );
  return rows;
}

export async function resetEmailOutbox(): Promise<void> {
  await ensureDatabase();
  await getPool().query(`DELETE FROM helix_email_outbox`);
}
