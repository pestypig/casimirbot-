// Hook for accessing the centralized HELIX-CORE energy pipeline
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { publish } from "@/lib/luma-bus";
import { getModeWisdom } from "@/lib/luma-whispers";

export interface EnergyPipelineState {
  // Input parameters
  tileArea_cm2: number;
  shipRadius_m: number;
  gap_nm: number;
  sag_nm?: number;
  temperature_K: number;
  modulationFreq_GHz: number;
  
  // Mode parameters
  currentMode: 'hover' | 'cruise' | 'emergency' | 'standby';
  dutyCycle: number;
  sectorStrobing: number;
  qSpoilingFactor: number;
  
  // Physics parameters
  gammaGeo: number;
  qMechanical: number;
  qCavity: number;
  gammaVanDenBroeck: number;
  exoticMassTarget_kg: number;
  
  // Calculated values
  U_static: number;
  U_geo: number;
  U_Q: number;
  U_cycle: number;
  P_loss_raw: number;
  P_avg: number;
  M_exotic: number;
  M_exotic_raw: number;     // Raw physics exotic mass (before calibration)
  massCalibration: number;  // Mass calibration factor
  TS_ratio: number;
  zeta: number;
  N_tiles: number;
  
  // System status
  fordRomanCompliance: boolean;
  natarioConstraint: boolean;
  curvatureLimit: boolean;
  overallStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

// Chat message interface for HELIX-CORE
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// System metrics interface
export interface SystemMetrics {
  totalTiles: number;
  activeTiles: number;
  currentMode?: string;
}

// Helix metrics interface
export interface HelixMetrics {
  totalTiles: number;
  activeTiles: number;
  data?: any;
}

// Shared physics constants from pipeline backend
export const PIPE_CONST = {
  TOTAL_SECTORS: 400,
  BURST_DUTY_LOCAL: 0.01,  // 1% local burst window
  Q_BURST: 1e9
};

// Shared smart formatter (W→kW→MW) for UI labels
export const fmtPowerUnitFromW = (watts?: number) => {
  const x = Number(watts);
  if (!Number.isFinite(x)) return '—';
  if (x >= 1e6) return `${(x/1e6).toFixed(1)} MW`;
  if (x >= 1e3) return `${(x/1e3).toFixed(1)} kW`;
  return `${x.toFixed(1)} W`;
};

// Hook to get current pipeline state
export function useEnergyPipeline() {
  return useQuery({
    queryKey: ['/api/helix/pipeline'],
    queryFn: async () =>
      (await apiRequest('GET', '/api/helix/pipeline')).json(),
    refetchInterval: 1000, // Refresh every second
  });
}

// Hook to update pipeline parameters
export function useUpdatePipeline() {
  return useMutation({
    mutationFn: async (params: Partial<EnergyPipelineState>) => {
      const response = await apiRequest('POST', '/api/helix/pipeline/update', params);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/helix/pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['/api/helix/metrics'] });
    }
  });
}

// Hook to switch operational mode
export function useSwitchMode() {
  return useMutation({
    mutationFn: async (mode: EnergyPipelineState['currentMode']) => {
      // 1) switch server mode
      const resMode = await apiRequest('POST', '/api/helix/pipeline/mode', { mode });
      const data = await resMode.json();

      // 2) immediately push mode-specific knobs so duty/strobing/qSpoil are in sync
      const cfg = MODE_CONFIGS[mode];
      if (cfg) {
        await apiRequest('POST', '/api/helix/pipeline/update', {
          dutyCycle: cfg.dutyCycle,
          sectorStrobing: cfg.sectorStrobing,
          qSpoilingFactor: cfg.qSpoilingFactor,
          gammaVanDenBroeck: cfg.gammaVanDenBroeck,  // ← include this
        });
      }
      return data;
    },
    onSuccess: (data, mode) => {
      queryClient.invalidateQueries({ queryKey: ['/api/helix/pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['/api/helix/metrics'] });
      
      // Trigger Luma whisper for mode changes
      const wisdom = getModeWisdom(mode);
      publish("luma:whisper", { text: wisdom });
    }
  });
}

// Mode configurations for UI display (synchronized with backend)
export const MODE_CONFIGS = {
  hover: {
    name: "Hover Mode",
    dutyCycle: 0.14,
    sectorStrobing: 1,
    qSpoilingFactor: 1,
    gammaVanDenBroeck: 1e11,  // Paper-authentic value (server-authoritative)
    description: "High-power hover mode for station-keeping",
    // Store targets in **watts** to match the server pipeline MODE_POLICY
    powerTarget_W: 83.3e6,
    color: "text-cyan-400"
  },
  cruise: {
    name: "Cruise Mode",
    dutyCycle: 0.005,
    sectorStrobing: 1,
    qSpoilingFactor: 0.625,
    gammaVanDenBroeck: 1e11,  // Paper-authentic value (server-authoritative)
    description: "Low-power cruise mode for sustained travel",
    powerTarget_W: 83.3e6,
    color: "text-green-400"
  },
  emergency: {
    name: "Emergency Mode",
    dutyCycle: 0.50,
    sectorStrobing: 2,
    qSpoilingFactor: 1,
    gammaVanDenBroeck: 1e11,  // Paper-authentic value (server-authoritative)
    description: "Maximum power emergency mode",
    powerTarget_W: 297.5e6,
    color: "text-red-400"
  },
  standby: {
    name: "Standby Mode",
    dutyCycle: 0.001,
    sectorStrobing: 0,
    qSpoilingFactor: 0.1,
    gammaVanDenBroeck: 1,
    description: "Minimal power standby mode",
    powerTarget_W: 0,
    color: "text-slate-400"
  }
};

// Optional: helper if other components want to apply mode knobs explicitly
export const modeKnobsFor = (mode: EnergyPipelineState['currentMode']) => {
  const m = MODE_CONFIGS[mode];
  return m ? {
    dutyCycle: m.dutyCycle,
    sectorStrobing: m.sectorStrobing,
    qSpoilingFactor: m.qSpoilingFactor,
  } : undefined;
};