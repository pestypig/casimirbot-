# Electron-line transversality and conditional forward coefficient

Exploratory matching step, September 7, 2026. The frozen 300 MeV candidate is unchanged.

For S(k)=(slash(k)+m)/(k^2-m^2), define the forward electron tensor between on-shell external spinors as T^(mu nu)=ubar[p] {gamma^mu S(p+l) gamma^nu + gamma^nu S(p-l) gamma^mu} u[p]. Contracting l_mu into the first term gives ubar gamma^nu u using the external Dirac equation and inverse propagator identity. The second gives its negative. The other index cancels in the same way. This proof does not require l to be on shell. It fixes the relative plus sign of these two electron orderings.

The companion script verifies both contractions on the full two-by-two external rest-spin block at 24 seeded off-shell momenta. Maximum absolute residual is 2.20e-16. A deliberately wrong relative minus sign gives a maximum residual of 2, providing a nontrivial negative control. The [Compton Ward identity](https://home.ba.infn.it/~marrone/IQF-Lecture-Notes.html) provides the standard context; the explicit off-shell-forward derivation here is the relevant check.

For this electron vector-current subset, longitudinal vector-propagator terms have an l index on the electron tensor and therefore vanish in the sum. This result does not require pretending that the mass-changing dark current is conserved. It is restricted to the vector subset and on-shell electron amplitude; scalar-portal contributions or bound-state response are not established by it.

Using the preceding normalized trace integrals, their sum is 0.00123840232413 GeV^-2 before couplings. Multiplication by (4*pi*alpha_eff)^2 with alpha_eff=3.03645203155e-6 gives a conditional forward SI potential-coefficient magnitude of 1.80307725877e-12 GeV^-2. The preceding heavy-limit check supports this magnitude convention. Neither Ward cancellation nor that limit separately fixes every Majorana multiplicity or a global sign; retain the coefficient as conditional pending a complete operator derivation.

Do not equate this coefficient to the complete electron amplitude squared. Rest spin averaging projects onto the SI part, and does not determine spin-dependent operators. Nonzero momentum and electron kinetic-energy dependence must be checked before using a density-response function. The two-insertion interaction on different constituents remains a distinct matching problem. No detector count, local coherence loss, measurable overlap or model admission is claimed.

Next derive the remaining spin/operator content and bound the momentum expansion over the material-response grid. This work closes the electron-line longitudinal-propagator check for the forward vector subset and keeps the full shared-model goal active.
