  { stage: "|U_static|", value: Math.abs(derived.U_static) },
    { stage: "×γ_geo³",    value: derived.E_tile_geo3 },
    { stage: "×γ_VdB",     value: derived.E_tile_VdB },
    { stage: "×d_eff",     value: derived.E_tile_mass } // duty applied here (no Q_cav in mass)
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Mode Controls */}
        <Card className="bg-slate-900/60 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CircuitBoard className="w-6 h-6 text-blue-400"/>
                <span className="text-slate-100">HELIX-CORE Casimir Amplifier</span>
                <Badge variant="outline" className="text-xs">Pipeline-Driven Physics</Badge>
              </div>
              <div className="flex gap-2">
                {["hover", "cruise", "emergency", "standby"].map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={switchingMode ? "outline" : "default"}
                    onClick={() => switchMode(mode)}
                    disabled={switchingMode}
                    className="capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <Badge variant="secondary" className="justify-center">ζ = {fmtNum(metrics.fordRoman.value, "", 3)}</Badge>
              <Badge variant={metrics.timeScaleRatio > 1 ? "default" : "destructive"} className="justify-center">TS = {fmtNum(metrics.timeScaleRatio, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">γ_geo = {fmtNum(derived.gammaGeo, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">q_mech = {fmtNum(derived.qMech, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">γ_VdB = {fmtNum(state.gammaVanDenBroeck, "", 1)}</Badge>
              <Badge variant="outline" className="justify-center">Q_cav = {fmtNum(qCav, "", 0)}</Badge>
              <Badge variant="outline" className="justify-center">N = {fmtNum(derived.N_tiles, "", 0)}</Badge>
              <Badge variant="outline" className="justify-center">P = {fmtNum(derived.P_ship_avg_report_MW, "MW", 2)}</Badge>
              <Badge variant="outline" className="justify-center">M = {fmtNum(derived.M_total_report, "kg", 0)}</Badge>
            </div>

            {/* Time-Evolving Cavity Physics Display */}
            {lightCrossing && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="mb-2 text-xs text-slate-400 font-mono uppercase tracking-wide">Cavity Dynamics (Phase-Locked)</div>
                <div className="grid grid-cols-3 gap-3 text-[10px] font-mono">
                  <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                    <div className="text-slate-400 mb-0.5">τ_LC</div>
                    <div className="text-slate-200">{(lightCrossing.tauLC_ms).toFixed(3)} ms</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                    <div className="text-slate-400 mb-0.5">τ_Q</div>
                    <div className="text-slate-200">{(tauQ_s * 1e3).toFixed(1)} ms</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-center">
                    <div className="text-slate-400 mb-0.5">U(t)/U∞</div>
                    <div className="text-slate-200">{(U / Math.max(1e-12, U_inf)).toFixed(3)}</div>
                  </div>
                </div>
                
                {/* Visual cavity energy bar with ON/OFF indication */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-100 ${
                        lightCrossing.onWindow ? 'bg-cyan-400' : 'bg-slate-600'
                      }`}
                      style={{ width: `${Math.min(100, driveEnv * 100)}%` }}
                    />
                  </div>
                  <Badge 
                    variant={lightCrossing.onWindowDisplay ? "default" : "secondary"} 
                    className={`text-xs ${
                      lightCrossing.onWindowDisplay ? 'bg-cyan-500 text-white' : 'bg-slate-600 text-slate-200'
                    }`}
                  >
                    {lightCrossing.onWindowDisplay ? 'ON' : 'OFF'}
                  </Badge>
                </div>
                
                {/* Instantaneous per-tile power display */}
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="mb-2 text-xs text-slate-400 font-mono uppercase tracking-wide">Per-Tile Instantaneous Power</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      lightCrossing.onWindowDisplay ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/40 text-slate-300"
                    }`}>
                      {lightCrossing.onWindowDisplay ? "ON" : "OFF"}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {derived?.isBurstMeaningful ? `${fmtNum(P_tile_instant_W_display, "W")}` : "insufficient cycles"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
          </CardContent>
        </Card>

        {/* Casimir Foundation */}
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Sigma className="w-5 h-5"/>
              Casimir Energy Density Foundation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <EquationChip eq="u = -π² ħc / (720 a⁴)" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>Gap (a): <span className="text-slate-300">{fmtNum(derived.gap_m * 1e9, "nm", 1)}</span></div>
                  <div>Tile Area: <span className="text-slate-300">{fmtNum(state.tileArea_cm2, "cm²", 1)}</span></div>
                  <div>Theory u: <span className="text-slate-300">{fmtNum(derived.casimir_theory, "J/m³", 2)}</span></div>
                  <div>Per Tile: <span className="text-slate-300">{fmtNum(derived.casimir_per_tile, "J", 2)}</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-slate-300">Backend U_static/tile: <span className="font-mono">{fmtNum(derived.U_static, "J", 3)}</span></div>
                <div className="text-xs text-slate-400">
                  Theory match: {Math.abs((derived.U_static - derived.casimir_per_tile) / derived.casimir_per_tile * 100) < 5 ? "✓ Good" : "⚠ Check units"}
                </div>
              </div>
            </div>
            
            {/* To-Scale Cavity Cross-Section */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <h4 className="font-semibold mb-3 text-slate-200 flex items-center gap-2">
                <ScanSearch className="w-4 h-4"/>
                Pipeline-Driven Cavity Cross-Section (To Scale)
              </h4>
              <CavitySideView
                width={800}
                height={240}
                tileWidth_mm={50}
                pocketDiameter_um={40}
                sag_nm={state.sagDepth_nm ?? 16}
                gap_nm={state.gap_nm ?? 1}
                topMirror_thick_um={1.5}
                botMirror_thick_um={1.5}
                alnRim_width_um={20}
                stroke_nm={stroke_nm_instant} // Pipeline-driven mechanical stroke
                gammaGeo={derived?.gammaGeo ?? 1}
                onWindow={lightCrossing?.onWindow ?? false}
                physicsParity={false}
                mode="explanatory" // Use explanatory mode for better visibility
              />
            </div>
          </CardContent>
        </Card>

        {/* Amplification Ladders */}
        <div className="grid lg:grid-cols-2 gap-6">
          <LadderChart title="Power Chain (Per Tile → Ship)" unit="W" data={powerLadder} />
          <LadderChart title="Energy Chain (Per Tile → Ship Avg)" unit="J" data={massLadder} />
        </div>

        {/* Pipeline Cross-checks */}
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <ShieldCheck className="w-5 h-5"/>
              Pipeline Cross-checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-slate-200">Power Verification</h4>
                <div className="space-y-1 text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>P_tile (instantaneous):</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      lightCrossing?.onWindowDisplay ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/40 text-slate-300"
                    }`}>
                      {lightCrossing?.onWindowDisplay ? "ON" : "OFF"}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {derived?.isBurstMeaningful
                        ? `${fmtNum(derived.P_tile_instant_W, "W")}`
                        : "OFF · insufficient cycles"}
                    </span>
                  </div>
                  <div>P_ship (calc): {fmtNum(derived.P_ship_avg_calc_MW, "MW", 2)}</div>
                  <div>P_ship (report): {fmtNum(derived.P_ship_avg_report_MW, "MW", 2)}</div>
                  <div className="text-xs text-slate-400">
                    Match: {Math.abs((derived.P_ship_avg_calc_MW - derived.P_ship_avg_report_MW) / derived.P_ship_avg_report_MW * 100) < 10 ? "✓ Good" : "⚠ Check calibration"}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-slate-200">Mass Verification</h4>
                <div className="space-y-1 text-slate-300">
                  <div>M_tile: {fmtNum(derived.M_tile, "kg", 6)}</div>
                  <div>M_total (calc): {fmtNum(derived.M_total_calc, "kg", 0)}</div>
                  <div>M_total (report): {fmtNum(derived.M_total_report, "kg", 0)}</div>
                  <div className="text-xs text-slate-400">
                    Match: {Math.abs((derived.M_total_calc - derived.M_total_report) / derived.M_total_report * 100) < 10 ? "✓ Good" : "⚠ Check calibration"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Displacement Field Heatmap */}
        <DisplacementHeatmap endpoint={fieldEndpoint} metrics={metrics} state={state} />
        
      </div>
    </div>
  );
}