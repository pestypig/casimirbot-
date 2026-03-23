const http = require("http");
const question = [
  "# Mini Contract",
  "",
  "## Hard Constraints",
  "1. Preserve this boundary statement verbatim:",
  '"Boundary text."',
  "",
  "## Required Repo Inputs",
  "- docs/does-not-exist.md",
  "",
  "## Fail-Closed Behavior",
  "If any required repo input is missing or unreadable:",
  "- return blocked=true",
  "- list the missing paths",
  "- set stop_reason=Fail-closed",
  "- do not complete the manuscript"
].join("\n");
const payload = JSON.stringify({ question, debug: true, mode: "read" });
const req = http.request({ hostname: "localhost", port: 5064, path: "/api/agi/ask", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => {
  let body = "";
  res.setEncoding("utf8");
  res.on("data", (c) => body += c);
  res.on("end", () => {
    const j = JSON.parse(body);
    const d = j.debugContext || j.debug || {};
    console.log(JSON.stringify({
      text: String(j.answer || j.text || "").slice(0, 700),
      mode: d.prompt_contract_mode ?? null,
      missing: d.prompt_contract_missing_inputs ?? null,
      blocked: d.answer_blocked ?? null,
      stop: d.answer_stop_reason ?? null,
      llm: d.llm_invoke_attempted ?? null,
      path: d.answer_path ?? null
    }, null, 2));
  });
});
req.on("error", (e) => { console.error(String(e)); process.exit(1); });
req.write(payload);
req.end();
