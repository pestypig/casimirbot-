import { Router } from "express";

export const discordLinkRouter = Router();

discordLinkRouter.get("/link-discord", (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code.trim() : "";
  res
    .status(code ? 200 : 400)
    .type("html")
    .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Link Discord to CasimirBot</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #020617; color: #e2e8f0; }
      main { max-width: 680px; margin: 10vh auto; padding: 24px; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; background: rgba(15,23,42,.75); }
      code { color: #67e8f9; }
      input, button { font: inherit; }
      input { width: 100%; box-sizing: border-box; margin-top: 8px; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,.16); background: #0f172a; color: white; }
      button { margin-top: 12px; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(103,232,249,.4); background: rgba(8,145,178,.25); color: #ecfeff; cursor: pointer; }
      p { color: #94a3b8; line-height: 1.5; }
    </style>
  </head>
  <body>
    <main>
      <h1>Link Discord Session</h1>
      <p>This dev page completes a Discord link code after you sign in. It never asks the Discord bot for a password.</p>
      <p>Code: <code>${code ? code.replace(/[<>&"]/g, "") : "missing"}</code></p>
      <label>
        Profile ID
        <input id="profile" value="DatDamPig" />
      </label>
      <button id="complete" ${code ? "" : "disabled"}>Complete link</button>
      <p id="result"></p>
    </main>
    <script>
      const code = ${JSON.stringify(code)};
      document.getElementById("complete").addEventListener("click", async () => {
        const profile_id = document.getElementById("profile").value.trim();
        const response = await fetch("/api/discord/session/complete-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, profile_id })
        });
        const body = await response.json();
        document.getElementById("result").textContent = body.message || JSON.stringify(body);
      });
    </script>
  </body>
</html>`);
});
