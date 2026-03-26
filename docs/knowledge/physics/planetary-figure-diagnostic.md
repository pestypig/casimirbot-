---
id: planetary-figure-diagnostic
aliases: ["planetary figure diagnostic", "J2 flattening diagnostic", "profile-calibrated figure diagnostic"]
scope: diagnostic closure over low-order planetary figure quantities q, J2, H, k2, and flattening, with profile-backed cross-body comparisons
intentHints: ["define", "what is", "diagnostic", "explain"]
topicTags: ["physics", "gravity", "planetary", "shape", "diagnostic"]
mustIncludeFiles: ["docs/knowledge/physics/physics-self-gravity-shape-tree.json", "docs/knowledge/physics/physics-gravitational-response-tree.json"]
---
Definition: Planetary figure diagnostic is the low-order closure that checks whether rotational parameter, quadrupole coefficient, dynamical ellipticity, Love-number response, and flattening proxies are mutually consistent for a self-gravitating body under a named calibration profile.
Key questions: Is the source discussing calibrated low-order figure closure, rather than only naming J2 or flattening in isolation? Does it distinguish diagnostic cross-body comparison from certified geodesy or interior inversion?
Notes: This is a diagnostic lane, not a certified geodesy, interior-structure, or IERS Earth-orientation product. The current profile set includes Earth reference, Mercury as the primary non-Earth executable congruence surface, Mars as a secondary static solid-body calibration, Jupiter as a giant-body stress-test, and synthetic Saturn-moon executable profiles for Mimas and Hyperion. Those Saturn-moon profiles are explicitly labeled as synthetic diagnostic state sources rather than kernel ephemeris entries. The Mercury profile is now pinned to the Verma-Margot MESSENGER gravity/tide solution and is expected to behave as a hard falsifier for this low-order closure rather than as a permissive cross-body pass band.
Validated against:
- NASA GSFC Earth Fact Sheet / NSSDC Earth fact data for equatorial radius, flattening, and moment-of-inertia context. https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
- NASA GSFC / NSSDC Mercury Fact Sheet. https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html
- Verma and Margot, "Mercury's gravity, tides, and spin from MESSENGER radio science data." https://arxiv.org/abs/1608.01360
- Gomes, Folonier, and Ferraz-Mello, "Rotation and figure evolution in the creep tide theory. A new approach and application to Mercury." https://arxiv.org/abs/1910.12990
- Goossens et al., Mercury tides and interior constraints review. https://ntrs.nasa.gov/api/citations/20220012959/downloads/Goossens.tidal.STI.pdf
- NASA GSFC / NSSDC Mars Fact Sheet. https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
- Konopliv et al., Mars gravity and tidal Love number. https://doi.org/10.1029/2020GL090568
- NASA GSFC, "Nutation and Precession." https://earth.gsfc.nasa.gov/geo/multimedia/nutation-and-precession
- Tatum, "Precession." https://phys.libretexts.org/Bookshelves/Astronomy__Cosmology/Celestial_Mechanics_%28Tatum%29/06%3A_The_Celestial_Sphere/6.07%3A_Precession
- IERS Conventions (2010), Technical Note 36. https://www.iers.org/IERS/EN/Publications/TechnicalNotes/tn36
- Wahl, Hubbard, and Militzer, "The Concentric Maclaurin Spheroid method with tides and a rotational enhancement of Saturn's tidal response." https://doi.org/10.1016/j.icarus.2016.09.011
- JPL Solar System Dynamics, Planetary Satellite Physical Parameters. https://ssd.jpl.nasa.gov/sats/phys_par/sep.html
- NASA NSSDC, Saturnian Satellite Fact Sheet. https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html
- NASA Technical Report 19880067580, "Internal structure and shape of Mimas." https://ntrs.nasa.gov/citations/19880067580
- Thomas et al., "Hyperion's sponge-like appearance." https://pubmed.ncbi.nlm.nih.gov/17611535/
- NASA Science, Hyperion. https://science.nasa.gov/saturn/moons/hyperion/
