# Stellar Observables Diagnostic Source Check

Date: 2026-03-25

## Purpose

This audit records the source basis for the executable `stellar_observables_diagnostic` lane that consumes magnetic-activity, helioseismic-shift, and optional flare-statistics inputs.

## Theory Used

- Activity-cycle proxies and p-mode frequency shifts should move together positively in the solar-observables lane.
- Helioseismology remains an interior-diagnostic use of oscillation data.
- Magnetic cycle remains the observable downstream of solar-dynamo semantics.
- Flare statistics may optionally be summarized with power-law-like avalanche language inside the stellar activity lane.
- None of these observables are promoted into consciousness or collapse evidence.

## Source Basis

1. NASA/MSFC, "Helioseismology"
   - https://solarscience.msfc.nasa.gov/Helioseismology.shtml
   - Used for the role of oscillation modes and helioseismic inversion in probing solar interior structure.

2. NSO, helioseismic parameter archive
   - https://nso.edu/data/nisp-data/helioseismology/helioseismic-parameters/
   - Used as the authoritative landing page for the helioseismic parameter product family.

3. NSO, MRV1Z mode-frequency archive
   - https://nso.edu/data/nisp-data/helioseismology-mrv1z/
   - Used as the authoritative landing page for the mode-frequency series used in the replay.

4. GONG month/date lookup table
   - https://gong.nso.edu/data/DMAC_documentation/gongmonths.html
   - Used to resolve date-keyed MRV1Z monthly directories when assembling the replay series.

5. SILSO official monthly sunspot data file
   - https://www.sidc.be/SILSO/DATA/SN_m_tot_V2.0.txt
   - Used for the monthly magnetic-activity series paired to the GONG windows.

6. Chaplin et al., "Solar p-mode frequencies over the solar cycle"
   - https://adsabs.harvard.edu/pdf/1998MNRAS.300.1077C
   - Used for the diagnostic expectation that p-mode frequencies shift with solar activity.

7. NASA Technical Memorandum 111102, solar dynamo
   - https://ntrs.nasa.gov/api/citations/19960001025/downloads/19960001025.pdf
   - Used for the parent magnetic-cycle semantics.

8. Lu and Hamilton, "Avalanches and the Distribution of Solar Flares"
   - https://doi.org/10.1103/PhysRevLett.83.4662
   - Used for optional flare-avalanche / power-law statistics framing.

9. Guardrail source already recorded in the bridge lane
   - `stellar-plasma-observables-not-consciousness`
   - Used to block direct promotion of stellar plasma observables into consciousness claims.

## Result

- The repo now has an executable stellar-observables diagnostic lane.
- The current replay is no longer synthetic-only. It is built from GONG MRV1Z `l=0, n=17..23` weighted mean frequency shifts relative to the 1998-01 window, paired against official SILSO monthly sunspot numbers for the same months.
- The lane is observational and diagnostic.
- The guardrail against consciousness promotion remains explicit and executable.
