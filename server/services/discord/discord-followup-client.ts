export type DiscordFollowupPayload = {
  content: string;
  flags?: number;
};

export type DiscordFollowupRecord = {
  application_id: string;
  token: string;
  payload: DiscordFollowupPayload;
  ok: boolean;
  status: number | null;
  response: unknown;
  created_at: string;
};

const followupRecords: DiscordFollowupRecord[] = [];

export function listDiscordFollowupRecords(): DiscordFollowupRecord[] {
  return [...followupRecords];
}

export function resetDiscordFollowupRecords(): void {
  followupRecords.splice(0, followupRecords.length);
}

export async function sendDiscordInteractionFollowup(input: {
  applicationId: string;
  interactionToken: string;
  payload: DiscordFollowupPayload;
  botToken?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<DiscordFollowupRecord> {
  const createdAt = new Date().toISOString();
  const botToken = input.botToken?.trim() || process.env.DISCORD_BOT_TOKEN?.trim() || "";
  if (!botToken) {
    const record: DiscordFollowupRecord = {
      application_id: input.applicationId,
      token: input.interactionToken,
      payload: input.payload,
      ok: true,
      status: null,
      response: { skipped_network: true, reason: "missing_discord_bot_token" },
      created_at: createdAt,
    };
    followupRecords.push(record);
    return record;
  }
  const fetcher = input.fetchImpl ?? fetch;
  const response = await fetcher(
    `https://discord.com/api/v10/webhooks/${encodeURIComponent(input.applicationId)}/${encodeURIComponent(input.interactionToken)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input.payload),
    },
  );
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  const record: DiscordFollowupRecord = {
    application_id: input.applicationId,
    token: input.interactionToken,
    payload: input.payload,
    ok: response.ok,
    status: response.status,
    response: parsed,
    created_at: createdAt,
  };
  followupRecords.push(record);
  return record;
}
