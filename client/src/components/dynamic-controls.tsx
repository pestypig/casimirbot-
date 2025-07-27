import { Activity, Zap, Clock, Power, BarChart3, Settings } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationParameters } from "@shared/schema";

interface DynamicControlsProps {
  form: UseFormReturn<SimulationParameters>;
  isVisible: boolean;
}

export function DynamicControls({ form, isVisible }: DynamicControlsProps) {
  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Activity className="h-5 w-5" />
          Dynamic Casimir Effects Configuration
        </CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Configure moving boundary parameters following math-gpt.org formulation with quantum inequality constraints
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Time Domain Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Domain Modulation
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dynamicConfig.modulationFreqGHz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Modulation Frequency (fₘ)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="15" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="pr-12"
                      />
                    </FormControl>
                    <span className="absolute right-3 top-2 text-sm text-muted-foreground">GHz</span>
                  </div>
                  <FormDescription className="text-xs">Stroke frequency (0.1-100 GHz)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dynamicConfig.strokeAmplitudePm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Stroke Amplitude (δa)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="50" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="pr-12"
                      />
                    </FormControl>
                    <span className="absolute right-3 top-2 text-sm text-muted-foreground">pm</span>
                  </div>
                  <FormDescription className="text-xs">Peak displacement amplitude (±0.1-1000 pm)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Duty Cycle Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Duty Cycle Control
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dynamicConfig.burstLengthUs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Burst Length (t_burst)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="10" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="pr-12"
                      />
                    </FormControl>
                    <span className="absolute right-3 top-2 text-sm text-muted-foreground">μs</span>
                  </div>
                  <FormDescription className="text-xs">Active modulation period (0.1-1000 μs)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dynamicConfig.cycleLengthUs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Cycle Time (t_cycle)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1" 
                        placeholder="1000" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="pr-12"
                      />
                    </FormControl>
                    <span className="absolute right-3 top-2 text-sm text-muted-foreground">μs</span>
                  </div>
                  <FormDescription className="text-xs">Total cycle period (1-10000 μs)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Cavity Enhancement */}
        <div className="space-y-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Cavity Enhancement
          </h4>
          
          <FormField
            control={form.control}
            name="dynamicConfig.cavityQ"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Quality Factor (Q)</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type="number" 
                      step="1000000" 
                      placeholder="1000000000" 
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="pr-12"
                    />
                  </FormControl>
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">—</span>
                </div>
                <FormDescription className="text-xs">
                  Cavity quality factor for energy enhancement (10³-10¹² range)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Physics Preview */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Physics Preview
          </h5>
          <div className="grid grid-cols-2 gap-4 text-xs text-blue-700 dark:text-blue-300">
            <div>
              <span className="font-medium">Stroke Period:</span>
              <div className="font-mono">
                {form.watch("dynamicConfig.modulationFreqGHz") 
                  ? `${(1000 / form.watch("dynamicConfig.modulationFreqGHz")).toFixed(1)} ps`
                  : "—"}
              </div>
            </div>
            <div>
              <span className="font-medium">Duty Factor:</span>
              <div className="font-mono">
                {form.watch("dynamicConfig.burstLengthUs") && form.watch("dynamicConfig.cycleLengthUs")
                  ? `${((form.watch("dynamicConfig.burstLengthUs") / form.watch("dynamicConfig.cycleLengthUs")) * 100).toFixed(1)}%`
                  : "—"}
              </div>
            </div>
            <div>
              <span className="font-medium">Rep Rate:</span>
              <div className="font-mono">
                {form.watch("dynamicConfig.cycleLengthUs") 
                  ? `${(1000 / form.watch("dynamicConfig.cycleLengthUs")).toFixed(1)} kHz`
                  : "—"}
              </div>
            </div>
            <div>
              <span className="font-medium">Q Factor:</span>
              <div className="font-mono">
                {form.watch("dynamicConfig.cavityQ") 
                  ? form.watch("dynamicConfig.cavityQ").toExponential(1)
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Information */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
          <h5 className="font-medium text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
            <Power className="h-4 w-4" />
            Quantum Safety
          </h5>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Simulation includes quantum inequality monitoring (Ford-Roman bound), GR validity checks 
            (Isaacson limit, Green-Wald compliance), and exotic mass generation tracking.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}