import fs from "node:fs/promises";

const payload = JSON.parse(await fs.readFile(process.argv[2], "utf8"));
const rows = [];
const seen = new Set();
const walk = (value, path = "$") => {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (
    !Array.isArray(value) &&
    value.capability_id === "com.casimirbot.minecraft.player.camera.track"
  ) {
    const args = value.arguments ?? value.args ?? value.input ??
      value.request_arguments ?? value.request_payload?.arguments ?? null;
    const row = {
      path,
      keys: Object.keys(value),
      arguments: args,
      outcome: value.outcome ?? value.status ?? null,
      failure_code: value.failure_code ?? value.error ?? null,
    };
    const identity = JSON.stringify(row);
    if (!rows.some((candidate) => JSON.stringify(candidate) === identity)) {
      rows.push(row);
    }
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, `${path}[${index}]`));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    walk(entry, `${path}.${key}`);
  }
};
walk(payload);
process.stdout.write(`${JSON.stringify({ count: rows.length, rows })}\n`);
