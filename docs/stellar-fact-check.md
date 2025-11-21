### Stellar evolution and ISM fact-check

Concise checks for the lecture notes and UI copy. Pair each cited fix with the linked source.

1) **HRD turnoff ages** — Correct. Cluster main-sequence turnoff sets age; see Osterbrock & Ferland; Smartt 2009 for mass-lifetime context.  
2) **What sets a star’s life** — Correct, with wording tweak: mass dominates; metallicity modulates. Use bins: low-mass (<=0.8 Msun), intermediate (~0.8–8 Msun), high-mass (>=8–9 Msun). Above ~8–9 Msun stars can core-collapse (Smartt 2009).  
3) **Three-phase ISM** — Correct. Hot/warm/cold phases; SNe create a pervasive hot phase while cold/warm hold most local gas mass (McKee & Ostriker 1977).  
4) **H II regions** — Correct. Stromgren spheres, Te ~6,000–10,000 K; Strömgren 1939; Osterbrock & Ferland 2006.  
5) **Gas vs stars mass budget** — Fix: Galaxy stars (~5e10 Msun) outweigh cold+warm gas (few x 1e9 Msun). Replace “more material in cold clouds than stars” with this (Heyer & Dame 2015).  
6) **Dust/extinction** — Correct. Blue light scattered/absorbed; IR penetrates. Use CCM89 law (Cardelli, Clayton, Mathis 1989) for dereddening widgets.  
7) **H I 21 cm** — Correct. Hyperfine line traces H I scale height/flaring; see Draine 2011.  
8) **Protostars/disks/jets** — Correct. Kelvin–Helmholtz contraction, disks, bipolar jets (Reipurth & Bally 2001).  
9) **Brown dwarfs vs red dwarfs** — Fix: brown dwarfs are below H-burning limit (~0.075 Msun); some briefly burn deuterium (>~13 MJ) then cool. Red dwarfs (low-mass M stars) burn H for hundreds of billions–trillions of years. Cite Chabrier & Baraffe 2000.  
10) **End states** — Correct. Core-collapse progenitors above ~8–9 Msun -> SN -> NS/BH; below that -> WD (Smartt 2009).  
11) **Local Bubble** — Correct. Multiple SNe ~10–20 Myr; non-equilibrium soft X-ray spectrum; Berghofer & Breitschwerdt 2002; “Life in the Bubble” (2024).  
12) **Motions and LSR** — Correct. Adopt (U,V,W)_sun ~ (7.0, 10.4, 5.0) km/s from LSS-GAC (Huang 2015). Outreach “stacked speed” ref: Fraknoi 2007.

### Equations to surface in UI/tooltips
- Stromgren radius: R_S = (3 Q_H / (4 pi alpha_B n_e^2))^(1/3); recombination time tau_rec = 1/(alpha_B n_e).  
- Kelvin–Helmholtz timescale: t_KH = G M^2 / (R L).  
- CCM extinction: A_lambda / A_V = a(x) + b(x)/R_V, x = 1/lambda (micron^-1).  
- LSR conversion: build (U,V,W) from (mu_alpha, mu_delta, v_r, parallax) then subtract solar (U,V,W)_sun.  
- ISM phase defaults: HIM hot/low-n volume dominant; CNM/WNM hold most gas mass.

### Sources (ADS/standard texts)
- McKee & Ostriker 1977, ApJ 218, 148.  
- Strömgren 1939, ApJ 89, 526.  
- Osterbrock & Ferland 2006, *Astrophysics of Gaseous Nebulae and AGN*.  
- Cardelli, Clayton, Mathis 1989, ApJ 345, 245 (CCM89).  
- Draine 2011, *Physics of the Interstellar and Intergalactic Medium*.  
- Heyer & Dame 2015, ARA&A 53, 583.  
- Reipurth & Bally 2001, ARA&A 39, 403.  
- Chabrier & Baraffe 2000, ARA&A 38, 337.  
- Smartt 2009, ARA&A 47, 63.  
- Berghofer & Breitschwerdt 2002, A&A.  
- “Life in the Bubble” (2024).  
- Huang et al. 2015 (LSS-GAC); Fraknoi 2007 outreach note.
