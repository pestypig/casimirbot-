# Exactly one soft collision: stronger-branch correction

Exploratory conditional transport component, using the same point-nucleus silica model and strong algebraic root. No measured-site transport, allowed point or detector likelihood is claimed.

Consider a normally incident, uniformly illuminated infinite slab. Select histories with exactly one collision, recoil energy at most 1 keV, and no subsequent collision before exiting the far face. This is disjoint from the uncollided histories. Lateral uniformity is essential: finite beam or detector geometry cannot simply import this transmitted-flux result.

## Calculation

For a species of mass mA, the normalized recoil density is proportional to 1/(E+b)^2, b=mmed^2/(2mA), over its elastic interval. After a recoil E, v'^2=v^2-2E/mchi and

`cos(theta_lab)=[p^2-(mchi+mA)E]/sqrt[p^2(p^2-2mchi E)]`.

At depth fraction y, the zero-additional-collision weight is exp[-tau*y-tau*k(E)*(1-y)], where k is the total cross-section ratio at the slower velocity divided by the outgoing cosine. The script integrates this depth factor analytically and recoil energy numerically. It includes both Si and O in the postcollision interaction rate.

An independent lower bound uses sigma(v')/sigma(v)<=v^2/v'^2 and cos(theta)>=sqrt[1-2mA,max Ecut/(p^2-2mchi Ecut)]. Thus k<=1.00338580. The soft optical depth is 6.37143870 and the exactly-one-soft transmitted flux divided by the uncollided flux is at least 5.93256898. Direct quadrature gives 6.27607816, between the lower bound and soft optical depth as checked by the script.

Including only uncollided and exactly-one-soft histories already gives 7.27607816 times the uncollided transmitted flux. Histories with more collisions are still omitted. The minimum xenon endpoint after the maximum selected energy loss remains about 329.4 keV, above the entire 200-269.9 keV comparison window.

## Consequence

The strong root's one-event uncollided normalization is not a total-flux solution. In this idealized geometry, an omitted, explicitly calculated population exceeds the uncollided flux and remains kinematically able to produce high xenon recoils. At fixed recoil energy within the common allowed window the prior Born differential cross section scales as 1/v^2, so slowing this selected component does not remove its high-window scattering response. Converting it to accepted events still needs angular/volume weighting and detector response; no accepted-count lower bound is claimed here.

Do not iteratively retune the coupling using only a succession of truncated collision orders as if that solved transport. The next calculation should include the full energy/angle redistribution, with collision-order convergence or a justified bound, and revisit the one-event normalization only after that response is available. Capture and the local diamond distribution remain separate unsolved outputs of the same model.

The companion Python/JSON files record the branch hash, checks and values. The lower bound and numerical component are conditional on the Born point-nucleus law; they do not establish its accuracy for the actual material or laboratory.
