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
  sag_nm: number;
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

// Hook to get current pipeline state
export function useEnergyPipeline() {
  return useQuery({
    queryKey: ['/api/helix/pipeline'],
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
      const response = await apiRequest('POST', '/api/helix/pipeline/mode', { mode });
      return response.json();
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
    powerTarget: 83.3,
    color: "text-cyan-400"
  },
  cruise: {
    name: "Cruise Mode",
    dutyCycle: 0.005,
    sectorStrobing: 400,
    qSpoilingFactor: 0.625,
    gammaVanDenBroeck: 1e11,  // Paper-authentic value (server-authoritative)
    description: "Low-power cruise mode for sustained travel",
    powerTarget: 7.4,
    color: "text-green-400"
  },
  emergency: {
    name: "Emergency Mode",
    dutyCycle: 0.50,
    sectorStrobing: 1,
    qSpoilingFactor: 1,
    gammaVanDenBroeck: 1e11,  // Paper-authentic value (server-authoritative)
    description: "Maximum power emergency mode",
    powerTarget: 297,
    color: "text-red-400"
  },
  standby: {
    name: "Standby Mode",
    dutyCycle: 0.001,
    sectorStrobing: 1,
    qSpoilingFactor: 0.1,
    gammaVanDenBroeck: 1,
    description: "Minimal power standby mode",
    powerTarget: 0.1,
    color: "text-slate-400"
  }
};