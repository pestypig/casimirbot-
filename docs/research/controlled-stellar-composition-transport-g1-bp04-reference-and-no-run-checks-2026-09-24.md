Program gate: G1 — real calibrated solar baseline
Workstream: reference-source binding and zero-transport execution preparation
Capability or component: BP04 radius convention, reference-profile readiness, bounded runtime-stop tests
Current maturity: reduced_order_diagnostic
Target maturity: reduced_order_diagnostic; source audit and non-executing checks only
Required frozen inputs: Basu et al. 2009 BiSON-13 Table 3, author averaging kernels, G1 model/acceptance/structural manifests
Required evidence: authoritative BP04 radius and numerical profile fields, full kernel support, fail-closed resource tests
Stop/fail criteria: absent reference sound speed or Gamma1, partial radial coverage, unverified profile identity, missing cross terms or density operator, resource-policy drift
Explicit non-goals: deriving sound speed from an assumed EOS, launching MESA, structural admission, G1 closure
Downstream gate unlocked: none

# G1 BP04 reference and no-run checks — September 24, 2026

Status: **radius convention identified; full BP04 reference profile remains unbound**.

[Basu et al. (2009), Table 2](https://arxiv.org/html/0905.0651v2)
specifies a BP04 radius of `6.9598e10 cm` (`6.9598e8 m`). The authors state
that BP04 is their main reference for the sound-speed inversion, and that the
inverted quantity is `delta c^2/c^2` using `(c^2,rho)` kernel pairs. This is
the radius convention for interpreting that paper's BP04-normalized radii;
it is **not** the G1 calibration radius target `6.957e8 m`. The latter must
remain the separately frozen fit convention rather than be silently replaced.
The two radius conventions differ by `2.8e5 m`, about `0.0402%`; a future
candidate profile must state which radius is used to make each dimensionless
grid. The kernel's normalized coordinate should not be compared directly to
a MESA profile normalized by a different radius without explicit conversion.
The diagnostic operator now provides a tested physical-centimeters-to-BP04
fraction conversion; a `6.957e10 cm` model radius maps to approximately
`0.99959769`, not `1`. Coordinate conversion alone does not authorize use of
the incomplete reference or change the frozen MESA fit target.

The [public Bahcall BP2004 model table](https://www.sns.ias.edu/~jnb/SNdata/Export/BP2004/bp2004stdmodel.dat)
states `Rsun 6.9598E+10` and labels its second numerical column `R/Rsun`.
Its numerical radius runs from approximately `0.00649` to `0.94676` in the
published export. The author-provided sound-speed averaging-kernel grid
extends from approximately `0.006695899` to `1.001225` in normalized radius.
Thus the public export does **not** cover the outer kernel support, even
before any extrapolation or surface convention is considered. Its 12 columns
include `P`, `rho`, `T` and selected compositions, but omit `c^2` and
`Gamma1`. Computing `c^2 = Gamma1 P/rho` from this table would require an
unprovided, source-matched EOS/adiabatic-exponent profile. An ideal-gas
constant or another solar model is not an admissible stand-in. The public
table's exact identity with the inversion input remains unverified.
The archive's separately published [BP2000 sound-speed file](https://www.sns.ias.edu/~jnb/SNdata/Export/BP2000/)
belongs to a different model and likewise ends near `0.95 R_sun`; it is not
a BP04 substitute. The older MDI-derived sound-speed/Gamma1 table is an
observational inversion using a different reference, not the missing BP04
model profile.
The diagnostic operator's exact piecewise-linear tail integration at the
public table's `0.94676` endpoint makes the coverage failure quantitative.
Across the 37 Table 3 sound-speed kernels, absolute tail weight ranges from
`0.00581` to `0.94464` relative to a unit signed total kernel integral;
25 of 37 exceed `0.01`. For the outermost Table 3 row (second-quartile
radius `0.9566`), the signed tail is `0.82950` and absolute tail `0.94464`.
Even its central reported radius lies beyond the public table. These are
kernel-weight integrals, **not** bounds on the physical sound-speed residual:
without a bound on `delta c^2/c^2` in the missing interval, there is no
numerical error bound for clipping. A near-zero signed tail for another row
would not by itself establish safety because positive and negative lobes can
cancel. No kernel was truncated in the G1 operator.
The [public BP2004 directory index](https://www.sns.ias.edu/~jnb/SNdata/Export/BP2004/)
lists only the standard-model and neutrino-flux tables; it provides no
separate sound-speed or pulsation export. A further search of Basu's public
research page found explanatory figures, not a numerical BP04 model file.

The requested full fixed-reference calculation therefore remains blocked on
the exact BP04 `c^2(r)` profile and full radial support, as well as the
density/cross-term and systematic-error inputs already recorded in the G1
source manifest. No `comparisonOperator` is bound and no launch authority
changes. The Monday author follow-up can explicitly ask whether the original
BP04 structural/pulsation profile or a c/Gamma1 export and its normalization
are available. No additional email was sent for this packet.
Direct inspection of the received `cdif.txt` confirms its nine fields are
target/resolution statistics, the inverted difference and uncertainty; it
does not embed the BP04 `c^2` profile. The received averaging-kernel file
contains radius plus 76 kernel columns, not a reference-model column. Its
outermost coordinate of `1.001225` is about 852.6 km beyond the stated BP04
radius. The treatment of this near-surface tail must be specified and tested,
not silently clipped or extrapolated.

The non-running bounded-launcher monitor now rejects drift in each of its
four frozen runtime limits before evaluating a resource sample. Adversarial
tests cover relaxed concurrency, timeout, attempt-byte and host-free-space
limits, as well as negative, boolean, fractional-job and nonfinite samples.
The manifest check also uses exact scalar types: `true` cannot masquerade as
integer concurrency `1` under Python's boolean/integer equality rule.
The start-capacity preflight similarly now requires nonnegative integer byte
counts. Unknown, boolean, floating, infinite and NaN disk/RAM samples fail
closed; in particular NaN cannot bypass a threshold comparison.
This is a pure future-stop decision: it does not start, stop or certify a
container and cannot replace the still-missing execution adapter.

The pinned [MESA r24.03.1 output documentation](https://docs.mesastar.org/en/24.03.1/using_mesa/output.html)
warns that `history.data` appends rows after a restart without deleting
superseded models. The new read-only
[`g1_history_extract.py`](../../ops/mesa/g1-preparation-v1/g1_history_extract.py)
identifies the numbered column header, rejects malformed/nonfinite values,
and discards superseded branches when a model number repeats. Synthetic tests
show that a stale pre-restart terminal row cannot become the reported terminal
row. This extractor still makes no solver-exit, input-hash, unit, target-age,
convergence, profile or observation assertion; its `admissionAllowed` is
always false. Integration with an actual MESA history and its exact column
schema remains required before a calibration attempt can use it.
The pinned release's [default history-column list](https://raw.githubusercontent.com/MESAHub/mesa/24.03.1/star/defaults/history_columns.list)
includes `log_L` and `log_R`, but not an explicit `surface_Z_div_X` value;
its surface `h1` and `he4` lines are commented out. Thus the current frozen
inlist plus default history cannot supply the three-target calibration
objective from `history.data` alone. The history-only extractor requires
explicit `luminosity_ergs_s`, `radius_cm` and `surface_Z_div_X` columns before
converting the first two from cgs to SI. Its synthetic unit test passes, but
those custom history columns are not currently bound. Do not treat the
test-suite's custom Z/X output as a default MESA history column.

There is a better candidate for Z/X in the final profile. The pinned
[default profile-column list](https://raw.githubusercontent.com/MESAHub/mesa/24.03.1/star/defaults/profile_columns.list)
enables `x_mass_fraction_H`, `y_mass_fraction_He` and
`z_mass_fraction_metals` and states that zone 1 is the surface. The new
[`g1_profile_extract.py`](../../ops/mesa/g1-preparation-v1/g1_profile_extract.py)
checks model metadata, full sequential zone count, finite/closing mass
fractions and calculates zone-1 `Z/X` from those
total H/metals fields. This avoids inventing a metal abundance from selected
isotopes. It is still only a candidate extraction route: the actual final
profile, the surface-zone-versus-photosphere convention, and output identity
must be checked after a real run. The frozen
inlist requests a final profile but it can also be written on unsuccessful
termination; file presence alone is not a completed solar model. The default
profile's sound-speed and `Gamma1` columns are **disabled**, so a later
source-bound structural profile still needs versioned output selection and
native validation.

The pinned release's [source constants](https://raw.githubusercontent.com/MESAHub/mesa/24.03.1/const/public/const_def.f90)
give `Lsun=3.828e33 erg/s` and `Rsun=6.957e10 cm`, matching the nominal G1
fit conversions. A second pure extractor joins default history `log_L` and
`log_R` to the final profile's zone-1 Z/X only when model number and age
agree, yielding the three SI fit inputs without custom columns. The join
is covered by synthetic match/mismatch tests and always retains
`admissionAllowed:false`. Exact installed constant-file identity, native
output format, termination code, age target and convergence remain pending;
this does not admit a trial.

A read-only `docker image inspect` on September 24 evening failed because the
Docker Desktop Linux engine pipe was absent. This is an infrastructure
observation, not evidence that the pinned image has changed or that MESA
failed. No engine restart, container launch or model evolution was attempted.

Verification: the 31 `test_g1_*.py` no-solver tests passed, including a
hash-checked author-kernel regression for the public-table tail. A fresh local
preflight measured `40,708,919,296` host free bytes (above the 25 GB floor)
and `3,893,219,328` available-memory bytes (below the 4 GiB floor). It
remained `BLOCKED` on host memory, all four launch-authority flags, the null
structural comparison operator and the unimplemented execution adapter. The
preflight does not inspect Docker's data drive, and no science run occurred.
