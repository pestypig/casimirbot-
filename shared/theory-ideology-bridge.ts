export {
  buildTheoryIdeologyBridgeV1,
  isTheoryIdeologyBridgeV1,
  validateTheoryIdeologyBridgeV1,
  THEORY_IDEOLOGY_BRIDGE_ARTIFACT_ID,
  THEORY_IDEOLOGY_BRIDGE_RELATIONS,
  THEORY_IDEOLOGY_BRIDGE_SCHEMA_VERSION,
  type BuildTheoryIdeologyBridgeInput,
  type TheoryIdeologyBridgeAuthorityV1,
  type TheoryIdeologyBridgeLinkV1,
  type TheoryIdeologyBridgeRecommendedActionV1,
  type TheoryIdeologyBridgeRelationV1,
  type TheoryIdeologyBridgeV1,
} from "./contracts/theory-ideology-bridge.v1";

export {
  buildTheoryIdeologyBridgeFromReflections,
  type BuildTheoryIdeologyBridgeInput as BuildTheoryIdeologyBridgeFromReflectionsInput,
} from "./theory-ideology/build-theory-ideology-bridge";
