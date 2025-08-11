/**
 * Needle Hull Preset Component
 * Applies theoretical warp bubble parameters based on research papers
 */

import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { zenLongToast } from "@/lib/zen-long-toasts";
import { SimulationParameters } from "@shared/schema";

interface NeedleHullPresetProps {
  form: UseFormReturn<SimulationParameters>;
  onTileAreaChange?: (value: number) => void;
  onShipRadiusChange?: (value: number) => void;
  onApplyPreset?: () => void;
}

export function NeedleHullPreset({ form, onTileAreaChange, onShipRadiusChange, onApplyPreset }: NeedleHullPresetProps) {
  
  const applyNeedleHullPreset = () => {
    // Based on "Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator"
    // and "time-sliced sector strobing functions as a GR-valid proxy"
    
    // Core geometry: 40 μm concave pocket
    form.setValue("geometry", "bowl");
    form.setValue("radius", 25000); // 25 mm radius (50 mm diameter) as per paper spec
    form.setValue("sagDepth", 16); // 16 nm sag depth for γ_geo ≈ 25
    form.setValue("gap", 1); // 1 nm vacuum gap
    
    // Material: Superconducting Nb₃Sn
    form.setValue("material", "custom");
    form.setValue("temperature", 20); // 20 K operating temperature
    
    // Natário Warp Bubble configuration
    form.setValue("moduleType", "warp");
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
      lightCrossingTimeNs: 100, // ~100 ns light crossing time for hull geometry
      
      // Warp field parameters
      shiftAmplitude: 50e-12, // 50 pm shift amplitude for β(r) field
      expansionTolerance: 1e-12, // Zero-expansion tolerance
      warpFieldType: "natario" // Natário zero-expansion type
    });
    
    // Advanced computational parameters for high precision
    form.setValue("advanced", {
      xiMin: 0.0001, // Tighter tolerance for exotic mass calculations
      maxXiPoints: 25000, // Higher precision for warp bubble conditions
      intervals: 100,
      absTol: 0,
      relTol: 0.005 // 0.5% tolerance for Van-den-Broeck amplification
    });
    
    // Phase diagram parameters - Needle Hull research specifications
    onTileAreaChange?.(25); // 25 cm² tile area (5 cm × 5 cm tiles)
    onShipRadiusChange?.(5.0); // 5.0 m ship radius
    
    // Apply all dynamic parameters for real-time phase diagram integration
    onApplyPreset?.();
  };

  return (
    <div className="space-y-2">
      <Button 
        type="button" 
        onClick={() => {
          applyNeedleHullPreset();
          zenLongToast("sim:create", {
            gammaGeo: 26,
            qFactor: 1e9,
            duty: 0.14,
            shipRadiusM: 86.5,
            gapNm: 1.0
          });
        }}
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