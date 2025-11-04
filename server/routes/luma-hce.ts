import express from "express";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const ai = a[i];
    const bi = b[i];
    if (!Number.isFinite(ai) || !Number.isFinite(bi)) continue;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA <= 0 || normB <= 0) return 0;
  return dot / Math.sqrt(normA * normB);
}

function describePeaks(peaks: unknown): string | null {
  if (!Array.isArray(peaks) || peaks.length === 0) return null;
  const summary = (peaks as any[]) // eslint-disable-line @typescript-eslint/no-explicit-any
    .slice(0, 3)
    .map((peak) => {
      if (!peak || typeof peak !== "object") return null;
      if (typeof (peak as any).f === "number") {
        return `${Math.round((peak as any).f)}Hz`;
      }
      if (typeof (peak as any).omega === "number") {
        const approx = Math.round((peak as any).omega * 180 + 80);
        return `${approx}Hz`;
      }
      return null;
    })
    .filter((value): value is string => typeof value === "string");
  if (!summary.length) return null;
  return summary.join(", ");
}

export const lumaHceRouter = express.Router();

lumaHceRouter.post("/hce_explain", (req, res) => {
  const { energies, centers, psi, branch, peaks } = req.body ?? {};
  if (
    !Array.isArray(energies) ||
    !Array.isArray(centers) ||
    !Array.isArray(psi) ||
    typeof branch !== "number"
  ) {
    return res.status(400).json({ error: "invalid-payload" });
  }

  const best = energies.reduce(
    (acc: { value: number; index: number }, value: number, index: number) =>
      value < acc.value ? { value, index } : acc,
    { value: Number.POSITIVE_INFINITY, index: 0 },
  );

  const sorted = energies
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const competitor = sorted.find((item) => item.index !== branch);
  const gap = competitor ? competitor.value - energies[branch] : 0;

  const center = Array.isArray(centers[branch]) ? centers[branch] : [];
  const alignment = center.length === psi.length ? cosineSimilarity(psi, center) : 0;

  const summaryParts = [
    `Selected branch ${branch} due to minimum energy basin (argmin=${best.index}).`,
    `Energy margin to next candidate: ${gap.toFixed(3)}.`,
    `Alignment with center: cos?=${alignment.toFixed(3)}.`,
  ];

  const peakSummary = describePeaks(peaks);
  if (peakSummary) {
    summaryParts.push(`Peaks emphasize ${peakSummary}.`);
  }

  res.json({ explanation: summaryParts.join(" ") });
});
