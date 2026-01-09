# RenderPlan Training Pipeline

This pipeline builds a lightweight model that maps stems + metadata analysis to a
RenderPlan. It is intentionally small and deterministic so you can iterate on
data collection and feature design before scaling up to larger models.

## Dataset layout

Create a dataset root with this structure:

```
datasets/renderplan/
  manifest.jsonl (optional)
  tracks/
    <track_id>/
      stems/
        instrumental.wav
        vocal.wav (optional)
      metadata/
        ableton.json (optional)
        tempo.json (optional)
      render_plan.json
```

`manifest.jsonl` can override paths per entry:

```json
{"id":"track-001","stems":"C:/data/stems/track-001","metadata":"C:/data/meta/track-001.json","render_plan":"C:/data/plans/track-001.json","tempo":"C:/data/meta/tempo.json"}
```

## Step 1: Build the dataset

```
python scripts/plan-train/build_renderplan_dataset.py --root datasets/renderplan --out datasets/renderplan/plan_dataset.jsonl
```

Output rows include:
- `tempo`
- `analysis` (energy/density/brightness windows + optional sections)
- `target` (RenderPlan)

## Step 2: Train a baseline model

```
python scripts/plan-train/train_renderplan_model.py --dataset datasets/renderplan/plan_dataset.jsonl --out datasets/renderplan/plan_model.json
```

The model is a per-window linear regressor for:
- `sampleInfluence`, `styleInfluence`, `weirdness`
- `fx.chorus`, `fx.sat`, `fx.reverbSend`, `fx.comp`

## Step 3: Predict a RenderPlan from analysis

```
python scripts/plan-train/predict_renderplan_model.py --model datasets/renderplan/plan_model.json --analysis datasets/renderplan/example_analysis.json --out datasets/renderplan/example_render_plan.json
```

`example_analysis.json` can be a dataset row (contains `analysis` + `tempo`) or a
raw analysis object with windows.

## Next upgrades

- Replace the linear regressor with a small transformer or MLP.
- Add symbolic atoms (motifs/grooves/macros) to targets.
- Train separate heads for section classification + energy curve.
