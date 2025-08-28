/**
 * Phase Diagram Validation Component
 * Interactive UI component to test and validate viability calculations
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { viability } from '../../../sim_core/viability';
import { Play, CheckCircle, XCircle } from 'lucide-react';

interface ValidationResult {
  test: string;
  area: number;    // tile area (cm²)
  radius: number;  // ship radius (m)
  expected: boolean;
  actual: boolean;
  passed: boolean;
  mass: number;
  power: number;   // MW
  zeta: number;
  reason?: string;
}

// Needle Hull pipeline parameters (keep aligned with server pipeline defaults)
const needleHullPipeline = {
  gap: 1e-9,             // 1 nm gap (m)
  gamma_geo: 26,         // Geometric amplification (γ_geo)
  Q: 1e9,                // Burst-window cavity Q
  duty: 0.01,            // Local burst duty (10 µs / 1 ms)
  duty_eff: 0.01 / 400,  // Ship-wide effective duty (Ford–Roman): 0.01 × (S_live=1 / S_total=400)
  N_tiles: 1.96e9,       // Paper-authentic census (approx; matches server’s order of magnitude)
  P_raw: 2e15,           // Raw lattice power (2 PW) for stress tests
  // ℏc in J·m — must match server constant (see physics-const.ts -> HBAR * C)
  HBARC: 3.16152677e-26,
};

const needleHullConstraints = {
  massNominal: 1400, // kg (server targets ~1405 kg)
  massTolPct: 5,
  maxPower: 100,     // MW ceiling for validation display
  maxZeta: 1.0,
  minGamma: 25
};

export default function PhaseDiagramValidator() {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runValidation = async () => {
    setIsRunning(true);
    setResults([]);

    const testCases = [
      // Canonical needle hull (paper-authentic)
      { test: 'Needle Hull Exact', area: 25, radius: 86.5, expected: true },

      // Larger tiles on canonical hull (should remain viable under power target)
      { test: 'Large Tile Optimal', area: 2500, radius: 86.5, expected: true },

      // Deliberate non-viable regimes
      { test: 'Small Area · Large Radius', area: 100, radius: 300, expected: false },
      { test: 'Very Small Setup', area: 10, radius: 50, expected: false },
      { test: 'Tiny Configuration', area: 5, radius: 1, expected: false },
    ];

    const validationResults: ValidationResult[] = [];

    for (const testCase of testCases) {
      // small delay for UI responsiveness
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = viability(testCase.area, testCase.radius, needleHullPipeline, needleHullConstraints);

      validationResults.push({
        test: testCase.test,
        area: testCase.area,
        radius: testCase.radius,
        expected: testCase.expected,
        actual: result.ok,
        passed: result.ok === testCase.expected,
        mass: result.m_exotic,
        power: result.P_avg / 1e6, // W → MW
        zeta: result.zeta,
        reason: result.fail_reason
      });

      setResults([...validationResults]);
    }

    setIsRunning(false);
  };

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Phase Diagram Validation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the viability function against known configurations to prove the phase diagram accuracy
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={runValidation}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running Tests...' : 'Run Validation Tests'}
          </Button>

          {results.length > 0 && (
            <Badge variant={passedTests === totalTests ? 'default' : 'destructive'}>
              {passedTests}/{totalTests} Tests Passed
            </Badge>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results:</h4>

            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.passed
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{result.test}</span>
                  </div>

                  <Badge variant={result.passed ? 'default' : 'destructive'}>
                    {result.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                  <div>Configuration: {result.area} cm² tile, R = {result.radius} m</div>
                  <div>Expected: {result.expected ? 'Viable' : 'Failed'}</div>
                  <div>Actual: {result.actual ? 'Viable' : 'Failed'}</div>
                  <div>Mass: {Number.isFinite(result.mass) ? result.mass.toFixed(1) : '—'} kg</div>
                  <div>Power: {Number.isFinite(result.power) ? result.power.toFixed(1) : '—'} MW</div>
                  <div>ζ: {Number.isFinite(result.zeta) ? result.zeta.toFixed(3) : '—'}</div>
                </div>

                {result.reason && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Reason: {result.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Validation Summary:</h4>
            <p className="text-sm text-muted-foreground">
              {passedTests === totalTests ? (
                "✅ All tests passed! The phase diagram's teal sliver represents mathematically correct viability calculations."
              ) : (
                `❌ ${totalTests - passedTests} test(s) failed. The viability function may need adjustment.`
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}