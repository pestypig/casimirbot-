import { Router } from "express";
import { z } from "zod";
import { MemoryRecord } from "@shared/essence-persona";
import { putMemoryRecord, searchMemories } from "../services/essence/memory-store";
import { personaPolicy } from "../auth/policy";

export const memoryRouter = Router();
const ENABLE_DEBATE_SEARCH = process.env.ENABLE_DEBATE_SEARCH === "1";

const SearchQuery = z.object({
  q: z.string().min(1, "query required"),
  k: z.coerce.number().int().positive().max(50).default(6),
});

memoryRouter.post("/put", async (req, res) => {
  const parsed = MemoryRecord.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error);
  }
  if (!personaPolicy.canAccess(req.auth, parsed.data.owner_id, "memory:write")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const record = await putMemoryRecord(parsed.data);
  res.json({ record });
});

memoryRouter.get("/search", async (req, res) => {
  const parsed = SearchQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_query", details: parsed.error.issues });
  }
  const { q, k } = parsed.data;
  const debateOnly = ENABLE_DEBATE_SEARCH && String(req.query.debateOnly ?? "0") === "1";
  let items = await searchMemories(q, k, { debateOnly });
  if (personaPolicy.shouldRestrictRequest(req.auth)) {
    if (!req.auth) {
      return res.status(403).json({ error: "forbidden" });
    }
    const allowed = personaPolicy.allowedPersonas(req.auth, "memory:read");
    if (allowed.size === 0) {
      return res.status(403).json({ error: "forbidden" });
    }
    items = items.filter((item) => allowed.has(item.owner_id));
  }
  res.json({ items, query: q, top_k: k, debateOnly: debateOnly && ENABLE_DEBATE_SEARCH });
});
