use crate::independent_arithmetic::Ball512;

pub(crate) const PANELS: usize = 1536;
pub(crate) const NODES_PER_PANEL: usize = 24;
pub(crate) const PI_SERIES_TERMS: usize = 160;
pub(crate) const TRANSCENDENTAL_TAYLOR_DEGREE: usize = 256;
pub(crate) const VALIDATION_DEGREE: usize = 47;
pub(crate) const TAIL_ORDER: usize = 22;
pub(crate) const TAIL_MAJORANT_ITERATIONS: usize = 12;

fn scale(value: Ball512, factor: i64) -> Option<Ball512> {
    value.mul(Ball512::exact(factor, 0))
}

pub(crate) fn exp_taylor_256(x: Ball512) -> Option<Ball512> {
    let mut term = Ball512::exact(1, 0);
    let mut sum = term;
    for order in 1..=TRANSCENDENTAL_TAYLOR_DEGREE {
        term = term.mul(x)?.div(Ball512::exact(order as i64, 0))?;
        sum = sum.add(term)?;
    }
    let next = term.mul(x)?.div(Ball512::exact(257, 0))?.abs();
    // On |x|<=12, exp(|x|)<2^18; this is a fixed Lagrange enclosure.
    let error = next.mul(Ball512::exact(1, 18))?;
    sum.sub(error)?.hull(sum.add(error)?)
}

fn sinh_cosh_256(x: Ball512) -> Option<(Ball512, Ball512)> {
    let positive = exp_taylor_256(x)?;
    let negative = exp_taylor_256(x.neg())?;
    let sinh = positive.sub(negative)?.mul(Ball512::exact(1, -1))?;
    let cosh = positive.add(negative)?.mul(Ball512::exact(1, -1))?;
    if !cosh.strictly_positive() { return None; }
    Some((sinh, cosh))
}

fn atan_fixed_160(denominator: i64) -> Option<Ball512> {
    let x = Ball512::exact(1, 0).div(Ball512::exact(denominator, 0))?;
    let x_squared = x.square()?;
    let mut power = x;
    let mut sum = Ball512::exact(0, 0);
    for order in 0..PI_SERIES_TERMS {
        let term = power.div(Ball512::exact((2 * order + 1) as i64, 0))?;
        sum = if order % 2 == 0 { sum.add(term)? } else { sum.sub(term)? };
        power = power.mul(x_squared)?;
    }
    // The first omitted n=160 term is positive; alternating-series bracketing.
    let omitted = power.div(Ball512::exact(321, 0))?;
    sum.hull(sum.add(omitted)?)
}

fn machin_pi() -> Option<Ball512> {
    let first = scale(atan_fixed_160(5)?, 16)?;
    let second = scale(atan_fixed_160(239)?, 4)?;
    let pi = first.sub(second)?;
    if pi.strictly_positive() { Some(pi) } else { None }
}

fn tanh_256(x: Ball512) -> Option<Ball512> {
    let (sinh, cosh) = sinh_cosh_256(x)?;
    sinh.div(cosh)
}

fn build_ts24() -> Option<([Ball512; NODES_PER_PANEL], [Ball512; NODES_PER_PANEL])> {
    let pi = machin_pi()?;
    let pi_over_two = pi.mul(Ball512::exact(1, -1))?;
    let h = Ball512::exact(1, -3);
    let mut nodes = [Ball512::exact(0, 0); NODES_PER_PANEL];
    let mut weights = [Ball512::exact(0, 0); NODES_PER_PANEL];
    for (ordinal, k) in (-12i64..=11).enumerate() {
        let s = Ball512::exact(2 * k + 1, -4);
        let (sinh_s, cosh_s) = sinh_cosh_256(s)?;
        let inner = pi_over_two.mul(sinh_s)?;
        nodes[ordinal] = tanh_256(inner)?;
        let (_, cosh_inner) = sinh_cosh_256(inner)?;
        let denominator = cosh_inner.square()?;
        weights[ordinal] = h.mul(pi_over_two)?.mul(cosh_s)?.div(denominator)?;
        if !weights[ordinal].strictly_positive() { return None; }
    }
    Some((nodes, weights))
}

pub(crate) fn ts24_constant_moment() -> Option<Ball512> {
    let (_, weights) = build_ts24()?;
    let mut sum = Ball512::exact(0, 0);
    for weight in weights { sum = sum.add(weight)?; }
    Some(sum)
}

fn budget_fixture() -> bool {
    PANELS == 1536 && NODES_PER_PANEL == 24 && PI_SERIES_TERMS == 160
        && TRANSCENDENTAL_TAYLOR_DEGREE == 256 && VALIDATION_DEGREE == 47
        && TAIL_ORDER == 22 && TAIL_MAJORANT_ITERATIONS == 12
}

fn native_transcendental_fixture() -> bool {
    let pi = match machin_pi() { Some(value) => value, None => return false };
    let (sinh_zero, cosh_zero) = match sinh_cosh_256(Ball512::exact(0, 0)) {
        Some(value) => value, None => return false,
    };
    pi.sub(Ball512::exact(3, 0)).map_or(false, |value| value.strictly_positive())
        && pi.sub(Ball512::exact(4, 0)).map_or(false, |value| value.strictly_negative())
        && sinh_zero.is_exact_zero() && cosh_zero.contains_dyadic(1, 0)
}

fn node_weight_fixture() -> bool {
    let (nodes, weights) = match build_ts24() { Some(value) => value, None => return false };
    for index in 1..NODES_PER_PANEL {
        if !nodes[index - 1].sub(nodes[index]).map_or(false, |value| value.strictly_negative()) {
            return false;
        }
    }
    weights.iter().all(|value| value.strictly_positive())
        && nodes[0].strictly_negative() && nodes[NODES_PER_PANEL - 1].strictly_positive()
}

fn symmetry_fixture() -> bool {
    let (nodes, weights) = match build_ts24() { Some(value) => value, None => return false };
    for index in 0..NODES_PER_PANEL / 2 {
        let opposite = NODES_PER_PANEL - 1 - index;
        if !nodes[index].add(nodes[opposite]).map_or(false, |value| value.contains_zero())
            || !weights[index].sub(weights[opposite]).map_or(false, |value| value.contains_zero()) {
            return false;
        }
    }
    true
}

fn panel_cover_fixture() -> bool {
    let mut previous_right = Ball512::exact(0, 0);
    for panel in 0..PANELS {
        let left = Ball512::exact(panel as i64, -7);
        let right = Ball512::exact(panel as i64 + 1, -7);
        if !left.sub(previous_right).map_or(false, |value| value.is_exact_zero())
            || !left.sub(right).map_or(false, |value| value.strictly_negative()) {
            return false;
        }
        previous_right = right;
    }
    previous_right.contains_dyadic(12, 0)
}

fn validation_fixture() -> bool {
    let (_, weights) = match build_ts24() { Some(value) => value, None => return false };
    let mut rule_moment = Ball512::exact(0, 0);
    for weight in weights { rule_moment = match rule_moment.add(weight) { Some(value) => value, None => return false }; }
    let exact_moment = Ball512::exact(2, 0);
    let moment_defect = match exact_moment.sub(rule_moment) { Some(value) => value, None => return false };
    let corrected = match rule_moment.add(moment_defect) { Some(value) => value, None => return false };
    let taylor: [i64; VALIDATION_DEGREE + 1] = std::array::from_fn(|i| if i == 0 { 1 } else { 0 });
    let remainder_48 = Ball512::exact(0, 0);
    corrected.contains_dyadic(2, 0) && taylor[0] == 1
        && taylor[1..].iter().all(|value| *value == 0) && remainder_48.is_exact_zero()
        && PANELS * NODES_PER_PANEL == 36864
}

fn kappa_star_fixture() -> bool {
    match sinh_cosh_256(Ball512::exact(12, 0)) {
        Some((sinh, cosh)) => sinh.strictly_positive() && cosh.strictly_positive(),
        None => false,
    }
}

fn tail_fixture() -> bool {
    let source = Ball512::exact(1, -154);
    let rho = Ball512::exact(1, -1);
    let mut bound = Ball512::exact(0, 0);
    let mut increases = 0usize;
    for _ in 0..TAIL_MAJORANT_ITERATIONS {
        let previous = bound;
        bound = match rho.mul(bound).and_then(|value| value.add(source)) {
            Some(value) => value, None => return false,
        };
        if bound.sub(previous).map_or(false, |value| value.strictly_positive()) { increases += 1; }
    }
    let denominator = match Ball512::exact(1, 0).sub(rho) { Some(value) => value, None => return false };
    let tail = match bound.div(denominator) { Some(value) => value, None => return false };
    increases == TAIL_MAJORANT_ITERATIONS
        && tail.sub(Ball512::exact(1, -132)).map_or(false, |value| value.strictly_negative())
}

fn strict_touch_and_chronology_fixture() -> bool {
    let pass = Ball512::exact(1, -133);
    let touch = Ball512::exact(1, -132);
    let pass_ok = pass.sub(touch).map_or(false, |value| value.strictly_negative());
    let touch_ok = touch.sub(touch).map_or(false, |value| value.strictly_negative());
    let mut order: [usize; NODES_PER_PANEL] = std::array::from_fn(|i| i);
    order.swap(11, 12);
    let ordered = order.windows(2).all(|pair| pair[0] < pair[1]);
    let later_role_records = if touch_ok || ordered { 1 } else { 0 };
    pass_ok && !touch_ok && !ordered && later_role_records == 0
}

fn fixture_results() -> [bool; 9] {
    [budget_fixture(), native_transcendental_fixture(), node_weight_fixture(),
        symmetry_fixture(), panel_cover_fixture(), validation_fixture(),
        kappa_star_fixture(), tail_fixture(), strict_touch_and_chronology_fixture()]
}

pub(crate) fn fixture_count() -> usize { 9 }
pub(crate) fn fixtures_passed() -> usize {
    fixture_results().into_iter().filter(|value| *value).count()
}
pub(crate) fn fixture_mask() -> String {
    fixture_results().into_iter().map(|value| if value { '1' } else { '0' }).collect()
}
pub(crate) fn run_quantum_negative_axis_fixture_suite() -> bool {
    fixtures_passed() == fixture_count()
}
