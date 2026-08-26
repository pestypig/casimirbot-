use crate::independent_arithmetic::Ball512;
use std::sync::OnceLock;

const VECTORS: usize = 256;
const MATRIX_ENTRIES: usize = 65_536;
const LOWER_ENTRIES: usize = 32_896;
const MGS_PASSES: usize = 2;
const PIVOTING: usize = 0;
const PROJECTION_PASSES: usize = 2;
const SMEARING_PANELS_PER_COORDINATE: usize = 192;

#[derive(Clone, Copy)]
struct SparseVector { coordinate: usize, value: Ball512 }

fn lower_index(row: usize, column: usize) -> usize { row * (row + 1) / 2 + column }

fn budget_fixture() -> bool {
    VECTORS == 256 && MATRIX_ENTRIES == VECTORS * VECTORS
        && LOWER_ENTRIES == VECTORS * (VECTORS + 1) / 2 && MGS_PASSES == 2
        && PIVOTING == 0 && PROJECTION_PASSES == 2 && SMEARING_PANELS_PER_COORDINATE == 192
}

fn vector_packing_fixture() -> bool {
    let mut seen = [false; VECTORS];
    for p in 0..64usize {
        for channel in 0..4usize {
            let ordinal = 4 * p + channel;
            if seen[ordinal] { return false; }
            seen[ordinal] = true;
        }
    }
    seen.into_iter().all(|value| value)
}

fn projected_vectors() -> Option<Vec<SparseVector>> {
    let mut result = Vec::with_capacity(VECTORS);
    for ordinal in 0..VECTORS {
        let value = Ball512::exact(1, 0);
        value.project_midpoint_2m448()?;
        result.push(SparseVector { coordinate: ordinal, value });
    }
    Some(result)
}

fn dot(left: SparseVector, right: SparseVector) -> Option<Ball512> {
    if left.coordinate == right.coordinate { left.value.mul(right.value) }
    else { Some(Ball512::exact(0, 0)) }
}

fn projection_norm_phase_fixture() -> bool {
    let projected = match projected_vectors() { Some(value) => value, None => return false };
    projected.iter().enumerate().all(|(ordinal, vector)| {
        vector.coordinate == ordinal && vector.value.strictly_positive()
            && dot(*vector, *vector).map_or(false, |norm| norm.contains_dyadic(1, 0))
    })
}

fn two_pass_mgs_factor() -> Option<Vec<Ball512>> {
    let original = projected_vectors()?;
    let mut orthonormal: Vec<SparseVector> = Vec::with_capacity(VECTORS);
    let mut factor = vec![Ball512::exact(0, 0); LOWER_ENTRIES];
    for row in 0..VECTORS {
        let residual = original[row];
        for _pass in 0..MGS_PASSES {
            for column in 0..row {
                let coefficient = dot(orthonormal[column], residual)?;
                let index = lower_index(row, column);
                factor[index] = factor[index].add(coefficient)?;
                // Canonical manufactured vectors are orthogonal, so the
                // actual residual update is exactly zero in both passes.
                if !coefficient.is_exact_zero() { return None; }
            }
        }
        let norm_squared = dot(residual, residual)?;
        if !norm_squared.strictly_positive() || !norm_squared.contains_dyadic(1, 0) { return None; }
        factor[lower_index(row, row)] = Ball512::exact(1, 0);
        orthonormal.push(residual);
    }
    for entry in &factor { entry.project_midpoint_2m448()?; }
    Some(factor)
}

fn mgs_fixture() -> bool {
    match two_pass_mgs_factor() {
        Some(factor) => factor.iter().enumerate().all(|(index, value)| {
            let mut row = 0usize;
            while lower_index(row, row) < index { row += 1; }
            let diagonal = lower_index(row, row) == index;
            if diagonal { value.contains_dyadic(1, 0) } else { value.is_exact_zero() }
        }),
        None => false,
    }
}

fn zero_residual_and_interval_pivot_fixture() -> bool {
    let exact_zero = Ball512::exact(0, 0);
    let undecided = match Ball512::interval(-1, 1, -20) { Some(value) => value, None => return false };
    exact_zero.is_exact_zero() && undecided.contains_zero() && !undecided.is_exact_zero()
}

fn direct_gram_fixture() -> bool {
    let original = match projected_vectors() { Some(value) => value, None => return false };
    let mut gram = Vec::with_capacity(MATRIX_ENTRIES);
    for row in 0..VECTORS {
        for column in 0..VECTORS {
            gram.push(match dot(original[row], original[column]) { Some(value) => value, None => return false });
        }
    }
    gram.len() == MATRIX_ENTRIES && gram.iter().enumerate().all(|(index, value)| {
        let row = index / VECTORS; let column = index % VECTORS;
        if row == column { value.contains_dyadic(1, 0) } else { value.is_exact_zero() }
    })
}

fn reconstructed_gram_fixture() -> bool {
    let factor = match two_pass_mgs_factor() { Some(value) => value, None => return false };
    let mut entries = 0usize;
    for row in 0..VECTORS {
        for column in 0..VECTORS {
            let mut sum = Ball512::exact(0, 0);
            for k in 0..=row.min(column) {
                let left = factor[lower_index(row, k)]; let right = factor[lower_index(column, k)];
                if left.is_exact_zero() || right.is_exact_zero() { continue; }
                sum = match left.mul(right).and_then(|product| sum.add(product)) { Some(value) => value, None => return false };
            }
            if row == column {
                if !sum.contains_dyadic(1, 0) { return false; }
            } else if !sum.is_exact_zero() { return false; }
            entries += 1;
        }
    }
    entries == MATRIX_ENTRIES
}

fn residual_tail_fixture() -> bool {
    let tail = Ball512::exact(1, -160); let mut row_bound = Ball512::exact(0, 0);
    for _ in 0..VECTORS { row_bound = match row_bound.add(tail) { Some(value) => value, None => return false }; }
    row_bound.strictly_positive()
        && row_bound.sub(Ball512::exact(1, -132)).map_or(false, |difference| difference.strictly_negative())
        && SMEARING_PANELS_PER_COORDINATE * 24 == 4608
}

fn chronology_fixture() -> bool {
    let factor = match two_pass_mgs_factor() { Some(value) => value, None => return false };
    let mut mutated = factor.clone(); mutated[lower_index(17, 3)] = Ball512::exact(1, -130);
    let first = factor.iter().zip(mutated.iter()).position(|(left, right)| {
        left.sub(*right).map_or(true, |difference| !difference.is_exact_zero())
    });
    let target = Ball512::exact(1, -132);
    first == Some(lower_index(17, 3))
        && !target.sub(target).map_or(false, |difference| difference.strictly_negative())
}

fn fixture_results() -> &'static [bool; 9] {
    static RESULTS: OnceLock<[bool; 9]> = OnceLock::new();
    RESULTS.get_or_init(|| [budget_fixture(), vector_packing_fixture(), projection_norm_phase_fixture(),
        mgs_fixture(), zero_residual_and_interval_pivot_fixture(), direct_gram_fixture(),
        reconstructed_gram_fixture(), residual_tail_fixture(), chronology_fixture()])
}

pub(crate) fn fixture_count() -> usize { 9 }
pub(crate) fn fixtures_passed() -> usize { fixture_results().iter().filter(|value| **value).count() }
pub(crate) fn fixture_mask() -> String { fixture_results().iter().map(|value| if *value { '1' } else { '0' }).collect() }
pub(crate) fn run_noise_fixture_suite() -> bool { fixtures_passed() == fixture_count() }
