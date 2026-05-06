import { FIGURE_BACKGROUND } from "../figure-colors.js";
import type { SectorSchedule } from "./extract-sector-schedule.js";

export function sectorScheduleOverviewSpec(schedule: SectorSchedule): any {
  return {
    width: 680,
    height: 360,
    background: FIGURE_BACKGROUND,
    title: { text: `Sector duty-cycle schedule: ${schedule.sectorCount} sectors, ${schedule.concurrentSectors} active/window`, color: "#dbeaf1" },
    data: { values: schedule.rows },
    mark: { type: "rect" },
    encoding: {
      x: { field: "window", type: "ordinal", title: "schedule window", axis: axisStyle() },
      y: { field: "sector", type: "ordinal", title: "all sectors", axis: axisStyle() },
      color: {
        field: "active",
        type: "nominal",
        scale: { domain: [false, true], range: ["#162330", "#f0aa42"] },
        legend: { labelColor: "#dbeaf1", titleColor: "#dbeaf1", title: "scheduled active" },
      },
    },
    config: {
      font: "Consolas",
      view: { stroke: "#1c2b38" },
      axis: axisStyle(),
      legend: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" },
    },
  };
}

function axisStyle(): any {
  return { labelColor: "#dbeaf1", titleColor: "#dbeaf1", gridColor: "#263342", domainColor: "#6b7f8e", tickColor: "#6b7f8e", labelFontSize: 8 };
}
