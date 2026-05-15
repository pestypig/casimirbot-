import type { HelixDiscordSlashCommandDefinition } from "@shared/helix-discord-interaction";

const stringOption = (name: string, description: string, required = true): Record<string, unknown> => ({
  type: 3,
  name,
  description,
  required,
});

export function buildHelixDiscordCommandDefinition(): HelixDiscordSlashCommandDefinition {
  return {
    name: "helix",
    description: "Control CasimirBot Helix sessions and ask Helix from Discord.",
    type: 1,
    options: [
      { type: 1, name: "start", description: "Start a Helix Discord session for this channel." },
      { type: 1, name: "link", description: "Create a one-time web link to connect your Casimir profile." },
      { type: 1, name: "status", description: "Show the current Helix Discord session status." },
      {
        type: 1,
        name: "attach-minecraft",
        description: "Attach the linked Minecraft source to this Discord session.",
        options: [
          stringOption("source", "Optional explicit Minecraft source id.", false),
          stringOption("world", "Optional Minecraft world id.", false),
        ],
      },
      {
        type: 1,
        name: "companion-mode",
        description: "Set the Discord companion policy.",
        options: [
          {
            type: 3,
            name: "mode",
            description: "Companion mode.",
            required: true,
            choices: [
              { name: "direct_address_only", value: "direct_address_only" },
              { name: "active_companion", value: "active_companion" },
              { name: "critical_voice", value: "critical_voice" },
              { name: "debug_trace", value: "debug_trace" },
            ],
          },
        ],
      },
      {
        type: 1,
        name: "ask",
        description: "Ask Helix through the server-authoritative Ask runtime.",
        options: [stringOption("prompt", "Prompt for Helix Ask.", true)],
      },
      {
        type: 2,
        name: "visual",
        description: "Control permission-bound Helix visual sources.",
        options: [
          { type: 1, name: "start", description: "Request visual source start." },
          { type: 1, name: "capture-now", description: "Request a visual capture now." },
          { type: 1, name: "stop", description: "Stop the visual source." },
        ],
      },
    ],
  };
}

export async function registerHelixDiscordCommands(input: {
  botToken: string;
  applicationId: string;
  guildId?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: boolean; status: number; response: unknown; url: string }> {
  const fetcher = input.fetchImpl ?? fetch;
  const base = `https://discord.com/api/v10/applications/${encodeURIComponent(input.applicationId)}`;
  const url = input.guildId
    ? `${base}/guilds/${encodeURIComponent(input.guildId)}/commands`
    : `${base}/commands`;
  const response = await fetcher(url, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${input.botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([buildHelixDiscordCommandDefinition()]),
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { ok: response.ok, status: response.status, response: parsed, url };
}
