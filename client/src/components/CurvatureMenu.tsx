import React from "react";

type CurvPresetKey = "flat" | "mild" | "cruise" | "steep" | "physics" | "single" | "shear";

const PRESETS: Record<CurvPresetKey, { t?: number; boost?: number; ridge?: 0|1; color?: "theta"|"shear"|"solid" }> = {
  flat:    { t: 0.00, boost:  1, ridge: 0, color: "theta" },
  mild:    { t: 0.25, boost: 20, ridge: 1, color: "theta" },
  cruise:  { t: 0.45, boost: 30, ridge: 1, color: "theta" },
  steep:   { t: 0.70, boost: 40, ridge: 1, color: "theta" },
  physics: {            boost:  1, ridge: 0, color: "theta" },   // double-lobe, parity-faithful
  single:  {            boost: 20, ridge: 1, color: "theta" },   // single crest at ρ=1
  shear:   {            boost: 20, ridge: 1, color: "shear" },   // |σ| palette
};

export default function CurvatureMenu({
  onApply
}: {
  onApply: (patch: any) => void;
}) {
  const [preset, setPreset] = React.useState<CurvPresetKey>("cruise");
  const [t, setT] = React.useState<number>(0.45);
  const [boost, setBoost] = React.useState<number>(40);

  const apply = (p: Partial<typeof PRESETS["cruise"]> = {}) => {
    const ridgeMode = (p.ridge ?? PRESETS[preset].ridge ?? 1) as 0|1;
    const colorMode = p.color ?? PRESETS[preset].color ?? "theta";
    const curvT = p.t ?? t;
    const curvatureBoostMax = p.boost ?? boost;
    onApply({
      curvatureGainT: curvT,          // 0..1 blend
      curvatureBoostMax,              // typically 1..40
      ridgeMode,                      // 0=physics df, 1=single crest
      colorMode,                      // 'theta' or 'shear'
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Preset</label>
        <select
          className="px-2 py-1 text-sm border rounded"
          value={preset}
          onChange={(e) => {
            const k = e.target.value as CurvPresetKey;
            setPreset(k);
            const p = PRESETS[k];
            if (p.t != null) setT(p.t);
            if (p.boost != null) setBoost(p.boost);
            apply(p);
          }}
        >
          <option value="flat">Flat</option>
          <option value="mild">Mild</option>
          <option value="cruise">Cruise</option>
          <option value="steep">Steep</option>
          <option value="physics">Physics (double-lobe)</option>
          <option value="single">Single crest (ρ=1)</option>
          <option value="shear">Shear proxy</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm w-28">Curvature T</label>
        <input
          type="range" min={0} max={1} step={0.01}
          value={t}
          onChange={(e) => { const v = +e.target.value; setT(v); apply({ t: v }); }}
          className="w-full"
        />
        <span className="text-xs w-12 text-right">{t.toFixed(2)}</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm w-28">Boost max</label>
        <input
          type="range" min={1} max={60} step={1}
          value={boost}
          onChange={(e) => { const v = +e.target.value; setBoost(v); apply({ boost: v }); }}
          className="w-full"
        />
        <span className="text-xs w-12 text-right">{boost.toFixed(0)}×</span>
      </div>

      <button
        className="px-3 py-1 rounded bg-neutral-900 text-white text-sm"
        onClick={() => apply()}
      >
        Apply to both panes
      </button>
    </div>
  );
}