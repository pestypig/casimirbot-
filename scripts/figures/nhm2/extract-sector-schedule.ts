export interface SectorSchedule {
  sectorCount: number;
  concurrentSectors: number;
  rows: Array<{ window: number; sector: number; active: boolean }>;
}

export function extractSectorSchedule(cavity: any): SectorSchedule {
  const sectorCount = Number(cavity?.geometry?.sectorCount ?? 80);
  const concurrentSectors = Number(cavity?.geometry?.concurrentSectors ?? 2);
  const rows: SectorSchedule["rows"] = [];
  const windows = Math.min(16, sectorCount);
  for (let window = 0; window < windows; window += 1) {
    for (let lane = 0; lane < concurrentSectors; lane += 1) {
      rows.push({ window, sector: (window * concurrentSectors + lane) % sectorCount, active: true });
    }
  }
  return { sectorCount, concurrentSectors, rows };
}
