import { useState } from "react";
import { Link } from "wouter";
import { Book, FileText, Home, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Book className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Documentation</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="research-papers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="research-papers">Research Papers</TabsTrigger>
            <TabsTrigger value="physics-guide">Physics Guide</TabsTrigger>
            <TabsTrigger value="api-reference">API Reference</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          </TabsList>

          <TabsContent value="research-papers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Needle Hull Mk 1 Paper */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    83 MW Needle Hull Mark 1 Update
                  </CardTitle>
                  <CardDescription>
                    Complete technical specifications for the Needle Hull Mk 1 warp bubble configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Key Topics:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Fixed exotic mass budget: 1.405 × 10³ kg</li>
                      <li>Four operational modes (Hover, Cruise, Emergency, Standby)</li>
                      <li>Van-den-Broeck pocket amplification factors</li>
                      <li>Ford-Roman quantum inequality compliance</li>
                      <li>83 MW power target with sector strobing</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open('/attached_assets/83 MW Needle Hull Mark 1 update_1753733381119.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/attached_assets/83 MW Needle Hull Mark 1 update_1753733381119.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Online
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Geometry-Amplified Dynamic Casimir Effect Paper */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Geometry-Amplified Dynamic Casimir Effect
                  </CardTitle>
                  <CardDescription>
                    Concave microwave micro-resonator physics and amplification theory
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Key Topics:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Concave spherical cap geometry (16 nm sag depth)</li>
                      <li>Geometric amplification factor γ_geo ≈ 26</li>
                      <li>15 GHz modulation frequency optimization</li>
                      <li>Q-factor enhancement in superconducting cavities</li>
                      <li>Time-scale separation analysis</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open('/attached_assets/Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator_1753733560411.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/attached_assets/Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator_1753733560411.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Online
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Time-Sliced Sector Strobing Paper */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Time-Sliced Sector Strobing Functions
                  </CardTitle>
                  <CardDescription>
                    GR-valid proxy methods for warp bubble energy management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Key Topics:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>400-sector strobing implementation</li>
                      <li>Duty cycle optimization strategies</li>
                      <li>General Relativity validity constraints</li>
                      <li>Power throttling mechanisms</li>
                      <li>Energy budget management</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open('/attached_assets/time-sliced sector strobing functions as a GR-valid proxy_1753733389106.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/attached_assets/time-sliced sector strobing functions as a GR-valid proxy_1753733389106.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Online
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Bubble Metrics Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    CheckList of Bubble Metrics
                  </CardTitle>
                  <CardDescription>
                    Quality assurance and validation metrics for warp bubble calculations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Key Topics:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Six-tool verification system</li>
                      <li>Energy pipeline validation methods</li>
                      <li>Convergence testing protocols</li>
                      <li>Analytic cross-validation</li>
                      <li>Golden file regression testing</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open('/attached_assets/CheckList of Bubble Metric_1753798567838.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/attached_assets/CheckList of Bubble Metric_1753798567838.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Online
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Artificial Gravity Paper */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    A Gentle "Tilt" Inside Natário Bubble
                  </CardTitle>
                  <CardDescription>
                    Artificial gravity implementation through ultra-small linear β-gradients (0.1g-0.5g)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Key Topics:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Programmable phase array symmetry breaking</li>
                      <li>Linear β-gradient across cabin interior</li>
                      <li>Ford-Roman quantum inequality compliance</li>
                      <li>Comfort ceiling (0.1g) vs QI ceiling (0.5g) limits</li>
                      <li>Structural stress analysis and navigation considerations</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open('/attached_assets/A gentle tilt inside Natário bubble a whisper of artificial gravity 0.5g_1755482720186.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/attached_assets/A gentle tilt inside Natário bubble a whisper of artificial gravity 0.5g_1755482720186.pdf', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Online
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="physics-guide" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Physics Implementation Guide</CardTitle>
                <CardDescription>
                  Understanding the authentic Casimir physics calculations used in this platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Energy Pipeline Sequence</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li><strong>Static Casimir Energy:</strong> U_static = -(π²ℏc/(720a³)) × A_tile</li>
                      <li><strong>Geometric Amplification:</strong> U_geo = γ_geo × U_static</li>
                      <li><strong>Q-Enhancement:</strong> U_Q = Q_mechanical × U_geo</li>
                      <li><strong>Duty Cycling:</strong> U_cycle = U_Q × duty_factor</li>
                      <li><strong>Van-den-Broeck Pocket:</strong> U_final = U_cycle × γ_pocket</li>
                      <li><strong>Power Loss:</strong> P_loss = |U_geo × ω| / Q_cavity</li>
                      <li><strong>Throttling:</strong> P_avg = P_loss × duty × (1/sectors) × Q_spoiling</li>
                      <li><strong>Mass Calculation:</strong> M_exotic = |U_final × N_tiles| / c²</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Physics Constants</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Planck constant: ℏ = 1.055 × 10⁻³⁴ J⋅s</li>
                      <li>Speed of light: c = 2.998 × 10⁸ m/s</li>
                      <li>Modulation frequency: ω = 2π × 15 GHz</li>
                      <li>Gap distance: a = 1.0 nm (fixed)</li>
                      <li>Hull surface area: A_hull = 5.6 × 10⁵ m² (Needle Hull)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Operational Modes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Hover Mode</h4>
                        <p className="text-sm text-muted-foreground">14% duty, 83.3 MW, station-hold</p>
                      </div>
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Cruise Mode</h4>
                        <p className="text-sm text-muted-foreground">0.5% duty, 400 sectors, 7.4 W</p>
                      </div>
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Emergency Mode</h4>
                        <p className="text-sm text-muted-foreground">50% duty, 297+ MW, fast-burn</p>
                      </div>
                      <div className="p-3 border rounded">
                        <h4 className="font-medium">Standby Mode</h4>
                        <p className="text-sm text-muted-foreground">0% duty, system-off</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-reference" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
                <CardDescription>
                  Technical reference for simulation endpoints and data structures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Simulation Endpoints</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="p-2 bg-muted rounded">POST /api/simulations - Create simulation</div>
                      <div className="p-2 bg-muted rounded">GET /api/simulations/:id - Get simulation status</div>
                      <div className="p-2 bg-muted rounded">POST /api/simulations/:id/start - Start simulation</div>
                      <div className="p-2 bg-muted rounded">POST /api/simulations/:id/scuffgeo - Generate geometry</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Viability Calculation</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="p-2 bg-muted rounded">POST /api/viability/calculate - Calculate viability metrics</div>
                      <div className="p-2 bg-muted rounded">POST /api/viability/grid - Generate phase diagram grid</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutorials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started Tutorials</CardTitle>
                <CardDescription>
                  Step-by-step guides for using the Needle Hull research platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Quick Start Guide</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Start with the <strong>Live Energy Pipeline</strong> on the home page</li>
                      <li>Select different operational modes (Hover, Cruise, Emergency, Standby)</li>
                      <li>Observe real-time calculations showing fixed 1.405 × 10³ kg exotic mass</li>
                      <li>Use the <strong>Interactive Phase Diagram</strong> to explore design space</li>
                      <li>Adjust constraint sliders to see viable regions</li>
                      <li>Click "Simulation Config" to set up detailed calculations</li>
                      <li>Apply "Needle Hull Preset" for research-grade parameters</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Advanced Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><strong>Multi-dimensional Design Explorer:</strong> Use physics parameter sliders to reshape viable regions</li>
                      <li><strong>Ford-Roman Compliance:</strong> Monitor quantum inequality bounds (ζ ≤ 1.0)</li>
                      <li><strong>Visual Proof Charts:</strong> Validate calculations against research specifications</li>
                      <li><strong>Six-Tool Verification:</strong> Run comprehensive physics validation suite</li>
                      <li><strong>Energy Pipeline Audit:</strong> Trace calculations step-by-step with real values</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Needle Hull Mk 1 Research Platform Documentation • Version 1.0</p>
        </div>
      </div>
    </div>
  );
}