export interface SectorSchedule {
  sectorCount: number;
  concurrentSectors: number;
  rows: Array<{ window: number; sector: number; active: boolean }>;
  coveredSectorCount: number;
}

export function extractSectorSchedule(cavity: any): SectorSchedule {
  const sectorCount = Number(cavity?.geometry?.sectorCount ?? 80);
  const concurrentSectors = Number(cavity?.geometry?.concurrentSectors ?? 2);
  const rows: SectorSchedule["rows"] = [];
  const windows = Math.ceil(sectorCount / Math.max(1, concurrentSectors));
  for (let window = 0; window < windows; window += 1) {
    const active = new Set<number>();
    for (let lane = 0; lane < concurrentSectors; lane += 1) {
      active.add((window * concurrentSectors + lane) % sectorCount);
    }
    for (let sector = 0; sector < sectorCount; sector += 1) {
      rows.push({ window, sector, active: active.has(sector) });
    }
  }
  return { sectorCount, concurrentSectors, rows, coveredSectorCount: sectorCount };
}
