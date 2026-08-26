use std::cmp::Ordering;

use crate::independent_arithmetic::{Ball512, I512};

pub(crate) const MAXIMUM_MODULAR_PRIMES: usize = 32_768;

#[derive(Clone, Debug, Eq, PartialEq)]
struct BigNat(Vec<u32>);

impl BigNat {
    fn zero() -> Self { Self(Vec::new()) }
    fn one() -> Self { Self(vec![1]) }

    fn normalize(&mut self) {
        while self.0.last() == Some(&0) { self.0.pop(); }
    }

    fn is_zero(&self) -> bool { self.0.is_empty() }

    fn bit_len(&self) -> usize {
        self.0.last().map_or(0, |word| (self.0.len() - 1) * 32 + 32 - word.leading_zeros() as usize)
    }

    fn power_of_two(bit: usize) -> Self {
        let mut words = vec![0; bit / 32 + 1];
        words[bit / 32] = 1u32 << (bit % 32);
        Self(words)
    }

    fn is_power_of_two_at(&self, bit: usize) -> bool { self == &Self::power_of_two(bit) }

    fn from_words(words: [u64; 8]) -> Self {
        let mut result = Vec::with_capacity(16);
        for word in words { result.push(word as u32); result.push((word >> 32) as u32); }
        let mut value = Self(result); value.normalize(); value
    }

    fn mod_u64(&self, modulus: u64) -> u64 {
        let mut result = 0u128;
        for word in self.0.iter().rev() {
            result = ((result << 32) + *word as u128) % modulus as u128;
        }
        result as u64
    }

    fn mul_u64(&self, multiplier: u64) -> Self {
        if multiplier == 0 || self.is_zero() { return Self::zero(); }
        let mut result = Vec::with_capacity(self.0.len() + 2);
        let mut carry = 0u128;
        for word in &self.0 {
            let total = *word as u128 * multiplier as u128 + carry;
            result.push(total as u32);
            carry = total >> 32;
        }
        while carry != 0 { result.push(carry as u32); carry >>= 32; }
        Self(result)
    }

    fn add_assign(&mut self, other: &Self) {
        let length = self.0.len().max(other.0.len());
        self.0.resize(length, 0);
        let mut carry = 0u64;
        for index in 0..length {
            let total = self.0[index] as u64 + other.0.get(index).copied().unwrap_or(0) as u64 + carry;
            self.0[index] = total as u32;
            carry = total >> 32;
        }
        if carry != 0 { self.0.push(carry as u32); }
    }

    fn sub(&self, other: &Self) -> Self {
        assert!(self >= other);
        let mut result = self.0.clone();
        let mut borrow = 0u64;
        for (index, word) in result.iter_mut().enumerate() {
            let subtrahend = other.0.get(index).copied().unwrap_or(0) as u64 + borrow;
            let current = *word as u64;
            if current >= subtrahend { *word = (current - subtrahend) as u32; borrow = 0; }
            else { *word = ((1u64 << 32) + current - subtrahend) as u32; borrow = 1; }
        }
        assert_eq!(borrow, 0);
        let mut value = Self(result); value.normalize(); value
    }

    fn shr_one(&self) -> Self {
        let mut result = self.0.clone();
        let mut carry = 0u32;
        for word in result.iter_mut().rev() {
            let next = *word & 1;
            *word = (*word >> 1) | (carry << 31);
            carry = next;
        }
        let mut value = Self(result); value.normalize(); value
    }
}

impl Ord for BigNat {
    fn cmp(&self, other: &Self) -> Ordering {
        match self.0.len().cmp(&other.0.len()) {
            Ordering::Equal => self.0.iter().rev().cmp(other.0.iter().rev()),
            order => order,
        }
    }
}
impl PartialOrd for BigNat { fn partial_cmp(&self, other: &Self) -> Option<Ordering> { Some(self.cmp(other)) } }

#[derive(Clone, Debug)]
pub(crate) struct ReconstructedDeterminant {
    negative: bool,
    magnitude: BigNat,
    pub(crate) primes_used: usize,
}

impl ReconstructedDeterminant {
    pub(crate) fn is_zero(&self) -> bool { self.magnitude.is_zero() }
    pub(crate) fn is_positive_nonzero(&self) -> bool { !self.negative && !self.magnitude.is_zero() }
    pub(crate) fn is_positive_power_of_two(&self, bit: usize) -> bool { !self.negative && self.magnitude.is_power_of_two_at(bit) }
}

fn mod_mul(left: u64, right: u64, modulus: u64) -> u64 { (left as u128 * right as u128 % modulus as u128) as u64 }

fn mod_pow(mut base: u64, mut exponent: u64, modulus: u64) -> u64 {
    let mut result = 1u64;
    while exponent != 0 {
        if exponent & 1 == 1 { result = mod_mul(result, base, modulus); }
        base = mod_mul(base, base, modulus);
        exponent >>= 1;
    }
    result
}

fn prime(value: u64) -> bool {
    if value < 2 { return false; }
    for small in [2u64, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37] {
        if value == small { return true; }
        if value % small == 0 { return false; }
    }
    let mut odd = value - 1;
    let powers = odd.trailing_zeros();
    odd >>= powers;
    for witness in [2u64, 325, 9_375, 28_178, 450_775, 9_780_504, 1_795_265_022] {
        let base = witness % value;
        if base == 0 { continue; }
        let mut x = mod_pow(base, odd, value);
        if x == 1 || x == value - 1 { continue; }
        let mut composite = true;
        for _ in 1..powers {
            x = mod_mul(x, x, value);
            if x == value - 1 { composite = false; break; }
        }
        if composite { return false; }
    }
    true
}

fn next_prime(mut candidate: u64) -> Option<u64> {
    if candidate <= (1u64 << 60) { candidate = (1u64 << 60) + 1; }
    if candidate & 1 == 0 { candidate += 1; }
    loop {
        if prime(candidate) { return Some(candidate); }
        candidate = candidate.checked_add(2)?;
    }
}

fn signed_mod(value: I512, modulus: u64) -> u64 {
    let (negative, words) = value.sign_and_words();
    let residue = BigNat::from_words(words).mod_u64(modulus);
    if negative && residue != 0 { modulus - residue } else { residue }
}

fn determinant_mod(matrix: &[Vec<I512>], modulus: u64) -> u64 {
    let dimension = matrix.len();
    let mut work: Vec<Vec<u64>> = matrix.iter().map(|row| row.iter().map(|value| signed_mod(*value, modulus)).collect()).collect();
    let mut determinant = 1u64;
    let mut negative = false;
    for column in 0..dimension {
        let pivot = match (column..dimension).find(|row| work[*row][column] != 0) {
            Some(value) => value,
            None => return 0,
        };
        if pivot != column { work.swap(pivot, column); negative = !negative; }
        let pivot_value = work[column][column];
        determinant = mod_mul(determinant, pivot_value, modulus);
        let inverse = mod_pow(pivot_value, modulus - 2, modulus);
        for row in column + 1..dimension {
            let factor = mod_mul(work[row][column], inverse, modulus);
            for j in column + 1..dimension {
                let removed = mod_mul(factor, work[column][j], modulus);
                work[row][j] = if work[row][j] >= removed { work[row][j] - removed } else { modulus - (removed - work[row][j]) };
            }
        }
    }
    if negative && determinant != 0 { modulus - determinant } else { determinant }
}

fn magnitude_bits(value: I512) -> usize {
    let (_, words) = value.sign_and_words();
    for index in (0..8).rev() {
        if words[index] != 0 { return index * 64 + 64 - words[index].leading_zeros() as usize; }
    }
    0
}

fn hadamard_bound_bits(matrix: &[Vec<I512>]) -> usize {
    let dimension = matrix.len();
    let dimension_bits = if dimension <= 1 { 0 } else { usize::BITS as usize - (dimension - 1).leading_zeros() as usize };
    matrix.iter().map(|row| row.iter().map(|value| magnitude_bits(*value)).max().unwrap_or(0) + dimension_bits).sum()
}

pub(crate) fn project_matrix(input: &[Vec<Ball512>]) -> Option<Vec<Vec<I512>>> {
    input.iter().map(|row| row.iter().map(|value| value.project_midpoint_2m448().map(|pair| pair.0)).collect()).collect()
}

pub(crate) fn reconstruct_determinant(matrix: &[Vec<I512>]) -> Option<ReconstructedDeterminant> {
    let dimension = matrix.len();
    if dimension == 0 || dimension > 2050 || matrix.iter().any(|row| row.len() != dimension) { return None; }
    let bound_bits = hadamard_bound_bits(matrix);
    let mut x = BigNat::zero();
    let mut modulus_product = BigNat::one();
    let mut candidate = (1u64 << 60) + 1;
    for ordinal in 0..MAXIMUM_MODULAR_PRIMES {
        let modulus = next_prime(candidate)?;
        candidate = modulus.checked_add(2)?;
        let residue = determinant_mod(matrix, modulus);
        let x_mod = x.mod_u64(modulus);
        let product_mod = modulus_product.mod_u64(modulus);
        if product_mod == 0 { return None; }
        let delta = if residue >= x_mod { residue - x_mod } else { modulus - (x_mod - residue) };
        let multiplier = mod_mul(delta, mod_pow(product_mod, modulus - 2, modulus), modulus);
        x.add_assign(&modulus_product.mul_u64(multiplier));
        modulus_product = modulus_product.mul_u64(modulus);
        if modulus_product.bit_len() > bound_bits + 1 {
            let half = modulus_product.shr_one();
            let (negative, magnitude) = if x > half { (true, modulus_product.sub(&x)) } else { (false, x) };
            return Some(ReconstructedDeterminant { negative, magnitude, primes_used: ordinal + 1 });
        }
    }
    None
}

pub(crate) fn finite_z0_row_sum(
    approximate_inverse: &[Vec<Ball512>], jacobian: &[Vec<Ball512>],
) -> Option<Ball512> {
    let dimension = jacobian.len();
    if dimension == 0 || dimension > 2050
        || jacobian.iter().any(|row| row.len() != dimension)
        || approximate_inverse.len() != dimension
        || approximate_inverse.iter().any(|row| row.len() != dimension) {
        return None;
    }
    let mut z0 = Ball512::exact(0, 0);
    for row in 0..dimension {
        let mut row_sum = Ball512::exact(0, 0);
        for column in 0..dimension {
            let mut product = Ball512::exact(0, 0);
            for inner in 0..dimension {
                product = product.add(approximate_inverse[row][inner].mul(jacobian[inner][column])?)?;
            }
            if row == column { product = product.sub(Ball512::exact(1, 0))?; }
            row_sum = row_sum.add(product.abs())?;
        }
        z0 = z0.hull(row_sum)?;
    }
    Some(z0)
}

fn inverse_projection_fixture() -> bool {
    let matrix = vec![
        vec![Ball512::exact(2, 0), Ball512::exact(1, 0)],
        vec![Ball512::exact(1, 0), Ball512::exact(1, 0)],
    ];
    let mut first = usize::MAX;
    let inverse = match crate::independent_inverse::column_pivoted_householder_inverse(&matrix, &mut first) { Some(value) => value, None => return false };
    let projected = match project_matrix(&inverse) { Some(value) => value, None => return false };
    reconstruct_determinant(&projected).map_or(false, |value| value.is_positive_nonzero() && value.primes_used <= MAXIMUM_MODULAR_PRIMES)
}

fn direct_projection_fixture() -> bool {
    let matrix = vec![
        vec![Ball512::exact(2, 0), Ball512::exact(1, 0)],
        vec![Ball512::exact(1, 0), Ball512::exact(1, 0)],
    ];
    let projected = project_matrix(&matrix).unwrap();
    reconstruct_determinant(&projected).map_or(false, |value| value.is_positive_power_of_two(896))
}

fn singular_fixture() -> bool {
    let matrix = vec![
        vec![Ball512::exact(1, 0), Ball512::exact(1, 0)],
        vec![Ball512::exact(1, 0), Ball512::exact(1, 0)],
    ];
    let projected = project_matrix(&matrix).unwrap();
    reconstruct_determinant(&projected).map_or(false, |value| value.is_zero())
}

fn prime_fixture() -> bool {
    let first = next_prime((1u64 << 60) + 1).unwrap();
    let second = next_prime(first + 2).unwrap();
    first > (1u64 << 60) && second > first && prime(first) && prime(second)
}

fn z0_fixture() -> bool {
    let matrix = vec![
        vec![Ball512::exact(2, 0), Ball512::exact(1, 0)],
        vec![Ball512::exact(1, 0), Ball512::exact(1, 0)],
    ];
    let exact_inverse = vec![
        vec![Ball512::exact(1, 0), Ball512::exact(-1, 0)],
        vec![Ball512::exact(-1, 0), Ball512::exact(2, 0)],
    ];
    let exact = finite_z0_row_sum(&exact_inverse, &matrix);
    let corrupted = vec![
        vec![Ball512::exact(1, 0), Ball512::exact(0, 0)],
        vec![Ball512::exact(0, 0), Ball512::exact(1, 0)],
    ];
    exact.map_or(false, |value| value.is_exact_zero())
        && finite_z0_row_sum(&corrupted, &matrix)
            .map_or(false, |value| !value.is_exact_zero() && value.contains_dyadic(2, 0))
        && finite_z0_row_sum(&[vec![Ball512::exact(1, 0)]], &matrix).is_none()
}

fn fixture_results() -> [bool; 6] {
    [MAXIMUM_MODULAR_PRIMES == 32_768, prime_fixture(), direct_projection_fixture(), inverse_projection_fixture(), singular_fixture(), z0_fixture()]
}

pub(crate) fn fixture_count() -> usize { 6 }
pub(crate) fn fixtures_passed() -> usize { fixture_results().into_iter().filter(|value| *value).count() }
pub(crate) fn fixture_mask() -> String { fixture_results().into_iter().map(|value| if value { '1' } else { '0' }).collect() }
pub(crate) fn fixture_diagnostic() -> String {
    if fixtures_passed() == fixture_count() { return "pass".into(); }
    let matrix = vec![
        vec![Ball512::exact(2, 0), Ball512::exact(1, 0)],
        vec![Ball512::exact(1, 0), Ball512::exact(1, 0)],
    ];
    let mut first = usize::MAX;
    let inverse = match crate::independent_inverse::column_pivoted_householder_inverse(&matrix, &mut first) {
        Some(value) => value,
        None => return "inverse:none".into(),
    };
    let shapes = inverse.iter().flatten().map(|value| value.debug_shape()).collect::<Vec<_>>().join(",");
    let projected = match project_matrix(&inverse) {
        Some(value) => value,
        None => return format!("projection:none;shapes:{}", shapes),
    };
    match reconstruct_determinant(&projected) {
        Some(value) => format!("negative:{};bits:{};primes:{};shapes:{}", value.negative, value.magnitude.bit_len(), value.primes_used, shapes),
        None => format!("reconstruction:none;shapes:{}", shapes),
    }
}
pub(crate) fn run_determinant_fixture_suite() -> bool { fixtures_passed() == fixture_count() }
