import fs from "node:fs/promises";
import path from "node:path";

const turnId = String(process.argv[2] ?? "").trim();
const outputDirectory = path.resolve(String(process.argv[3] ?? "").trim());
if (!turnId || !process.argv[3]) throw new Error("turn_id_and_output_directory_required");

const state = JSON.parse(
  await fs.readFile(".tmp-helix-minecraft-room-state.json", "utf8"),
);
const signIn = await fetch(`${state.base_url}/api/account/session/sign-in`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: state.base_url,
    "sec-fetch-site": "same-origin",
  },
  body: JSON.stringify({
    profile_id: state.profile_id,
    display_name: "Minecraft exact-turn debug audit",
    account_type: "developer",
  }),
});
if (!signIn.ok) throw new Error(`sign_in_http_${signIn.status}`);
const cookie = signIn.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("session_cookie_missing");

const response = await fetch(
  `${state.base_url}/api/agi/ask/turn/${encodeURIComponent(turnId)}/debug-export`,
  { headers: { cookie } },
);
if (!response.ok) throw new Error(`debug_export_http_${response.status}`);
const payload = await response.json();
const serialized = JSON.stringify(payload);
if (
  /helix_room_src_[A-Za-z0-9_-]+/u.test(serialized) ||
  /"bearer_token"\s*:\s*"(?!\[?REDACTED)/iu.test(serialized) ||
  /"claim_handle"\s*:/iu.test(serialized)
) {
  throw new Error("debug_export_secret_material_detected");
}

await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(
  path.join(outputDirectory, "debug-export.json"),
  `${JSON.stringify(payload, null, 2)}\n`,
);
process.stdout.write(`${JSON.stringify({
  fetched: true,
  turn_id: turnId,
  root_keys: Object.keys(payload),
  credential_material_reported: false,
})}\n`);
