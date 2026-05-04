import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emitHelixAskLiveEvent } from "@/lib/helix/liveEventsBus";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { pushWorkstationDebugEvent } from "@/lib/helix/workstation-debug";
import { useSituationRoomJobStore } from "@/store/useSituationRoomJobStore";
import type {
  SituationGraphEdge,
  SituationGraphLane,
  SituationGraphNode,
  SituationGraphNodeColumn,
  SituationGraphNodeStatus,
  SituationGraphNodeType,
  SituationRoomGraph,
  TranslationPairNodeConfig,
} from "@shared/helix-situation-graph";
import { HELIX_SITUATION_GRAPH_SCHEMA } from "@shared/helix-situation-graph";

const SITUATION_ROOM_GRAPH_STORAGE_KEY = "situation-room-graphs:v1";

type CreateGraphInput = {
  room_id: string;
  title?: string;
};

type AddNodeInput = {
  graph_id: string;
  type: SituationGraphNodeType;
  title: string;
  column?: SituationGraphNodeColumn;
  status?: SituationGraphNodeStatus;
  subtitle?: string;
  source_id?: string;
  speaker_id?: string;
  job_id?: string;
  output_id?: string;
  config?: Record<string, unknown>;
};

type ConnectNodesInput = {
  graph_id: string;
  from_node_id: string;
  from_port?: string;
  to_node_id: string;
  to_port?: string;
  lane: SituationGraphLane;
};

export type CreateTranslationPairInput = {
  graph_id?: string;
  room_id: string;
  speaker_a_id: string;
  speaker_b_id: string;
  speaker_a_native_language: string;
  speaker_b_native_language: string;
  source_ids?: string[];
  render_policy?: TranslationPairNodeConfig["render_policy"];
  voice_output?: TranslationPairNodeConfig["voice_output"];
  title?: string;
};

type SituationRoomGraphStoreState = {
  graphs: Record<string, SituationRoomGraph>;
  graph_order: string[];
  active_graph_id_by_room: Record<string, string>;
  selected_node_id_by_graph: Record<string, string | undefined>;
  createGraph: (input: CreateGraphInput) => SituationRoomGraph;
  ensureGraphForRoom: (roomId: string, title?: string) => SituationRoomGraph;
  addNode: (input: AddNodeInput) => SituationGraphNode | null;
  connectNodes: (input: ConnectNodesInput) => SituationGraphEdge | null;
  createTranslationPair: (input: CreateTranslationPairInput) => {
    graph: SituationRoomGraph;
    node: SituationGraphNode;
    job_ids: [string, string];
  } | null;
  attachGraphToHelixAsk: (graphId: string) => void;
  setSelectedNode: (graphId: string, nodeId?: string) => void;
  reset: () => void;
};

const nowIso = (): string => new Date().toISOString();

const createId = (prefix: string): string => {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}:${Date.now()}:${random}`;
};

const defaultColumnForNodeType = (type: SituationGraphNodeType): SituationGraphNodeColumn => {
  if (type.startsWith("source.")) return "sources";
  if (type.startsWith("speaker.")) return "speakers";
  if (type === "translate" || type === "language.detect" || type === "transcript.buffer") return "jobs";
  if (type.startsWith("output.")) return "outputs";
  return "helix";
};

const edgeId = (input: Omit<ConnectNodesInput, "graph_id">): string =>
  `edge:${input.from_node_id}:${input.from_port ?? "out"}:${input.to_node_id}:${input.to_port ?? "in"}:${input.lane}`;

const upsertNode = (graph: SituationRoomGraph, node: SituationGraphNode): SituationRoomGraph => ({
  ...graph,
  nodes: [...graph.nodes.filter((entry) => entry.node_id !== node.node_id), node],
  updated_at: nowIso(),
});

const upsertEdge = (graph: SituationRoomGraph, edge: SituationGraphEdge): SituationRoomGraph => ({
  ...graph,
  edges: [...graph.edges.filter((entry) => entry.edge_id !== edge.edge_id), edge],
  updated_at: nowIso(),
});

export const useSituationRoomGraphStore = create<SituationRoomGraphStoreState>()(
  persist(
    (set, get) => ({
      graphs: {},
      graph_order: [],
      active_graph_id_by_room: {},
      selected_node_id_by_graph: {},
      createGraph: (input) => {
        const timestamp = nowIso();
        const graph: SituationRoomGraph = {
          schema: HELIX_SITUATION_GRAPH_SCHEMA,
          graph_id: createId("sgraph"),
          room_id: input.room_id,
          title: input.title?.trim() || "Situation Room Graph",
          nodes: [],
          edges: [],
          policies: [
            {
              policy_id: "policy:context_attachment",
              kind: "context_attachment",
              config: {
                attachment_policy: "manual_only",
                context_injection: "explicit_attachment_only",
              },
            },
            {
              policy_id: "policy:unknown_speaker",
              kind: "unknown_speaker",
              config: {
                behavior: "transcribe_only",
              },
            },
          ],
          created_at: timestamp,
          updated_at: timestamp,
        };
        set((state) => ({
          graphs: { ...state.graphs, [graph.graph_id]: graph },
          graph_order: [graph.graph_id, ...state.graph_order.filter((entry) => entry !== graph.graph_id)],
          active_graph_id_by_room: {
            ...state.active_graph_id_by_room,
            [graph.room_id]: graph.graph_id,
          },
        }));
        return graph;
      },
      ensureGraphForRoom: (roomId, title) => {
        const state = get();
        const activeGraphId = state.active_graph_id_by_room[roomId];
        if (activeGraphId && state.graphs[activeGraphId]) return state.graphs[activeGraphId];
        const existingGraphId = state.graph_order.find((graphId) => state.graphs[graphId]?.room_id === roomId);
        if (existingGraphId && state.graphs[existingGraphId]) {
          set((current) => ({
            active_graph_id_by_room: {
              ...current.active_graph_id_by_room,
              [roomId]: existingGraphId,
            },
          }));
          return state.graphs[existingGraphId];
        }
        return get().createGraph({ room_id: roomId, title });
      },
      addNode: (input) => {
        const graph = get().graphs[input.graph_id];
        if (!graph) return null;
        const timestamp = nowIso();
        const node: SituationGraphNode = {
          node_id: createId("node"),
          type: input.type,
          title: input.title,
          column: input.column ?? defaultColumnForNodeType(input.type),
          status: input.status ?? "idle",
          subtitle: input.subtitle,
          source_id: input.source_id,
          speaker_id: input.speaker_id,
          job_id: input.job_id,
          output_id: input.output_id,
          config: input.config,
          created_at: timestamp,
          updated_at: timestamp,
        };
        set((state) => ({
          graphs: {
            ...state.graphs,
            [graph.graph_id]: upsertNode(graph, node),
          },
        }));
        return node;
      },
      connectNodes: (input) => {
        const graph = get().graphs[input.graph_id];
        if (!graph) return null;
        if (!graph.nodes.some((node) => node.node_id === input.from_node_id)) return null;
        if (!graph.nodes.some((node) => node.node_id === input.to_node_id)) return null;
        const edge: SituationGraphEdge = {
          edge_id: edgeId(input),
          from_node_id: input.from_node_id,
          from_port: input.from_port ?? "out",
          to_node_id: input.to_node_id,
          to_port: input.to_port ?? "in",
          lane: input.lane,
        };
        set((state) => ({
          graphs: {
            ...state.graphs,
            [graph.graph_id]: upsertEdge(graph, edge),
          },
        }));
        return edge;
      },
      createTranslationPair: (input) => {
        const graph = input.graph_id && get().graphs[input.graph_id]
          ? get().graphs[input.graph_id]
          : get().ensureGraphForRoom(input.room_id, input.title ?? "Translation graph");
        const renderPolicy = input.render_policy ?? "dual";
        const voiceOutput = input.voice_output ?? "off";
        const jobState = useSituationRoomJobStore.getState();
        const aToB = jobState.createJob({
          room_id: input.room_id,
          kind: "translate",
          title: `${input.speaker_a_id} to ${input.speaker_b_native_language}`,
          source_ids: input.source_ids ?? [],
          target_language: input.speaker_b_native_language,
          native_language: input.speaker_a_native_language,
          input_text_policy: "source_text_preferred",
          output_render_policy: renderPolicy,
          attachment_policy: "manual_only",
          context_injection: "explicit_attachment_only",
          command_lane_enabled: false,
        });
        const bToA = jobState.createJob({
          room_id: input.room_id,
          kind: "translate",
          title: `${input.speaker_b_id} to ${input.speaker_a_native_language}`,
          source_ids: input.source_ids ?? [],
          target_language: input.speaker_a_native_language,
          native_language: input.speaker_b_native_language,
          input_text_policy: "source_text_preferred",
          output_render_policy: renderPolicy,
          attachment_policy: "manual_only",
          context_injection: "explicit_attachment_only",
          command_lane_enabled: false,
        });
        const timestamp = nowIso();
        const config: TranslationPairNodeConfig = {
          speaker_a_id: input.speaker_a_id,
          speaker_b_id: input.speaker_b_id,
          speaker_a_native_language: input.speaker_a_native_language,
          speaker_b_native_language: input.speaker_b_native_language,
          a_to_b_job_id: aToB.job_id,
          b_to_a_job_id: bToA.job_id,
          render_policy: renderPolicy,
          voice_output: voiceOutput,
        };
        const node: SituationGraphNode = {
          node_id: createId("node:translation_pair"),
          type: "translate",
          title: input.title?.trim() || "Two-way translation pair",
          column: "jobs",
          status: "idle",
          subtitle: `${input.speaker_a_native_language} <-> ${input.speaker_b_native_language}`,
          config: { translation_pair: config },
          runtime: {
            event_count: 0,
            output_count: 0,
            last_error: null,
            last_updated_at: timestamp,
          },
          created_at: timestamp,
          updated_at: timestamp,
        };
        const speakerA: SituationGraphNode = {
          node_id: createId("node:speaker"),
          type: "speaker.identity",
          title: input.speaker_a_id,
          column: "speakers",
          status: "idle",
          speaker_id: input.speaker_a_id,
          subtitle: input.speaker_a_native_language,
          config: { native_language: input.speaker_a_native_language, authority: "transcribe_only" },
          runtime: {
            event_count: 0,
            output_count: 0,
            last_error: null,
            last_updated_at: timestamp,
          },
          created_at: timestamp,
          updated_at: timestamp,
        };
        const speakerB: SituationGraphNode = {
          node_id: createId("node:speaker"),
          type: "speaker.identity",
          title: input.speaker_b_id,
          column: "speakers",
          status: "idle",
          speaker_id: input.speaker_b_id,
          subtitle: input.speaker_b_native_language,
          config: { native_language: input.speaker_b_native_language, authority: "transcribe_only" },
          runtime: {
            event_count: 0,
            output_count: 0,
            last_error: null,
            last_updated_at: timestamp,
          },
          created_at: timestamp,
          updated_at: timestamp,
        };
        let nextGraph = upsertNode(upsertNode(upsertNode(graph, speakerA), speakerB), node);
        nextGraph = upsertEdge(nextGraph, {
          edge_id: edgeId({
            from_node_id: speakerA.node_id,
            to_node_id: node.node_id,
            lane: "speaker_identity",
          }),
          from_node_id: speakerA.node_id,
          from_port: "speaker",
          to_node_id: node.node_id,
          to_port: "speaker_a",
          lane: "speaker_identity",
        });
        nextGraph = upsertEdge(nextGraph, {
          edge_id: edgeId({
            from_node_id: speakerB.node_id,
            to_node_id: node.node_id,
            lane: "speaker_identity",
          }),
          from_node_id: speakerB.node_id,
          from_port: "speaker",
          to_node_id: node.node_id,
          to_port: "speaker_b",
          lane: "speaker_identity",
        });
        set((state) => ({
          graphs: { ...state.graphs, [graph.graph_id]: nextGraph },
          active_graph_id_by_room: {
            ...state.active_graph_id_by_room,
            [graph.room_id]: graph.graph_id,
          },
          selected_node_id_by_graph: {
            ...state.selected_node_id_by_graph,
            [graph.graph_id]: node.node_id,
          },
        }));
        pushWorkstationDebugEvent({
          channel: "situation_room_graph",
          action: "translation_pair_created",
          room_id: input.room_id,
          detail: {
            graph_id: graph.graph_id,
            node_id: node.node_id,
            job_ids: [aToB.job_id, bToA.job_id],
            attachment_policy: "manual_only",
            context_injection: "explicit_attachment_only",
          },
        });
        return { graph: nextGraph, node, job_ids: [aToB.job_id, bToA.job_id] };
      },
      attachGraphToHelixAsk: (graphId) => {
        const graph = get().graphs[graphId];
        if (!graph) return;
        emitHelixAskLiveEvent({
          contextId: HELIX_ASK_CONTEXT_ID.desktop,
          traceId: graph.room_id,
          entry: {
            id: `situation-room-graph-attached:${graphId}:${Date.now()}`,
            text: `attached situation room graph "${graph.title}" with ${graph.nodes.length} node(s) and ${graph.edges.length} edge(s)`,
            tool: "situation-room.graph",
            ts: nowIso(),
            meta: {
              kind: "situation_room_graph_attachment",
              graph,
              attachment_policy: "manual_only",
              context_injection: "explicit_attachment_only",
            },
          },
        });
      },
      setSelectedNode: (graphId, nodeId) =>
        set((state) => ({
          selected_node_id_by_graph: {
            ...state.selected_node_id_by_graph,
            [graphId]: nodeId,
          },
        })),
      reset: () =>
        set({
          graphs: {},
          graph_order: [],
          active_graph_id_by_room: {},
          selected_node_id_by_graph: {},
        }),
    }),
    {
      name: SITUATION_ROOM_GRAPH_STORAGE_KEY,
      partialize: (state) => ({
        graphs: state.graphs,
        graph_order: state.graph_order,
        active_graph_id_by_room: state.active_graph_id_by_room,
        selected_node_id_by_graph: state.selected_node_id_by_graph,
      }),
    },
  ),
);
