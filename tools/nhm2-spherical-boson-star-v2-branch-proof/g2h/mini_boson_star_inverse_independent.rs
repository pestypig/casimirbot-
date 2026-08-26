use std::cmp::Ordering;

use crate::independent_arithmetic::Ball512;

pub(crate) const MAXIMUM_DIMENSION: usize = 2050;

fn zero() -> Ball512 { Ball512::exact(0, 0) }
fn one() -> Ball512 { Ball512::exact(1, 0) }

fn dot(left: &[Ball512], right: &[Ball512]) -> Option<Ball512> {
    if left.len() != right.len() { return None; }
    let mut sum = zero();
    for (a, b) in left.iter().zip(right) {
        sum = sum.add(a.mul(*b)?)?;
    }
    Some(sum)
}

fn squared_norm(values: &[Ball512]) -> Option<Ball512> {
    let mut sum = zero();
    for value in values { sum = sum.add(value.square()?)?; }
    Some(sum)
}

fn column_norm(matrix: &[Vec<Ball512>], start: usize, column: usize) -> Option<Ball512> {
    let values: Vec<Ball512> = (start..matrix.len()).map(|row| matrix[row][column]).collect();
    squared_norm(&values)?.sqrt()
}

fn apply_reflector(target: &mut [Ball512], start: usize, vector: &[Ball512], beta: Ball512) -> Option<()> {
    let active: Vec<Ball512> = target[start..].to_vec();
    let coefficient = beta.mul(dot(vector, &active)?)?;
    for (index, value) in vector.iter().enumerate() {
        target[start + index] = target[start + index].sub(value.mul(coefficient)?)?;
    }
    Some(())
}

fn qr_inverse_impl(
    input: &[Vec<Ball512>], first_pivot_original_column: &mut usize,
) -> Result<Vec<Vec<Ball512>>, &'static str> {
    let dimension = input.len();
    if dimension == 0 || dimension > MAXIMUM_DIMENSION
        || input.iter().any(|row| row.len() != dimension) { return Err("dimension"); }
    let mut matrix: Vec<Vec<Ball512>> = input.iter()
        .map(|row| row.iter().map(|entry| entry.midpoint()).collect::<Option<Vec<_>>>())
        .collect::<Option<Vec<_>>>().ok_or("midpoint")?;
    let mut transformed_identity = vec![vec![zero(); dimension]; dimension];
    for row in 0..dimension { transformed_identity[row][row] = one(); }
    let mut permutation: Vec<usize> = (0..dimension).collect();

    for stage in 0..dimension {
        let mut selected: Option<(usize, Ball512)> = None;
        for column in stage..dimension {
            let norm = column_norm(&matrix, stage, column).ok_or("column_norm")?;
            if !norm.strictly_positive() { continue; }
            selected = match selected {
                None => Some((column, norm)),
                Some((best_column, best_norm)) => match norm.lower_nonnegative_cmp(best_norm).ok_or("pivot_compare")? {
                    Ordering::Greater => Some((column, norm)),
                    Ordering::Equal if permutation[column] < permutation[best_column] => Some((column, norm)),
                    _ => Some((best_column, best_norm)),
                },
            };
        }
        let (pivot_column, norm) = selected.ok_or("no_positive_pivot")?;
        if stage == 0 { *first_pivot_original_column = permutation[pivot_column]; }
        for row in 0..dimension { matrix[row].swap(stage, pivot_column); }
        permutation.swap(stage, pivot_column);

        let leading = matrix[stage][stage];
        let alpha = if leading.strictly_negative() { norm } else { norm.neg() };
        let mut vector: Vec<Ball512> = (stage..dimension).map(|row| matrix[row][stage]).collect();
        vector[0] = vector[0].sub(alpha).ok_or("vector_head")?;
        let vector_norm_squared = squared_norm(&vector).ok_or("vector_norm")?;
        if vector_norm_squared.contains_zero() { return Err("zero_vector_norm"); }
        let beta = Ball512::exact(2, 0).div(vector_norm_squared).ok_or("beta")?;

        for column in stage..dimension {
            let mut target: Vec<Ball512> = (0..dimension).map(|row| matrix[row][column]).collect();
            apply_reflector(&mut target, stage, &vector, beta).ok_or("matrix_reflector")?;
            for row in 0..dimension { matrix[row][column] = target[row]; }
        }
        for column in 0..dimension {
            let mut target: Vec<Ball512> = (0..dimension).map(|row| transformed_identity[row][column]).collect();
            apply_reflector(&mut target, stage, &vector, beta).ok_or("rhs_reflector")?;
            for row in 0..dimension { transformed_identity[row][column] = target[row]; }
        }
    }

    let mut inverse = vec![vec![zero(); dimension]; dimension];
    for original_column in 0..dimension {
        let mut solution = vec![zero(); dimension];
        for row in (0..dimension).rev() {
            let mut residual = transformed_identity[row][original_column];
            for column in row + 1..dimension {
                residual = residual.sub(matrix[row][column].mul(solution[column]).ok_or("back_product")?).ok_or("back_subtract")?;
            }
            if matrix[row][row].contains_zero() { return Err("zero_diagonal"); }
            solution[row] = residual.div(matrix[row][row]).ok_or("back_divide")?;
        }
        for permuted_column in 0..dimension {
            inverse[permutation[permuted_column]][original_column] = solution[permuted_column];
        }
    }
    Ok(inverse)
}

pub(crate) fn column_pivoted_householder_inverse(
    input: &[Vec<Ball512>], first_pivot_original_column: &mut usize,
) -> Option<Vec<Vec<Ball512>>> {
    qr_inverse_impl(input, first_pivot_original_column).ok()
}

fn base_matrix() -> Vec<Vec<Ball512>> {
    vec![
        vec![Ball512::exact(2, 0), Ball512::exact(1, 0)],
        vec![Ball512::exact(1, 0), Ball512::exact(1, 0)],
    ]
}

fn inverse_constructs_fixture() -> bool {
    let mut first = usize::MAX;
    column_pivoted_householder_inverse(&base_matrix(), &mut first).is_some()
}

fn inverse_values_fixture() -> bool {
    let mut first = usize::MAX;
    let inverse = match column_pivoted_householder_inverse(&base_matrix(), &mut first) {
        Some(value) => value,
        None => return false,
    };
    first == 0
        && inverse[0][0].contains_dyadic(1, 0)
        && inverse[0][1].contains_dyadic(-1, 0)
        && inverse[1][0].contains_dyadic(-1, 0)
        && inverse[1][1].contains_dyadic(2, 0)
}

fn tie_result() -> (bool, usize) {
    let matrix = vec![
        vec![Ball512::exact(0, 0), Ball512::exact(1, 0)],
        vec![Ball512::exact(1, 0), Ball512::exact(0, 0)],
    ];
    let mut first = usize::MAX;
    (column_pivoted_householder_inverse(&matrix, &mut first).is_some(), first)
}

fn pivot_tie_constructs_fixture() -> bool { tie_result().0 }
fn pivot_tie_ordinal_fixture() -> bool { let result = tie_result(); result.0 && result.1 == 0 }

fn singular_fixture() -> bool {
    let matrix = vec![
        vec![Ball512::exact(1, 0), Ball512::exact(1, 0)],
        vec![Ball512::exact(1, 0), Ball512::exact(1, 0)],
    ];
    let mut first = usize::MAX;
    column_pivoted_householder_inverse(&matrix, &mut first).is_none()
}

fn interval_midpoint_failure_fixture() -> bool {
    let matrix = vec![
        vec![Ball512::interval(-1, 1, -20).unwrap(), Ball512::exact(0, 0)],
        vec![Ball512::exact(0, 0), Ball512::exact(1, 0)],
    ];
    let mut first = usize::MAX;
    column_pivoted_householder_inverse(&matrix, &mut first).is_none()
}

fn fixture_results() -> [bool; 8] {
    [
        MAXIMUM_DIMENSION == 2050,
        inverse_constructs_fixture(),
        inverse_values_fixture(),
        pivot_tie_constructs_fixture(),
        pivot_tie_ordinal_fixture(),
        singular_fixture(),
        interval_midpoint_failure_fixture(),
        Ball512::exact(2, 0).sqrt().is_some(),
    ]
}

pub(crate) fn fixture_count() -> usize { 8 }
pub(crate) fn fixtures_passed() -> usize { fixture_results().into_iter().filter(|value| *value).count() }
pub(crate) fn fixture_mask() -> String { fixture_results().into_iter().map(|value| if value { '1' } else { '0' }).collect() }
pub(crate) fn fixture_diagnostic() -> String {
    if fixtures_passed() == fixture_count() { return "pass".into(); }
    let mut base_first = usize::MAX;
    let base = qr_inverse_impl(&base_matrix(), &mut base_first).err().unwrap_or("pass");
    let tie_matrix = vec![
        vec![Ball512::exact(0, 0), Ball512::exact(1, 0)],
        vec![Ball512::exact(1, 0), Ball512::exact(0, 0)],
    ];
    let mut tie_first = usize::MAX;
    let tie = qr_inverse_impl(&tie_matrix, &mut tie_first).err().unwrap_or("pass");
    let midpoint = Ball512::exact(2, 0).midpoint().unwrap();
    let norm = squared_norm(&[midpoint, Ball512::exact(1, 0).midpoint().unwrap()]).and_then(|value| value.sqrt()).unwrap();
    let head = midpoint.sub(norm.neg()).unwrap();
    let head_square = head.square();
    let tail_square = Ball512::exact(1, 0).midpoint().unwrap().square();
    let sum = head_square.and_then(|left| tail_square.and_then(|right| left.add(right)));
    format!("base:{}:{};tie:{}:{};norm:{};head:{};hs:{};ts:{};sum:{}", base, base_first, tie, tie_first, norm.debug_shape(), head.debug_shape(), head_square.map(|v| v.debug_shape()).unwrap_or_else(|| "none".into()), tail_square.map(|v| v.debug_shape()).unwrap_or_else(|| "none".into()), sum.map(|v| v.debug_shape()).unwrap_or_else(|| "none".into()))
}
pub(crate) fn run_inverse_fixture_suite() -> bool { fixtures_passed() == fixture_count() }
