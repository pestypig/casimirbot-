import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Sliders, Play, FileCode, Cpu, Zap, Activity, Rocket } from "lucide-react";
import { DynamicControls } from "./dynamic-controls";
import { NeedleHullPreset } from "./needle-hull-preset";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { simulationParametersSchema, SimulationParameters } from "@shared/schema";

interface ParameterPanelProps {
  onSubmit: (parameters: SimulationParameters) => void;
  onGenerateOnly: (parameters: SimulationParameters) => void;
  isLoading: boolean;
}

export default function ParameterPanel({ onSubmit, onGenerateOnly, isLoading }: ParameterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<SimulationParameters>({
    resolver: zodResolver(simulationParametersSchema),
    defaultValues: {
      geometry: "parallel_plate",
      gap: 1.0,
      radius: 25000,
      sagDepth: 100.0,
      material: "PEC",
      temperature: 20,
      moduleType: "static",
      dynamicConfig: {
        modulationFreqGHz: 15,
        strokeAmplitudePm: 50,
        burstLengthUs: 10,
        cycleLengthUs: 1000,
        cavityQ: 1e9
      },
      arrayConfig: {
        size: 1,
        spacing: 1000,
        coherence: true
      },
      advanced: {
        xiMin: 0.001,
        maxXiPoints: 10000,
        intervals: 50,
        absTol: 0,
        relTol: 0.01
      }
    }
  });

  const handleSubmit = (data: SimulationParameters) => {
    onSubmit(data);
  };

  const handleGenerateOnly = () => {
    const data = form.getValues();
    onGenerateOnly(data);
  };

  const handleNeedleHullPreset = () => {
    // Based on research papers: scaled for numerical stability while preserving physics ratios
    // Geometry-Amplified Dynamic Casimir Effect parameters for warp bubble configuration
    form.setValue("geometry", "bowl");
    form.setValue("gap", 1.0); // 1 nm vacuum gap (design parameter)
    form.setValue("radius", 25000); // 25 mm radius (50 mm diameter) as per paper spec
    form.setValue("sagDepth", 16); // 16 nm sag depth as specified in paper
    form.setValue("material", "PEC"); // Nb₃Sn superconducting mirrors
    form.setValue("temperature", 20); // 20 K operating temperature
    form.setValue("moduleType", "dynamic");
    form.setValue("dynamicConfig", {
      modulationFreqGHz: 15, // 15 GHz AlN piezo modulation
      strokeAmplitudePm: 50, // ±50 pm piston stroke amplitude
      burstLengthUs: 10, // 10 μs burst duration
      cycleLengthUs: 1000, // 1 ms cycle (1 kHz strobe frequency, S=400 sectors)
      cavityQ: 1e9, // Q ≈ 10⁹ superconducting RF quality factor
      sectorCount: 400,
      sectorDuty: 2.5e-5,
      pulseFrequencyGHz: 15,
      lightCrossingTimeNs: 100,
      shiftAmplitude: 1e-6,
      expansionTolerance: 1e-12,
      warpFieldType: "natario" as const
    });
    form.setValue("advanced", {
      xiMin: 0.001,
      maxXiPoints: 25000, // Enhanced for Van-den-Broeck amplification
      intervals: 100, // Higher precision for exotic mass calculations
      absTol: 0,
      relTol: 0.001 // Tighter tolerance for warp bubble requirements
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          Simulation Parameters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Geometry Selection */}
            <FormField
              control={form.control}
              name="geometry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Geometry Type</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value="sphere" id="sphere" />
                        <div className="flex-1">
                          <Label htmlFor="sphere" className="font-medium cursor-pointer">Sphere</Label>
                          <p className="text-sm text-muted-foreground">Sphere above a plate</p>
                        </div>
                        <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value="parallel_plate" id="parallel_plate" />
                        <div className="flex-1">
                          <Label htmlFor="parallel_plate" className="font-medium cursor-pointer">Parallel Plate</Label>
                          <p className="text-sm text-muted-foreground">Two parallel flat disks</p>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-4 h-1 bg-slate-300"></div>
                          <div className="w-4 h-1 bg-slate-300"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value="bowl" id="bowl" />
                        <div className="flex-1">
                          <Label htmlFor="bowl" className="font-medium cursor-pointer">Bowl</Label>
                          <p className="text-sm text-muted-foreground">Concave bowl with flat piston</p>
                        </div>
                        <div className="w-4 h-4 rounded-t-full bg-slate-300"></div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Module Type Selection */}
            <FormField
              control={form.control}
              name="moduleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Physics Module</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value="static" id="static" />
                        <div className="flex-1">
                          <Label htmlFor="static" className="font-medium cursor-pointer flex items-center gap-2">
                            <Cpu className="h-4 w-4" />
                            Static Casimir
                          </Label>
                          <p className="text-sm text-muted-foreground">Standard SCUFF-EM calculations</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value="dynamic" id="dynamic" />
                        <div className="flex-1">
                          <Label htmlFor="dynamic" className="font-medium cursor-pointer flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Dynamic Casimir
                          </Label>
                          <p className="text-sm text-muted-foreground">Moving boundaries with quantum inequality constraints</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                        <RadioGroupItem value="warp" id="warp" />
                        <div className="flex-1">
                          <Label htmlFor="warp" className="font-medium cursor-pointer flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-purple-600" />
                            Natário Warp Bubble
                          </Label>
                          <p className="text-sm text-muted-foreground">Zero-expansion warp metrics with exotic mass calculations</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Needle Hull Preset Button */}
            <NeedleHullPreset form={form} />

            {/* Dynamic Module Controls */}
            <DynamicControls form={form} isVisible={form.watch("moduleType") === "dynamic"} />

            {/* Numerical Parameters */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="gap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gap Distance</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="1.0" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="pr-12"
                        />
                      </FormControl>
                      <span className="absolute right-3 top-2 text-sm text-muted-foreground">nm</span>
                    </div>
                    <FormDescription>Distance between objects</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="radius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Radius</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1" 
                          placeholder="25000" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="pr-12"
                        />
                      </FormControl>
                      <span className="absolute right-3 top-2 text-sm text-muted-foreground">µm</span>
                    </div>
                    <FormDescription>Object characteristic size</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PEC">PEC (Perfect Electric Conductor)</SelectItem>
                        <SelectItem value="custom">Custom Material</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sag Depth Field (only for bowl geometry) */}
              {form.watch("geometry") === "bowl" && (
                <FormField
                  control={form.control}
                  name="sagDepth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sag Depth</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1" 
                            placeholder="100.0" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="pr-12"
                          />
                        </FormControl>
                        <span className="absolute right-3 top-2 text-sm text-muted-foreground">nm</span>
                      </div>
                      <FormDescription>Concave depth of the spherical cap (25 mm radius)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="20" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="pr-12"
                        />
                      </FormControl>
                      <span className="absolute right-3 top-2 text-sm text-muted-foreground">K</span>
                    </div>
                    <FormDescription>Simulation temperature (default: 20 K)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Advanced Parameters */}
            <div className="pt-6 border-t border-slate-200">
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex items-center justify-between w-full p-0 h-auto">
                    <span className="text-sm font-medium">Advanced Parameters</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="advanced.xiMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Xi Min</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.001" 
                              placeholder="0.001" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="text-sm"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="advanced.maxXiPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Max Xi Points</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10000" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="text-sm"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="advanced.intervals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Intervals</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="50" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="text-sm"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="advanced.relTol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Rel Tol</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.01" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="text-sm"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Preset Configuration */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Warp Bubble Research Configuration
              </h4>
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                Configure parameters based on "Needle Hull" and "Geometry-Amplified Dynamic Casimir Effect" research papers
                for theoretical warp bubble conditions. Implements Van-den-Broeck amplification (γ ≈ 10¹¹) targeting ≈1.5 kg exotic mass per tile.
              </p>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-purple-300 hover:bg-purple-100 dark:border-purple-600 dark:hover:bg-purple-900/30"
                onClick={handleNeedleHullPreset}
                disabled={isLoading}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Apply Needle Hull Preset
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                Generate & Run Simulation
              </Button>
              
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full"
                onClick={handleGenerateOnly}
                disabled={isLoading}
              >
                <FileCode className="w-4 h-4 mr-2" />
                Generate .scuffgeo Only
              </Button>
            </div>
          </form>
        </Form>

        {/* Example Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
              <span className="text-white text-xs">i</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-2">Example Usage</h3>
              <div className="text-xs text-blue-700 font-mono bg-blue-100 p-2 rounded">
                Geometry: parallel_plate<br />
                Gap: 1.0 nm<br />
                Radius: 25000 µm<br />
                Temperature: 20 K
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
