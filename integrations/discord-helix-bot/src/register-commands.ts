import { registerHelixDiscordCommands } from "../../../server/services/discord/discord-command-registry";

async function main() {
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
  const applicationId = process.env.DISCORD_APPLICATION_ID?.trim() || process.env.DISCORD_CLIENT_ID?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  if (!botToken) throw new Error("DISCORD_BOT_TOKEN is required.");
  if (!applicationId) throw new Error("DISCORD_APPLICATION_ID is required.");
  const result = await registerHelixDiscordCommands({
    botToken,
    applicationId,
    guildId: guildId || null,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
