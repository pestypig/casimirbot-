Program gate: S1 — common-scale hadronic matching.
Workstream: Spin-two quark/gluon evolution.
Capability or component: Leading five-flavor RG evolution and amplitude invariance.
Current maturity: Verified transport diagnostic, not authenticated axion boundary matching.
Target maturity: Matched coefficients and moments through heavy thresholds.
Required frozen inputs: Explicit moment and Wilson test vectors; no apparatus modification.
Required evidence: Splitting moments, momentum sum, dual evolution and independent ODE.
Stop/fail criteria: No test boundary vector presented as a UV matching result; no extension below heavy thresholds without matching.
Explicit non-goals: NLO running, threshold decoupling or complete axion twist prediction.
Downstream gate unlocked: Threshold and model-boundary matching; S1 remains open.

# Quark/gluon evolution must preserve the matched amplitude

This packet implements the leading spin-two evolution needed by the previous box matching. It tests the scale dependence of coefficients and nucleon momentum fractions together. Its purpose is to replace a scale-label check with an explicit evolution check, not to manufacture the missing axion matching boundary.

[Hill and Solon, QCD analysis](https://arxiv.org/html/1409.8290) develops the quark/gluon operator evolution and heavy-threshold matching framework. Here only a fixed five-flavor interval is implemented. The gluon convention has a positive momentum matrix element; coefficient signs must be converted if another operator basis defines the gluon operator oppositely.

For the momentum vector m=(u+,d+,s+,c+,b+,g), where q+=q(2)+anti-q(2), use

    dm/dln(mu^2) = alpha_s/(2 pi) P m,
    P_qq=-16/9, P_qg=1/3, P_gq=16/9, P_gg=-nf/3.

Other flavor-off-diagonal entries vanish at this order. Each column sums to zero, preserving the momentum sum. The off-diagonal entries are independently checked by integrating the leading splitting functions weighted by momentum.

The dual Wilson vector evolves with -P-transpose:

    dc/dln(mu^2) = -alpha_s/(2 pi) P^T c.

Consequently d(c^T m)/dln(mu^2)=0. With the leading running coupling, evolution is a matrix exponential with parameter t=2/beta0 log[alpha_s(mu0)/alpha_s(mu)], beta0=11-2nf/3. The script verifies this solution against an independent ODE integration and a round trip.

## Test inputs and results

The source-era Z-scale proton quark momentum fractions are those stated in [Abe et al., table 5](https://arxiv.org/html/1810.01039v2): (0.254,0.146,0.052,0.038,0.024). The gluon value 0.486 follows from the momentum sum. This is a reproduction input, not a modern PDF fit. Set alpha_s(MZ)=0.1181 as an explicit leading-order reference and choose a unit up-only Wilson test vector. It is not assigned to the previously calculated axion box coefficient.

At 10 GeV the evolved up moment is 0.285909. The up Wilson coefficient becomes 0.839567, the gluon coefficient becomes 0.0282081 and small other-flavor coefficients are generated. Their complete contraction remains exactly 0.254 to numerical precision. Evolving only the moments gives 0.285909, about 12.6% too large. Evolving both but discarding the generated gluon coefficient gives 0.240641, about 5.3% too small. These are intentionally inconsistent alternatives used to expose the error, not alternative physical predictions.

The maximum discrepancy between the ODE and exponential moment vectors is 3.22e-13. Momentum conservation, amplitude invariance and round-trip evolution pass. Results at 50 and 20 GeV are also retained in the JSON.

## Scope of progress

This evolves within 10 GeV to MZ, with nf=5 and no heavy-quark threshold crossing. Extending the same matrix to 1 GeV would be physically unjustified. Charm/bottom matching, a declared operator scheme and the model-specific low-mass-pseudoscalar matching are still required. Source PDF scale labels alone do not supply those steps.

The appropriate application is to evolve a genuinely matched full coefficient vector and compatible matrix elements. An up-only vector generally becomes a quark/gluon vector. It must enter both proton and neutron projections consistently before the xenon and local kernels are updated. This invariant transport test does not prove the existing axion coefficients are correctly matched at MZ, nor does it fix their missing gluonic hard contribution.

Replay `C:\Python313\python.exe docs/research/casimir-dp-axion-twist-rg-2026-09-07.py`. Five checks pass: splitting moments, generator momentum conservation, amplitude invariance, ODE comparison and round-trip transport. Physics root/leaf documentation validation passes. The full shared prediction and the user's goal remain open.
