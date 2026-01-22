import { Router } from "express";
import {
  getRepoSearchItem,
  searchRepoIndex,
  type RepoSearchKind,
} from "../services/search/repo-index";

export const searchRouter = Router();

const readQuery = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return value.length ? String(value[0]) : undefined;
  }
  return typeof value === "string" ? value : undefined;
};

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const parseKinds = (value: unknown): RepoSearchKind[] => {
  const raw = parseList(value);
  const allowed = new Set<RepoSearchKind>([
    "artifact",
    "ideology-node",
    "doc",
    "code",
  ]);
  return raw.filter((entry): entry is RepoSearchKind => allowed.has(entry as RepoSearchKind));
};

const parseNumber = (value: unknown): number | undefined => {
  const raw = readQuery(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

searchRouter.get("/", async (req, res) => {
  const query = readQuery(req.query.q ?? req.query.query) ?? "";
  const kinds = parseKinds(req.query.kinds ?? req.query.kind);
  const tags = parseList(req.query.tags ?? req.query.tag);
  const limit = parseNumber(req.query.limit);
  const offset = parseNumber(req.query.offset);

  try {
    const result = await searchRepoIndex({
      query,
      kinds: kinds.length ? kinds : undefined,
      tags: tags.length ? tags : undefined,
      limit,
      offset,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "search_failed", message });
  }
});

searchRouter.get("/:id(*)", async (req, res) => {
  try {
    const item = await getRepoSearchItem(req.params.id);
    if (!item) {
      res.status(404).json({ error: "search_item_not_found", id: req.params.id });
      return;
    }
    res.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "search_item_failed", message });
  }
});
