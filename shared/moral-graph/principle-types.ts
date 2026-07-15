import type {
  FruitionProceduralOperatorV1,
  FruitionProceduralRoleV1,
} from "../fruition-procedure-expression";

export type MoralWisdomPrinciple = {
  id: string;
  sourceIdeologyNodeId: string;
  label: string;
  glyph: string;
  summary: string;
  proceduralRole: FruitionProceduralRoleV1;
  procedureOperator: FruitionProceduralOperatorV1;
  proceduralRule: string;
  traceBehavior: string;
  actionEffect: string;
  evidenceNeeds: string[];
  refusesAuthority: string[];
  tags: string[];
};
