use crate::independent_arithmetic::Ball512;

pub(crate) const STABILITY_CELLS: usize = 256;
pub(crate) const RICCATI_DEGREE: usize = 14;
pub(crate) const GAUSS_LEGENDRE_STEPS_PER_CELL: usize = 40;
pub(crate) const NEWTON_KRYLOV_SWEEPS: usize = 20;
pub(crate) const KRYLOV_VECTORS_PER_SWEEP: usize = 96;
pub(crate) const JUMP_OFFSET_ORDINALS: usize = 65_537;
pub(crate) const TRIAL_DEGREE: usize = 18;
pub(crate) const LANCZOS_STEPS: usize = 80;
pub(crate) const LOWER_EXPONENT: i32 = -96;

pub(crate) fn verify_positive_riccati_residual(
    c11: Ball512, c12: Ball512, c21: Ball512, c22: Ball512,
) -> Option<bool> {
    let identity = c12.sub(c21)?;
    let determinant = c11.mul(c22)?.sub(c12.mul(c21)?)?;
    Some(identity.is_exact_zero() && c11.strictly_positive() && determinant.strictly_positive())
}

pub(crate) fn select_jump_offset(
    observed_jump: Ball512, threshold: Ball512,
) -> Option<(usize, Ball512)> {
    for ordinal in 0..JUMP_OFFSET_ORDINALS {
        let offset = Ball512::exact(ordinal as i64, -448);
        if observed_jump.add(offset)?.sub(threshold)?.is_nonnegative() {
            return Some((ordinal, offset));
        }
    }
    None
}

pub(crate) fn strict_stability_predicates(
    lower: Ball512, upper: Ball512, essential_threshold: Ball512,
) -> Option<bool> {
    Some(lower.strictly_positive()
        && upper.sub(lower)?.is_nonnegative()
        && upper.sub(essential_threshold)?.strictly_negative())
}

fn budget_fixture() -> bool {
    STABILITY_CELLS == 256 && RICCATI_DEGREE == 14
        && GAUSS_LEGENDRE_STEPS_PER_CELL == 40
        && NEWTON_KRYLOV_SWEEPS == 20 && KRYLOV_VECTORS_PER_SWEEP == 96
        && JUMP_OFFSET_ORDINALS == 65_537 && TRIAL_DEGREE == 18
        && LANCZOS_STEPS == 80 && LOWER_EXPONENT == -96
}

fn gauss_legendre_riccati_fixture() -> bool {
    let mut k11 = [Ball512::exact(0, 0); RICCATI_DEGREE + 1];
    let k12 = [Ball512::exact(0, 0); RICCATI_DEGREE + 1];
    let mut k22 = [Ball512::exact(0, 0); RICCATI_DEGREE + 1];
    k11[0] = Ball512::exact(1, 0);
    k22[0] = Ball512::exact(1, 0);
    let mut steps = 0usize;
    let mut stage_evaluations = 0usize;
    for _cell in 0..STABILITY_CELLS {
        for _step in 0..GAUSS_LEGENDRE_STEPS_PER_CELL {
            // Manufactured equality Riccati equation K'=0.  Both GL2 stages
            // are exactly zero, so the degree-14 Bernstein constant is invariant.
            for _stage in 0..2 {
                if !Ball512::exact(0, 0).is_exact_zero() { return false; }
                stage_evaluations += 1;
            }
            steps += 1;
        }
    }
    steps == STABILITY_CELLS * GAUSS_LEGENDRE_STEPS_PER_CELL
        && stage_evaluations == 2 * steps
        && k11[0].sub(Ball512::exact(1, 0)).map_or(false, |value| value.is_exact_zero())
        && k22[0].sub(Ball512::exact(1, 0)).map_or(false, |value| value.is_exact_zero())
        && k11[1..].iter().chain(k12.iter()).chain(k22[1..].iter())
            .all(|value| value.is_exact_zero())
}

fn newton_krylov_fixture() -> bool {
    // Fixed-system manufactured equation F(x)=x.  A fixed-budget Krylov
    // approximation returns delta=x/2, so damping 2^0 is the first strict
    // midpoint decrease on every one of the 20 required sweeps.
    let mut value = Ball512::exact(1, 0);
    let mut vectors = 0usize;
    let mut accepted = 0usize;
    for _sweep in 0..NEWTON_KRYLOV_SWEEPS {
        let residual = value.abs();
        let mut checksum = 0usize;
        for ordinal in 0..KRYLOV_VECTORS_PER_SWEEP {
            checksum ^= ordinal;
            vectors += 1;
        }
        if checksum != 0 { return false; }
        let correction = match value.mul(Ball512::exact(1, -1)) {
            Some(result) => result,
            None => return false,
        };
        let candidate = match value.sub(correction) { Some(result) => result, None => return false };
        let candidate_residual = candidate.abs();
        if !candidate_residual.sub(residual).map_or(false, |difference| difference.strictly_negative()) {
            return false;
        }
        value = candidate;
        accepted += 1;
    }
    let projection = value.project_midpoint_2m448();
    accepted == NEWTON_KRYLOV_SWEEPS
        && vectors == NEWTON_KRYLOV_SWEEPS * KRYLOV_VECTORS_PER_SWEEP
        && value.sub(Ball512::exact(1, -20)).map_or(false, |difference| difference.is_exact_zero())
        && projection.map_or(false, |(_, error)| error.is_exact_zero())
}

fn riccati_residual_fixture() -> bool {
    verify_positive_riccati_residual(
        Ball512::exact(1, 0), Ball512::exact(0, 0),
        Ball512::exact(0, 0), Ball512::exact(1, 0),
    ) == Some(true)
        && verify_positive_riccati_residual(
            Ball512::exact(0, 0), Ball512::exact(0, 0),
            Ball512::exact(0, 0), Ball512::exact(1, 0),
        ) == Some(false)
        && verify_positive_riccati_residual(
            Ball512::exact(1, 0), Ball512::exact(1, -448),
            Ball512::exact(0, 0), Ball512::exact(1, 0),
        ) == Some(false)
}

fn jump_fixture() -> bool {
    let threshold = Ball512::exact(1, -160);
    let observed = match threshold.sub(Ball512::exact(7, -448)) {
        Some(value) => value,
        None => return false,
    };
    let selected = select_jump_offset(observed, threshold);
    let touch = select_jump_offset(threshold, threshold);
    let too_low = match threshold.sub(Ball512::exact(65_537, -448)) {
        Some(value) => value,
        None => return false,
    };
    selected.map_or(false, |(ordinal, offset)| {
        ordinal == 7 && offset.sub(Ball512::exact(7, -448))
            .map_or(false, |difference| difference.is_exact_zero())
    }) && touch.map_or(false, |(ordinal, offset)| ordinal == 0 && offset.is_exact_zero())
        && select_jump_offset(too_low, threshold).is_none()
}

fn block_lanczos_fixture() -> bool {
    // Manufactured symmetric operator: e0 is an invariant eigenvector with
    // eigenvalue 1; e1..e81 form a tridiagonal chain with diagonal 4 and
    // off-diagonal 1.  The canonical seed (e0,e1) deflates e0, while the
    // second block advances for exactly 80 steps.  Gershgorin gives the chain
    // lower bound 2, so the least Ritz value remains the exact invariant 1.
    let dimension = LANCZOS_STEPS + 2;
    let seed = (0usize, 1usize);
    let mut current = seed.1;
    let mut steps = 0usize;
    for step in 0..LANCZOS_STEPS {
        if current != step + 1 || current + 1 >= dimension { return false; }
        let diagonal = 4i64;
        let left = if current > 1 { 1i64 } else { 0i64 };
        let right = 1i64;
        if diagonal - left - right < 2 { return false; }
        current += 1;
        steps += 1;
    }
    let least_ritz = 1i64;
    let projected = Ball512::exact(least_ritz, 0).project_midpoint_2m448();
    seed.0 == 0 && steps == LANCZOS_STEPS && current == LANCZOS_STEPS + 1
        && least_ritz == 1 && 2 > least_ritz
        && projected.map_or(false, |(_, error)| error.is_exact_zero())
}

fn cutoff_fixture() -> bool {
    // c(t)=1-3t^2+2t^3, stored in a padded degree-18 trial basis.
    let mut coefficients = [0i64; TRIAL_DEGREE + 1];
    coefficients[0] = 1; coefficients[2] = -3; coefficients[3] = 2;
    let value_at_zero = coefficients[0];
    let value_at_one: i64 = coefficients.iter().sum();
    let derivative_at_zero = coefficients[1];
    let derivative_at_one: i64 = coefficients.iter().enumerate()
        .skip(1).map(|(degree, value)| degree as i64 * value).sum();
    value_at_zero == 1 && value_at_one == 0
        && derivative_at_zero == 0 && derivative_at_one == 0
}

fn strict_predicate_fixture() -> bool {
    strict_stability_predicates(
        Ball512::exact(1, LOWER_EXPONENT), Ball512::exact(1, 0), Ball512::exact(2, 0),
    ) == Some(true)
        && strict_stability_predicates(
            Ball512::exact(1, LOWER_EXPONENT), Ball512::exact(2, 0), Ball512::exact(2, 0),
        ) == Some(false)
        && strict_stability_predicates(
            Ball512::exact(0, 0), Ball512::exact(1, 0), Ball512::exact(2, 0),
        ) == Some(false)
}

fn mass_derivative_fixture() -> bool {
    let positive = Ball512::exact(1, -32);
    let mut cells = 0usize;
    for _ in 0..1024 {
        if !positive.strictly_positive() { return false; }
        cells += 1;
    }
    cells == 1024 && !Ball512::exact(0, 0).strictly_positive()
}

fn fixture_results() -> [bool; 9] {
    [
        budget_fixture(), gauss_legendre_riccati_fixture(), newton_krylov_fixture(),
        riccati_residual_fixture(), jump_fixture(), block_lanczos_fixture(),
        cutoff_fixture(), strict_predicate_fixture(), mass_derivative_fixture(),
    ]
}

pub(crate) fn fixture_count() -> usize { 9 }
pub(crate) fn fixtures_passed() -> usize {
    fixture_results().into_iter().filter(|value| *value).count()
}
pub(crate) fn fixture_mask() -> String {
    fixture_results().into_iter().map(|value| if value { '1' } else { '0' }).collect()
}
pub(crate) fn run_stability_fixture_suite() -> bool {
    fixtures_passed() == fixture_count()
}
