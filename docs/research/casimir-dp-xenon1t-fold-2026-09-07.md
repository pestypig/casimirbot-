# Conditional XENON1T electron-response prediction

Exploratory detector folding, 2026-09-07. Fixed mediator products and the same assumed unattenuated mono-speed source are used. No likelihood limit or allowed shared point is established.

| Mediator masses | Raw events, E>=186 eV | Selected events, E>=186 eV | Selected events, E>=50 eV sensitivity only |
|---|---:|---:|---:|
| 1 keV, 1 GeV | 27.1108 | 1.20818 | 37.6936 |
| 100 keV, 1 GeV | 7.36800 | 0.342024 | 1.20327 |
| 10 MeV, 1 GeV | 7.00052e-7 | 3.64604e-8 | 5.58815e-8 |

Selected counts sum all 199 released S2 bins. They are not the count in a model-optimized statistical region of interest. The source's approximately 10 keV energy and 5 MeV momentum endpoints bound the atomic calculation. The large near-threshold raw total from earlier packets does not translate into a comparably large selected prediction with the published energy cutoff. Thus that raw total alone cannot establish a conflict with this search. The 50 eV variant does not reproduce the published analysis; it illustrates sensitivity to lower-energy response assumptions.

## Construction and checks

Use the authenticated [XENON1T release](https://github.com/XENON1T/s2only_data_release/tree/5a364bc8709f2561e5a013ddea6993a5a7c8e313), `s2_response_er.csv`, and raw search exposure 356770 kg day. The matrix already includes event selections. The earlier theoretical spectrum in counts per eV for 2840 kg year is rescaled by 356770/(2840*365), then integrated against each monoenergetic response interpolated linearly in log energy. This avoids treating the energy-node spacing as uniform and avoids a second efficiency factor. Source and response hashes are checked; the JSON records the reused baseline script hash.

The incident flux at XENON1T is assumed equal to the earlier fixed 0.003/cm³, 776 km/s source. This is a conditional cross-experiment assumption, not a halo fit or underground transport calculation. The frozen nuclear normalization and mediator products have not been retuned. Detector charge response does not correct the atomic electronic wavefunctions for liquid xenon.

For each variant, the full 199-bin prediction is saved in the sibling JSON. Quadrature refinement from 512 to 1024 subdivisions changes the selected total by at most 0.017%. All predicted bins are nonnegative and their sum is below the raw count. Those are numerical checks over fixed interpolation choices, not atomic or detector systematic uncertainties. The calculation reuses the established atomic integral; it is not an independent normalization validation.

    python docs/research/casimir-dp-xenon1t-fold-2026-09-07.py PATH_TO_ATOMICIONISATION PATH_TO_XENON1T_RELEASE

## Next decision

The older published cutoff gives only order-unity selected events for the most promising light pair. Before spending effort on a full recast, compare that prediction with the release's actual region-selection and inference procedure and assess whether it can discriminate this parameter point. A stronger low-threshold response may be more useful, but requires the correct liquid response, exposure and selections. Capture supply and a measurable canonical boundary contrast remain the principal unresolved requirements. This packet supports neither a global exclusion nor compatibility with all experiments. Research-only calculation and documentation; no Casimir server verification applies.
