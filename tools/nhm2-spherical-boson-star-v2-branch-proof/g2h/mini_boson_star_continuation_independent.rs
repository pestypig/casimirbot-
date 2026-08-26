use crate::independent_arithmetic::{Ball512, I512};

pub(crate) const CELL_COUNT: usize = 1024;
pub(crate) const RADII_PER_CELL: usize = 73;
pub(crate) const FIRST_RADIUS_EXPONENT: i32 = -192;
pub(crate) const LAST_RADIUS_EXPONENT: i32 = -120;
pub(crate) const COEFFICIENT_WEIGHT_POWER: usize = 8;

pub(crate) fn second_order_predictor(
    left: &[Ball512], tangent: &[Ball512], acceleration: &[Ball512], h: Ball512,
) -> Option<Vec<Ball512>> {
    if left.is_empty() || left.len() != tangent.len() || left.len() != acceleration.len() {
        return None;
    }
    let half_h_squared = h.mul(h)?.mul(Ball512::exact(1, -1))?;
    left.iter().zip(tangent).zip(acceleration).map(|((x, v), a)| {
        x.add(h.mul(*v)?)?.add(half_h_squared.mul(*a)?)
    }).collect()
}

pub(crate) fn select_least_radius(
    y: Ball512, z0: Ball512, z1: Ball512, z2: Ball512, domain_margin: Ball512,
) -> Option<(usize, usize)> {
    if !y.is_nonnegative() || !z0.is_nonnegative() || !z1.is_nonnegative()
        || !z2.is_nonnegative() || !domain_margin.strictly_positive() { return None; }
    let one = Ball512::exact(1, 0);
    let linear = one.sub(z0)?.sub(z1)?;
    let mut selected = None;
    let mut evaluated = 0;
    for index in 0..RADII_PER_CELL {
        let radius = Ball512::exact(1, FIRST_RADIUS_EXPONENT + index as i32);
        let polynomial = z2.mul(radius)?.mul(radius)?.sub(linear.mul(radius)?)?.add(y)?;
        let contraction = z0.add(z1)?.add(z2.mul(radius)?)?.sub(one)?;
        let domain = radius.sub(domain_margin)?;
        evaluated += 1;
        if selected.is_none() && polynomial.strictly_negative()
            && contraction.strictly_negative() && domain.strictly_negative() {
            selected = Some(index);
        }
    }
    Some((selected?, evaluated))
}

pub(crate) fn strict_ball_containment(
    center_distance: Ball512, left_radius: Ball512, right_radius: Ball512,
) -> Option<bool> {
    if !center_distance.is_nonnegative() || !left_radius.strictly_positive()
        || !right_radius.strictly_positive() { return None; }
    let right_in_left = center_distance.add(right_radius)?.sub(left_radius)?.strictly_negative();
    let left_in_right = center_distance.add(left_radius)?.sub(right_radius)?.strictly_negative();
    Some(right_in_left || left_in_right)
}

fn elevate_once(input: &[Ball512]) -> Option<Vec<Ball512>> {
    if input.is_empty() { return None; }
    let degree = input.len() - 1;
    let denominator = Ball512::exact((degree + 1) as i64, 0);
    let mut output = Vec::with_capacity(input.len() + 1);
    for index in 0..=degree + 1 {
        let mut value = Ball512::exact(0, 0);
        if index != 0 {
            value = value.add(input[index - 1].mul(Ball512::exact(index as i64, 0))?)?;
        }
        if index <= degree {
            value = value.add(input[index].mul(Ball512::exact((degree + 1 - index) as i64, 0))?)?;
        }
        output.push(value.div(denominator)?);
    }
    Some(output)
}

fn elevate_to(mut input: Vec<Ball512>, degree: usize) -> Option<Vec<Ball512>> {
    if input.len() - 1 > degree { return None; }
    while input.len() - 1 < degree { input = elevate_once(&input)?; }
    Some(input)
}

fn multiply_tau(input: &[Ball512]) -> Option<Vec<Ball512>> {
    if input.is_empty() { return None; }
    let degree = input.len() - 1;
    let denominator = Ball512::exact((degree + 1) as i64, 0);
    let mut output = Vec::with_capacity(input.len() + 1);
    for index in 0..=degree + 1 {
        let mut numerator = Ball512::exact(0, 0);
        if index != 0 {
            numerator = numerator.add(input[index - 1].mul(Ball512::exact(index as i64, 0))?)?;
        }
        if index <= degree {
            numerator = numerator.sub(input[index].mul(Ball512::exact((degree + 1 - index) as i64, 0))?)?;
        }
        output.push(numerator.div(denominator)?);
    }
    Some(output)
}

pub(crate) fn chebyshev_to_bernstein(input: &[Ball512]) -> Option<Vec<Ball512>> {
    if input.is_empty() || input.len() > 257 { return None; }
    let degree = input.len() - 1;
    let mut bases: Vec<Vec<Ball512>> = vec![vec![Ball512::exact(1, 0)]];
    if degree != 0 { bases.push(vec![Ball512::exact(-1, 0), Ball512::exact(1, 0)]); }
    for ordinal in 1..degree {
        let twice_tau = multiply_tau(&bases[ordinal])?.into_iter()
            .map(|value| value.mul(Ball512::exact(2, 0))).collect::<Option<Vec<_>>>()?;
        let previous = elevate_to(bases[ordinal - 1].clone(), ordinal + 1)?;
        bases.push(twice_tau.into_iter().zip(previous).map(|(left, right)| left.sub(right)).collect::<Option<Vec<_>>>()?);
    }
    let mut output = vec![Ball512::exact(0, 0); degree + 1];
    for (ordinal, coefficient) in input.iter().enumerate() {
        let basis = elevate_to(bases[ordinal].clone(), degree)?;
        for index in 0..=degree {
            output[index] = output[index].add(basis[index].mul(*coefficient)?)?;
        }
    }
    Some(output)
}

fn binomial(n: usize, k: usize) -> Option<I512> {
    let k = k.min(n.checked_sub(k)?);
    let mut value = I512::from_u64(1);
    for index in 1..=k {
        value = value.checked_mul_div_u64((n - k + index) as u64, index as u64)?;
    }
    Some(value)
}

pub(crate) fn bernstein_integer_convolution(
    left: &[Ball512], right: &[Ball512],
) -> Option<Vec<Ball512>> {
    if left.is_empty() || right.is_empty() { return None; }
    let left_degree = left.len() - 1;
    let right_degree = right.len() - 1;
    let degree = left_degree.checked_add(right_degree)?;
    if degree > 512 { return None; }
    let mut output = vec![Ball512::exact(0, 0); degree + 1];
    for i in 0..=left_degree {
        for j in 0..=right_degree {
            let k = i + j;
            let numerator = binomial(left_degree, i)?.checked_mul(binomial(right_degree, j)?)?;
            let weight = Ball512::exact_integer(numerator)
                .div(Ball512::exact_integer(binomial(degree, k)?))?;
            output[k] = output[k].add(left[i].mul(right[j])?.mul(weight)?)?;
        }
    }
    Some(output)
}

fn integer_power(base: u64, exponent: usize) -> Option<I512> {
    let mut value = I512::from_u64(1);
    let factor = I512::from_u64(base);
    for _ in 0..exponent { value = value.checked_mul(factor)?; }
    Some(value)
}

pub(crate) fn bernstein_weighted_l1_majorant(
    left_chebyshev: &[Ball512], right_chebyshev: &[Ball512], flat_envelope: Ball512,
) -> Option<(Ball512, Ball512)> {
    if !flat_envelope.is_nonnegative() { return None; }
    let left_bernstein = chebyshev_to_bernstein(left_chebyshev)?;
    let right_bernstein = chebyshev_to_bernstein(right_chebyshev)?;
    let product_bernstein = bernstein_integer_convolution(&left_bernstein, &right_bernstein)?;
    let mut conversion_remainder = Ball512::exact(0, 0);
    for coefficient in &product_bernstein {
        conversion_remainder = conversion_remainder.add(coefficient.width()?)?;
    }
    let degree = left_chebyshev.len() + right_chebyshev.len() - 2;
    let mut convolution = vec![Ball512::exact(0, 0); degree + 1];
    for (i, left) in left_chebyshev.iter().enumerate() {
        for (j, right) in right_chebyshev.iter().enumerate() {
            convolution[i + j] = convolution[i + j].add(left.mul(*right)?.abs())?;
        }
    }
    let mut majorant = flat_envelope;
    for (index, coefficient) in convolution.into_iter().enumerate() {
        let weight = Ball512::exact_integer(integer_power((index + 1) as u64, COEFFICIENT_WEIGHT_POWER)?);
        majorant = majorant.add(coefficient.abs().mul(weight)?)?;
    }
    majorant = majorant.add(conversion_remainder)?;
    Some((majorant, conversion_remainder))
}

fn bounds_for_selected_index(index: usize) -> Ball512 {
    if index == 0 { Ball512::exact(0, 0) }
    else { Ball512::exact(3, FIRST_RADIUS_EXPONENT + index as i32 - 2) }
}

fn advance_cell_ordinal(expected: &mut usize, observed: usize) -> bool {
    if observed != *expected || observed >= CELL_COUNT { return false; }
    *expected += 1;
    true
}

fn predictor_fixture() -> bool {
    let output = second_order_predictor(
        &[Ball512::exact(1, 0), Ball512::exact(-2, 0)],
        &[Ball512::exact(3, 0), Ball512::exact(4, 0)],
        &[Ball512::exact(2, 0), Ball512::exact(-2, 0)],
        Ball512::exact(1, -2),
    );
    output.map_or(false, |value| value[0].contains_dyadic(29, -4) && value[1].contains_dyadic(-17, -4))
}

fn radius_fixture() -> bool {
    select_least_radius(
        bounds_for_selected_index(17), Ball512::exact(0, 0), Ball512::exact(0, 0),
        Ball512::exact(0, 0), Ball512::exact(1, 0),
    ) == Some((17, RADII_PER_CELL))
}

fn boundary_fixture() -> bool {
    strict_ball_containment(Ball512::exact(0, 0), Ball512::exact(1, 0), Ball512::exact(1, -1)) == Some(true)
        && strict_ball_containment(Ball512::exact(1, -1), Ball512::exact(1, 0), Ball512::exact(1, -1)) == Some(false)
}

fn manufactured_chain_fixture() -> bool {
    let mut previous_radius = None;
    let mut inverse_builds = 0usize;
    let mut radii_evaluated = 0usize;
    let mut expected = 0usize;
    for cell in 0..CELL_COUNT {
        if !advance_cell_ordinal(&mut expected, cell) { return false; }
        let right = match second_order_predictor(
            &[Ball512::exact(cell as i64, -10)], &[Ball512::exact(1, 0)],
            &[Ball512::exact(0, 0)], Ball512::exact(1, -10),
        ) { Some(value) => value, None => return false };
        if !right[0].contains_dyadic((cell + 1) as i64, -10) { return false; }
        let desired = if cell % 2 == 0 { 71 } else { 72 };
        inverse_builds += 1;
        let selected = match select_least_radius(
            bounds_for_selected_index(desired), Ball512::exact(0, 0), Ball512::exact(0, 0),
            Ball512::exact(0, 0), Ball512::exact(1, 0),
        ) { Some(value) => value, None => return false };
        if selected.0 != desired || selected.1 != RADII_PER_CELL { return false; }
        radii_evaluated += selected.1;
        let radius = Ball512::exact(1, FIRST_RADIUS_EXPONENT + desired as i32);
        if previous_radius.map_or(false, |previous| strict_ball_containment(Ball512::exact(0, 0), previous, radius) != Some(true)) {
            return false;
        }
        previous_radius = Some(radius);
    }
    expected == CELL_COUNT && inverse_builds == CELL_COUNT
        && radii_evaluated == CELL_COUNT * RADII_PER_CELL
}

fn chronology_fixture() -> bool {
    let mut expected = 0usize;
    !advance_cell_ordinal(&mut expected, 1) && expected == 0
        && advance_cell_ordinal(&mut expected, 0) && expected == 1
        && !advance_cell_ordinal(&mut expected, 0) && expected == 1
}

fn bernstein_fixture() -> bool {
    let left = [Ball512::exact(1, 0), Ball512::exact(2, 0)];
    let right = [Ball512::exact(3, 0), Ball512::exact(4, 0)];
    let left_bernstein = chebyshev_to_bernstein(&left);
    let result = bernstein_weighted_l1_majorant(&left, &right, Ball512::exact(5, 0));
    left_bernstein.map_or(false, |value| value[0].contains_dyadic(-1, 0) && value[1].contains_dyadic(3, 0))
        && result.map_or(false, |(majorant, remainder)| majorant.contains_dyadic(55056, 0) && remainder.is_exact_zero())
}

fn invalid_fixture() -> bool {
    select_least_radius(
        Ball512::exact(-1, 0), Ball512::exact(0, 0), Ball512::exact(0, 0),
        Ball512::exact(0, 0), Ball512::exact(1, 0),
    ).is_none()
        && bernstein_weighted_l1_majorant(
            &[Ball512::exact(1, 0)], &[Ball512::exact(1, 0)], Ball512::exact(-1, 0),
        ).is_none()
}

fn coefficient_range_fixture() -> bool {
    binomial(512, 256).is_some() && integer_power(513, COEFFICIENT_WEIGHT_POWER).is_some()
}

fn fixture_results() -> [bool; 9] {
    [
        CELL_COUNT == 1024 && RADII_PER_CELL == 73
            && FIRST_RADIUS_EXPONENT == -192 && LAST_RADIUS_EXPONENT == -120,
        predictor_fixture(), radius_fixture(), boundary_fixture(),
        manufactured_chain_fixture(), chronology_fixture(), bernstein_fixture(),
        invalid_fixture(), coefficient_range_fixture(),
    ]
}

pub(crate) fn fixture_count() -> usize { 9 }
pub(crate) fn fixtures_passed() -> usize { fixture_results().into_iter().filter(|value| *value).count() }
pub(crate) fn fixture_mask() -> String { fixture_results().into_iter().map(|value| if value { '1' } else { '0' }).collect() }
pub(crate) fn run_continuation_fixture_suite() -> bool { fixtures_passed() == fixture_count() }
