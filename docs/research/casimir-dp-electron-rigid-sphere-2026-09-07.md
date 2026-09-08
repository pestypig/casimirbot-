# Rigid electron-density response of the frozen sphere

Date: 2026-09-07. Smooth-sphere contact component, not a complete subgap response.

The covered ELF calculation does not include elastic motion of the entire object's electron cloud. Evaluate that component for the constant electron-density interaction at W_e=0.015382967 GeV^-2, the coefficient corresponding nominally to the preceding XENON1T reference count. Treat the electrons as a uniform rigid density with six electrons per carbon atom. The whole-object amplitude is 6 N W_e times the uniform-sphere form factor 3 j_1(qR)/(qR).

Using the same frozen branch separation, hold, incoming density and speed, the dimensionless branch-filtered integral gives D=5.37074675e-19 through qR=1000. The analytic outer-tail bound is included in the companion JSON. The previously established loose envelope for the full dimensionless integral gives D<=1.49288572e-17. The central eikonal phase is 1.34764522e-7, supporting the weak-scattering treatment for this smooth potential at this coefficient.

The script directly reruns the sphere integral with W_atom=6 W_e; it does not change the nuclear amplitude or reinterpret the prior nuclear result as an electron response. It authenticates the apparatus and records the input result hash. Unit- and half-unit integration segments agree within the existing numerical criterion.

This component is larger than the covered electronic-excitation contribution, but remains over fifteen orders below the theoretical DP comparator near 0.03 even with the loose envelope. That comparator is not a measured sensitivity. The result concerns the constant density interaction, not the single-Yukawa range scan or full virtual two-insertion operator.

Microscopic electron density, phonon excitations, surface modes and correlations remain outside the uniform rigid model. No bound on all subgap material response follows. In a complete material calculation, elastic and inelastic channels must be normalized consistently; do not combine independent whole-domain approximations as if they were disjoint data.

Decision: rigid electron-cloud motion does not rescue the contact-density bridge under the shared-flux/reference-count assumptions. The next useful low-energy lead needs a specified internal material response, or a finite-range force with its ordinary-matter constraints and transport treated consistently. Preserve the quantitative failures rather than rescaling the contact coupling.
