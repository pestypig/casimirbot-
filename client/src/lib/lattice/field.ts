import type { QITileSnapshot } from "@shared/schema"
import { clamp } from "@/lib/utils"

export interface LatticeGrid {
  minI: number
  minJ: number
  cols: number
  rows: number
}

export interface SigmaFieldStats {
  meanAbs: number
  stdAbs: number
  maxSigma: number
}

export interface SigmaField {
  grid: LatticeGrid
  sigma: Float32Array
  weights: Float32Array
  absValues: Float32Array
  order: Array<QITileSnapshot | null>
  stats: SigmaFieldStats
}

const EPS = 1e-9

export function buildSigmaField(tiles: QITileSnapshot[]): SigmaField | null {
  if (!tiles.length) return null

  let minI = Infinity
  let maxI = -Infinity
  let minJ = Infinity
  let maxJ = -Infinity
  for (const tile of tiles) {
    const [i, j] = tile.ijk
    minI = Math.min(minI, i)
    maxI = Math.max(maxI, i)
    minJ = Math.min(minJ, j)
    maxJ = Math.max(maxJ, j)
  }

  if (!Number.isFinite(minI) || !Number.isFinite(minJ)) {
    return null
  }

  const cols = Math.max(1, Math.round(maxI - minI + 1))
  const rows = Math.max(1, Math.round(maxJ - minJ + 1))
  const total = cols * rows
  const sigma = new Float32Array(total)
  const weights = new Float32Array(total)
  const absValues = new Float32Array(total)
  const order: Array<QITileSnapshot | null> = new Array(total).fill(null)
  const samples: number[] = []

  for (const tile of tiles) {
    const [i, j] = tile.ijk
    const col = i - minI
    const row = j - minJ
    if (col < 0 || row < 0 || col >= cols || row >= rows) continue
    const idx = row * cols + col
    const absVal =
      typeof tile.absRho_Jm3 === "number"
        ? Math.abs(tile.absRho_Jm3)
        : Math.abs(tile.rho_neg_Jm3)
    absValues[idx] = absVal
    weights[idx] = typeof tile.weight === "number" ? clamp(tile.weight, 0.05, 1) : 1
    order[idx] = tile
    samples.push(absVal)
  }

  if (!samples.length) return null

  const stats = measure(samples)
  let maxSigma = 0
  for (let idx = 0; idx < total; idx += 1) {
    const tile = order[idx]
    if (!tile) continue
    const absVal = absValues[idx]
    const sigmaValue =
      typeof tile.sigmaNorm === "number"
        ? tile.sigmaNorm
        : stats.stdAbs > EPS
          ? (absVal - stats.meanAbs) / stats.stdAbs
          : 0
    sigma[idx] = sigmaValue
    maxSigma = Math.max(maxSigma, Math.abs(sigmaValue))
  }

  return {
    grid: { minI, minJ, cols, rows },
    sigma,
    weights,
    absValues,
    order,
    stats: {
      meanAbs: stats.meanAbs,
      stdAbs: stats.stdAbs,
      maxSigma,
    },
  }
}

function measure(values: number[]): { meanAbs: number; stdAbs: number } {
  if (!values.length) return { meanAbs: 0, stdAbs: 0 }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  let variance = 0
  for (const value of values) {
    const delta = value - mean
    variance += delta * delta
  }
  variance /= values.length
  return { meanAbs: mean, stdAbs: Math.sqrt(Math.max(variance, 0)) }
}
