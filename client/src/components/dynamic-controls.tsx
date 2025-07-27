import { UseFormReturn } from "react-hook-form";
import { SimulationParameters } from "@shared/schema";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

interface DynamicControlsProps {
  form: UseFormReturn<SimulationParameters>;
  isVisible: boolean;
}

export function DynamicControls({ form, isVisible }: DynamicControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, watch } = form;
  
  const moduleType = watch("moduleType");
  
  if (!isVisible || moduleType !== "dynamic") {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
        <Collapsible.Trigger className="flex items-center justify-between w-full text-left">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Dynamic Modulation
          </h3>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </Collapsible.Trigger>
        
        <Collapsible.Content className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modulation Frequency (GHz)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                {...register("dynamicConfig.modulationFreqGHz", { valueAsNumber: true })}
              />
              <p className="text-xs text-gray-500 mt-1">Piezo stroke frequency fₘ (15 GHz default)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stroke Amplitude (pm)
              </label>
              <input
                type="number"
                step="1"
                min="0.1"
                max="1000"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                {...register("dynamicConfig.strokeAmplitudePm", { valueAsNumber: true })}
              />
              <p className="text-xs text-gray-500 mt-1">±boundary motion δa (50 pm default)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Burst Length (μs)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="1000"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                {...register("dynamicConfig.burstLengthUs", { valueAsNumber: true })}
              />
              <p className="text-xs text-gray-500 mt-1">Drive window t_burst (10 μs default)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cycle Time (μs)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="10000"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                {...register("dynamicConfig.cycleLengthUs", { valueAsNumber: true })}
              />
              <p className="text-xs text-gray-500 mt-1">Sector-strobe period t_cycle (1000 μs = 1 kHz)</p>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cavity Q Factor
              </label>
              <input
                type="number"
                step="1e6"
                min="1000"
                max="1e12"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                {...register("dynamicConfig.cavityQ", { valueAsNumber: true })}
              />
              <p className="text-xs text-gray-500 mt-1">Amplifies ΔE during burst (1×10⁹ default)</p>
            </div>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}