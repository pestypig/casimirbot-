use crate::independent_arithmetic::Ball512;
use std::cmp::Ordering;

pub(crate) const RADIAL_CELLS: usize = 256;
pub(crate) const STEPS_PER_CELL: usize = 48;
pub(crate) const TAYLOR_DEGREE: usize = 28;
pub(crate) const PICARD_ITERATIONS: usize = 12;
pub(crate) const SEED_RADIUS_CAP_EXPONENT: i32 = -16;

#[derive(Clone, Copy)]
struct ComplexBall {
    real: Ball512,
    imag: Ball512,
}

impl ComplexBall {
    fn div(self, denominator: Self) -> Option<Self> {
        let norm = denominator.real.square()?.add(denominator.imag.square()?)?;
        if !norm.strictly_positive() { return None; }
        Some(Self {
            real: self.real.mul(denominator.real)?
                .add(self.imag.mul(denominator.imag)?)?.div(norm)?,
            imag: self.imag.mul(denominator.real)?
                .sub(self.real.mul(denominator.imag)?)?.div(norm)?,
        })
    }
}

fn budget_fixture() -> bool {
    RADIAL_CELLS == 256 && STEPS_PER_CELL == 48 && TAYLOR_DEGREE == 28
        && PICARD_ITERATIONS == 12 && SEED_RADIUS_CAP_EXPONENT == -16
}

fn fixed_step_taylor_fixture() -> bool {
    let mut steps = 0usize;
    let mut state = [Ball512::exact(1, 0), Ball512::exact(0, 0)];
    for _cell in 0..RADIAL_CELLS {
        for _step in 0..STEPS_PER_CELL {
            let mut coefficients = [[Ball512::exact(0, 0); TAYLOR_DEGREE + 1]; 2];
            coefficients[0][0] = state[0];
            coefficients[1][0] = state[1];
            // Manufactured first-order system u'=0. Formal substitution in
            // ascending coefficient order makes every higher coefficient zero.
            for order in 0..TAYLOR_DEGREE {
                let rhs = [Ball512::exact(0, 0), Ball512::exact(0, 0)];
                coefficients[0][order + 1] = rhs[0];
                coefficients[1][order + 1] = rhs[1];
            }
            state = [coefficients[0][0], coefficients[1][0]];
            if !coefficients.iter().flat_map(|row| row[1..].iter()).all(|v| v.is_exact_zero()) {
                return false;
            }
            steps += 1;
        }
    }
    steps == RADIAL_CELLS * STEPS_PER_CELL
        && state[0].sub(Ball512::exact(1, 0)).map_or(false, |v| v.is_exact_zero())
        && state[1].is_exact_zero()
}

fn convolution_order_fixture() -> bool {
    let left: [i64; TAYLOR_DEGREE + 1] = std::array::from_fn(|i| i as i64 + 1);
    let right: [i64; TAYLOR_DEGREE + 1] = std::array::from_fn(|i| 2 * i as i64 + 1);
    let mut product = [0i64; 2 * TAYLOR_DEGREE + 1];
    let mut operations = 0usize;
    for total in 0..=2 * TAYLOR_DEGREE {
        let low = total.saturating_sub(TAYLOR_DEGREE);
        let high = total.min(TAYLOR_DEGREE);
        for left_index in low..=high {
            product[total] += left[left_index] * right[total - left_index];
            operations += 1;
        }
    }
    operations == (TAYLOR_DEGREE + 1).pow(2) && product[0] == 1
        && product[2 * TAYLOR_DEGREE] == 29 * 57
}

fn seed_and_picard_fixture() -> bool {
    // Defect 2^-20 gives the least power-of-two seed 2^-19 after doubling.
    let seed_exponent = -19;
    if seed_exponent > SEED_RADIUS_CAP_EXPONENT { return false; }
    let mut previous = Ball512::interval(-1, 1, seed_exponent).unwrap();
    let mut strict = 0usize;
    for iteration in 0..PICARD_ITERATIONS {
        let current = Ball512::interval(-1, 1, seed_exponent - iteration as i32 - 1).unwrap();
        let current_width = current.width().unwrap();
        let previous_width = previous.width().unwrap();
        if current_width.lower_nonnegative_cmp(previous_width) != Some(Ordering::Less) {
            return false;
        }
        previous = current;
        strict += 1;
    }
    strict == PICARD_ITERATIONS
}

fn projection_per_cell_fixture() -> bool {
    let mut projections = 0usize;
    for cell in 0..RADIAL_CELLS {
        let value = Ball512::exact((cell % 2) as i64, -448);
        let (_, error) = match value.project_midpoint_2m448() {
            Some(result) => result,
            None => return false,
        };
        if !error.is_exact_zero() { return false; }
        projections += 1;
    }
    projections == RADIAL_CELLS
}

fn endpoint_direction_fixture() -> bool {
    let forward: Vec<usize> = (0..RADIAL_CELLS).collect();
    let backward: Vec<usize> = (0..RADIAL_CELLS).rev().collect();
    forward.first() == Some(&0) && forward.last() == Some(&(RADIAL_CELLS - 1))
        && backward.first() == Some(&(RADIAL_CELLS - 1)) && backward.last() == Some(&0)
}

fn complex_division_fixture() -> bool {
    let numerator = ComplexBall { real: Ball512::exact(1, 0), imag: Ball512::exact(1, 0) };
    let denominator = ComplexBall { real: Ball512::exact(1, 0), imag: Ball512::exact(-1, 0) };
    let quotient = match numerator.div(denominator) { Some(value) => value, None => return false };
    let zero = ComplexBall { real: Ball512::exact(0, 0), imag: Ball512::exact(0, 0) };
    quotient.real.is_exact_zero()
        && quotient.imag.sub(Ball512::exact(1, 0)).map_or(false, |v| v.is_exact_zero())
        && numerator.div(zero).is_none()
}

fn wronskian_fixture() -> bool {
    let regular = [1i64, 0];
    let weyl = [0i64, 1];
    regular[0] * weyl[1] - regular[1] * weyl[0] == 1
}

fn strict_touch_fixture() -> bool {
    let pass = Ball512::exact(1, -2);
    let touch = Ball512::exact(1, 0);
    pass.is_nonnegative() && pass.sub(Ball512::exact(1, 0)).map_or(false, |v| v.strictly_negative())
        && !touch.sub(Ball512::exact(1, 0)).map_or(false, |v| v.strictly_negative())
}

fn fixture_results() -> [bool; 9] {
    [budget_fixture(), fixed_step_taylor_fixture(), convolution_order_fixture(),
        seed_and_picard_fixture(), projection_per_cell_fixture(), endpoint_direction_fixture(),
        complex_division_fixture(), wronskian_fixture(), strict_touch_fixture()]
}

pub(crate) fn fixture_count() -> usize { 9 }
pub(crate) fn fixtures_passed() -> usize {
    fixture_results().into_iter().filter(|value| *value).count()
}
pub(crate) fn fixture_mask() -> String {
    fixture_results().into_iter().map(|value| if value { '1' } else { '0' }).collect()
}
pub(crate) fn run_quantum_radial_fixture_suite() -> bool {
    fixtures_passed() == fixture_count()
}
