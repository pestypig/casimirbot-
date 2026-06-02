import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Link2, PanelLeftClose, PanelLeftOpen, Search, Waypoints } from "lucide-react";
import type {
  StagePlayBadgeEdgeV1,
  StagePlayBadgeGraphRecommendedActionV1,
  StagePlayBadgeGraphV1,
  StagePlayBadgeV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import type {
  StagePlayBuilderCatalogV1,
  StagePlayGraphDraftValidationV1,
  StagePlaySourceHandleV1,
  StagePlaySourceQueryV1,
} from "@shared/contracts/stage-play-builder.v1";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStagePlayBadgeGraphPanelStore } from "@/store/useStagePlayBadgeGraphPanelStore";
import {
  selectActiveLiveAnswerEnvironment,
  useLiveAnswerEnvironmentStore,
} from "@/store/useLiveAnswerEnvironmentStore";

const STAGE_PLAY_PANEL_THREAD_ID = "helix-ask:desktop";

type StagePlayNodeBuilderType = {
  kind: StagePlayBadgeV1["kind"];
  label: string;
  role: string;
};

type DraftStagePlayNodeParameter = {
  id: string;
  key: string;
  value: string;
};

type DraftStagePlayNode = StagePlayNodeBuilderType & {
  id: string;
  x: number;
  y: number;
  parameters: DraftStagePlayNodeParameter[];
};

type HeldStagePlayNode = StagePlayNodeBuilderType & {
  clientX: number;
  clientY: number;
};

type StagePlaySourceOption = {
  id: string;
  sourceId: string;
  label: string;
  sourceClass: string;
  status: string;
  descriptorId?: string | null;
  producerId?: string | null;
  surface?: string | null;
  origin?: string | null;
  cadenceMs?: number | null;
  latestRef?: string | null;
  latestEvidenceRefs: string[];
};

type StagePlayBuilderContextResponse = {
  artifactId: "stage_play_builder_context";
  schemaVersion: "stage_play_builder_context/v1";
  generatedAt: string;
  catalog: StagePlayBuilderCatalogV1;
  sourceQuery: StagePlaySourceQueryV1;
  authority: StagePlayBuilderCatalogV1["authority"];
};

async function fetchStagePlayBadgeGraph(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
}): Promise<StagePlayBadgeGraphV1> {
  const params = new URLSearchParams();
  params.set("threadId", input.threadId);
  if (input.roomId) params.set("roomId", input.roomId);
  if (input.environmentId) params.set("environmentId", input.environmentId);
  const response = await fetch(`/api/helix/stage-play/graph?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Stage Play graph request failed: ${response.status}`);
  }
  return await response.json() as StagePlayBadgeGraphV1;
}

async function fetchStagePlayBuilderContext(input: {
  threadId: string;
  environmentId?: string | null;
}): Promise<StagePlayBuilderContextResponse> {
  const params = new URLSearchParams();
  params.set("threadId", input.threadId);
  if (input.environmentId) params.set("environmentId", input.environmentId);
  const response = await fetch(`/api/helix/stage-play/builder?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Stage Play builder request failed: ${response.status}`);
  }
  return await response.json() as StagePlayBuilderContextResponse;
}

async function validateStagePlayDraft(input: {
  threadId: string;
  environmentId?: string | null;
  draft: unknown;
}): Promise<StagePlayGraphDraftValidationV1> {
  const response = await fetch("/api/helix/stage-play/draft/validate", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadId: input.threadId,
      environmentId: input.environmentId ?? null,
      draft: input.draft,
    }),
  });
  if (!response.ok && response.status !== 422) {
    throw new Error(`Stage Play draft validation failed: ${response.status}`);
  }
  return await response.json() as StagePlayGraphDraftValidationV1;
}

function sourceOptionFromHandle(handle: StagePlaySourceHandleV1): StagePlaySourceOption {
  const latestObservationRef = [...handle.latestEvidenceRefs].reverse().find((ref) => /observation/i.test(ref));
  return {
    id: handle.descriptorId ?? handle.producerId ?? handle.sourceId,
    sourceId: handle.sourceId,
    label: handle.label ?? (handle.surface ? `${labelize(handle.sourceClass)} on ${labelize(handle.surface)}` : handle.sourceId),
    sourceClass: handle.sourceClass,
    status: handle.status,
    descriptorId: handle.descriptorId ?? null,
    producerId: handle.producerId ?? null,
    surface: handle.surface ?? null,
    origin: handle.origin ?? null,
    cadenceMs: handle.cadenceMs ?? null,
    latestRef: latestObservationRef ?? handle.latestEvidenceRefs.at(-1) ?? null,
    latestEvidenceRefs: handle.latestEvidenceRefs,
  };
}

function labelize(value: string): string {
  return value.replace(/[._-]/g, " ");
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a: string, b: string) => a.localeCompare(b));
}

function readClientCoordinate(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function statusTone(status: string): string {
  if (status === "blocked") return "border-rose-700 bg-rose-950/40 text-rose-100";
  if (status === "missing_evidence") return "border-amber-700 bg-amber-950/40 text-amber-100";
  if (status === "candidate" || status === "ask_user_required") return "border-cyan-700 bg-cyan-950/40 text-cyan-100";
  if (status === "available" || status === "observed") return "border-emerald-700 bg-emerald-950/35 text-emerald-100";
  return "border-slate-700 bg-slate-950/70 text-slate-200";
}

function kindTone(kind: string): string {
  if (kind === "source") return "border-sky-800/70 bg-sky-950/25";
  if (kind === "interpreter") return "border-fuchsia-800/70 bg-fuchsia-950/25";
  if (kind === "hazard" || kind === "blocked_affordance") return "border-rose-800/70 bg-rose-950/25";
  if (kind === "procedural_binding" || kind === "intent_module") return "border-violet-800/70 bg-violet-950/25";
  if (kind === "affordance" || kind === "resource") return "border-emerald-800/70 bg-emerald-950/25";
  if (kind === "setting" || kind === "actor") return "border-cyan-800/70 bg-cyan-950/25";
  return "border-slate-800 bg-slate-950/70";
}

function proceduralExpression(badge: StagePlayBadgeV1): string {
  if (badge.intentModule) {
    return [
      badge.intentModule.verb,
      ...(badge.intentModule.requires ?? []),
      ...(badge.intentModule.preserves ?? []),
      ...(badge.intentModule.blocks ?? []),
    ].filter(Boolean).join(" + ");
  }
  return badge.reasonCodes.join(" + ");
}

function badgeActionLine(badge: StagePlayBadgeV1): string {
  if (badge.kind === "procedural_binding") return `Assembles: ${proceduralExpression(badge)}`;
  if (badge.kind === "intent_module") return `Verb: ${proceduralExpression(badge)}`;
  if (badge.kind === "affordance") return "Available move candidate";
  if (badge.kind === "blocked_affordance") return "Blocked move boundary";
  if (badge.kind === "hazard") return "Constrains possible moves";
  if (badge.kind === "resource" || badge.kind === "prop") return "Can support or block a procedure";
  return "Observed stage condition";
}

const STAGE_PLAY_NODE_BUILDER_TYPES: StagePlayNodeBuilderType[] = [
  { kind: "source", label: "Source Class", role: "live feed handle to wire in" },
  { kind: "interpreter", label: "Interpreter Job", role: "continual reflection over source refs" },
  { kind: "setting", label: "Setting", role: "where the scene is bounded" },
  { kind: "actor", label: "Actor", role: "who can act or be acted on" },
  { kind: "prop", label: "Prop", role: "nearby object or world feature" },
  { kind: "resource", label: "Resource", role: "usable inventory or material" },
  { kind: "hazard", label: "Hazard", role: "danger that constrains movement" },
  { kind: "constraint", label: "Constraint", role: "rule limiting possible moves" },
  { kind: "goal", label: "Goal", role: "desired state or objective" },
  { kind: "world_state", label: "World State", role: "current observed condition" },
  { kind: "affordance", label: "Affordance", role: "move currently available" },
  { kind: "blocked_affordance", label: "Blocked Move", role: "move ruled out by evidence" },
  { kind: "intent_module", label: "Intent Module", role: "verb building block" },
  { kind: "procedural_binding", label: "Procedure", role: "combined action pattern" },
  { kind: "recommended_check", label: "Check", role: "missing validation step" },
  { kind: "admission_gate", label: "Gate", role: "permission boundary" },
  { kind: "missing_evidence", label: "Missing Evidence", role: "unknown fact to resolve" },
];

const STAGE_PLAY_SOURCE_CLASSES = [
  "world_event",
  "environment_state",
  "environment_affordance",
  "visual_frame",
  "audio_transcript",
  "text_chat",
  "screen_summary",
  "minecraft_world_events",
  "calculator_stream",
  "simulation_stream",
  "document_context",
  "note_context",
  "procedure_graph",
  "process_graph",
] as const;

function defaultDraftParametersForNode(node: StagePlayNodeBuilderType): DraftStagePlayNodeParameter[] {
  const presets: Record<StagePlayBadgeV1["kind"], [string, string][]> = {
    source: [["source_class", ""], ["source_id", ""], ["status", ""], ["descriptor_ref", ""], ["producer_ref", ""], ["latest_ref", ""]],
    interpreter: [["tool", "live_env.reflect_stage_play_context"], ["cadence", ""], ["input_sources", ""], ["output", "stage_play_badge_graph"]],
    setting: [["dimension", ""], ["biome_or_area", ""], ["bounds", ""]],
    actor: [["entity_id", ""], ["state", ""], ["relation", ""]],
    prop: [["object_or_block", ""], ["position", ""], ["state", ""]],
    resource: [["item_or_material", ""], ["count", ""], ["availability", ""]],
    hazard: [["hazard_type", ""], ["severity", ""], ["radius_or_position", ""]],
    constraint: [["rule", ""], ["applies_to", ""], ["reason", ""]],
    goal: [["target_state", ""], ["priority", ""], ["success_check", ""]],
    world_state: [["observation", ""], ["freshness", ""], ["source_ref", ""]],
    affordance: [["action", ""], ["precondition", ""], ["possible_effect", ""]],
    blocked_affordance: [["blocked_action", ""], ["blocked_by", ""], ["missing_check", ""]],
    intent_module: [["verb", ""], ["target", ""], ["preserves", ""]],
    procedural_binding: [["expression", ""], ["requires", ""], ["possible_result", ""]],
    recommended_check: [["check", ""], ["evidence_needed", ""], ["status", ""]],
    admission_gate: [["gate", ""], ["admission", ""], ["authority", "evidence_only"]],
    missing_evidence: [["question", ""], ["needed_ref", ""], ["status", "missing"]],
  };

  return presets[node.kind].map(([key, value], index) => ({
    id: `${node.kind}:param:${index + 1}`,
    key,
    value,
  }));
}

function readDraftParameter(node: DraftStagePlayNode, key: string): string {
  return node.parameters.find((parameter) => parameter.key === key)?.value ?? "";
}

function setDraftParameterValue(node: DraftStagePlayNode, key: string, value: string): DraftStagePlayNode {
  const index = node.parameters.findIndex((parameter) => parameter.key === key);
  if (index >= 0) {
    return {
      ...node,
      parameters: node.parameters.map((parameter, parameterIndex) =>
        parameterIndex === index ? { ...parameter, value } : parameter,
      ),
    };
  }
  return {
    ...node,
    parameters: [
      ...node.parameters,
      {
        id: `${node.id}:param:${key}`,
        key,
        value,
      },
    ],
  };
}

function draftParameterRecord(node: DraftStagePlayNode): Record<string, string> {
  return Object.fromEntries(
    node.parameters
      .map((parameter) => [parameter.key.trim(), parameter.value.trim()] as const)
      .filter(([key]) => key.length > 0),
  );
}

function splitEvidenceRefs(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function draftNodeEvidenceRefs(node: DraftStagePlayNode): string[] {
  const parameters = draftParameterRecord(node);
  return uniqueSorted([
    ...splitEvidenceRefs(parameters.descriptor_ref),
    ...splitEvidenceRefs(parameters.producer_ref),
    ...splitEvidenceRefs(parameters.latest_ref),
    ...splitEvidenceRefs(parameters.source_ref),
    ...splitEvidenceRefs(parameters.evidence_ref),
  ]);
}

function buildDraftEdges(nodes: DraftStagePlayNode[]) {
  const edges: { from: string; to: string; relation: string; label: string }[] = [];
  let edgeCount = 0;
  const sourceNodes = nodes.filter((node) => node.kind === "source");
  const interpreterNodes = nodes.filter((node) => node.kind === "interpreter");
  const intentNodes = nodes.filter((node) => node.kind === "intent_module");
  const procedureNodes = nodes.filter((node) => node.kind === "procedural_binding");
  const affordanceNodes = nodes.filter((node) => node.kind === "affordance" || node.kind === "blocked_affordance");
  const constraintNodes = nodes.filter((node) => node.kind === "hazard" || node.kind === "constraint" || node.kind === "missing_evidence");
  const addEdge = (from: DraftStagePlayNode, to: DraftStagePlayNode, relation: string, label: string) => {
    edgeCount += 1;
    edges.push({
      from: from.id,
      to: to.id,
      relation,
      label: `${edgeCount}. ${label}`,
    });
  };

  for (const source of sourceNodes) {
    for (const interpreter of interpreterNodes) addEdge(source, interpreter, "feeds", "source feeds interpreter");
  }
  for (const interpreter of interpreterNodes) {
    for (const node of nodes.filter((entry) => entry.kind !== "source" && entry.kind !== "interpreter")) {
      addEdge(interpreter, node, "interprets", "interpreter produces stage fact");
    }
  }
  for (const intent of intentNodes) {
    for (const procedure of procedureNodes) addEdge(intent, procedure, "composes_with", "intent composes procedure");
  }
  for (const constraint of constraintNodes) {
    for (const affordance of affordanceNodes) addEdge(constraint, affordance, "constrains", "constraint bounds affordance");
  }
  return edges;
}

function buildStagePlayDraftFromNodes(input: {
  draftNodes: DraftStagePlayNode[];
  objective?: string | null;
}) {
  const cadenceCandidate = input.draftNodes
    .flatMap((node) => [
      readDraftParameter(node, "cadence_ms"),
      readDraftParameter(node, "cadence"),
    ])
    .map((value) => Number.parseInt(value, 10))
    .find((value) => Number.isFinite(value) && value > 0);
  return {
    artifactId: "stage_play_graph_draft",
    schemaVersion: "stage_play_graph_draft/v1",
    draftId: "stage_play_panel_draft",
    objective: input.objective ?? "Assemble a Stage Play evidence graph from admitted source handles.",
    nodes: input.draftNodes.map((node) => {
      const parameters = draftParameterRecord(node);
      return {
        id: node.id,
        kind: node.kind,
        title: node.label,
        bind: node.kind === "source"
          ? {
              sourceClass: parameters.source_class || null,
              sourceId: parameters.source_id || null,
            }
          : null,
        parameters,
        evidenceRefs: draftNodeEvidenceRefs(node),
      };
    }),
    edges: buildDraftEdges(input.draftNodes),
    checkpointPolicy: {
      cadenceMs: cadenceCandidate ?? null,
      completeEachWindow: true,
      standingJobRemainsOpen: true,
    },
  };
}

function BadgeButton({
  badge,
  selected,
  onSelect,
}: {
  badge: StagePlayBadgeV1;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition ${
        selected
          ? "border-cyan-500 bg-cyan-950/45 text-cyan-50"
          : `${kindTone(badge.kind)} text-slate-100 hover:border-slate-600`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{badge.title}</div>
          <div className="mt-1 line-clamp-2 text-xs text-slate-400">{badge.plainMeaning}</div>
        </div>
        {badge.kind === "blocked_affordance" || badge.status === "blocked" ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-label="Blocked move" />
        ) : badge.kind === "procedural_binding" ? (
          <Waypoints className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-label="Procedural binding" />
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
          {labelize(badge.kind)}
        </Badge>
        <Badge variant="outline" className={`text-[10px] ${statusTone(badge.status)}`}>
          {labelize(badge.status)}
        </Badge>
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-400">
          {badge.confidence.toFixed(2)}
        </Badge>
      </div>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-2 text-sm text-slate-200">{children}</div>
    </section>
  );
}

function StagePlayGraphCanvas({
  graph,
  selectedBadgeIds,
  selectedBadgeId,
  draftNodes,
  selectedDraftNodeId,
  scrollportRef,
  onSelect,
  onSelectDraftNode,
}: {
  graph: StagePlayBadgeGraphV1;
  selectedBadgeIds: string[];
  selectedBadgeId: string | null;
  draftNodes: DraftStagePlayNode[];
  selectedDraftNodeId: string | null;
  scrollportRef: React.RefObject<HTMLDivElement>;
  onSelect: (badgeId: string) => void;
  onSelectDraftNode: (nodeId: string) => void;
}) {
  const columns = useMemo(() => {
    const order = [
      "source",
      "interpreter",
      "setting",
      "actor",
      "resource",
      "prop",
      "hazard",
      "affordance",
      "blocked_affordance",
      "intent_module",
      "procedural_binding",
      "recommended_check",
      "admission_gate",
      "missing_evidence",
    ];
    const grouped = new Map<string, StagePlayBadgeV1[]>();
    for (const kind of order) grouped.set(kind, []);
    for (const badge of graph.badges) {
      const group = grouped.get(badge.kind) ?? [];
      group.push(badge);
      grouped.set(badge.kind, group);
    }
    return Array.from(grouped.entries()).filter(([, badges]) => badges.length > 0);
  }, [graph.badges]);

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    columns.forEach(([, badges], columnIndex) => {
      badges.forEach((badge, rowIndex) => {
        map.set(badge.id, {
          x: 120 + columnIndex * 190,
          y: 86 + rowIndex * 92,
        });
      });
    });
    return map;
  }, [columns]);

  const width = Math.max(
    780,
    columns.length * 190 + 140,
    ...draftNodes.map((node) => node.x + 180),
  );
  const height = Math.max(
    420,
    Math.max(...columns.map(([, badges]) => badges.length), 1) * 92 + 120,
    ...draftNodes.map((node) => node.y + 140),
  );
  const selectedSet = new Set(selectedBadgeIds);
  const relatedEdgeIds = new Set(
    graph.edges
      .filter((edge: StagePlayBadgeEdgeV1) =>
        selectedBadgeId ? edge.from === selectedBadgeId || edge.to === selectedBadgeId : false,
      )
      .map((edge: StagePlayBadgeEdgeV1) => edge.id),
  );

  return (
    <div
      ref={scrollportRef}
      className="relative min-h-0 flex-1 overflow-auto rounded-md border border-slate-800 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.16)_1px,transparent_0)] [background-size:22px_22px]"
      data-testid="stage-play-badge-graph-scrollport"
    >
      <svg width={width} height={height} className="absolute left-0 top-0">
        <defs>
          <marker id="stage-play-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgb(100 116 139)" />
          </marker>
        </defs>
        {graph.edges.map((edge: StagePlayBadgeEdgeV1) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const active = relatedEdgeIds.has(edge.id) || selectedSet.has(edge.from) || selectedSet.has(edge.to);
          return (
            <g key={edge.id}>
              <line
                x1={from.x + 64}
                y1={from.y + 26}
                x2={to.x - 64}
                y2={to.y + 26}
                stroke={active ? "rgb(34 211 238)" : "rgb(51 65 85)"}
                strokeWidth={active ? 2 : 1}
                markerEnd="url(#stage-play-arrow)"
              />
            </g>
          );
        })}
      </svg>
      <div className="relative" style={{ width, height }}>
        {graph.badges.map((badge: StagePlayBadgeV1) => {
          const point = positions.get(badge.id);
          if (!point) return null;
          const active = selectedBadgeId === badge.id || selectedSet.has(badge.id);
          return (
            <div
              key={badge.id}
              className="group absolute"
              style={{ left: point.x - 64, top: point.y }}
            >
              <button
                type="button"
                onClick={() => onSelect(badge.id)}
                className={`flex h-14 w-32 flex-col items-center justify-center rounded-md border px-2 text-center text-xs transition ${
                  active
                    ? "border-cyan-400 bg-cyan-950/70 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.2)]"
                    : `${kindTone(badge.kind)} text-slate-200 hover:border-slate-500`
                }`}
                aria-label={badge.title}
              >
                <span
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 rounded-full border ${
                    active
                      ? "border-cyan-100 bg-cyan-300"
                      : badge.status === "blocked"
                        ? "border-rose-300 bg-rose-500/80"
                        : badge.kind === "procedural_binding"
                          ? "border-violet-300 bg-violet-500/80"
                          : badge.kind === "intent_module"
                            ? "border-cyan-300 bg-cyan-500/80"
                            : "border-slate-300 bg-slate-500/80"
                  }`}
                />
              </button>
              <div className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-40 hidden w-64 -translate-x-1/2 rounded-md border border-cyan-700/70 bg-slate-950/95 p-3 text-left text-xs text-slate-100 shadow-2xl group-hover:block">
                <div className="font-semibold text-cyan-100">{badge.title}</div>
                <div className="mt-1 text-slate-300">{badgeActionLine(badge)}</div>
                <div className="mt-2 font-mono text-[11px] leading-snug text-cyan-100">
                  {proceduralExpression(badge) || labelize(badge.kind)}
                </div>
                <div className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-slate-400">{badge.plainMeaning}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">{labelize(badge.kind)}</span>
                  <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">{labelize(badge.status)}</span>
                  {badge.admission ? (
                    <span className="rounded border border-amber-700 px-1.5 py-0.5 text-[10px] text-amber-100">{labelize(badge.admission)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        {draftNodes.map((node) => (
          <button
            type="button"
            key={node.id}
            className={`group absolute flex h-16 w-16 items-center justify-center rounded-sm border-2 shadow-lg transition ${
              selectedDraftNodeId === node.id
                ? "border-cyan-300 bg-cyan-950/70 shadow-[0_0_24px_rgba(34,211,238,0.25)]"
                : kindTone(node.kind)
            }`}
            style={{ left: node.x - 32, top: node.y - 32 }}
            aria-label={`Draft ${node.label} node`}
            data-testid="stage-play-draft-node"
            onClick={() => onSelectDraftNode(node.id)}
          >
            <span
              aria-hidden="true"
              className="h-5 w-5 rounded-sm border border-cyan-200 bg-cyan-400/80"
            />
            <div className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-40 hidden w-56 -translate-x-1/2 rounded-md border border-cyan-700/70 bg-slate-950/95 p-2 text-left text-xs text-slate-100 shadow-2xl group-hover:block">
              <div className="font-semibold text-cyan-100">{node.label}</div>
              <div className="mt-1 text-slate-300">{node.role}</div>
              <div className="mt-1 font-mono text-[10px] text-cyan-100">draft.{node.kind}</div>
              <div className="mt-1 text-[10px] text-slate-400">{node.parameters.length} parameter(s)</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DraftNodeParameterEditor({
  node,
  sourceOptions,
  draftValidation,
  onClose,
  onUpdateParameter,
  onAddParameter,
  onSetSourceClass,
  onApplySourceOption,
}: {
  node: DraftStagePlayNode;
  sourceOptions: StagePlaySourceOption[];
  draftValidation?: StagePlayGraphDraftValidationV1 | null;
  onClose: () => void;
  onUpdateParameter: (nodeId: string, parameterId: string, field: "key" | "value", value: string) => void;
  onAddParameter: (nodeId: string) => void;
  onSetSourceClass: (nodeId: string, sourceClass: string) => void;
  onApplySourceOption: (nodeId: string, option: StagePlaySourceOption) => void;
}) {
  const selectedSourceClass = readDraftParameter(node, "source_class");
  const matchingSourceOptions = sourceOptions.filter((option) =>
    !selectedSourceClass || option.sourceClass === selectedSourceClass,
  );
  const sourceClassOptions = Array.from(new Set([
    ...STAGE_PLAY_SOURCE_CLASSES,
    ...sourceOptions.map((option) => option.sourceClass),
  ])).filter(Boolean).sort((a, b) => a.localeCompare(b));

  return (
    <aside
      data-testid="stage-play-draft-parameter-editor"
      className="absolute right-3 top-3 z-30 w-80 rounded-md border border-slate-800 bg-slate-950/95 p-3 text-slate-100 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Draft Parameters</div>
          <div className="mt-0.5 text-base font-semibold leading-tight">{node.label}</div>
          <div className="mt-1 font-mono text-[11px] text-slate-500">draft.{node.kind}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 hover:border-slate-500"
          aria-label="Close draft parameters"
        >
          Close
        </button>
      </div>

      {node.kind === "source" ? (
        <div className="mt-3 rounded-md border border-sky-800/70 bg-sky-950/20 p-3">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-sky-200">
            Source class
            <select
              value={selectedSourceClass}
              onChange={(event) => onSetSourceClass(node.id, event.target.value)}
              className="mt-1 h-8 w-full rounded border border-slate-800 bg-slate-950 px-2 text-xs normal-case tracking-normal text-slate-100 outline-none focus:border-sky-500"
              aria-label="Source class"
            >
              <option value="">Choose source class</option>
              {sourceClassOptions.map((sourceClass) => (
                <option key={sourceClass} value={sourceClass}>{labelize(sourceClass)}</option>
              ))}
            </select>
          </label>
          <div className="mt-3 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Active sources</div>
            {matchingSourceOptions.length === 0 ? (
              <div className="rounded border border-slate-800 bg-black/20 p-2 text-[11px] text-slate-500">
                No matching source handle is active for this class.
              </div>
            ) : matchingSourceOptions.slice(0, 8).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onApplySourceOption(node.id, option)}
                className="w-full rounded border border-slate-800 bg-black/20 p-2 text-left text-xs text-slate-200 hover:border-sky-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{option.label}</span>
                  <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">{labelize(option.status)}</span>
                </div>
                <div className="mt-1 truncate font-mono text-[10px] text-sky-100">{option.sourceClass} / {option.sourceId}</div>
                <div className="mt-1 truncate text-[10px] text-slate-500">
                  {option.descriptorId ?? "no descriptor"} / {option.producerId ?? "no producer"}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {node.parameters.map((parameter) => (
          <div key={parameter.id} className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
            <Input
              value={parameter.key}
              onChange={(event) => onUpdateParameter(node.id, parameter.id, "key", event.target.value)}
              aria-label={`Parameter key ${parameter.key}`}
              className="h-8 border-slate-800 bg-slate-950 text-xs text-slate-100"
            />
            <Input
              value={parameter.value}
              onChange={(event) => onUpdateParameter(node.id, parameter.id, "value", event.target.value)}
              aria-label={`Parameter value ${parameter.key}`}
              placeholder="value"
              className="h-8 border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder:text-slate-600"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddParameter(node.id)}
        className="mt-3 w-full rounded-md border border-cyan-700 bg-cyan-950/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:border-cyan-400"
      >
        Add parameter
      </button>
      <div className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Manual parameters stay local until a future admission path explicitly persists them.
      </div>
      <div
        data-testid="stage-play-draft-validation-status"
        className={`mt-3 rounded-md border p-3 text-xs ${
          draftValidation?.ok
            ? "border-emerald-800 bg-emerald-950/25 text-emerald-100"
            : draftValidation
              ? "border-amber-800 bg-amber-950/25 text-amber-100"
              : "border-slate-800 bg-black/20 text-slate-400"
        }`}
      >
        <div className="font-semibold">
          {draftValidation?.ok ? "Draft accepted" : draftValidation ? "Draft needs checks" : "Draft not submitted"}
        </div>
        {draftValidation ? (
          <div className="mt-2 space-y-1">
            <div className="font-mono text-[10px] text-slate-300">{draftValidation.schemaVersion}</div>
            {draftValidation.resolvedSourceIds.length > 0 ? (
              <div>Resolved source: {draftValidation.resolvedSourceIds.join(", ")}</div>
            ) : null}
            {draftValidation.issues.slice(0, 3).map((issue) => (
              <div key={issue}>Issue: {issue}</div>
            ))}
            {draftValidation.warnings.slice(0, 2).map((warning) => (
              <div key={warning}>Warning: {warning}</div>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function StagePlayBindingOverlay({
  graph,
  builderContext,
  sourceOptions,
  draftNodeCount,
  draftValidation,
  query,
  setQuery,
  groupedBadges,
  activeFilterKind,
  setActiveFilterKind,
  selectedBadgeId,
  selectedBadgeIds,
  setSelectedBadgeIds,
  toggleSelectedBadgeId,
  selectedBadge,
  relatedEdges,
  relatedBadges,
  relatedActions,
  onStartBuilderDrag,
  onClose,
}: {
  graph: StagePlayBadgeGraphV1;
  builderContext?: StagePlayBuilderContextResponse | null;
  sourceOptions: StagePlaySourceOption[];
  draftNodeCount: number;
  draftValidation?: StagePlayGraphDraftValidationV1 | null;
  query: string;
  setQuery: (value: string) => void;
  groupedBadges: { kind: string; badges: StagePlayBadgeV1[] }[];
  activeFilterKind: string | null;
  setActiveFilterKind: (kind: string | null) => void;
  selectedBadgeId: string | null;
  selectedBadgeIds: string[];
  setSelectedBadgeIds: (badgeIds: string[]) => void;
  toggleSelectedBadgeId: (badgeId: string) => void;
  selectedBadge: StagePlayBadgeV1 | null;
  relatedEdges: StagePlayBadgeEdgeV1[];
  relatedBadges: StagePlayBadgeV1[];
  relatedActions: StagePlayBadgeGraphRecommendedActionV1[];
  onStartBuilderDrag: (nodeType: StagePlayNodeBuilderType, event: React.PointerEvent<HTMLButtonElement>) => void;
  onClose: () => void;
}) {
  const selectedBadges = graph.badges.filter((badge) => selectedBadgeIds.includes(badge.id));
  const selectedExpression = selectedBadges.length > 0
    ? selectedBadges.map((badge) => proceduralExpression(badge) || badge.id).join(" + ")
    : "Click badges in the map to assemble a procedural trace.";
  const liveNodeGroups = activeFilterKind ? groupedBadges : [];
  const visibleBadges = liveNodeGroups.flatMap((group) => group.badges);

  function addNodeType(kind: StagePlayBadgeV1["kind"]) {
    const matchingIds = graph.badges.filter((badge) => badge.kind === kind).map((badge) => badge.id);
    setActiveFilterKind(kind);
    if (matchingIds.length > 0) {
      setSelectedBadgeIds(Array.from(new Set([...selectedBadgeIds, ...matchingIds])));
    }
  }

  return (
    <aside
      data-testid="stage-play-binding-overlay"
      className="absolute bottom-3 left-3 top-3 z-30 flex w-[340px] flex-col rounded-md border border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Stage Builder</div>
          <div className="mt-0.5 text-base font-semibold leading-tight">Node library</div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Add node types, watch live evidence fill them, and assemble procedures without granting execution.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-700 p-1.5 text-slate-300 hover:border-slate-500 hover:text-slate-100"
          aria-label="Close Stage Play bindings"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-slate-800 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search live badges"
            className="h-9 border-slate-800 bg-slate-950 pl-8 text-slate-100 placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <Section title="Node builder">
          <div className="space-y-2">
            {STAGE_PLAY_NODE_BUILDER_TYPES.map((nodeType) => {
              const count = graph.summary.kindCounts[nodeType.kind] ?? 0;
              const active = activeFilterKind === nodeType.kind;
              return (
                <button
                  key={nodeType.kind}
                  type="button"
                  onPointerDown={(event) => onStartBuilderDrag(nodeType, event)}
                  onClick={() => addNodeType(nodeType.kind)}
                  className={`w-full rounded-md border p-2 text-left transition ${
                    active
                      ? "border-cyan-500 bg-cyan-950/45"
                      : "border-slate-800 bg-black/20 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{nodeType.label}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{nodeType.role}</div>
                    </div>
                    <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Tool assembly">
          <div data-testid="stage-play-builder-artifacts" className="space-y-2 text-xs">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="border-cyan-800 text-cyan-100">
                {builderContext?.catalog.schemaVersion ?? "stage_play_builder_catalog/v1"}
              </Badge>
              <Badge variant="outline" className="border-cyan-800 text-cyan-100">
                {builderContext?.sourceQuery.schemaVersion ?? "stage_play_source_query/v1"}
              </Badge>
              <Badge variant="outline" className="border-cyan-800 text-cyan-100">
                {draftValidation?.schemaVersion ?? "stage_play_graph_draft_validation/v1"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-mono text-sm text-slate-100">{sourceOptions.length}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">sources</div>
              </div>
              <div className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-mono text-sm text-slate-100">{draftNodeCount}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">draft nodes</div>
              </div>
              <div className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-mono text-sm text-slate-100">
                  {draftValidation ? (draftValidation.ok ? "ok" : "check") : "idle"}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">validation</div>
              </div>
            </div>
            {draftValidation ? (
              <div className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-semibold text-slate-200">
                  {draftValidation.ok ? "Draft accepted by builder contract." : "Draft needs checks before reflection."}
                </div>
                {draftValidation.issues.length > 0 ? (
                  <div className="mt-1 text-amber-100">{draftValidation.issues[0]}</div>
                ) : draftValidation.warnings.length > 0 ? (
                  <div className="mt-1 text-slate-400">{draftValidation.warnings[0]}</div>
                ) : (
                  <div className="mt-1 text-slate-400">Evidence-only validation; no execution permission granted.</div>
                )}
              </div>
            ) : null}
          </div>
        </Section>

        <Section title="Source handles">
          <div className="space-y-1.5 text-xs">
            {sourceOptions.length === 0 ? (
              <div className="rounded border border-slate-800 bg-black/20 p-2 text-slate-500">
                No active source handles are available to stage.
              </div>
            ) : sourceOptions.slice(0, 6).map((option) => (
              <div key={option.id} className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-slate-100">{option.label}</span>
                  <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">{labelize(option.status)}</span>
                </div>
                <div className="mt-1 truncate font-mono text-[10px] text-cyan-100">{option.sourceClass} / {option.sourceId}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Selected trace">
          <div className="font-mono text-xs leading-relaxed text-cyan-100">{selectedExpression}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedBadges.map((badge) => (
              <Badge key={badge.id} variant="outline" className="border-cyan-700 text-cyan-100">
                {badge.title}
              </Badge>
            ))}
          </div>
        </Section>

        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {activeFilterKind ? `${labelize(activeFilterKind)} nodes` : "Live nodes"}
            </div>
            {activeFilterKind ? (
              <button
                type="button"
                onClick={() => setActiveFilterKind(null)}
                className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 hover:border-slate-500"
              >
                Show all
              </button>
            ) : null}
          </div>
          {!activeFilterKind ? (
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-500">
              Choose a node type above to stage matching live nodes onto the graph assembly.
            </div>
          ) : visibleBadges.length === 0 ? (
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-500">
              This node type is ready for tool-call assembly, but no admitted live source has filled it yet.
            </div>
          ) : liveNodeGroups.map((group) => (
            <div key={group.kind}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{labelize(group.kind)}</div>
              <div className="space-y-2">
                {group.badges.map((badge) => (
                  <BadgeButton
                    key={badge.id}
                    badge={badge}
                    selected={selectedBadgeId === badge.id || selectedBadgeIds.includes(badge.id)}
                    onSelect={() => toggleSelectedBadgeId(badge.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <Inspector
            badge={selectedBadge}
            relatedEdges={relatedEdges}
            relatedBadges={relatedBadges}
            relatedActions={relatedActions}
          />
        </div>
      </div>
    </aside>
  );
}

function Inspector({
  badge,
  relatedEdges,
  relatedBadges,
  relatedActions,
}: {
  badge: StagePlayBadgeV1 | null;
  relatedEdges: StagePlayBadgeEdgeV1[];
  relatedBadges: StagePlayBadgeV1[];
  relatedActions: StagePlayBadgeGraphRecommendedActionV1[];
}) {
  if (!badge) {
    return (
      <aside className="min-h-0 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/75 p-4 text-sm text-slate-400">
        Select a Stage Play badge to inspect live bindings, affordances, procedural bindings, evidence, and admission.
      </aside>
    );
  }

  const expression = proceduralExpression(badge);

  return (
    <aside className="min-h-0 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-50">{badge.title}</div>
          <div className="mt-1 font-mono text-xs text-slate-500">{badge.id}</div>
        </div>
        <Badge variant="outline" className={statusTone(badge.status)}>
          {labelize(badge.status)}
        </Badge>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Section title="Meaning">
          <p>{badge.plainMeaning}</p>
          <p className="mt-2 text-xs text-slate-400">{badge.whyItMatters}</p>
        </Section>

        <Section title="Live Bindings">
          {badge.liveBindings.length > 0 ? (
            <div className="space-y-2">
              {badge.liveBindings.map((binding, index) => (
                <div key={`${binding.bindingKind}-${index}`} className="rounded border border-slate-800 bg-black/20 p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
                      {labelize(binding.bindingKind)}
                    </Badge>
                    <span className="text-xs text-slate-400">{binding.freshness}</span>
                    <span className="font-mono text-[10px] text-slate-500">{binding.confidence.toFixed(2)}</span>
                  </div>
                  {binding.compactValue !== undefined && binding.compactValue !== null ? (
                    <div className="mt-1 font-mono text-xs text-slate-300">{String(binding.compactValue)}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-500">No live binding attached to this badge.</span>
          )}
        </Section>

        <Section title="Affordance / Blocked Move">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {labelize(badge.kind)}
            </Badge>
            {badge.admission ? (
              <Badge variant="outline" className={statusTone(badge.admission === "blocked" ? "blocked" : badge.status)}>
                {labelize(badge.admission)}
              </Badge>
            ) : null}
          </div>
        </Section>

        <Section title="Intent Module">
          {badge.intentModule ? (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Verb:</span>{" "}
                <span className="font-mono text-cyan-200">{badge.intentModule.verb}</span>
              </div>
              {badge.intentModule.requires?.length ? <div>Requires: {badge.intentModule.requires.join(", ")}</div> : null}
              {badge.intentModule.preserves?.length ? <div>Preserves: {badge.intentModule.preserves.join(", ")}</div> : null}
              {badge.intentModule.blocks?.length ? <div>Blocks: {badge.intentModule.blocks.join(", ")}</div> : null}
            </div>
          ) : (
            <span className="text-slate-500">No intent verb is attached to this badge.</span>
          )}
        </Section>

        <Section title="Procedural Binding">
          <div className="rounded border border-slate-800 bg-black/30 p-2 font-mono text-xs text-cyan-100">
            {expression || "No procedural expression for this badge."}
          </div>
        </Section>

        <Section title="Missing Evidence">
          {badge.missingEvidence.length > 0 ? (
            <ul className="list-inside list-disc space-y-1 text-xs text-amber-100">
              {badge.missingEvidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <span className="text-slate-500">No missing evidence recorded.</span>
          )}
        </Section>

        <Section title="Admission">
          <div className="space-y-2 text-xs">
            <div>Badge admission: <span className="font-mono text-slate-200">{badge.admission ?? "none"}</span></div>
            {relatedActions.map((action) => (
              <div key={action.id} className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-semibold text-slate-100">{action.label}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className={statusTone(action.admission === "blocked" ? "blocked" : "candidate")}>
                    {labelize(action.admission)}
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    {labelize(action.actionType)}
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    agent executable: false
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Source Refs">
          <div className="space-y-1 font-mono text-xs text-slate-400">
            {badge.sourceRefs.length > 0 ? badge.sourceRefs.map((ref) => (
              <div key={`${ref.kind}:${ref.id}`}>{ref.kind}: {ref.id}</div>
            )) : <span>No source refs.</span>}
          </div>
        </Section>

        <Section title="Related Badges">
          <div className="space-y-2">
            {relatedEdges.map((edge) => (
              <div key={edge.id} className="rounded border border-slate-800 bg-black/20 p-2 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <Link2 className="h-3.5 w-3.5 text-slate-500" />
                  {labelize(edge.relation)}: {edge.label}
                </div>
              </div>
            ))}
            {relatedBadges.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {relatedBadges.map((related) => (
                  <Badge key={related.id} variant="outline" className="border-slate-700 text-slate-300">
                    {related.title}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </Section>
      </div>
    </aside>
  );
}

export default function StagePlayBadgeGraphPanel() {
  const [query, setQuery] = useState("");
  const [bindingOverlayOpen, setBindingOverlayOpen] = useState(false);
  const [draftNodes, setDraftNodes] = useState<DraftStagePlayNode[]>([]);
  const [selectedDraftNodeId, setSelectedDraftNodeId] = useState<string | null>(null);
  const [heldNode, setHeldNode] = useState<HeldStagePlayNode | null>(null);
  const graphScrollportRef = useRef<HTMLDivElement>(null);
  const draftNodeCountRef = useRef(0);
  const draftParameterCountRef = useRef(0);
  const activeEnvironment = useLiveAnswerEnvironmentStore((state) =>
    selectActiveLiveAnswerEnvironment(state, STAGE_PLAY_PANEL_THREAD_ID),
  );
  const threadId = activeEnvironment?.thread_id ?? STAGE_PLAY_PANEL_THREAD_ID;
  const roomId = activeEnvironment?.room_id ?? null;
  const environmentId = activeEnvironment?.environment_id ?? null;
  const selectedBadgeId = useStagePlayBadgeGraphPanelStore((state) => state.selectedBadgeId);
  const selectedBadgeIds = useStagePlayBadgeGraphPanelStore((state) => state.selectedBadgeIds);
  const activeFilterKind = useStagePlayBadgeGraphPanelStore((state) => state.activeFilterKind);
  const setSelectedBadgeId = useStagePlayBadgeGraphPanelStore((state) => state.setSelectedBadgeId);
  const setSelectedBadgeIds = useStagePlayBadgeGraphPanelStore((state) => state.setSelectedBadgeIds);
  const toggleSelectedBadgeId = useStagePlayBadgeGraphPanelStore((state) => state.toggleSelectedBadgeId);
  const setActiveFilterKind = useStagePlayBadgeGraphPanelStore((state) => state.setActiveFilterKind);
  const { data: graph, isLoading, error } = useQuery<StagePlayBadgeGraphV1>({
    queryKey: [
      "/api/helix/stage-play/graph",
      threadId,
      roomId,
      environmentId,
    ],
    queryFn: () => fetchStagePlayBadgeGraph({ threadId, roomId, environmentId }),
    refetchInterval: 1000,
  });
  const { data: builderContext = null } = useQuery<StagePlayBuilderContextResponse>({
    queryKey: [
      "/api/helix/stage-play/builder",
      threadId,
      environmentId,
    ],
    queryFn: () => fetchStagePlayBuilderContext({ threadId, environmentId }),
    refetchInterval: 2000,
  });
  const sourceOptions = useMemo(
    () => (builderContext?.sourceQuery.sourceHandles ?? []).map(sourceOptionFromHandle),
    [builderContext?.sourceQuery.sourceHandles],
  );
  const draftForValidation = useMemo(
    () => buildStagePlayDraftFromNodes({
      draftNodes,
      objective: graph?.description ?? graph?.title ?? null,
    }),
    [draftNodes, graph?.description, graph?.title],
  );
  const draftValidationKey = useMemo(
    () => JSON.stringify(draftForValidation),
    [draftForValidation],
  );
  const { data: draftValidation = null } = useQuery<StagePlayGraphDraftValidationV1>({
    queryKey: [
      "/api/helix/stage-play/draft/validate",
      threadId,
      environmentId,
      draftValidationKey,
    ],
    queryFn: () => validateStagePlayDraft({
      threadId,
      environmentId,
      draft: draftForValidation,
    }),
    enabled: draftNodes.length > 0,
  });

  const filteredBadges = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (graph?.badges ?? []).filter((badge: StagePlayBadgeV1) => {
      const haystack = [
        badge.id,
        badge.title,
        badge.plainMeaning,
        badge.whyItMatters,
        badge.kind,
        badge.status,
        ...badge.subjects,
        ...badge.tags,
        ...badge.reasonCodes,
      ].join(" ").toLowerCase();
      return (
        (needle.length === 0 || haystack.includes(needle)) &&
        (!activeFilterKind || badge.kind === activeFilterKind)
      );
    });
  }, [activeFilterKind, graph?.badges, query]);

  const groupedBadges = useMemo(() => {
    return uniqueSorted(filteredBadges.map((badge) => badge.kind)).map((kind) => ({
      kind,
      badges: filteredBadges.filter((badge: StagePlayBadgeV1) => badge.kind === kind),
    })).filter((group) => group.badges.length > 0);
  }, [filteredBadges]);

  useEffect(() => {
    if (!graph) return;
    if (filteredBadges.length === 0) {
      setSelectedBadgeId(null);
      return;
    }
    if (selectedBadgeId && !filteredBadges.some((badge) => badge.id === selectedBadgeId)) {
      setSelectedBadgeId(null);
    }
  }, [filteredBadges, graph, selectedBadgeId, setSelectedBadgeId]);

  const selectedBadge = useMemo(
    () => graph?.badges.find((badge) => badge.id === selectedBadgeId) ?? null,
    [graph?.badges, selectedBadgeId],
  );
  const relatedEdges = useMemo(
    () => graph && selectedBadge
      ? graph.edges.filter((edge) => edge.from === selectedBadge.id || edge.to === selectedBadge.id)
      : [],
    [graph, selectedBadge],
  );
  const relatedBadges = useMemo(() => {
    if (!graph || !selectedBadge) return [];
    const ids = new Set(relatedEdges.flatMap((edge) => [edge.from, edge.to]).filter((id) => id !== selectedBadge.id));
    return graph.badges.filter((badge) => ids.has(badge.id));
  }, [graph, relatedEdges, selectedBadge]);
  const relatedActions = useMemo(
    () => graph && selectedBadge
      ? graph.recommendedActions.filter((action) =>
        action.evidenceRefs.some((ref) => selectedBadge.evidenceRefs.includes(ref)) ||
        action.reasonCodes.some((code) => selectedBadge.reasonCodes.includes(code)),
      )
      : [],
    [graph, selectedBadge],
  );

  function scrollGraphNearEdge(clientX: number, clientY: number) {
    const scrollport = graphScrollportRef.current;
    if (!scrollport) return;
    const rect = scrollport.getBoundingClientRect();
    const threshold = 56;
    const maxStep = 22;
    const leftPressure = Math.max(0, threshold - (clientX - rect.left));
    const rightPressure = Math.max(0, threshold - (rect.right - clientX));
    const topPressure = Math.max(0, threshold - (clientY - rect.top));
    const bottomPressure = Math.max(0, threshold - (rect.bottom - clientY));
    const left = rightPressure > 0
      ? Math.ceil((rightPressure / threshold) * maxStep)
      : leftPressure > 0
        ? -Math.ceil((leftPressure / threshold) * maxStep)
        : 0;
    const top = bottomPressure > 0
      ? Math.ceil((bottomPressure / threshold) * maxStep)
      : topPressure > 0
        ? -Math.ceil((topPressure / threshold) * maxStep)
        : 0;
    if (left !== 0 || top !== 0) {
      scrollport.scrollBy({ left, top });
    }
  }

  function startBuilderDrag(nodeType: StagePlayNodeBuilderType, event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setBindingOverlayOpen(false);
    setHeldNode({
      ...nodeType,
      clientX: readClientCoordinate(event.clientX),
      clientY: readClientCoordinate(event.clientY),
    });
  }

  function updateDraftParameter(nodeId: string, parameterId: string, field: "key" | "value", value: string) {
    setDraftNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              parameters: node.parameters.map((parameter) =>
                parameter.id === parameterId ? { ...parameter, [field]: value } : parameter,
              ),
            }
          : node,
      ),
    );
  }

  function addDraftParameter(nodeId: string) {
    draftParameterCountRef.current += 1;
    setDraftNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              parameters: [
                ...node.parameters,
                {
                  id: `${node.id}:param:custom:${draftParameterCountRef.current}`,
                  key: "parameter",
                  value: "",
                },
              ],
            }
          : node,
      ),
    );
  }

  function setDraftSourceClass(nodeId: string, sourceClass: string) {
    setDraftNodes((nodes) =>
      nodes.map((node) => node.id === nodeId ? setDraftParameterValue(node, "source_class", sourceClass) : node),
    );
  }

  function applyDraftSourceOption(nodeId: string, option: StagePlaySourceOption) {
    setDraftNodes((nodes) =>
      nodes.map((node) => {
        if (node.id !== nodeId) return node;
        return [
          ["source_class", option.sourceClass],
          ["source_id", option.sourceId],
          ["status", option.status],
          ["descriptor_ref", option.descriptorId ?? ""],
          ["producer_ref", option.producerId ?? ""],
          ["latest_ref", option.latestRef ?? ""],
          ["surface", option.surface ?? ""],
          ["origin", option.origin ?? ""],
          ["cadence_ms", option.cadenceMs != null ? String(option.cadenceMs) : ""],
        ].reduce<DraftStagePlayNode>(
          (updated, [key, value]) => setDraftParameterValue(updated, key, value),
          node,
        );
      }),
    );
  }

  useEffect(() => {
    if (!heldNode) return;

    function handlePointerMove(event: PointerEvent) {
      const clientX = readClientCoordinate(event.clientX);
      const clientY = readClientCoordinate(event.clientY);
      setHeldNode((node) => node ? { ...node, clientX, clientY } : null);
      scrollGraphNearEdge(clientX, clientY);
    }

    function handlePointerUp(event: PointerEvent) {
      const scrollport = graphScrollportRef.current;
      setHeldNode((node) => {
        if (!node || !scrollport) return null;
        const rect = scrollport.getBoundingClientRect();
        const clientX = readClientCoordinate(event.clientX);
        const clientY = readClientCoordinate(event.clientY);
        const x = Math.max(32, Math.round(clientX - rect.left + scrollport.scrollLeft));
        const y = Math.max(32, Math.round(clientY - rect.top + scrollport.scrollTop));
        draftNodeCountRef.current += 1;
        setDraftNodes((nodes) => [
          ...nodes,
          {
            id: `draft:${node.kind}:${draftNodeCountRef.current}`,
            kind: node.kind,
            label: node.label,
            role: node.role,
            x,
            y,
            parameters: defaultDraftParametersForNode(node),
          },
        ]);
        setSelectedDraftNodeId(`draft:${node.kind}:${draftNodeCountRef.current}`);
        return null;
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [heldNode]);

  useEffect(() => {
    if (!heldNode) return;
    const timer = window.setInterval(() => {
      scrollGraphNearEdge(heldNode.clientX, heldNode.clientY);
    }, 40);
    return () => window.clearInterval(timer);
  }, [heldNode]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400">Loading Stage Play Badge Graph...</div>;
  }

  if (error || !graph) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 p-6 text-sm text-rose-200">
        Stage Play graph failed to load.
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-slate-950 text-slate-100">
      <div className="relative min-h-0 flex-1">
        {!bindingOverlayOpen ? (
          <button
            type="button"
            onClick={() => setBindingOverlayOpen(true)}
            className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 shadow-xl hover:border-cyan-500"
            aria-label="Open Stage Play bindings"
          >
            <PanelLeftOpen className="h-4 w-4" />
            Bindings
          </button>
        ) : null}

        {bindingOverlayOpen ? (
          <StagePlayBindingOverlay
            graph={graph}
            builderContext={builderContext}
            sourceOptions={sourceOptions}
            draftNodeCount={draftNodes.length}
            draftValidation={draftValidation}
            query={query}
            setQuery={setQuery}
            groupedBadges={groupedBadges}
            activeFilterKind={activeFilterKind}
            setActiveFilterKind={setActiveFilterKind}
            selectedBadgeId={selectedBadgeId}
            selectedBadgeIds={selectedBadgeIds}
            setSelectedBadgeIds={setSelectedBadgeIds}
            toggleSelectedBadgeId={toggleSelectedBadgeId}
            selectedBadge={selectedBadge}
            relatedEdges={relatedEdges}
            relatedBadges={relatedBadges}
            relatedActions={relatedActions}
            onStartBuilderDrag={startBuilderDrag}
            onClose={() => setBindingOverlayOpen(false)}
          />
        ) : null}

        {heldNode ? (
          <div
            className={`pointer-events-none fixed z-50 flex h-16 w-16 items-center justify-center rounded-sm border-2 shadow-2xl ${kindTone(heldNode.kind)}`}
            style={{ left: heldNode.clientX - 32, top: heldNode.clientY - 32 }}
            data-testid="stage-play-held-builder-node"
            aria-hidden="true"
          >
            <span className="h-5 w-5 rounded-sm border border-cyan-100 bg-cyan-300" />
          </div>
        ) : null}

        {selectedDraftNodeId ? (
          (() => {
            const selectedDraftNode = draftNodes.find((node) => node.id === selectedDraftNodeId) ?? null;
            return selectedDraftNode ? (
              <DraftNodeParameterEditor
                node={selectedDraftNode}
                sourceOptions={sourceOptions}
                draftValidation={draftValidation}
                onClose={() => setSelectedDraftNodeId(null)}
                onUpdateParameter={updateDraftParameter}
                onAddParameter={addDraftParameter}
                onSetSourceClass={setDraftSourceClass}
                onApplySourceOption={applyDraftSourceOption}
              />
            ) : null;
          })()
        ) : null}

        <main className="flex h-full min-h-0 flex-col">
          <StagePlayGraphCanvas
            graph={graph}
            selectedBadgeIds={selectedBadgeIds}
            selectedBadgeId={selectedBadgeId}
            draftNodes={draftNodes}
            selectedDraftNodeId={selectedDraftNodeId}
            scrollportRef={graphScrollportRef}
            onSelect={toggleSelectedBadgeId}
            onSelectDraftNode={setSelectedDraftNodeId}
          />
        </main>
      </div>
    </div>
  );
}
