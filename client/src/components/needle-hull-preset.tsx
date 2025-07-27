/**
 * Needle Hull Preset Component
 * Applies theoretical warp bubble parameters based on research papers
 */

import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SimulationParameters } from "@shared/schema";

interface NeedleHullPresetProps {
  form: UseFormReturn<SimulationParameters>;
}

export function NeedleHullPreset({ form }: NeedleHullPresetProps) {
  
  const applyNeedleHullPreset = () => {
    // Based on "Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator"
    // and "time-sliced sector strobing functions as a GR-valid proxy"
    
    // Core geometry: 40 μm concave pocket
    form.setValue("geometry", "bowl");
    form.setValue("radius", 20); // 20 μm radius for 40 μm diameter pocket
    form.setValue("sagDepth", 16); // 16 nm sag depth for γ_geo ≈ 25
    form.setValue("gap", 1); // 1 nm vacuum gap
    
    // Material: Superconducting Nb₃Sn
    form.setValue("material", "custom");
    form.setValue("temperature", 20); // 20 K operating temperature
    
    // Dynamic Casimir configuration
    form.setValue("moduleType", "dynamic");
    form.setValue("dynamicConfig", {
      // 15 GHz modulation with ±50 pm stroke amplitude
      modulationFreqGHz: 15,
      strokeAmplitudePm: 50,
      
      // Sector strobing: 10 μs burst, 1 ms cycle (d = 0.01)
      burstLengthUs: 10,
      cycleLengthUs: 1000,
      
      // Superconducting cavity Q ≈ 10⁹
      cavityQ: 1e9,
      
      // Needle Hull sector strobing parameters from papers
      sectorCount: 400, // 400 azimuthal sectors
      sectorDuty: 2.5e-5, // Ship-wide duty factor d_eff = 2.5×10⁻⁵
      pulseFrequencyGHz: 15, // 15 GHz pulse frequency
      lightCrossingTimeNs: 100 // ~100 ns light crossing time for hull geometry
    });
    
    // Advanced computational parameters for high precision
    form.setValue("advanced", {
      xiMin: 0.0001, // Tighter tolerance for exotic mass calculations
      maxXiPoints: 25000, // Higher precision for warp bubble conditions
      intervals: 100,
      absTol: 0,
      relTol: 0.005 // 0.5% tolerance for Van-den-Broeck amplification
    });
  };

  return (
    <div className="space-y-2">
      <Button 
        type="button" 
        onClick={applyNeedleHullPreset}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Rocket className="mr-2 h-4 w-4" />
        Apply Needle Hull Preset
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Theoretical warp bubble configuration with GR-valid sector strobing
      </p>
    </div>
  );
}