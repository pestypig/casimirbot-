export type IdeologyGraphLink = {
  rel?: string;
  to: string;
};

export type IdeologyGraphReference = {
  kind?: string;
  title?: string;
  path?: string;
  url?: string;
  id?: string;
  [key: string]: unknown;
};

export type IdeologyGraphAction = {
  label: string;
  action?: {
    kind?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type IdeologyGraphNode = {
  id: string;
  slug?: string;
  title: string;
  excerpt?: string;
  summary?: string;
  bodyMD?: string;
  tags?: string[];
  children?: string[];
  links?: IdeologyGraphLink[];
  references?: IdeologyGraphReference[];
  actions?: IdeologyGraphAction[];
  [key: string]: unknown;
};

export type IdeologyActionGatePolicy = {
  version?: number;
  claim_tier?: string;
  covered_action_tags?: string[];
  legal_key_tags?: string[];
  ethos_key_tags?: string[];
  jurisdiction_floor_ok_tags?: string[];
  hard_fail_ids?: Record<string, string>;
  [key: string]: unknown;
};

export type IdeologyGraphDocument = {
  version?: number;
  rootId: string;
  nodes: IdeologyGraphNode[];
  actionGatePolicy?: IdeologyActionGatePolicy;
  [key: string]: unknown;
};

export type IdeologyGraph = IdeologyGraphDocument & {
  nodeById: Map<string, IdeologyGraphNode>;
  parentIdsById: Map<string, string[]>;
  childIdsById: Map<string, string[]>;
  linkedIdsById: Map<string, string[]>;
};

export type IdeologyGraphValidationIssue = {
  code:
    | "invalid_document"
    | "invalid_root"
    | "invalid_nodes"
    | "invalid_node"
    | "duplicate_node"
    | "invalid_child_endpoint"
    | "invalid_link_endpoint"
    | "invalid_action_gate_policy";
  message: string;
  nodeId?: string;
  targetId?: string;
};
