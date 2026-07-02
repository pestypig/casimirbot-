import * as Calculator from "./capabilities/calculator";
import * as CapabilityCatalog from "./capabilities/capability-catalog";
import * as CivilizationBounds from "./capabilities/civilization-bounds";
import * as DocsViewer from "./capabilities/docs-viewer";
import * as InternetSearch from "./capabilities/internet-search";
import * as ProcessedLiveSourceMail from "./capabilities/processed-live-source-mail";
import * as RepoCode from "./capabilities/repo-code";
import * as ScholarlyResearch from "./capabilities/scholarly-research";
import * as StagePlayReflection from "./capabilities/stage-play-reflection";
import * as TheoryReflection from "./capabilities/theory-reflection";
import * as VisualCapture from "./capabilities/visual-capture";
import * as WorkspaceDirectory from "./capabilities/workspace-directory";
import * as WorkspaceStatus from "./capabilities/workspace-status";
import * as MoralGraphReflection from "./capabilities/moral-graph-reflection";
import * as CatalogWorkspace from "./compounds/catalog-workspace";
import * as CivilizationMoralReflection from "./compounds/civilization-moral-reflection";
import * as DocsCalculator from "./compounds/docs-calculator";
import * as InternetTheoryReflection from "./compounds/internet-theory-reflection";
import * as RepoDocs from "./compounds/repo-docs";
import * as VisualCalculator from "./compounds/visual-calculator";
import * as CompoundItinerary from "./itinerary/compound-itinerary";
import type { RecordLike } from "./core";
import type { HelixAskGoldenPathRuntimeDependencies } from "./runtime-dependencies";

export type GoldenPathDispatchModule = {
  requiredObservationKinds: readonly string[];
  requiredTerminalKinds: readonly string[];
  isRequested: (body: RecordLike) => boolean;
  buildPayload: (args: {
    body: RecordLike;
    deps: HelixAskGoldenPathRuntimeDependencies;
  }) => RecordLike;
};

export const orderedDispatchModules: readonly GoldenPathDispatchModule[] = [
  CatalogWorkspace,
  VisualCalculator,
  CompoundItinerary,
  DocsCalculator,
  RepoDocs,
  InternetTheoryReflection,
  CivilizationMoralReflection,
  ProcessedLiveSourceMail,
  StagePlayReflection,
  InternetSearch,
  ScholarlyResearch,
  CivilizationBounds,
  MoralGraphReflection,
  TheoryReflection,
  VisualCapture,
  Calculator,
  DocsViewer,
  RepoCode,
  WorkspaceDirectory,
  CapabilityCatalog,
  WorkspaceStatus,
];
