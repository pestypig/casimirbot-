const STARTUP_SCREEN_CSS = `
      :root { color-scheme: dark; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background:
        linear-gradient(rgba(4, 9, 21, 0.76), rgba(4, 9, 21, 0.88)),
        url("/loading/helix-loading-mark.svg") center / cover no-repeat,
        radial-gradient(120% 180% at 10% 10%, rgba(56, 189, 248, 0.18) 0%, transparent 62%),
        radial-gradient(140% 200% at 90% 8%, rgba(30, 58, 138, 0.2) 0%, transparent 70%),
        #040915; color: #e2e8f0; font-family: "Segoe UI", system-ui, -apple-system, sans-serif; }
      .card { width: min(90vw, 520px); border-radius: 18px; border: 1px solid rgba(56, 189, 248, 0.28); background: rgba(15, 23, 42, 0.86); padding: 24px 24px 20px; text-align: center; box-shadow: 0 30px 90px rgba(56, 189, 248, 0.16); }
      .card--compact { width: min(90vw, 480px); padding: 20px 22px; }
      .icon-wrap { width: 62px; height: 62px; border-radius: 14px; margin: 0 auto 14px; display: grid; place-items: center; background: rgba(56, 189, 248, 0.14); box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.25); }
      .card--compact .icon-wrap { width: 58px; height: 58px; margin-bottom: 12px; }
      .icon { width: 28px; height: 28px; border: 2px solid rgba(148, 163, 184, 0.35); border-top-color: #f8fafc; border-radius: 999px; animation: spin 0.8s linear infinite; }
      .card--compact .icon { width: 26px; height: 26px; }
      h1 { margin: 0 0 8px; font-size: 18px; }
      p { margin: 0 0 10px; font-size: 14px; line-height: 1.5; color: #94a3b8; }
      .card--compact p { margin: 0; font-size: 13px; }
      a { color: #7dd3fc; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      .muted { color: #94a3b8; }
      #boot-error { display: none; font-size: 12px; color: #fca5a5; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderShell(args: {
  title: string;
  headExtra?: string;
  cardClass?: string;
  body: string;
  script?: string;
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
${args.headExtra ?? ""}
    <title>${escapeHtml(args.title)}</title>
    <style>${STARTUP_SCREEN_CSS}
    </style>
  </head>
  <body>
    <div class="card${args.cardClass ? ` ${args.cardClass}` : ""}" role="status" aria-live="polite">
      <div class="icon-wrap">
        <div class="icon" aria-hidden="true"></div>
      </div>
${args.body}
    </div>
${args.script ?? ""}
  </body>
</html>`;
}

export function renderRootRedirectHtml(target: string) {
  const safeTarget = escapeHtml(target);
  return renderShell({
    title: "CasimirBot",
    headExtra: `    <meta http-equiv="refresh" content="0; url=${safeTarget}">
`,
    cardClass: "card--compact",
    body: `      <h1>Opening workspace...</h1>
      <p>Redirecting to <a href="${safeTarget}">${safeTarget}</a>.</p>`,
    script: `    <script>
      window.location.replace(${JSON.stringify(target)});
    </script>`,
  });
}

export function renderStartupRetryHtml(target: string) {
  const safeTarget = escapeHtml(target);
  return renderShell({
    title: "Starting up...",
    headExtra: `    <meta http-equiv="refresh" content="8">
    <meta name="robots" content="noindex,nofollow">
`,
    body: `      <h1>Starting up...</h1>
      <p>The server is still warming up. This page will auto-refresh when it is ready.</p>
      <p class="muted">Target: <code>${safeTarget}</code></p>
      <p class="muted" id="boot-error" style="display:none;"></p>
      <p class="muted">If this persists, check the deploy logs for runtime errors.</p>`,
    script: `    <script>
      (function retryWhenReady() {
        function reload() { window.location.replace(${JSON.stringify(target)}); }
        function poll() {
          fetch("/api/ready", { cache: "no-store" })
            .then(function (res) { return res.json ? res.json() : null; })
            .then(function (payload) {
              if (payload && payload.ready) {
                reload();
                return;
              }
              var err = payload && (payload.bootstrapError || payload.artifactsError);
              if (err) {
                var el = document.getElementById("boot-error");
                if (el) {
                  el.textContent = "Last error: " + err;
                  el.style.display = "block";
                }
              }
              setTimeout(poll, 2000);
            })
            .catch(function () { setTimeout(poll, 2000); });
        }
        poll();
      })();
    </script>`,
  });
}

export function renderRootBootHtml(target: string) {
  const safeTarget = escapeHtml(target);
  return renderShell({
    title: "CasimirBot",
    headExtra: `    <meta http-equiv="refresh" content="5">
    <meta name="robots" content="noindex">
`,
    body: `      <h1>Starting up...</h1>
      <p>Redirecting to <a href="${safeTarget}">${safeTarget}</a> once ready.</p>
      <p id="boot-error"></p>`,
    script: `    <script>
      (function() {
        var target = ${JSON.stringify(target)};
        var retryMs = 500;
        function schedule() {
          setTimeout(check, retryMs);
        }
        function check() {
          fetch("/api/ready", { cache: "no-store" })
            .then(function(res) {
              return res.ok ? res.json() : null;
            })
            .then(function(payload) {
              if (payload && payload.ready) {
                window.location.replace(target);
                return;
              }
              var err = payload && (payload.bootstrapError || payload.artifactsError);
              if (err) {
                var el = document.getElementById("boot-error");
                if (el) {
                  el.textContent = "Last error: " + err;
                  el.style.display = "block";
                }
              }
              schedule();
            })
            .catch(schedule);
        }
        check();
      })();
    </script>`,
  });
}
