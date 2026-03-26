/**
 * Needle Hull Preset Component
 * Applies the NHM2 cavity contract to the legacy simulation form.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { zenLongToast } from "@/lib/zen-long-toasts";
import { SimulationParameters } from "@shared/schema";
import { NHM2_CAVITY_CONTRACT } from "@shared/needle-hull-mark2-cavity-contract";

const NHM2_TILE_RADIUS_UM = NHM2_CAVITY_CONTRACT.geometry.pocketDiameter_um / 2;
const NHM2_TILE_AREA_CM2 = NHM2_CAVITY_CONTRACT.layout.tileArea_mm2 / 100;
const NHM2_LIGHT_CROSSING_TIME_NS = 3.34;

interface NeedleHullPresetProps {
  form: UseFormReturn<SimulationParameters>;
  onTileAreaChange?: (value: number) => void;
  onShipRadiusChange?: (value: number) => void;
  onApplyPreset?: () => void;
}

export function NeedleHullPreset({
  form,
  onTileAreaChange,
  onShipRadiusChange,
  onApplyPreset,
}: NeedleHullPresetProps) {
  const applyNeedleHullPreset = () => {
    form.setValue("geometry", "bowl");
    form.setValue("radius", NHM2_TILE_RADIUS_UM);
    form.setValue("sagDepth", NHM2_CAVITY_CONTRACT.geometry.sag_nm);
    form.setValue("gap", NHM2_CAVITY_CONTRACT.geometry.gap_nm);

    form.setValue("material", "custom");
    form.setValue("temperature", NHM2_CAVITY_CONTRACT.thermal.temperature_K);

    form.setValue("moduleType", "warp");
    form.setValue("dynamicConfig", {
      modulationFreqGHz: NHM2_CAVITY_CONTRACT.drive.modulationFreq_GHz,
      strokeAmplitudePm: 50,
      burstLengthUs: 10,
      cycleLengthUs: 1000,
      dutyCycle: NHM2_CAVITY_CONTRACT.loss.dutyCycle,
      cavityQ: NHM2_CAVITY_CONTRACT.loss.qCavity,
      sectorCount: NHM2_CAVITY_CONTRACT.geometry.sectorCount,
      sectorDuty: NHM2_CAVITY_CONTRACT.loss.dutyShip,
      pulseFrequencyGHz: NHM2_CAVITY_CONTRACT.drive.modulationFreq_GHz,
      lightCrossingTimeNs: NHM2_LIGHT_CROSSING_TIME_NS,
      shiftAmplitude: 50e-12,
      expansionTolerance: 1e-12,
      warpFieldType: NHM2_CAVITY_CONTRACT.geometry.warpFieldType,
      gap_nm: NHM2_CAVITY_CONTRACT.geometry.gap_nm,
    });

    form.setValue("advanced", {
      xiMin: 0.0001,
      maxXiPoints: 25000,
      intervals: 100,
      absTol: 0,
      relTol: 0.005,
    });

    onTileAreaChange?.(NHM2_TILE_AREA_CM2);
    onShipRadiusChange?.(NHM2_CAVITY_CONTRACT.geometry.shipRadius_m);
    onApplyPreset?.();
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={() => {
          applyNeedleHullPreset();
          zenLongToast("sim:create", {
            gammaGeo: NHM2_CAVITY_CONTRACT.geometry.gammaGeo,
            qFactor: NHM2_CAVITY_CONTRACT.loss.qCavity,
            duty: NHM2_CAVITY_CONTRACT.loss.dutyShip,
            shipRadiusM: NHM2_CAVITY_CONTRACT.geometry.shipRadius_m,
            gapNm: NHM2_CAVITY_CONTRACT.geometry.gap_nm,
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
