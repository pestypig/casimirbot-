import type sharp from "sharp";

export type OverlayList = sharp.OverlayOptions[];

export interface Badge {
  label: string;
  status: string;
  tone: "pass" | "review" | "fail" | "unknown" | "locked";
}

export interface RegionStatus {
  region: "global" | "hull" | "wall" | "exterior_shell";
  status: string;
  tone: Badge["tone"];
}

export function drawAxisTriad(overlays: OverlayList, width: number, height: number): void {
  overlays.push(svgOverlay(width, height, `
    <g transform="translate(${width - 126},${height - 112})" font-family="Consolas, monospace" font-size="12" fill="#d8eef6">
      <line x1="0" y1="56" x2="66" y2="56" stroke="#7ee7ff" stroke-width="1.2" marker-end="url(#arrow)"/>
      <line x1="0" y1="56" x2="-32" y2="36" stroke="#f7c35f" stroke-width="1.2" marker-end="url(#arrow)"/>
      <line x1="0" y1="56" x2="0" y2="4" stroke="#a7f28f" stroke-width="1.2" marker-end="url(#arrow)"/>
      <text x="70" y="60">x_ship</text>
      <text x="-62" y="34">y_port</text>
      <text x="6" y="10">z</text>
    </g>
    <defs>
      <marker id="arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#d8eef6"/>
      </marker>
    </defs>
  `));
}

export function drawCenterlineWorldline(overlays: OverlayList, width: number, height: number): void {
  overlays.push(svgOverlay(width, height, `
    <path d="M ${Math.round(width * 0.18)} ${Math.round(height * 0.53)} C ${Math.round(width * 0.38)} ${Math.round(height * 0.47)}, ${Math.round(width * 0.62)} ${Math.round(height * 0.47)}, ${Math.round(width * 0.82)} ${Math.round(height * 0.53)}"
      fill="none" stroke="#dffbff" stroke-width="1.2" stroke-dasharray="8 8"/>
    <circle cx="${Math.round(width * 0.5)}" cy="${Math.round(height * 0.5)}" r="4" fill="#7ee7ff"/>
  `));
}

export function drawLedgerBadgeStrip(overlays: OverlayList, width: number, height: number, badges: Badge[]): void {
  const badgeWidth = Math.max(118, Math.floor((width - 28) / Math.max(1, badges.length)));
  const nodes = badges
    .map((badge, i) => {
      const x = 14 + i * badgeWidth;
      const color = toneColor(badge.tone);
      const lock = badge.tone === "locked" ? " LOCK" : "";
      return `
        <rect x="${x}" y="${height - 44}" width="${badgeWidth - 8}" height="30" rx="7" fill="#07111b" stroke="${color}" stroke-width="1.2"/>
        <circle cx="${x + 13}" cy="${height - 29}" r="4" fill="${color}"/>
        <text x="${x + 22}" y="${height - 31}" font-size="9" fill="#d7e8ef">${escapeXml(badge.label)}</text>
        <text x="${x + 22}" y="${height - 20}" font-size="9" fill="${color}">${escapeXml(badge.status + lock)}</text>`;
    })
    .join("");
  overlays.push(svgOverlay(width, height, `<g font-family="Consolas, monospace">${nodes}</g>`));
}

export function drawTensorAuthorityMatrix(overlays: OverlayList, width: number, height: number, options: { x?: number; y?: number } = {}): void {
  const x0 = options.x ?? width - 230;
  const y0 = options.y ?? 46;
  const cell = 26;
  let cells = "";
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const diag = r === c;
      const fill = diag ? "#123b36" : "#3b2a12";
      const stroke = diag ? "#40d7a0" : "#f2ae4a";
      cells += `<rect x="${x0 + c * cell}" y="${y0 + r * cell}" width="${cell - 3}" height="${cell - 3}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
      cells += `<text x="${x0 + c * cell + 6}" y="${y0 + r * cell + 17}" font-size="9" fill="${stroke}">${r}${c}</text>`;
    }
  }
  overlays.push(svgOverlay(width, height, `
    <g font-family="Consolas, monospace">
      <text x="${x0}" y="${y0 - 12}" font-size="13" fill="#e6f1f6">Full tensor authority gate</text>
      ${cells}
      <text x="${x0}" y="${y0 + 122}" font-size="10" fill="#f2ae4a">off-diagonal authority locked/review</text>
    </g>
  `));
}

export function drawObserverQeiInset(overlays: OverlayList, width: number, height: number, status: string, tone: Badge["tone"]): void {
  const x = 24;
  const y = 42;
  const color = toneColor(tone);
  overlays.push(svgOverlay(width, height, `
    <g font-family="Consolas, monospace">
      <rect x="${x}" y="${y}" width="222" height="112" rx="10" fill="#07111bea" stroke="${color}" stroke-width="1.2"/>
      <text x="${x + 14}" y="${y + 24}" font-size="13" fill="#e6f1f6">Observer / QEI placeholder</text>
      <path d="M ${x + 22} ${y + 74} C ${x + 72} ${y + 40}, ${x + 138} ${y + 110}, ${x + 200} ${y + 58}" fill="none" stroke="#e05aff" stroke-width="1" stroke-dasharray="5 5"/>
      <circle cx="${x + 70}" cy="${y + 72}" r="16" fill="none" stroke="#dffbff" stroke-width="1"/>
      <line x1="${x + 70}" y1="${y + 72}" x2="${x + 70}" y2="${y + 61}" stroke="#dffbff" stroke-width="1"/>
      <line x1="${x + 70}" y1="${y + 72}" x2="${x + 81}" y2="${y + 72}" stroke="#dffbff" stroke-width="1"/>
      <text x="${x + 14}" y="${y + 100}" font-size="10" fill="${color}">QEI dossier: ${escapeXml(status)}</text>
    </g>
  `));
}

export function drawSourceClosureBrackets(overlays: OverlayList, width: number, height: number, statuses: RegionStatus[]): void {
  const rows = statuses
    .map((entry, i) => {
      const y = 96 + i * 34;
      const color = toneColor(entry.tone);
      return `
        <path d="M 34 ${y} h 58 M 34 ${y} v 20 M ${width - 92} ${y} h 58 M ${width - 34} ${y} v 20" stroke="${color}" stroke-width="1.5" fill="none"/>
        <text x="102" y="${y + 5}" font-size="11" fill="${color}">${escapeXml(entry.region)}: ${escapeXml(entry.status)}</text>`;
    })
    .join("");
  overlays.push(svgOverlay(width, height, `<g font-family="Consolas, monospace">${rows}</g>`));
}

export function drawSectorScheduleInset(overlays: OverlayList, width: number, height: number, sectorCount: number, activeCount: number): void {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.29;
  const ry = height * 0.15;
  let lines = "";
  for (let i = 0; i < sectorCount; i += 1) {
    const theta = (i / sectorCount) * Math.PI * 2;
    const x1 = cx + Math.cos(theta) * rx * 0.72;
    const y1 = cy + Math.sin(theta) * ry * 0.72;
    const x2 = cx + Math.cos(theta) * rx;
    const y2 = cy + Math.sin(theta) * ry;
    const active = i < activeCount;
    lines += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${active ? (i % 2 === 0 ? "#f2ae4a" : "#e05aff") : "#88b8c855"}" stroke-width="${active ? 2.2 : 0.7}"/>`;
  }
  overlays.push(svgOverlay(width, height, `
    <g font-family="Consolas, monospace">
      ${lines}
      <text x="${Math.round(cx - 150)}" y="${Math.round(cy + ry + 34)}" font-size="11" fill="#d7e8ef">${sectorCount} scheduled sectors; ${activeCount} active demonstration sectors</text>
    </g>
  `));
}

export function drawTileInsetFrame(overlays: OverlayList, width: number, height: number, label = "Representative Casimir tile-sector element, layout scale."): void {
  const x = width - 248;
  const y = height - 248;
  overlays.push(svgOverlay(width, height, `
    <g font-family="Consolas, monospace">
      <rect x="${x}" y="${y}" width="224" height="178" rx="10" fill="#07111bea" stroke="#7ee7ff" stroke-width="1.1"/>
      <rect x="${x + 48}" y="${y + 40}" width="96" height="96" rx="5" fill="#152939" stroke="#83d9ff" stroke-width="1"/>
      <rect x="${x + 66}" y="${y + 58}" width="60" height="60" rx="4" fill="#293a1b" stroke="#c7f06d" stroke-width="1"/>
      <rect x="${x + 58}" y="${y + 50}" width="76" height="8" fill="#d7a443"/>
      <rect x="${x + 58}" y="${y + 118}" width="76" height="8" fill="#af6cff"/>
      <circle cx="${x + 54}" cy="${y + 46}" r="5" fill="#d9edf4"/>
      <circle cx="${x + 138}" cy="${y + 46}" r="5" fill="#d9edf4"/>
      <circle cx="${x + 54}" cy="${y + 130}" r="5" fill="#d9edf4"/>
      <circle cx="${x + 138}" cy="${y + 130}" r="5" fill="#d9edf4"/>
      <g fill="#07111b" stroke="#7ee7ff" stroke-width="0.8">
        <circle cx="${x + 78}" cy="${y + 78}" r="3"/>
        <circle cx="${x + 96}" cy="${y + 78}" r="3"/>
        <circle cx="${x + 114}" cy="${y + 78}" r="3"/>
        <circle cx="${x + 78}" cy="${y + 98}" r="3"/>
        <circle cx="${x + 96}" cy="${y + 98}" r="3"/>
        <circle cx="${x + 114}" cy="${y + 98}" r="3"/>
      </g>
      <rect x="${x + 160}" y="${y + 54}" width="32" height="18" fill="#ec6a48"/>
      <rect x="${x + 160}" y="${y + 102}" width="32" height="18" fill="#ec6a48"/>
      <text x="${x + 12}" y="${y + 154}" font-size="9" fill="#d7e8ef">${escapeXml(label)}</text>
      <text x="${x + 12}" y="${y + 168}" font-size="9" fill="#f2ae4a">Mask/process layers, not field strength.</text>
    </g>
  `));
}

export function drawLegend(overlays: OverlayList, width: number, _height: number, items: { label: string; color: string }[]): void {
  const nodes = items
    .map((item, i) => `
      <circle cx="${26 + i * 172}" cy="24" r="5" fill="${item.color}"/>
      <text x="${38 + i * 172}" y="28" font-size="11" fill="#d7e8ef">${escapeXml(item.label)}</text>`)
    .join("");
  overlays.push(svgOverlay(width, 44, `<g font-family="Consolas, monospace"><rect width="100%" height="44" fill="#05080dcc"/>${nodes}</g>`));
}

function toneColor(tone: Badge["tone"]): string {
  switch (tone) {
    case "pass":
      return "#40d7a0";
    case "review":
      return "#f2ae4a";
    case "fail":
      return "#ec6a48";
    case "locked":
      return "#86a5ff";
    default:
      return "#8a98a6";
  }
}

function svgOverlay(width: number, height: number, svg: string, left = 0, top = 0): sharp.OverlayOptions {
  return {
    input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svg}</svg>`),
    left,
    top,
  };
}

function escapeXml(text: string): string {
  return String(text).replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}
