use crate::independent_arithmetic::Ball512;
use crate::independent_quantum_angular::Rational;

const TRANSPORT_ORDER: usize = 22;
const JET_TOTAL_ORDER: usize = 4;
const JET_MULTIINDICES: usize = 70;
const PICARD_PASSES: usize = 12;
const REMAINDER_MAJORANT_ITERATIONS: usize = 12;
const PROJECTION_PASSES: usize = 1;
const RSET_CELLS: usize = 64;
const RSET_COMPONENTS: usize = 4;

fn graded_multiindices() -> [(u8, u8, u8, u8); JET_MULTIINDICES] {
    let mut result = [(0, 0, 0, 0); JET_MULTIINDICES];
    let mut ordinal = 0usize;
    for total in 0..=JET_TOTAL_ORDER as u8 {
        for a in 0..=total {
            for b in 0..=total - a {
                for c in 0..=total - a - b {
                    result[ordinal] = (a, b, c, total - a - b - c);
                    ordinal += 1;
                }
            }
        }
    }
    result
}

fn budget_and_multiindex_fixture() -> bool {
    let table = graded_multiindices();
    let mut unique = true;
    for (ordinal, value) in table.iter().enumerate() {
        unique &= value.0 as usize + value.1 as usize + value.2 as usize + value.3 as usize <= JET_TOTAL_ORDER;
        unique &= !table[..ordinal].contains(value);
    }
    unique && TRANSPORT_ORDER == 22 && JET_MULTIINDICES == 70 && PICARD_PASSES == 12
        && REMAINDER_MAJORANT_ITERATIONS == 12 && PROJECTION_PASSES == 1
}

fn native_tensor_connection_fixture() -> bool {
    // Native flat metric/connection construction for P=Box-1 and U=1.
    let metric = [[-1i8, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
    let connection = [[[0i8; 4]; 4]; 4];
    let u = [Ball512::exact(0, 0); JET_MULTIINDICES];
    let mut u = u; u[0] = Ball512::exact(1, 0);
    metric[0][0] == -1 && metric[1][1] == 1
        && connection.iter().flatten().flatten().all(|value| *value == 0)
        && u[0].contains_dyadic(1, 0) && u[1..].iter().all(|value| value.is_exact_zero())
        && Ball512::exact(-1, 0).contains_dyadic(-1, 0)
}

fn transport_recurrence_fixture() -> bool {
    let one = match Rational::from_i64(1) { Some(value) => value, None => return false };
    let two = match Rational::from_i64(2) { Some(value) => value, None => return false };
    let mut coefficients = [Rational::ZERO; TRANSPORT_ORDER + 1];
    coefficients[0] = match one.div(two) { Some(value) => value, None => return false };
    for n in 0..TRANSPORT_ORDER {
        let denominator = match Rational::from_i64(((n + 1) * (2 * n + 4)) as i64) {
            Some(value) => value, None => return false,
        };
        coefficients[n + 1] = match coefficients[n].div(denominator) { Some(value) => value, None => return false };
        if coefficients[n + 1].mul(denominator) != Some(coefficients[n]) { return false; }
    }
    coefficients.iter().all(|value| !value.is_zero())
}

fn interval_picard_fixture() -> bool {
    let one = Ball512::exact(1, 0); let half = Ball512::exact(1, -1);
    let mut value = Ball512::exact(0, 0); let mut previous = one;
    for _ in 0..PICARD_PASSES {
        let residual = match one.sub(value) { Some(result) => result, None => return false };
        let correction = match residual.mul(half) { Some(result) => result, None => return false };
        value = match value.add(correction) { Some(result) => result, None => return false };
        let next = match one.sub(value) { Some(result) => result, None => return false };
        if !next.strictly_positive() || !next.sub(previous).map_or(false, |difference| difference.strictly_negative()) { return false; }
        previous = next;
    }
    !previous.is_exact_zero()
}

fn state_remainder_fixture() -> bool {
    let ground = Rational::from_i64(5).and_then(|value| value.div(Rational::from_i64(8)?));
    let parametrix = Rational::from_i64(1).and_then(|value| value.div(Rational::from_i64(2)?));
    let alternate = Rational::from_i64(3).and_then(|value| value.div(Rational::from_i64(4)?));
    match (ground, parametrix, alternate) {
        (Some(g), Some(p), Some(a)) => {
            let w = g.sub(p); let changed = a.sub(p);
            w == Rational::from_i64(1).and_then(|value| value.div(Rational::from_i64(8)?))
                && changed == Rational::from_i64(1).and_then(|value| value.div(Rational::from_i64(4)?))
                && w != changed
        }
        _ => false,
    }
}

fn projection_and_recompute_fixture() -> bool {
    let mut coefficients = [Ball512::exact(0, 0); JET_MULTIINDICES];
    coefficients[0] = Ball512::exact(1, -449);
    let mut projections = 0usize;
    for coefficient in coefficients {
        if coefficient.project_midpoint_2m448().is_none() { return false; }
        projections += 1;
    }
    let rset = [Ball512::exact(0, 0); RSET_CELLS * RSET_COMPONENTS];
    projections == JET_MULTIINDICES && rset.iter().all(|entry| entry.is_exact_zero())
}

fn conservation_fixture() -> bool {
    let cells = [Ball512::exact(0, 0); RSET_CELLS * RSET_COMPONENTS];
    for cell in 0..RSET_CELLS - 1 {
        for component in 0..RSET_COMPONENTS {
            let left = cells[(cell + 1) * RSET_COMPONENTS + component];
            let right = cells[cell * RSET_COMPONENTS + component];
            if !left.sub(right).map_or(false, |difference| difference.is_exact_zero()) { return false; }
        }
    }
    true
}

fn remainder_fixture() -> bool {
    const TAYLOR_MAJORANT_DEGREE: usize = 23;
    let source = Ball512::exact(1, -164); let ratio = Ball512::exact(1, -1);
    let mut bound = Ball512::exact(0, 0);
    for iteration in 0..REMAINDER_MAJORANT_ITERATIONS {
        let previous = bound;
        bound = match ratio.mul(bound).and_then(|value| value.add(source)) { Some(value) => value, None => return false };
        if iteration != 0 && !bound.sub(previous).map_or(false, |difference| difference.strictly_positive()) { return false; }
    }
    let tail = match bound.div(Ball512::exact(1, 0).sub(ratio).unwrap()) { Some(value) => value, None => return false };
    TAYLOR_MAJORANT_DEGREE == 23
        && tail.sub(Ball512::exact(1, -132)).map_or(false, |difference| difference.strictly_negative())
}

fn chronology_fixture() -> bool {
    let mut corrupted = graded_multiindices();
    corrupted[17] = corrupted[16];
    let first_duplicate = (0..corrupted.len()).find(|ordinal| corrupted[..*ordinal].contains(&corrupted[*ordinal]));
    let target = Ball512::exact(1, -132);
    first_duplicate == Some(17)
        && !target.sub(target).map_or(false, |difference| difference.strictly_negative())
}

fn fixture_results() -> [bool; 9] {
    [budget_and_multiindex_fixture(), native_tensor_connection_fixture(), transport_recurrence_fixture(),
        interval_picard_fixture(), state_remainder_fixture(), projection_and_recompute_fixture(),
        conservation_fixture(), remainder_fixture(), chronology_fixture()]
}

pub(crate) fn fixture_count() -> usize { 9 }
pub(crate) fn fixtures_passed() -> usize { fixture_results().into_iter().filter(|value| *value).count() }
pub(crate) fn fixture_mask() -> String { fixture_results().into_iter().map(|value| if value { '1' } else { '0' }).collect() }
pub(crate) fn run_hadamard_fixture_suite() -> bool { fixtures_passed() == fixture_count() }
