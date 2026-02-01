from pathlib import Path
import re

path = Path('server/routes/agi.plan.ts')
text = path.read_text(encoding='utf-8')
start = text.find('planRouter.post("/ask"')
end = text.find('planRouter.post("/plan"', start)
if start == -1 or end == -1:
    raise SystemExit('ask or plan route not found')

ask_block = text[start:end]
body_start = ask_block.find('{', ask_block.find('=>')) + 1
body_end = ask_block.rfind('});')
if body_start <= 0 or body_end <= 0:
    raise SystemExit('failed to locate ask body')
ask_body = ask_block[body_start:body_end]
core_start = ask_body.find('  const askSessionId =')
if core_start == -1:
    raise SystemExit('failed to locate askSessionId')
ask_body_core = ask_body[core_start:]

ask_body_core = re.sub(r"\n  const keepAlive = createHelixAskJsonKeepAlive\(res,\s*\{[^}]*?\}\);", "", ask_body_core, flags=re.S)
ask_body_core = ask_body_core.replace(
    "const streamEmitter = createHelixAskStreamEmitter({ sessionId: askSessionId, traceId: askTraceId });",
    "const streamEmitter = createHelixAskStreamEmitter({ sessionId: askSessionId, traceId: askTraceId, onChunk: streamChunk });",
)
ask_body_core = ask_body_core.replace('keepAlive.send', 'responder.send')
ask_body_core = re.sub(r"\n\s*\}\s*$", "", ask_body_core)
ask_body_core = ask_body_core.rstrip() + "\n"

helper = '''
type HelixAskResponder = {
  send: (status: number, payload: unknown) => void;
};

type HelixAskExecutionArgs = {
  request: z.infer<typeof LocalAskRequest>;
  personaId: string;
  responder: HelixAskResponder;
  streamChunk?: (chunk: string) => void;
};

const executeHelixAsk = async ({
  request,
  personaId,
  responder,
  streamChunk,
}: HelixAskExecutionArgs): Promise<void> => {
  const parsed = { data: request };
__ASK_BODY_CORE__
};

'''
helper = helper.replace('__ASK_BODY_CORE__', ask_body_core)

ask_route = '''planRouter.post("/ask", async (req, res) => {
  const parsed = LocalAskRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  let personaId = parsed.data.personaId ?? "default";
  if (personaPolicy.shouldRestrictRequest(req.auth) && (!personaId || personaId === "default") && req.auth?.sub) {
    personaId = req.auth.sub;
  }
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const keepAlive = createHelixAskJsonKeepAlive(res, {
    enabled: HELIX_ASK_HTTP_KEEPALIVE && parsed.data.dryRun !== true,
    intervalMs: HELIX_ASK_HTTP_KEEPALIVE_MS,
  });
  await executeHelixAsk({
    request: parsed.data,
    personaId,
    responder: { send: keepAlive.send },
  });
});

'''

job_routes = '''const describeHelixAskJobError = (payload: unknown, status: number): string => {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: string }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
    const error = (payload as { error?: string }).error;
    if (typeof error === "string" && error.trim()) {
      return error.trim();
    }
  }
  return `helix_ask_failed_${status}`;
};

const buildHelixAskJobResponse = (job: HelixAskJobRecord) => ({
  jobId: job.id,
  status: job.status,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  expiresAt: job.expiresAt,
  sessionId: job.sessionId ?? null,
  traceId: job.traceId ?? null,
  partialText: job.partialText ?? null,
  error: job.error ?? null,
  result: job.result ?? null,
});

const runHelixAskJob = async (
  jobId: string,
  request: z.infer<typeof LocalAskRequest>,
  personaId: string,
): Promise<void> => {
  if (!markHelixAskJobRunning(jobId)) return;
  let settled = false;
  const responder: HelixAskResponder = {
    send: (status, payload) => {
      if (settled) return;
      settled = true;
      if (status >= 400) {
        const message = describeHelixAskJobError(payload, status);
        failHelixAskJob(jobId, message);
        return;
      }
      completeHelixAskJob(jobId, payload as Record<string, unknown>);
    },
  };
  try {
    await executeHelixAsk({
      request,
      personaId,
      responder,
      streamChunk: (chunk) => appendHelixAskJobPartial(jobId, chunk),
    });
    if (!settled) {
      failHelixAskJob(jobId, "helix_ask_no_response");
    }
  } catch (error) {
    if (settled) return;
    const message = error instanceof Error ? error.message : String(error);
    failHelixAskJob(jobId, message || "helix_ask_failed");
  }
};

planRouter.post("/ask/jobs", async (req, res) => {
  const parsed = LocalAskRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  let personaId = parsed.data.personaId ?? "default";
  if (personaPolicy.shouldRestrictRequest(req.auth) && (!personaId || personaId === "default") && req.auth?.sub) {
    personaId = req.auth.sub;
  }
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const askTraceId = (parsed.data.traceId?.trim() || `ask:${crypto.randomUUID()}`).slice(0, 128);
  const request = { ...parsed.data, traceId: askTraceId };
  const question = (request.question ?? request.prompt ?? "").trim();
  const job = createHelixAskJob({
    sessionId: request.sessionId,
    traceId: askTraceId,
    question: question ? question.slice(0, 480) : undefined,
  });
  res.status(202).json({
    jobId: job.id,
    status: job.status,
    sessionId: request.sessionId ?? null,
    traceId: askTraceId,
  });
  void runHelixAskJob(job.id, request, personaId);
});

planRouter.get("/ask/jobs/:jobId", (req, res) => {
  const jobId = req.params.jobId?.trim();
  if (!jobId) {
    return res.status(400).json({ error: "bad_request", details: [{ message: "jobId required" }] });
  }
  const job = getHelixAskJob(jobId);
  if (!job) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json(buildHelixAskJobResponse(job));
});

'''

new_text = text[:start] + helper + ask_route + job_routes + text[end:]
path.write_text(new_text, encoding='utf-8')
