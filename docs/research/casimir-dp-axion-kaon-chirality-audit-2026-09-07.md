# Kaon chirality audit

Exploratory snapshot, September 7, 2026. Previous turn evaluated generated-operator VLL matching. This packet checks the remaining down-quark Delta-S=2 structures rather than assuming they vanish.

## Result

The tree and linearized one-loop responses for VddRR, V1ddLR, V8ddLR, S1ddRR and S8ddRR are numerically **zero** for both sd and ds orientations in the declared top-only Yukawa approximation. VddLL is nonzero and reproduces the preceding imaginary coefficient:

`Im H_VLL = 1.28098329736e-15 (tree) + 1.49356091193e-15 (finite)`

`= 2.77454420929e-15 GeV^-2`.

The opposite flavor orientation has the conjugate vector coefficient. Testing both scalar orientations also covers the opposite-chirality conjugate coefficients in this basis. These six JMS tensor structures and orientations avoid introducing redundant scalar/vector basis entries.

The null result applies to the boundary and approximation actually evolved. With zero down-type Yukawas, the right-handed down sector lacks the flavor-breaking interaction needed for these kaon coefficients in this setup. It does not establish exact zeros after restoring light Yukawas or adding omitted UV interactions.

## Method and checks

The [script](casimir-dp-axion-kaon-chirality-audit-2026-09-07.py) authenticates the previous evolved-coefficient chain and extracts all six responses from the installed tree and loop matching sources. The additional tree source SHA256 is `709b4ec92c166f4ceba881ec88309b511bbdf9d0b5ae6c2f0fb3ab56e7effda0`.

The loop mass is configured to 162.6 GeV in memory. Non-top external fermion masses are explicitly set to zero, consistently with the Yukawa approximation. The prior VLL result is preserved by this choice. Rotations follow the library's chirality-specific rules: four left-handed indices for VLL, two for mixed vectors, the two barred left-handed indices for scalar structures, and no rotation of right-handed down indices. H=-L is applied after rotation.

Symmetric positive/negative coefficient evaluations isolate the linear response, with amplification factors 100 and 300. VLL reproduction, the non-VLL null threshold and amplification stability pass. [JSON](casimir-dp-axion-kaon-chirality-audit-2026-09-07.json) retains separate tree and finite values for all twelve entries. The root-leaf documentation check passes separately. Installed and archived sources remain unchanged.

The finite library implementation is based on [Dekens–Stoffer matching](https://arxiv.org/abs/1908.05295). This audit is of the extracted implementation and the stated candidate approximation; it is not a proof for the complete UV model.

## Next work

Within this approximation, VLL is the only nonzero kaon structure to evolve below the weak scale. Next perform consistent thresholded QCD evolution and match the hadronic matrix-element convention, without reusing the earlier borrowed eta factors or double counting their running. Keep the incomplete UV boundary, electroweak input conversion and omitted light-Yukawa corrections explicit before deriving a new constraint or joint parameter region.

No xenon or local-coherence prediction changes. The shared-scattering goal remains active.
