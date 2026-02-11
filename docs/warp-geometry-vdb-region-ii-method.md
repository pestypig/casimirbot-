# Warp Geometry VdB Region II Method (M4)

Status: draft  
Owner: dan  
Scope: Van Den Broeck region II modeling and two-wall signature

## Purpose
Define the method required to make Van Den Broeck CL2/CL3 congruent: B(r) must be a function with explicit derivatives so region II stress-energy depends on B' and B''.

## VdB Region II Requirements
- Model B(r) as a function, not a scalar gain.
- Compute B' and B'' explicitly for region II.
- Verify two-wall signature: nontrivial contributions from both the B-transition (region II) and the f-transition (region IV).

## Method Outline
1. Define B(r) using the piecewise conditions in the paper, with a smooth polynomial in the transition band.
2. Compute B'(r) and B''(r) analytically or via finite differences.
3. Evaluate the region II energy density using the B' and B'' dependence.
4. Confirm region II support is nonzero where B varies and falls off outside the transition band.

## Two-Wall Signature Check
- Region II: B varies, f is constant; stress-energy must be nontrivial from B' and B''.
- Region IV: f varies, B is constant; stress-energy matches Alcubierre-like wall behavior.
- If only one region shows support, VdB implementation is incomplete.
- Region IV diagnostics should sample df/dr from the Alcubierre top-hat profile
  around R (f-wall band) and report df/dr support explicitly.

## Kickoff Checklist
- Locate current gammaVdB usage and identify implied B(r) assumptions.
- Select a candidate B(r) profile and smoothing scheme.
- Add a diagnostic plot or log of B, B', B'' across region II.
- Define tolerances for “nontrivial support” in region II and region IV.

## Artifacts
- This VdB region II method is referenced by Phase M4 in `docs/warp-tree-dag-task.md`.
