# Mass-matched initial-path capture rate

Exploratory Born nuclear-channel calculation, 2026-09-07. No total capture or local-population prediction.

For the fixed local 776 km/s, 100 GeV incident particle and chosen 11.2 km/s escape speed, the allowed capture recoil interval is exceptionally narrow. With approximate nuclear mass M=A u, it is 334.935795–335.004664 keV for A=107, Z=47, and 334.935795–335.002569 keV for A=108, Z=48. These are diagnostic mass-matched nuclei, not a terrestrial abundance model.

For y=q² in GeV², integrate

    d sigma/dy = 4 pi Z²/v² [sum alpha_i/(y+m_i²)]² F_Helm²(q)

from y_min=M m (v²-v_escape²) to y_max=4 mu² v², with the usual GeV^-2 to cm² conversion. Products are unchanged. A point-nucleus calculation sets F=1 and bounds this normalized nuclear form-factor channel; it does not bound every atomic inelastic process. The Helm parameters follow the earlier xenon convention, applied to the chosen A.

For the leading 1-keV/1-GeV mediator pair:

| Target | Point nuclear cross section | Helm cross section | Pure-column point optical depth | Pure-column Helm optical depth |
|---|---:|---:|---:|---:|
| A=107, Z=47 | 1.24022e-41 cm² | 3.36841e-45 cm² | 4.88611e-10 | 1.32706e-13 |
| A=108, Z=48 | 1.26536e-41 cm² | 2.75521e-45 cm² | 4.93900e-10 | 1.07543e-13 |

The column is deliberately set to 7e9 g/cm² of the pure target isotope; number column is X/(A u). All three mediator pairs give similarly small values, with point optical depth below 4.95e-10 in this screen. Diluting this target at fixed total column cannot increase its contribution. No abundance lookup is needed to establish that specific statement.

Optical depths characterize a constant-initial-speed path with no prior collisions. If it were an independent Poisson channel alone, its collision probability would be 1-exp(-tau)<=tau. Earlier energy loss, changes in direction/potential, thermal nuclei or competing interactions alter the path and kinematics; the calculation is not an upper bound on such total capture histories. Do not combine it with perfect-capture population estimates and call the result a measured surface density.

The script asserts the frozen common-product receipt, verifies the capture interval is open, and checks the Helm integral lies below the point-nucleus result. Precision isotope masses and nuclear-response uncertainty would be needed for a precision capture rate, especially because this interval is narrow. The favorable initial mass-matched channel is small enough to deprioritize it as a standalone population supply. Next examine prior slowing or a genuinely different energy-changing mechanism without retuning the existing xenon normalization silently.

    python docs/research/casimir-dp-matched-capture-2026-09-07.py

Research-only calculation and documentation; no Casimir server verification applies.
