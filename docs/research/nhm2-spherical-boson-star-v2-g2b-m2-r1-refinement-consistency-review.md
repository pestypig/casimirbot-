# NHM2 spherical-boson-star v2 G2B-M2-R1 refinement consistency review

Program gate: G2B-M2-R1 — refinement and evidence consistency review  
Workstream: lambda-zero center recovery  
Capability or component: read-only first-failure causality audit  
Current maturity: active review; no numerical execution authorized  
Target maturity: one minimal versioned successor or terminal falsifier  
Required frozen inputs: immutable M2 receipt, source, packet, and engine  
Required evidence: structural refinement analysis and receipt completeness audit  
Stop/fail criteria: no candidate values, solver call, threshold inference, or rerun  
Explicit non-goals: relaxing `2^-60` or `1e-10`, adding favorable refinements  
Downstream gate unlocked: preregistered local-center successor or terminal stop

## Questions to resolve

1. Does the failed 16/32 jet comparison test convergence of one consistent
   discrete solution, or does it mix the eight-substep nonlinear root with
   independently rematerialized flows in a way that requires a new solve at
   each refinement?
2. Is the fixed `2^-60` comparison appropriate for a twice-differentiated
   quintic on the frozen local mesh, based on method order and conditioning
   alone, without using the missing candidate disagreement magnitude?
3. What is the smallest successor that records all completed jets and
   comparisons before classification and can terminate without projection if
   the center duty fails?

The review may inspect code, immutable receipt bytes, and analytic truncation or
conditioning formulas. It may not invoke the nonlinear solver, rematerialize
candidate state, infer a looser threshold from a new observation, or change any
authority field.
