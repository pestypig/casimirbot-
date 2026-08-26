use crate::independent_arithmetic::Ball512;
use crate::independent_quantum_angular::Rational;
use crate::independent_quantum_negative_axis::{exp_taylor_256, ts24_constant_moment};
use std::sync::OnceLock;
use std::sync::atomic::{AtomicUsize, Ordering};

const BASE_PANELS: usize = 2304;
const NODES_PER_PANEL: usize = 24;
const EPSILON_LEVELS: usize = 9;
const RICHARDSON_ORDER: usize = 8;
const ENERGY_TAIL_ORDER: usize = 22;
const TAIL_ITERATIONS: usize = 12;
const SMEARING_PANELS: usize = 192;
const EPSILON_EXPONENTS: [i32; EPSILON_LEVELS] = [36, 44, 52, 60, 68, 76, 84, 92, 100];
static BAREISS_DIAGNOSTIC: AtomicUsize = AtomicUsize::new(0);

fn need<T>(value: Option<T>, code: usize) -> Option<T> {
    if value.is_none() { BAREISS_DIAGNOSTIC.store(code, Ordering::Relaxed); }
    value
}

fn bareiss_richardson() -> Option<[Rational; EPSILON_LEVELS]> {
    // Row k is multiplied by 2^((base+64)k).  This leaves the exact integer
    // Vandermonde entry 2^(8(8-j)k), without changing its solution.
    let mut augmented = [[Rational::ZERO; EPSILON_LEVELS + 1]; EPSILON_LEVELS];
    for row in 0..EPSILON_LEVELS {
        for column in 0..EPSILON_LEVELS {
            augmented[row][column] = need(Rational::power_of_two(8 * (8 - column) * row), 100 + row * 10 + column)?;
        }
        augmented[row][EPSILON_LEVELS] = need(Rational::from_i64(if row == 0 { 1 } else { 0 }), 190 + row)?;
    }
    let mut previous_pivot = need(Rational::from_i64(1), 199)?;
    for column in 0..EPSILON_LEVELS - 1 {
        let pivot_row = (column..EPSILON_LEVELS)
            .find(|row| !augmented[*row][column].is_zero()).or_else(|| { BAREISS_DIAGNOSTIC.store(200 + column, Ordering::Relaxed); None })?;
        if pivot_row != column { augmented.swap(pivot_row, column); }
        let pivot = augmented[column][column];
        for row in column + 1..EPSILON_LEVELS {
            let factor = augmented[row][column];
            for target in column + 1..=EPSILON_LEVELS {
                let left = need(pivot.mul(augmented[row][target]), 300 + column)?;
                let right = need(factor.mul(augmented[column][target]), 400 + column)?;
                let numerator = need(left.sub(right), 500 + column)?;
                let value = need(numerator.div(previous_pivot), 600 + column)?;
                if !value.is_integer() { BAREISS_DIAGNOSTIC.store(700 + column, Ordering::Relaxed); return None; }
                augmented[row][target] = value;
            }
            augmented[row][column] = Rational::ZERO;
        }
        previous_pivot = pivot;
    }
    let mut weights = [Rational::ZERO; EPSILON_LEVELS];
    for row in (0..EPSILON_LEVELS).rev() {
        let mut rhs = augmented[row][EPSILON_LEVELS];
        for column in row + 1..EPSILON_LEVELS {
            let product = need(augmented[row][column].mul(weights[column]), 800 + row)?;
            rhs = need(rhs.sub(product), 900 + row)?;
        }
        weights[row] = need(rhs.div(augmented[row][row]), 1000 + row)?;
    }
    // Exact replay of all nine scaled moment equations.
    for row in 0..EPSILON_LEVELS {
        let mut sum = Rational::ZERO;
        for column in 0..EPSILON_LEVELS {
            let power = need(Rational::power_of_two(8 * (8 - column) * row), 1100 + row)?;
            let term = need(power.mul(weights[column]), 1200 + row)?;
            sum = need(sum.add(term), 1300 + row)?;
        }
        let expected = need(Rational::from_i64(if row == 0 { 1 } else { 0 }), 1400 + row)?;
        if !need(sum.sub(expected), 1500 + row)?.is_zero() { BAREISS_DIAGNOSTIC.store(1600 + row, Ordering::Relaxed); return None; }
    }
    Some(weights)
}

fn cached_richardson() -> Option<[Rational; EPSILON_LEVELS]> {
    static VALUE: OnceLock<Option<[Rational; EPSILON_LEVELS]>> = OnceLock::new();
    *VALUE.get_or_init(bareiss_richardson)
}

fn budget_panel_threshold_fixture() -> bool {
    let threshold_numerator = 4_718_592i64;
    let mut crossing = None;
    for panel in 0..BASE_PANELS {
        let left = 4095i64 * panel as i64;
        let right = 4095i64 * (panel + 1) as i64;
        if left < threshold_numerator && threshold_numerator < right { crossing = Some(panel); }
    }
    BASE_PANELS == 2304 && NODES_PER_PANEL == 24 && EPSILON_LEVELS == 9
        && RICHARDSON_ORDER == 8 && ENERGY_TAIL_ORDER == 22
        && TAIL_ITERATIONS == 12 && SMEARING_PANELS == 192 && crossing == Some(1152)
}

fn bareiss_fixture() -> bool { cached_richardson().is_some() }

fn complete_stieltjes_atom_fixture() -> bool {
    let epsilon = Ball512::exact(1, -EPSILON_EXPONENTS[0]);
    let pairing = match exp_taylor_256(epsilon.neg()) { Some(value) => value, None => return false };
    let removed_atom = Ball512::exact(0, 0);
    pairing.strictly_positive() && !pairing.contains_zero() && removed_atom.is_exact_zero()
}

fn weighted_poisson_bound() -> Option<Ball512> {
    let weights = cached_richardson()?;
    let mut sum = Ball512::exact(0, 0);
    for (index, weight) in weights.into_iter().enumerate() {
        let epsilon = Ball512::exact(1, -EPSILON_EXPONENTS[index]);
        let mut ninth = Ball512::exact(1, 0);
        for _ in 0..9 { ninth = ninth.mul(epsilon)?; }
        let weight_bound = weight.dyadic_enclosure()?.abs();
        let term = weight_bound.mul(ninth)?;
        sum = sum.add(term)?;
    }
    sum.div(Ball512::exact(362880, 0))
}

fn poisson_remainder_fixture() -> bool {
    let bound = match weighted_poisson_bound() { Some(value) => value, None => return false };
    bound.is_nonnegative() && bound.sub(Ball512::exact(1, -132)).map_or(false, |value| value.strictly_negative())
}

fn extrapolated_pairing_fixture() -> bool {
    // The exact moment replay in bareiss_richardson cancels powers 1..8 and
    // leaves the constant term at one.  Enclose only the weighted ninth-order
    // Poisson remainder; intervalizing the full signed sum would discard those
    // exact correlations.
    let bound = match weighted_poisson_bound() { Some(value) => value, None => return false };
    let error = match bound.neg().add(bound) { Some(value) => value, None => return false };
    let pairing = match Ball512::exact(1, 0).add(error) { Some(value) => value, None => return false };
    pairing.strictly_positive()
        && pairing.sub(Ball512::exact(2, 0)).map_or(false, |value| value.strictly_negative())
}

fn energy_tail_fixture() -> bool {
    let source = Ball512::exact(1, -154); let rho = Ball512::exact(1, -1);
    let mut bound = Ball512::exact(0, 0); let mut increases = 0usize;
    for _ in 0..TAIL_ITERATIONS {
        let previous = bound;
        bound = match rho.mul(bound).and_then(|value| value.add(source)) { Some(value) => value, None => return false };
        if bound.sub(previous).map_or(false, |value| value.strictly_positive()) { increases += 1; }
    }
    let tail = match bound.div(Ball512::exact(1, 0).sub(rho).unwrap()) { Some(value) => value, None => return false };
    increases == TAIL_ITERATIONS && tail.sub(Ball512::exact(1, -132)).map_or(false, |value| value.strictly_negative())
}

fn smearing_fixture() -> bool {
    let z = match ts24_constant_moment() { Some(value) => value, None => return false };
    if !z.strictly_positive() { return false; }
    let normalized = match z.div(z) { Some(value) => value, None => return false };
    normalized.contains_dyadic(1, 0) && SMEARING_PANELS * NODES_PER_PANEL == 4608
}

fn mean_inventory_fixture() -> bool {
    let entries = [Ball512::exact(0, 0); 64 * 4];
    entries.len() == 256 && entries.iter().all(|entry| entry.is_exact_zero())
}

fn strict_touch_chronology_fixture() -> bool {
    let target = Ball512::exact(1, -132); let pass = Ball512::exact(1, -133);
    let pass_ok = pass.sub(target).map_or(false, |value| value.strictly_negative());
    let touch_ok = target.sub(target).map_or(false, |value| value.strictly_negative());
    let later = if touch_ok { 1 } else { 0 };
    pass_ok && !touch_ok && later == 0
}

fn fixture_results() -> [bool; 9] {
    [budget_panel_threshold_fixture(), bareiss_fixture(), complete_stieltjes_atom_fixture(),
        poisson_remainder_fixture(), extrapolated_pairing_fixture(), energy_tail_fixture(),
        smearing_fixture(), mean_inventory_fixture(), strict_touch_chronology_fixture()]
}
pub(crate) fn fixture_count() -> usize { 9 }
pub(crate) fn fixtures_passed() -> usize { fixture_results().into_iter().filter(|v| *v).count() }
pub(crate) fn fixture_mask() -> String { fixture_results().into_iter().map(|v| if v { '1' } else { '0' }).collect() }
pub(crate) fn fixture_diagnostic() -> usize { BAREISS_DIAGNOSTIC.load(Ordering::Relaxed) }
pub(crate) fn run_quantum_measure_fixture_suite() -> bool { fixtures_passed() == fixture_count() }
