import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SimulationResult } from "@shared/schema";

interface ChartVisualizationProps {
  simulation: SimulationResult;
}

export default function ChartVisualization({ simulation }: ChartVisualizationProps) {
  const chartData = useMemo(() => {
    const baseEnergy = simulation?.results?.totalEnergy;
    const baseGapRaw =
      (simulation as any)?.parameters?.gap ??
      (simulation as any)?.parameters?.gapDistance;

    if (!Number.isFinite(baseEnergy as number) || !Number.isFinite(baseGapRaw as number)) {
      return [];
    }

    const baseGap = Number(baseGapRaw); // nm
    const baseE = Number(baseEnergy);

    // Generate points around the base gap to show the relationship
    const points: { gap: number; energy: number; energyMagnitude: number }[] = [];
    for (let i = 0.5; i <= 2.0001; i += 0.1) {
      const gap = baseGap * i;
      // Casimir energy ~ 1/gap^4 (keep sign from base energy)
      const energy = baseE * Math.pow(baseGap / gap, 4);
      points.push({
        gap,
        energy,
        energyMagnitude: Math.abs(energy),
      });
    }

    return points;
  }, [simulation]);

  const formatEnergy = (value: number) => {
    if (!Number.isFinite(value) || value === 0) return "0";
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value);
    const exp = Math.floor(Math.log10(abs));
    const mantissa = (abs / Math.pow(10, exp)).toFixed(1);
    return `${sign}${mantissa}e${exp}`;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-4 h-64 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm">Chart will appear after simulation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg p-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="gap"
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <YAxis
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatEnergy}
          />
          <Tooltip
            formatter={(value: any) => [formatEnergy(Number(value)), "Energy (J)"]}
            labelFormatter={(label: any) => `Gap: ${Number(label).toFixed(2)} nm`}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Line
            type="monotone"
            dataKey="energy"
            name="Energy (J)"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}