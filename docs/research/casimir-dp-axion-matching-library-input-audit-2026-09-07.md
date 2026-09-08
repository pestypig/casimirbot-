# Independent matching: mass-input audit

Exploratory snapshot, September 7, 2026. Previous turn made progress by checking top self-running. Before extending the evolution, this packet audits an independent weak-scale matching implementation. No model inputs or installed package files are changed.

## Finding

The installed `wilson==2.5.2` one-loop matcher assigns `mt=173` and `mH=125` internally. It separately constructs a quark-mass array from parameters. Passing `m_t=162.6` therefore does not generally replace the top mass in its loop functions. Our selected calculation uses 162.6 GeV; an unqualified numerical comparison would mix inputs.

The library tests identify [Dekens and Stoffer, 1908.05295](https://arxiv.org/abs/1908.05295) as the underlying general-flavor one-loop matching calculation. The paper is an appropriate independent lead, but source applicability does not establish compatibility of the installed implementation's inputs with ours.

## Reproducible probe

The [script](casimir-dp-axion-matching-library-input-audit-2026-09-07.py) authenticates `smeft_loop.py` with SHA256 `8ed9cbfc1c7485e23506034dde6ffab8142439c69701718688c0a6427fa9d4e0`. It extracts the VddLL expression and original setup using ASTs, avoiding the unrelated large matching expressions. It subtracts the zero-Wilson-coefficient result.

A Hermitian up-basis probe sets phiq1_13=phiq1_31=1e-9 GeV^-2. This is a convention test, not our physical candidate. Changing the supplied top mass from 173 to 162.6 produces exactly zero change in this extracted original expression. In a separate in-memory variant, only `mt=173` is replaced by `mt=par['m_t']`. The relative tensor change is **0.0266685**, defined as max(abs(new-old))/max(abs(old)); it is not a kaon-coefficient shift. The variant reproduces the original at 173 to numerical precision.

The [JSON](casimir-dp-axion-matching-library-input-audit-2026-09-07.json) records all three passing checks. A larger Python recursion limit is needed to compile the generated expression tree. Installed and archived source files remain unchanged. The physics root-leaf documentation check passes separately.

## Consequence for the shared-model calculation

Do not use the default library result as an independent validation of our 162.6 GeV calculation. A numerical mass replacement is also not a pole-to-running mass scheme conversion: that requires consistent perturbative conventions and associated finite terms. The input-sensitive variant is diagnostic only.

Next compare isolated operator responses at a common declared mass and scale, rotate all doublet indices consistently between the library's up basis and our down basis, subtract the SM contribution, and establish the LEFT-Lagrangian versus Hamiltonian sign and symmetry normalization. Start with the qu/current structures before interpreting differences in the more general qq terms. Finite evanescent conventions and the library's broader gauge contributions also need an explicit scope comparison.

This audit changes the next validation procedure, not the xenon or coherence prediction. It does not establish a model discrepancy, correct a measured mass, or admit the model. The shared-scattering goal remains active.
