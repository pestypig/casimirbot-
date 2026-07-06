import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

type PanelAuditTarget = {
  panelId: string;
  label: string;
  files: string[];
  dynamicContentRefs?: string[];
};

type HardcodedTextFinding = {
  file: string;
  line: number;
  column: number;
  surface: string;
  text: string;
  classification: "unresolved_static_ui" | "deferred_developer_or_symbol";
};

type PanelCoverageReport = {
  panelId: string;
  label: string;
  files: string[];
  catalogCoveredStaticRefs: string[];
  dynamicTranslatableRefs: string[];
  unresolvedStaticUi: HardcodedTextFinding[];
  deferredDeveloperOrSymbol: HardcodedTextFinding[];
};

const repoRoot = process.cwd();

const auditTargets: PanelAuditTarget[] = [
  {
    panelId: "workstation-shell",
    label: "Workstation shell, tabs, and host",
    files: [
      "client/src/components/workstation/HelixWorkstationShell.tsx",
      "client/src/components/workstation/WorkstationPanelTabs.tsx",
      "client/src/components/workstation/WorkstationPanelHost.tsx",
      "client/src/pages/mobile-start.tsx",
    ],
  },
  {
    panelId: "account-session",
    label: "Account & Sessions",
    files: ["client/src/components/workstation/AccountSessionPanel.tsx"],
  },
  {
    panelId: "docs-viewer",
    label: "Docs & Papers",
    files: ["client/src/components/DocViewerPanel.tsx"],
    dynamicContentRefs: [
      "active document title/path",
      "visible document paragraphs",
      "selected document text",
      "document translation chunks",
    ],
  },
  {
    panelId: "situation-room",
    label: "Situation Room",
    files: ["client/src/components/workstation/SituationRoomPipelinesPanel.tsx"],
    dynamicContentRefs: [
      "pipeline job labels",
      "source excerpts",
      "translation output blocks",
      "external observation summaries",
    ],
  },
  {
    panelId: "theory-badge-graph",
    label: "Theory Badge Graph",
    files: ["client/src/components/panels/TheoryBadgeGraphPanel.tsx"],
    dynamicContentRefs: [
      "badge.title",
      "badge.plainMeaning",
      "edge.label",
      "equation.expression",
      "payload.label",
      "source.title",
      "atlas lens and preset data",
      "reflection and playback observations",
    ],
  },
  {
    panelId: "scientific-calculator",
    label: "Scientific Calculator",
    files: ["client/src/components/panels/ScientificCalculatorPanel.tsx"],
    dynamicContentRefs: [
      "calculator expression input/output",
      "theory run payload values",
      "computed step explanations",
    ],
  },
  {
    panelId: "image-lens",
    label: "Image Lens",
    files: [
      "client/src/components/workstation/DocumentImageLensPanel.tsx",
      "client/src/components/workstation/ImageLensPanel.tsx",
    ],
    dynamicContentRefs: [
      "OCR text",
      "image region labels",
      "scientific evidence packet text",
      "source image metadata",
    ],
  },
];

const visibleStringAttributes = new Set([
  "aria-label",
  "alt",
  "label",
  "placeholder",
  "title",
]);

const ignoredAttributes = new Set([
  "className",
  "data-testid",
  "data-workstation-panel-id",
  "href",
  "id",
  "key",
  "role",
  "type",
]);

const developerOrSymbolPatterns = [
  /^[+\-x×*/=<>()[\]{}|.:,;!?_#%&\s]+$/,
  /^[-\s]*[a-zA-Z0-9_.:-]+\s*[:=]$/,
  /^[A-Z0-9_./:-]{2,}$/,
  /^\d+(?:\.\d+)?(?:\s*[a-zA-Z%/]+)?$/,
  /^[A-Za-z0-9_.:-]+\/v\d+$/,
  /^[A-Za-z0-9_.:-]+:[A-Za-z0-9_.:-]+$/,
  /^#[0-9a-fA-F]{3,8}$/,
];

function toRepoPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function fileExists(repoRelativePath: string): boolean {
  return fs.existsSync(path.join(repoRoot, repoRelativePath));
}

function lineAndColumn(sourceFile: ts.SourceFile, position: number): { line: number; column: number } {
  const location = sourceFile.getLineAndCharacterOfPosition(position);
  return { line: location.line + 1, column: location.character + 1 };
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isDeveloperOrSymbolText(text: string, surface: string): boolean {
  if (!/[A-Za-z]/.test(text)) return true;
  if (text.length <= 2) return true;
  if (ignoredAttributes.has(surface)) return true;
  return developerOrSymbolPatterns.some((pattern) => pattern.test(text));
}

function readAttributeName(name: ts.JsxAttributeName): string {
  return ts.isIdentifier(name) ? name.text : name.getText();
}

function collectCatalogRefs(text: string): string[] {
  const refs = new Set<string>();
  const patterns = [
    /\b(?:t|interfaceText\.t)\(\s*["']([^"']+)["']/g,
    /\bgetInterfacePanelTitle\(\s*[^,]+,\s*[^,]+,\s*[^)]*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      refs.add(match[1] ?? "panel-title-route");
    }
  }
  return Array.from(refs).sort();
}

function collectDynamicRefs(text: string, configuredRefs: string[] = []): string[] {
  const refs = new Set<string>(configuredRefs);
  const dynamicPatterns: Array<[RegExp, string]> = [
    [/\bbadge\.title\b/g, "badge.title"],
    [/\bbadge\.plainMeaning\b/g, "badge.plainMeaning"],
    [/\bedge\.label\b/g, "edge.label"],
    [/\bsource\.(?:title|url|kind)\b/g, "source metadata"],
    [/\b(?:translatedText|translationBlocks|activeTranslationBlocks)\b/g, "translation blocks"],
    [/\b(?:selectedText|hoveredText|visibleText)\b/g, "selected/hovered/visible text"],
    [/\b(?:calculatorResult|expression|computedValue)\b/g, "calculator values"],
    [/\b(?:ocr|recognizedText|evidencePacket)\b/gi, "OCR/evidence packet text"],
  ];
  for (const [pattern, label] of dynamicPatterns) {
    if (pattern.test(text)) refs.add(label);
  }
  return Array.from(refs).sort();
}

function collectHardcodedText(sourceFile: ts.SourceFile, repoRelativePath: string): HardcodedTextFinding[] {
  const findings: HardcodedTextFinding[] = [];

  const addFinding = (node: ts.Node, surface: string, rawText: string) => {
    const text = cleanText(rawText);
    if (!text || !/[A-Za-z]/.test(text)) return;
    const { line, column } = lineAndColumn(sourceFile, node.getStart(sourceFile));
    const classification = isDeveloperOrSymbolText(text, surface)
      ? "deferred_developer_or_symbol"
      : "unresolved_static_ui";
    findings.push({
      file: repoRelativePath,
      line,
      column,
      surface,
      text,
      classification,
    });
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      addFinding(node, "jsx-text", node.getText(sourceFile));
    } else if (ts.isJsxAttribute(node)) {
      const attrName = readAttributeName(node.name);
      if (ignoredAttributes.has(attrName)) return;
      if (node.initializer && ts.isStringLiteral(node.initializer)) {
        if (visibleStringAttributes.has(attrName)) {
          addFinding(node.initializer, attrName, node.initializer.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return findings;
}

function auditFile(repoRelativePath: string): {
  catalogRefs: string[];
  dynamicRefs: string[];
  findings: HardcodedTextFinding[];
  missing: boolean;
} {
  if (!fileExists(repoRelativePath)) {
    return {
      catalogRefs: [],
      dynamicRefs: [],
      findings: [{
        file: repoRelativePath,
        line: 1,
        column: 1,
        surface: "file",
        text: "Audit target file is missing",
        classification: "unresolved_static_ui",
      }],
      missing: true,
    };
  }
  const absolutePath = path.join(repoRoot, repoRelativePath);
  const text = fs.readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    absolutePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    repoRelativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  return {
    catalogRefs: collectCatalogRefs(text),
    dynamicRefs: collectDynamicRefs(text),
    findings: collectHardcodedText(sourceFile, repoRelativePath),
    missing: false,
  };
}

function auditPanel(target: PanelAuditTarget): PanelCoverageReport {
  const catalogRefs = new Set<string>();
  const dynamicRefs = new Set<string>(target.dynamicContentRefs ?? []);
  const unresolvedStaticUi: HardcodedTextFinding[] = [];
  const deferredDeveloperOrSymbol: HardcodedTextFinding[] = [];

  for (const repoRelativePath of target.files) {
    const fileAudit = auditFile(repoRelativePath);
    fileAudit.catalogRefs.forEach((ref) => catalogRefs.add(ref));
    fileAudit.dynamicRefs.forEach((ref) => dynamicRefs.add(ref));
    for (const finding of fileAudit.findings) {
      if (finding.classification === "deferred_developer_or_symbol") {
        deferredDeveloperOrSymbol.push(finding);
      } else {
        unresolvedStaticUi.push(finding);
      }
    }
  }

  return {
    panelId: target.panelId,
    label: target.label,
    files: target.files.map(toRepoPath),
    catalogCoveredStaticRefs: Array.from(catalogRefs).sort(),
    dynamicTranslatableRefs: Array.from(dynamicRefs).sort(),
    unresolvedStaticUi,
    deferredDeveloperOrSymbol,
  };
}

const panels = auditTargets.map(auditPanel);
const totals = panels.reduce(
  (acc, panel) => {
    acc.catalogCoveredStaticRefs += panel.catalogCoveredStaticRefs.length;
    acc.dynamicTranslatableRefs += panel.dynamicTranslatableRefs.length;
    acc.unresolvedStaticUi += panel.unresolvedStaticUi.length;
    acc.deferredDeveloperOrSymbol += panel.deferredDeveloperOrSymbol.length;
    return acc;
  },
  {
    catalogCoveredStaticRefs: 0,
    dynamicTranslatableRefs: 0,
    unresolvedStaticUi: 0,
    deferredDeveloperOrSymbol: 0,
  },
);

const summary = {
  ok: true,
  purpose: "Report workstation language coverage by panel before adding more target languages.",
  classificationLegend: {
    catalogCoveredStaticRefs: "Stable UI routed through the interface catalog.",
    dynamicTranslatableRefs: "Runtime/domain content that should use translate-on-demand with provenance.",
    unresolvedStaticUi: "Likely stable UI still hardcoded in English and needing catalog coverage or explicit reclassification.",
    deferredDeveloperOrSymbol: "Developer-only, identifiers, symbols, or terse controls that can be reviewed later.",
  },
  totals,
  panels: panels.map((panel) => ({
    panelId: panel.panelId,
    label: panel.label,
    files: panel.files,
    catalogCoveredStaticRefCount: panel.catalogCoveredStaticRefs.length,
    catalogCoveredStaticRefs: panel.catalogCoveredStaticRefs,
    dynamicTranslatableRefCount: panel.dynamicTranslatableRefs.length,
    dynamicTranslatableRefs: panel.dynamicTranslatableRefs,
    unresolvedStaticUiCount: panel.unresolvedStaticUi.length,
    unresolvedStaticUiSample: panel.unresolvedStaticUi.slice(0, 25),
    deferredDeveloperOrSymbolCount: panel.deferredDeveloperOrSymbol.length,
    deferredDeveloperOrSymbolSample: panel.deferredDeveloperOrSymbol.slice(0, 15),
  })),
};

console.log(JSON.stringify(summary, null, 2));
