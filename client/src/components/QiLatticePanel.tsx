import { useEffect, useMemo, useRef, useState } from "react"
import type { QITileSnapshot } from "@shared/schema"
import { QI_S_THRESH } from "@shared/schema"
import { useQiStream } from "@/hooks/useQiStream"
import { useQiStore } from "@/store/useQiStore"
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline"
import type { LatticeGrid, SigmaField } from "@/lib/lattice/field"
import { buildSigmaField } from "@/lib/lattice/field"
import { diffuseSigmaField } from "@/lib/lattice/diffuse"

type QiLatticePanelProps = {
  hz?: number
  mock?: boolean
  params?: Record<string, string | number | boolean | undefined>
}

type ViewMode = "stress" | "saturation"

type HoverInfo = {
  tile: QITileSnapshot
  sigma?: number
  delta?: number
}

type TileLookupEntry = {
  tile: QITileSnapshot
  idx: number | null
}

const CANVAS_W = 360
const CANVAS_H = 280
const SIGMA_RANGE = 3

export function QiLatticePanel({ hz = 15, mock = false, params }: QiLatticePanelProps) {
  const streamParams = useMemo(
    () => ({
      hz,
      ...(mock ? { mock: 1 } : {}),
      ...(params ?? {}),
    }),
    [hz, mock, params],
  )

  useQiStream(true, streamParams)
  const tiles = useQiStore((state) => state.tiles())
  const counts = useQiStore((state) => state.counts())
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("stress")
  const { data: pipeline } = useEnergyPipeline()
  const qiStats = pipeline?.qi
  const homogenizerSource = qiStats?.homogenizerSource
  const homogenizerOffline = homogenizerSource === "offline"
  const homogenizerSimulated = homogenizerSource === "synthetic"

  const fallbackGrid = useMemo(() => {
    if (!tiles.length) return null
    let minI = Infinity
    let minJ = Infinity
    let maxI = -Infinity
    let maxJ = -Infinity
    for (const tile of tiles) {
      const [i, j] = tile.ijk
      minI = Math.min(minI, i)
      minJ = Math.min(minJ, j)
      maxI = Math.max(maxI, i)
      maxJ = Math.max(maxJ, j)
    }
    const cols = Math.max(1, Math.round(maxI - minI + 1))
    const rows = Math.max(1, Math.round(maxJ - minJ + 1))
    return { minI, minJ, cols, rows }
  }, [tiles])

  const sigmaField = useMemo(() => buildSigmaField(tiles), [tiles])
  const diffusedField = useMemo(() => {
    if (!sigmaField) return null
    return diffuseSigmaField(sigmaField.sigma, {
      cols: sigmaField.grid.cols,
      rows: sigmaField.grid.rows,
      iterations: 5,
      alpha: 0.4,
      kappa: 1.1,
      weights: sigmaField.weights,
    })
  }, [sigmaField])
  const deltaField = useMemo(() => {
    if (!sigmaField || !diffusedField) return null
    const arr = new Float32Array(diffusedField.length)
    for (let i = 0; i < diffusedField.length; i += 1) {
      arr[i] = diffusedField[i] - sigmaField.sigma[i]
    }
    return arr
  }, [sigmaField, diffusedField])

  const grid = sigmaField?.grid ?? fallbackGrid

  const tileLookup = useMemo(() => {
    const map = new Map<string, TileLookupEntry>()
    for (const tile of tiles) {
      const [i, j] = tile.ijk
      const idx = sigmaField ? cellIndex(i, j, sigmaField.grid) : null
      map.set(`${i}:${j}`, { tile, idx })
    }
    return map
  }, [tiles, sigmaField])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !grid) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (viewMode === "stress" && sigmaField) {
      renderSigmaField(ctx, canvas, sigmaField, deltaField)
    } else {
      renderSaturationField(ctx, canvas, grid, tiles)
    }
  }, [tiles, grid, sigmaField, diffusedField, deltaField, viewMode])

  const handlePointer = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !grid) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const relX = (event.clientX - rect.left) / rect.width
    const relY = (event.clientY - rect.top) / rect.height
    const i = grid.minI + Math.floor(relX * grid.cols)
    const j = grid.minJ + Math.floor(relY * grid.rows)
    const entry = tileLookup.get(`${i}:${j}`)
    if (!entry) {
      setHover(null)
      return
    }
    const sigma = entry.idx != null && sigmaField ? sigmaField.sigma[entry.idx] : undefined
    const delta = entry.idx != null && deltaField ? deltaField[entry.idx] : undefined
    setHover({ tile: entry.tile, sigma, delta })
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/85 p-4 text-slate-100 shadow-lg">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wide text-slate-400">
        <span>QI Lattice Monitor</span>
        <div className="flex items-center gap-2">
          <strong className="font-semibold text-emerald-300">{counts.green}</strong>/
          <strong className="font-semibold text-amber-300">{counts.amber}</strong>/
          <strong className="font-semibold text-rose-400">{counts.red}</strong>
          <span className="text-[11px] text-slate-500">
            S<sub>max</sub> {counts.worst.toFixed(3)}
          </span>
        </div>
      </div>
      <p className="mb-3 text-[11px] leading-snug text-slate-500">
        Cycle-averaged |T<sup>00</sup>| variance tracked here is the same homogenization guard spelled out in
        <code className="px-1">docs/qi-homogenization-addendum.md</code>; see the Action-Principle telemetry callout in
        <code className="px-1">docs/needle-hull-mainframe.md</code> for how these sigma bands feed the least-action strip.
      </p>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-wide text-slate-500">
        <span>Lattice view</span>
        <div className="flex gap-1">
          <button
            className={`rounded border px-2 py-0.5 transition ${
              viewMode === "stress"
                ? "border-cyan-400/80 bg-cyan-500/10 text-cyan-200"
                : "border-slate-700 bg-transparent text-slate-400"
            }`}
            onClick={() => setViewMode("stress")}
          >
            |T<sup>00</sup>| heat
          </button>
          <button
            className={`rounded border px-2 py-0.5 transition ${
              viewMode === "saturation"
                ? "border-emerald-400/80 bg-emerald-500/10 text-emerald-200"
                : "border-slate-700 bg-transparent text-slate-400"
            }`}
            onClick={() => setViewMode("saturation")}
          >
            S ratio
          </button>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col gap-3">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-lg border border-slate-800 bg-slate-900"
            onMouseMove={handlePointer}
            onMouseLeave={() => setHover(null)}
          />
          {viewMode === "stress" && (
            <div className="text-[10px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>-3σ</span>
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #2563eb, #f8fafc, #f87171)",
                  }}
                />
                <span>+3σ</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3 w-3 border border-slate-200/70" />
                  <span>|σ| ≈ 1 boundary</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-5 bg-emerald-400/60" />
                  <span>↑ trim / ↓ payback</span>
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 text-sm leading-relaxed text-slate-200">
          {hover ? (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Tile</div>
              <div className="text-lg font-semibold text-slate-50">{hover.tile.tileId}</div>
              <div className="mt-2 font-mono text-xs text-slate-300">
                S={hover.tile.S.toFixed(3)} · ρ={hover.tile.rho_neg_Jm3.toFixed(3)} J/m³
              </div>
              <div className="font-mono text-xs text-slate-400">
                τ={hover.tile.tau_eff_s.toExponential(2)} s · QI={hover.tile.qi_limit.toExponential(2)}
              </div>
              {typeof hover.tile.absRho_Jm3 === "number" && (
                <div className="font-mono text-xs text-slate-400">
                  |T<sup>00</sup>|={hover.tile.absRho_Jm3.toFixed(3)} J/m³
                </div>
              )}
              <div className="font-mono text-xs text-slate-400">
                σ dev={formatNumber(hover.sigma, 2)} · Δσ preview={formatNumber(hover.delta, 3)}
              </div>
              {typeof hover.tile.weight === "number" && (
                <div className="font-mono text-xs text-slate-400">w={formatNumber(hover.tile.weight, 2)}</div>
              )}
              {typeof hover.tile.Q_factor === "number" && (
                <div className="font-mono text-xs text-slate-400">
                  Q={hover.tile.Q_factor.toExponential(2)}
                </div>
              )}
              {typeof hover.tile.T_K === "number" && (
                <div className="font-mono text-xs text-slate-400">
                  T={hover.tile.T_K.toFixed(1)} K
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500">
              Hover any tile to inspect saturation, |T<sup>00</sup>| deviation, and the suggested
              diffusion trims. Mock mode available via `mock=1` (dev / loopback only).
            </div>
          )}

          {homogenizerOffline && (
            <div className="mt-4 rounded border border-slate-700/60 bg-slate-900/60 p-3 text-[11px] text-amber-200">
              Homogenizer stream is offline—no tile telemetry available from hardware.
            </div>
          )}

          {homogenizerSimulated && !homogenizerOffline && (
            <div className="mt-4 rounded border border-slate-800/60 bg-slate-900/40 p-3 text-[11px] text-slate-300">
              Display uses synthesized tiles from pipeline heuristics. Real lattice feeds will replace
              this view automatically when available.
            </div>
          )}

          {sigmaField && (
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
              <span className="text-slate-500">mean |T<sup>00</sup>|</span>
              <span className="text-right">{formatNumber(sigmaField.stats.meanAbs, 3)} J/m³</span>

              <span className="text-slate-500">σ(|T<sup>00</sup>|)</span>
              <span className="text-right">{formatNumber(sigmaField.stats.stdAbs, 3)} J/m³</span>

              <span className="text-slate-500">max σ tile</span>
              <span className="text-right">{formatNumber(sigmaField.stats.maxSigma, 2)} σ</span>
            </div>
          )}

          {qiStats && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
              <span className="text-slate-500">var T<sup>00</sup> (norm)</span>
              <span className="text-right">{formatNumber(qiStats.varT00_lattice, 3)}</span>

              <span className="text-slate-500">σ grid (norm)</span>
              <span className="text-right">{formatNumber(qiStats.sigmaT00_norm, 3)}</span>

              <span className="text-slate-500">max σ tile (server)</span>
              <span className="text-right">{formatNumber(qiStats.maxTileSigma, 2)} σ</span>

              <span className="text-slate-500">trim energy hint</span>
              <span className="text-right">{formatNumber(qiStats.trimEnergy_pct, 1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function renderSaturationField(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  grid: LatticeGrid,
  tiles: QITileSnapshot[],
) {
  if (!grid.cols || !grid.rows) return
  const cellW = canvas.width / grid.cols
  const cellH = canvas.height / grid.rows
  ctx.save()
  ctx.translate(0.5, 0.5)
  for (const tile of tiles) {
    const [i, j] = tile.ijk
    const col = i - grid.minI
    const row = j - grid.minJ
    if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) continue
    const x = col * cellW
    const y = row * cellH
    ctx.fillStyle = colorForS(tile.S)
    ctx.fillRect(x, y, Math.max(1, cellW - 1), Math.max(1, cellH - 1))
  }
  ctx.restore()
}

function renderSigmaField(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  field: SigmaField,
  delta: Float32Array | null,
) {
  const { cols, rows } = field.grid
  if (!cols || !rows) return
  const cellW = canvas.width / cols
  const cellH = canvas.height / rows
  ctx.save()
  ctx.translate(0.5, 0.5)
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const idx = row * cols + col
      const sigma = field.sigma[idx]
      const x = col * cellW
      const y = row * cellH
      ctx.fillStyle = sigmaToColor(sigma)
      ctx.fillRect(x, y, Math.max(1, cellW - 1), Math.max(1, cellH - 1))

      if (Math.abs(Math.abs(sigma) - 1) < 0.12) {
        ctx.strokeStyle = "rgba(248,248,255,0.7)"
        ctx.lineWidth = 0.75
        ctx.strokeRect(x + 0.4, y + 0.4, Math.max(0, cellW - 0.8), Math.max(0, cellH - 0.8))
      }

      if (delta) {
        const deltaValue = delta[idx]
        const magnitude = Math.min(1, Math.abs(deltaValue) / 1.5)
        if (magnitude > 0.08) {
          drawArrow(ctx, x, y, cellW, cellH, deltaValue >= 0, magnitude)
        }
      }
    }
  }
  ctx.restore()
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  upward: boolean,
  magnitude: number,
) {
  const cx = x + cellW / 2
  const cy = y + cellH / 2
  const length = (Math.min(cellW, cellH) * 0.4) * magnitude
  ctx.strokeStyle = upward ? "rgba(34,197,94,0.9)" : "rgba(251,191,36,0.9)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy + (upward ? -length : length))
  ctx.stroke()
  ctx.beginPath()
  const headSize = 3
  if (upward) {
    ctx.moveTo(cx, cy - length)
    ctx.lineTo(cx - headSize, cy - length + headSize)
    ctx.lineTo(cx + headSize, cy - length + headSize)
  } else {
    ctx.moveTo(cx, cy + length)
    ctx.lineTo(cx - headSize, cy + length - headSize)
    ctx.lineTo(cx + headSize, cy + length - headSize)
  }
  ctx.closePath()
  ctx.fillStyle = ctx.strokeStyle
  ctx.fill()
}

function colorForS(S: number): string {
  if (S >= QI_S_THRESH.red) return "#E53935"
  if (S >= QI_S_THRESH.amber) return "#FDD835"
  return "#43A047"
}

const BLUE: [number, number, number] = [37, 99, 235]
const WHITE: [number, number, number] = [248, 250, 252]
const RED: [number, number, number] = [248, 113, 113]

function sigmaToColor(value: number): string {
  const clamped = Math.max(-SIGMA_RANGE, Math.min(SIGMA_RANGE, value)) / SIGMA_RANGE
  if (clamped < 0) {
    return mixColor(WHITE, BLUE, Math.abs(clamped))
  }
  return mixColor(WHITE, RED, clamped)
}

function mixColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

function formatNumber(value: number | undefined, digits = 3): string {
  if (!Number.isFinite(value)) return "--"
  return Number(value).toFixed(digits)
}

function cellIndex(i: number, j: number, grid: LatticeGrid): number | null {
  const col = i - grid.minI
  const row = j - grid.minJ
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return null
  return row * grid.cols + col
}
