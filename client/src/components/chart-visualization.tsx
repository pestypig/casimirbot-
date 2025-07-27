import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SimulationResult } from "@shared/schema";

interface ChartVisualizationProps {
  simulation: SimulationResult;
}

export default function ChartVisualization({ simulation }: ChartVisualizationProps) {
  const chartData = useMemo(() => {
    if (!simulation.results?.totalEnergy) {
      return [];
    }

    // Generate sample data points for visualization
    const baseGap = simulation.parameters.gap; // nm
    const baseEnergy = simulation.results.totalEnergy;
    
    // Generate points around the base gap to show the relationship
    const points = [];
    for (let i = 0.5; i <= 2.0; i += 0.1) {
      const gap = baseGap * i;
      // Casimir energy scales approximately as 1/gap^4
      const energy = baseEnergy * Math.pow(baseGap / gap, 4);
      points.push({
        gap: gap,
        energy: energy,
        energyMagnitude: Math.abs(energy)
      });
    }
    
    return points;
  }, [simulation]);

  const formatEnergy = (value: number) => {
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = (value / Math.pow(10, exp)).toFixed(1);
    return `${mantissa}e${exp}`;
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
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="gap" 
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatEnergy}
          />
          <Tooltip 
            formatter={(value: number) => [formatEnergy(value), "Energy (J)"]}
            labelFormatter={(label: number) => `Gap: ${label.toFixed(2)} nm`}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px"
            }}
          />
          <Line 
            type="monotone" 
            dataKey="energy" 
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
