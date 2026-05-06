export interface DagNode {
  id: string;
  label: string;
  kind: "artifact" | "gate" | "decision" | "context";
}

export interface DagEdge {
  from: string;
  to: string;
  label?: string;
}

export interface ValidationDag {
  nodes: DagNode[];
  edges: DagEdge[];
}

export function extractValidationDag(_ledger: any): ValidationDag {
  return {
    nodes: [
      { id: "brick", label: "metric brick hash/ref", kind: "artifact" },
      { id: "closure", label: "source closure artifact", kind: "artifact" },
      { id: "observer", label: "observer audit artifact", kind: "gate" },
      { id: "qei", label: "QEI dossier ref", kind: "gate" },
      { id: "ledger", label: "frozen blocker ledger ref", kind: "decision" },
      { id: "claim", label: "claim locks remain false", kind: "decision" },
    ],
    edges: [
      { from: "brick", to: "closure", label: "requires counterpart" },
      { from: "brick", to: "observer", label: "projects" },
      { from: "closure", to: "ledger", label: "feeds blockers" },
      { from: "observer", to: "ledger", label: "feeds blockers" },
      { from: "qei", to: "ledger", label: "constrains" },
      { from: "ledger", to: "claim", label: "locks" },
    ],
  };
}

export function dagToDot(graphName: string, dag: ValidationDag): string {
  const nodeLines = dag.nodes.map((node) => {
    const shape = node.kind === "decision" ? "diamond" : node.kind === "gate" ? "box" : "ellipse";
    const color = node.kind === "decision" ? "#7f9cff" : node.kind === "gate" ? "#f0aa42" : "#66d9e8";
    return `"${node.id}" [label="${escapeDot(node.label)}", shape=${shape}, color="${color}"];`;
  });
  const edgeLines = dag.edges.map((edge) => `"${edge.from}" -> "${edge.to}" [label="${escapeDot(edge.label ?? "")}"];`);
  return `digraph ${graphName} {
    graph [bgcolor="#05080d", rankdir=LR, fontname="Consolas"];
    node [style="rounded", fontname="Consolas", fontcolor="#dbeaf1", color="#66d9e8"];
    edge [fontname="Consolas", fontcolor="#9aa8b2", color="#6b7f8e"];
    ${nodeLines.join("\n    ")}
    ${edgeLines.join("\n    ")}
  }`;
}

function escapeDot(text: string): string {
  return text.replace(/["\\]/g, "\\$&");
}
