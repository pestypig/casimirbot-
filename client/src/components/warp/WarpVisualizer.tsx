  // -----------------------------------------------------------------------------
  // File: client/src/components/WarpVisualizer.tsx (SSOT v2)
  // Objective: Minimal, pipeline-true viewer that:
  //  - lets the adapter/engine own physics (θ chain, parity, ridge)
  //  - handles script load + watchdog + WebGL context loss/restore
  //  - uses gate helpers for cosmetics only (no physics writes)
  // -----------------------------------------------------------------------------
  import { useEffect, useRef, useState } from 'react'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'
  import { Play, Pause, RotateCcw } from 'lucide-react'
  import { zenLongToast } from '@/lib/zen-long-toasts'
  import { subscribe, unsubscribe, publish } from '@/lib/luma-bus'
  import { mapThetaToDisplay, type DisplayMode } from '@/lib/visual/curvature-display'
  import * as VIS from '@/constants/VIS'

  // 🔁 Adapter is the single authority for physics → uniforms
  import driveWarpFromPipeline from '@/lib/warp-pipeline-adapter'
  import { gatedUpdateUniforms, withoutPhysics, PHYSICS_TRUTH_MODE } from '@/lib/warp-uniforms-gate'

  const isFiniteNum = (v: any): v is number => typeof v === 'number' && Number.isFinite(v)
  const num = (v: any, d = 0) => (isFiniteNum(v) ? v : d)
  const vec3 = (v: any, d: [number, number, number] = [0, -1, 0]) =>
    Array.isArray(v) && v.length === 3 && v.every((x) => Number.isFinite(+x)) ? ([+v[0], +v[1], +v[2]] as [number,number,number]) : d
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

  // Camera helper (deterministic framing)
  function computeCameraZ(axesClip: [number, number, number], canvas: HTMLCanvasElement) {
    const w = canvas.clientWidth || canvas.width || 800
    const h = canvas.clientHeight || canvas.height || 320
    const aspect = w / Math.max(1, h)
    const fov = (aspect < 1.2 ? VIS.fovPortraitRad : VIS.fovDesktopRad)
    const R = Math.max(...axesClip)
    const margin = VIS.baseMargin * (aspect < 1.2 ? 1.12 : 1)
    return (margin * R) / Math.tan(0.5 * fov)
  }

  // Optional global prelude for legacy engines/demos
  function installWarpPrelude(initialScale = 1.0) {
    if (typeof window === 'undefined') return
    if ((window as any).__warpPreludeInstalled) return
    const prelude = document.createElement('script')
    prelude.id = 'warp-prelude'
    prelude.text = `if (typeof sceneScale === 'undefined') { var sceneScale = ${Number.isFinite(initialScale) ? initialScale : 1.0}; }
    if (typeof setStrobingState === 'undefined') { function setStrobingState(_) {} }`
    document.head.appendChild(prelude)
    ;(window as any).__warpPreludeInstalled = true
  }

  // Types
  type LightCrossing = {
    sectorIdx: number
    sectorCount: number
    phase: number
    dwell_ms: number
    tauLC_ms: number
    burst_ms: number
    duty: number
    freqGHz: number
    onWindow: boolean
    cyclesPerBurst: number
    onWindowDisplay: boolean
  }

  type ShiftParams = {
    epsilonTilt?: number
    betaTiltVec?: [number, number, number]
    gTarget?: number
    R_geom?: number
    gEff_check?: number
  }

  interface LoadingState { type: 'loading'|'compiling'|'ready'; message: string }

  interface WarpVisualizerProps {
    parameters: {
      dutyCycle: number
      g_y: number
      cavityQ: number
      sagDepth_nm: number
      tsRatio: number
      powerAvg_MW: number
      exoticMass_kg: number
      currentMode?: string
      sectorStrobing?: number
      qSpoilingFactor?: number
      gammaVanDenBroeck?: number
      dutyEffectiveFR?: number
      lightCrossing?: LightCrossing
      hull?: { Lx_m: number; Ly_m: number; Lz_m: number; a: number; b: number; c: number }
      wall?: { w_norm: number }
      gridScale?: number
      gridSpan?: number
      axesScene?: [number, number, number]
      epsilonTilt?: number
      betaTiltVec?: number[]
      wallWidth_m?: number
      curvatureGainT?: number
      curvatureBoostMax?: number
      curvatureGainDec?: number
      viz?: { colorMode?: 'solid'|'theta'|'shear'|0|1|2; curvatureGainT?: number; curvatureBoostMax?: number; exposure?: number; zeroStop?: number; cosmeticLevel?: number }
      shift?: ShiftParams
      physicsParityMode?: boolean
      gammaVanDenbroeck_vis?: number
      metric?: { use?: 0|1; G?: number[] }
      driveDir?: number[]
      sectorCount?: number
    }
  }

  export default function WarpVisualizer({ parameters }: WarpVisualizerProps) {
    const _p: any = parameters
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<any>(null)
    const unmountedRef = useRef(false)
    const [isRunning, setIsRunning] = useState(true)
    const [isLoaded, setIsLoaded] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [loadingState, setLoadingState] = useState<LoadingState>({ type: 'loading', message: 'Initializing…' })
    const [initNonce, setInitNonce] = useState(0)
    const displayModeRef = useRef<DisplayMode>('exaggerated')
    const displayGainRef = useRef<number>(20)
    const zeroStopRef = useRef<number>(VIS.zeroStopDefault)

    // Engine constructor shim
    const makeEngine = (EngineCtor: any) => {
      if (!canvasRef.current) throw new Error('canvas missing')
      const W = (EngineCtor || (window as any).WarpEngine)
      if (!W || typeof W.getOrCreate !== 'function') throw new Error('WarpEngine.getOrCreate missing - check /public/warp-engine.js')
      const engine = W.getOrCreate(canvasRef.current, { strictScientific: true })

      // Non-blocking shader compile state (or simulated states in CPU engine)
      engine.onLoadingStateChange = (state: LoadingState) => {
        setLoadingState(state)
        if (state.type === 'ready') setIsLoaded(true)
      }

      // WebGL context loss handling (restores cleanly)
      const cv = engine.canvas || canvasRef.current
      if (cv) {
        const onLost = (e: Event) => { e.preventDefault(); console.warn('[WarpEngine] WebGL context lost'); setLoadError('WebGL context lost'); }
        const onRestored = () => { console.info('[WarpEngine] WebGL context restored'); try { engine.reinit?.(); engine.requestRewarp?.(); setLoadError(null) } catch {} }
        cv.addEventListener('webglcontextlost', onLost as any, { passive: false })
        cv.addEventListener('webglcontextrestored', onRestored as any, { passive: true })
        ;(engine as any).__ctxLossCleanup = () => {
          cv.removeEventListener('webglcontextlost', onLost as any)
          cv.removeEventListener('webglcontextrestored', onRestored as any)
        }
      }

      // Initial framing + neutral cosmetics (physics comes from adapter)
      const mode = (parameters.currentMode || 'hover').toLowerCase()
      const hull = parameters.hull || { Lx_m: 1007, Ly_m: 264, Lz_m: 173, a: 503.5, b: 132, c: 86.5 }
      const a = num(hull.a, 503.5), b = num(hull.b, 132), c = num(hull.c, 86.5)
      const s = 1 / Math.max(a, b, c, 1e-9)
      const axesSceneSeed: [number,number,number] = [a*s, b*s, c*s]

      const wallNorm = Math.max(1e-5, num(parameters.wall?.w_norm, VIS.defaultWallWidthRho))
      const epsilonTilt = num(parameters.shift?.epsilonTilt ?? parameters.epsilonTilt, mode === 'standby' ? 0 : 5e-7)
      const betaTiltVec = vec3(parameters.shift?.betaTiltVec ?? parameters.betaTiltVec, [0,-1,0])
      const tiltGain = Math.max(0, Math.min(0.65, (epsilonTilt / 5e-7) * 0.35))

      engine.bootstrap?.({
        axesScene: axesSceneSeed,
        axesClip: axesSceneSeed,
        hullAxes: [a,b,c],
        gridSpan: parameters.gridSpan ?? Math.max(VIS.minSpan, Math.max(...axesSceneSeed) * VIS.spanPaddingDesktop),
        wallWidth: wallNorm,
        epsilonTilt,
        betaTiltVec,
        tiltGain,
        exposure: Math.max(1.0, VIS.exposureDefault),
        zeroStop: Math.max(1e-18, VIS.zeroStopDefault),
        physicsParityMode: !!parameters.physicsParityMode,
        ridgeMode: !!parameters.physicsParityMode ? 0 : 1,
        currentMode: parameters.currentMode || 'hover'
      })

      // Seed cameraZ (non-physics)
      try {
        const camZ0 = computeCameraZ(axesSceneSeed, canvasRef.current!)
        gatedUpdateUniforms(engine, withoutPhysics({ cameraZ: camZ0, lockFraming: true }), 'visualizer')
      } catch {}

  // Note: viewAvg is operational; do not set it here. Inspector essentials own it.

      // Resize observer keeps camera fit
      const ro = new ResizeObserver(() => {
        if (engine._resizeCanvasToDisplaySize) engine._resizeCanvasToDisplaySize()
        try {
          const u = engine.uniforms
          if (u && Array.isArray(u.axesClip) && canvasRef.current) {
            const cam = computeCameraZ(u.axesClip, canvasRef.current)
            gatedUpdateUniforms(engine, withoutPhysics({ cameraZ: cam, lockFraming: true }), 'visualizer')
          }
        } catch {}
      })
      if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement)
      ;(engine as any).__resizeObserver = ro

      // Global strobing multiplexer (fan-out to many viewers)
      const ensureStrobeMux = () => {
        const w = window as any
        const prev = w.setStrobingState
        if (!w.__strobingListeners) w.__strobingListeners = new Set()
        w.setStrobingState = (payload: { sectorCount:number; currentSector:number; split?:number }) => {
          try { typeof prev === 'function' && prev(payload) } catch {}
          for (const fn of w.__strobingListeners) { try { fn(payload) } catch {} }
        }
        w.__addStrobingListener = (fn:Function) => { w.__strobingListeners.add(fn); return () => w.__strobingListeners.delete(fn) }
      }
      ensureStrobeMux()

      // Subscribe this engine to strobe fan-out
      const off = (window as any).__addStrobingListener?.(({ sectorCount, currentSector, split }:{sectorCount:number;currentSector:number;split?:number;})=>{
        if (!engineRef.current) return
        const s = Math.max(1, Math.floor(sectorCount||1))
        const splitValue = (typeof split === 'number' && Number.isFinite(split))
          ? (split < 1 ? split * s : split)
          : s / 2;
        const splitIdx = Math.max(0, Math.min(s - 1, Math.floor(splitValue)));
        gatedUpdateUniforms(engineRef.current, withoutPhysics({
          sectors: s,
          split: splitIdx,
          sectorIdx: Math.max(0, currentSector % s)
        }), 'visualizer')
        engineRef.current.requestRewarp?.()
      })
      ;(engine as any).__strobingCleanup = off

      // Kick first frame (legacy engines may require it)
      engine._startRenderLoop?.()
      requestAnimationFrame(() => { if (!unmountedRef.current) setIsLoaded(true) })

      return engine
    }

    // Init + watchdog
    useEffect(() => {
      let cancelled = false
      unmountedRef.current = false
      let watchdog: number | null = null

      const performInit = async () => {
        installWarpPrelude(Number(parameters.gridScale ?? 1.0))
        setLoadError(null); setIsLoaded(false)

        watchdog = window.setTimeout(() => {
          if (!cancelled) setLoadError('Timeout waiting for WarpEngine. Check /public/warp-engine.js and WebGL support.')
        }, 6000) as any

        try {
          // If already present, use it
          if ((window as any).WarpEngine) {
            if (!cancelled) engineRef.current = makeEngine((window as any).WarpEngine)
            return
          }

          // Load script from common locations
          const resolveAssetBase = () => {
            const w: any = window
            if (w.__ASSET_BASE__) return String(w.__ASSET_BASE__)
            if (import.meta?.env?.BASE_URL) return String(import.meta.env.BASE_URL)
            if (typeof (w.__webpack_public_path__) === 'string') return w.__webpack_public_path__
            if (typeof (w.__NEXT_DATA__)?.assetPrefix === 'string') return w.__NEXT_DATA__.assetPrefix || '/'
            const baseEl = document.querySelector('base[href]') as HTMLBaseElement | null
            return baseEl ? baseEl.href : '/'
          }
          const assetBase = resolveAssetBase()
          const stamp = (window as any).__APP_WARP_BUILD || 'dev'
          const mk = (p: string) => { try { return new URL(p, assetBase).toString() } catch { return p } }
          const trySrcs = [ (window as any).__WARP_ENGINE_SRC__, mk(`warp-engine.js?v=${encodeURIComponent(stamp)}`), 'warp-engine.js', '/warp-engine.js?v=canonical' ].filter(Boolean) as string[]

          for (const src of trySrcs) {
            await new Promise<void>((resolve) => {
              const script = document.createElement('script')
              script.src = src; script.async = true
              script.onload = () => resolve()
              script.onerror = () => resolve()
              document.head.appendChild(script)
            })
            if ((window as any).WarpEngine && !cancelled) {
              engineRef.current = makeEngine((window as any).WarpEngine)
              return
            }
          }
          throw new Error('WarpEngine not found on window after script load (check public path / base URL)')
        } catch (err: any) {
          console.error('WarpEngine init error:', err)
          if (!cancelled) setLoadError(err?.message || 'Engine initialization failed')
        } finally {
          if (watchdog) clearTimeout(watchdog)
        }
      }

      const el = canvasRef.current
      if (!el) return

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !cancelled) { performInit(); io.disconnect() }
        }, { root: null, rootMargin: '200px 0px', threshold: 0.01 })
        io.observe(el)
        return () => {
          cancelled = true; unmountedRef.current = true
          io.disconnect(); if (watchdog) clearTimeout(watchdog)
          try { (engineRef.current as any)?.__resizeObserver?.disconnect?.() } catch {}
          try { (engineRef.current as any)?.__strobingCleanup?.() } catch {}
          try { (engineRef.current as any)?.__ctxLossCleanup?.() } catch {}
          try { engineRef.current?.destroy?.() } catch {}
          engineRef.current = null
        }
      }

      performInit()
      return () => {
        cancelled = true; unmountedRef.current = true
        if (watchdog) clearTimeout(watchdog)
        try { (engineRef.current as any)?.__resizeObserver?.disconnect?.() } catch {}
        try { (engineRef.current as any)?.__strobingCleanup?.() } catch {}
        try { (engineRef.current as any)?.__ctxLossCleanup?.() } catch {}
        try { engineRef.current?.destroy?.() } catch {}
        engineRef.current = null
      }
    }, [initNonce])

    // Live updates (physics via adapter; cosmetics via gate)
    useEffect(() => {
      if (!isLoaded || !engineRef.current) return
      const lc = parameters.lightCrossing

      try {
        const dutyResolved = isFiniteNum(parameters.dutyEffectiveFR)
          ? clamp01(parameters.dutyEffectiveFR!)
          : (lc && lc.dwell_ms > 0 ? clamp01(lc.burst_ms / lc.dwell_ms) : clamp01(num(parameters.dutyCycle, 0.14)))

        const sectorCountResolved = Math.max(1, Math.floor(num((parameters as any).sectorCount, lc?.sectorCount ?? 1)))
        const sectorsResolved = Math.max(1, Math.floor(num(parameters.sectorStrobing, lc?.sectorCount ?? 1)))

        const gammaGeo = Math.max(1, num(parameters.g_y, 26))
        const qCavity  = Math.max(1, num(parameters.cavityQ, 1e9))
        const qSpoil   = Math.max(1e-6, num(parameters.qSpoilingFactor, 1))
        const parity   = !!parameters.physicsParityMode

        const ah = num(parameters.hull?.a, 503.5), bh = num(parameters.hull?.b, 132), ch = num(parameters.hull?.c, 86.5)
        const sh = 1 / Math.max(ah, bh, ch, 1e-9)
        const axesSceneNow: [number,number,number] = [ah*sh, bh*sh, ch*sh]
        const spanNow = Math.max(VIS.minSpan, Math.max(...axesSceneNow) * VIS.spanPaddingDesktop)
        const camZnow = canvasRef.current ? computeCameraZ(axesSceneNow, canvasRef.current) : undefined

        // Ship-effective FR duty for geometry averaging
        const dFRShip = clamp01(dutyResolved * (sectorsResolved / Math.max(1, sectorCountResolved)))

        // Drive physics via adapter (SSOT); returns calibrated state if needed
        const pipelineState = {
          currentMode: parameters.currentMode || 'hover',
          dutyCycle: parameters.dutyCycle,
          dutyShip: parameters.dutyEffectiveFR ?? parameters.dutyCycle,
          sectorCount: sectorCountResolved,
          gammaGeo,
          gammaVanDenBroeck: num(parameters.gammaVanDenBroeck, 1.4e5),
          qCavity: qCavity,
          qSpoilingFactor: qSpoil,
          sag_nm: num(parameters.sagDepth_nm, 16),
          hull: parameters.hull || { Lx_m: 1007, Ly_m: 264, Lz_m: 173 },
          shipRadius_m: parameters.hull?.c ?? 86.5,
          modelMode: parity ? 'raw' : 'calibrated',
        }
        const liveState = driveWarpFromPipeline(engineRef.current, pipelineState)
        const _liveAny: any = liveState

        // Framing & pane-level uniforms that are non-physics
        const consolidatedUniforms = {
          axesScene: axesSceneNow,
          axesClip:  axesSceneNow,
          hullAxes:  [ah,bh,ch],
          gridSpan:  parameters.gridSpan ?? spanNow,
          ...(isFiniteNum(camZnow) ? { cameraZ: camZnow, lockFraming: true } : {}),
          currentMode: parameters.currentMode || 'hover',
          physicsParityMode: parity,
          ridgeMode: parity ? 0 : 1,
          sectorCount: sectorCountResolved,
          sectors: sectorsResolved,
          dutyEffectiveFR: dFRShip,
          viewAvg: true,
        }

        // Cosmetic-only patch (allowed through gate)
        gatedUpdateUniforms(
          engineRef.current,
          withoutPhysics({
            ...consolidatedUniforms,
            exoticMass_kg: (typeof _liveAny?.M_exotic === 'number' && isFinite(_liveAny.M_exotic)) ? _liveAny.M_exotic : _p.exoticMass_kg,
            // current exposure/zeroStop from overrides
            exposure: Number.isFinite(displayGainRef.current) ? Math.max(1.0, displayGainRef.current) : VIS.exposureDefault,
            zeroStop: Number.isFinite(zeroStopRef.current) ? Math.max(1e-18, zeroStopRef.current) : VIS.zeroStopDefault,
          }),
          'visualizer'
        )

        // Visual seasoning (never touches physics)
        const mode = parameters.currentMode || 'hover'
        const epsilonTilt = num(parameters.shift?.epsilonTilt ?? parameters.epsilonTilt, mode === 'standby' ? 0 : 5e-7)
        const betaTiltVec = parameters.shift?.betaTiltVec ?? parameters.betaTiltVec ?? [0,-1,0]
        const tiltGain = Math.max(0, Math.min(0.65, (epsilonTilt / 5e-7) * 0.35))

        const useMetric = Number(_p?.metric?.use ?? 0)
        const G = (_p?.metric?.G as number[] | undefined) ?? [1,0,0, 0,1,0, 0,0,1]
        const driveDir = (_p?.driveDir as number[] | undefined) ?? [1,0,0]

        const basePatch: any = {
          epsilonTilt: Number(epsilonTilt || 0),
          betaTiltVec,
          tiltGain,
          curvatureGainDec: parity ? 0 : Math.max(0, Math.min(8, parameters.curvatureGainDec ?? 0)),
          sagDepth_nm: Number.isFinite(parameters.sagDepth_nm) ? parameters.sagDepth_nm : 16,
          powerAvg_MW: Number.isFinite(parameters.powerAvg_MW) ? parameters.powerAvg_MW : VIS.powerAvgFallback,
          exoticMass_kg: Number.isFinite(parameters.exoticMass_kg) ? parameters.exoticMass_kg : VIS.exoticMassFallback,
          tsRatio: Number.isFinite(parameters.tsRatio) ? parameters.tsRatio : VIS.tsRatioDefault,
          u_useMetric: useMetric,
          u_metric: G,
          useMetric,
          metric: G,
          u_driveDir: driveDir,
          u_epsilonTilt: Number.isFinite(epsilonTilt) ? epsilonTilt : 0,
          u_betaTiltVec: betaTiltVec,
        }
        gatedUpdateUniforms(engineRef.current, withoutPhysics(basePatch), 'visualizer')

        // Display exaggeration (userGain) lives in the engine
        if (parity) {
          engineRef.current.setDisplayGain?.(1)
          if (!PHYSICS_TRUTH_MODE) gatedUpdateUniforms(engineRef.current, withoutPhysics({ displayGain: 1 }), 'visualizer')
        } else {
          const t = Math.max(0, Math.min(1, (parameters.curvatureGainDec ?? 0) / 8))
          const boost = (1 - t) + t * Math.max(1, parameters.curvatureBoostMax ?? 40)
          engineRef.current.setDisplayGain?.(boost)
          if (!PHYSICS_TRUTH_MODE) gatedUpdateUniforms(engineRef.current, withoutPhysics({ displayGain: 1 }), 'visualizer')
        }

        engineRef.current.requestRewarp?.()
      } catch (e) {
        console.warn('WarpVisualizer live update failed:', e)
      }
    }, [parameters, parameters.lightCrossing, isLoaded])

    // Window resize → camera fit & canvas size
    useEffect(() => {
      const handleResize = () => {
        if (!engineRef.current || !canvasRef.current) return
        try {
          const u = engineRef.current.uniforms || {}
          if (Array.isArray(u.axesClip) && u.axesClip.length === 3) {
            const cam = computeCameraZ(u.axesClip, canvasRef.current)
            gatedUpdateUniforms(engineRef.current, withoutPhysics({ cameraZ: cam, lockFraming: true }), 'visualizer')
          }
        } catch {}
        engineRef.current._resize?.()
        engineRef.current.requestRewarp?.()
      }
      if (isLoaded && engineRef.current) handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [isLoaded])

    // Subscribe to Viz Diagnostics HUD settings and push to engine
    useEffect(() => {
      if (!engineRef.current) return
      const handlerId = subscribe('warp:viz:display-settings', (payload: any) => {
        try {
          if (!engineRef.current) return
          const mode: DisplayMode = (payload?.displayMode as DisplayMode) || displayModeRef.current
          const gain: number = Number.isFinite(payload?.displayGain) ? Number(payload.displayGain) : displayGainRef.current
          const zero: number = Number.isFinite(payload?.zeroStop) ? Number(payload.zeroStop) : zeroStopRef.current
          displayModeRef.current = mode
          displayGainRef.current = gain
          zeroStopRef.current = zero

          // Map mode to exposure for this engine (exposure ~ visual gain)
          const mapped = mapThetaToDisplay({
            gammaGeo: 1, q: 1, gammaVdB: 1, dutyFR: 1, viewAvg: true
          }, { mode, ridgeMode: 1, zeroStop: zero, gain })
          const exposure = Math.max(1.0, mapped.displayGain)

          gatedUpdateUniforms(
            engineRef.current,
            withoutPhysics({ exposure, zeroStop: mapped.zeroStop }),
            'visualizer'
          )
          try {
            publish('warp:viz:trace', {
              t: Date.now(),
              mode,
              ridgeMode: engineRef.current?.uniforms?.ridgeMode ?? (parameters.physicsParityMode ? 0 : 1),
              gammaGeo: engineRef.current?.uniforms?.gammaGeo ?? 1,
              q: engineRef.current?.uniforms?.q ?? 1,
              gammaVdB: engineRef.current?.uniforms?.gammaVanDenBroeck ?? 1,
              dutyFR: engineRef.current?.uniforms?.dutyEffectiveFR ?? parameters.dutyEffectiveFR ?? parameters.dutyCycle,
              viewAvg: true,
              wallWidth: engineRef.current?.uniforms?.wallWidth ?? (parameters.wall?.w_norm ?? VIS.defaultWallWidthRho),
              axesClip: engineRef.current?.uniforms?.axesClip ?? [1,1,1],
              displayGain: exposure,
              zeroStop: mapped.zeroStop,
              cameraZ: engineRef.current?.uniforms?.cameraZ ?? 0,
            })
          } catch {}
          engineRef.current.requestRewarp?.()
        } catch {}
      })
      return () => { try { unsubscribe(handlerId) } catch {} }
    }, [isLoaded])

    // Scene scale global
    useEffect(() => {
      const s = Number(parameters.gridScale ?? 1.0)
      ;(window as any).sceneScale = Number.isFinite(s) ? s : 1.0
      if (engineRef.current?.setSceneScale) {
        engineRef.current.setSceneScale((window as any).sceneScale)
        engineRef.current.requestRewarp?.()
      }
    }, [parameters.gridScale, isLoaded])

    // Play/Pause toggle (legacy engines)
    const toggleAnimation = () => {
      setIsRunning((prev) => {
        const next = !prev
        if (engineRef.current) {
          if (next) engineRef.current._startRenderLoop?.()
          else if (engineRef.current.animationId) {
            cancelAnimationFrame(engineRef.current.animationId)
            engineRef.current.animationId = null
          }
        }
        return next
      })
    }

    const resetView = () => {
      if (!engineRef.current) return
      const u = engineRef.current.uniforms || {}
      gatedUpdateUniforms(engineRef.current, withoutPhysics({ ...u }), 'visualizer')
      engineRef.current.requestRewarp?.()
    }

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Natário Warp Bubble</CardTitle>
              <CardDescription>
                {(parameters.currentMode ? `${parameters.currentMode.toUpperCase()} Mode` : 'Real-time spacetime curvature')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { toggleAnimation(); zenLongToast('helix:pulse', { duty: parameters.dutyCycle, freqGHz: 15.0, sectors: parameters.sectorStrobing || 1, frOk: true, natarioOk: true, curvatureOk: true }) }}>
                {isRunning ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { resetView(); zenLongToast('helix:diagnostics', { zeta: VIS.zetaDefault, tsRatio: parameters.tsRatio, frOk: true, natarioOk: true, curvatureOk: true }) }}>
                <RotateCcw className="w-4 h-4"/>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700" style={{ aspectRatio: '16/9', width: 'min(100%, 900px)', minHeight: '320px' }}>
            <canvas ref={canvasRef} className="w-full h-full block transition-opacity duration-200" style={{ opacity: isLoaded ? 1 : 0 }} width={VIS.canvasWidthDefault} height={VIS.canvasHeightDefault} />
            {!isLoaded && (
              <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2 mx-auto"/>
                  <div>{loadingState.message}</div>
                  {loadingState.type === 'compiling' && <div className="text-xs text-yellow-400 mt-1">⚡ Non-blocking shader compilation…</div>}
                </div>
              </div>
            )}
            {loadError && (
              <div className="absolute inset-0 grid place-items-center bg-black/60 text-red-200 px-4">
                <div className="max-w-md text-center space-y-3">
                  <div className="font-mono text-sm">{loadError}</div>
                  <Button variant="outline" size="sm" onClick={() => setInitNonce((n) => n + 1)} className="mx-auto">Retry Load</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
