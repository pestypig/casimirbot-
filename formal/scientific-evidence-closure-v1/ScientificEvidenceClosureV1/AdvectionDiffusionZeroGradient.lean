import Mathlib.Data.Real.Basic

set_option linter.unusedVariables false
set_option linter.unusedTactic false
set_option maxHeartbeats 1000000

/-!
Generated formal replay slice for Scientific Evidence Closure v1.

The declarations below are the dependency-minimal extraction of the pinned
Lanyon `advection_diffusion_full_1d` source needed to replay
`xDiffusiveFluxConsistency`. The formal enrollment binds both the upstream
source hash and this emitted-source hash. This file is not a proof of the PDE,
the numerical solvers, empirical validity, or physical truth.
-/

namespace advection_diffusion_full_1d

structure Coordinates where
  x : Real

structure State where
  f : Real

structure Parameters where
  a : Real
  Dxx : Real

structure SpatialGradient where
  f_x : Real

structure DiffusiveFlux where
  diffusive_flux_f : Real

noncomputable def xDiffusiveFluxExprs
    (C : Coordinates)
    (P : Parameters)
    (U : State)
    (DU : SpatialGradient) : DiffusiveFlux :=
  let x := C.x
  let a := P.a
  let Dxx := P.Dxx
  let f := U.f
  let f_x := DU.f_x
  {
    diffusive_flux_f := (Dxx * f_x)
  }

theorem xDiffusiveFluxConsistency
    (C : Coordinates)
    (U : State)
    (P : Parameters) :
    let DU : SpatialGradient :=
      {
        f_x := 0
      }
    ((xDiffusiveFluxExprs C P U DU).diffusive_flux_f) = 0 := by
  simp only [xDiffusiveFluxExprs, mul_zero]

#check advection_diffusion_full_1d.xDiffusiveFluxConsistency

end advection_diffusion_full_1d
