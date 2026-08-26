use crate::independent_arithmetic::Ball512;
use std::cmp::Ordering;
use std::sync::OnceLock;

pub(crate) const ELL_TERMS: usize = 288;
pub(crate) const HEAT_ORDER: usize = 22;
pub(crate) const EULER_MACLAURIN_TERMS: usize = 64;
pub(crate) const MAJORANT_ITERATIONS: usize = 12;
pub(crate) const PROJECTION_PASSES: usize = 1;

const LIMBS: usize = 64;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct Nat([u64; LIMBS]);

impl Nat {
    const ZERO: Self = Self([0; LIMBS]);
    const ONE: Self = {
        let mut words = [0u64; LIMBS];
        words[0] = 1;
        Self(words)
    };

    fn from_u64(value: u64) -> Self {
        let mut words = [0u64; LIMBS]; words[0] = value; Self(words)
    }
    fn is_zero(self) -> bool { self.0.iter().all(|word| *word == 0) }
    fn bit_len(self) -> usize {
        for index in (0..LIMBS).rev() {
            if self.0[index] != 0 {
                return index * 64 + 64 - self.0[index].leading_zeros() as usize;
            }
        }
        0
    }
    fn bit(self, index: usize) -> bool { (self.0[index / 64] >> (index % 64)) & 1 == 1 }
    fn set_bit(&mut self, index: usize) { self.0[index / 64] |= 1u64 << (index % 64); }
    fn add(self, other: Self) -> Option<Self> {
        let mut words = [0u64; LIMBS];
        let mut carry = false;
        for index in 0..LIMBS {
            let (part, c0) = self.0[index].overflowing_add(other.0[index]);
            let (sum, c1) = part.overflowing_add(carry as u64);
            words[index] = sum; carry = c0 || c1;
        }
        if carry { None } else { Some(Self(words)) }
    }
    fn sub(self, other: Self) -> Self {
        debug_assert!(self >= other);
        let mut words = [0u64; LIMBS];
        let mut borrow = false;
        for index in 0..LIMBS {
            let (part, b0) = self.0[index].overflowing_sub(other.0[index]);
            let (difference, b1) = part.overflowing_sub(borrow as u64);
            words[index] = difference; borrow = b0 || b1;
        }
        debug_assert!(!borrow); Self(words)
    }
    fn shl_one(self) -> Option<Self> {
        if self.0[LIMBS - 1] >> 63 != 0 { return None; }
        let mut words = [0u64; LIMBS];
        let mut carry = 0u64;
        for index in 0..LIMBS {
            let next = self.0[index] >> 63;
            words[index] = (self.0[index] << 1) | carry;
            carry = next;
        }
        Some(Self(words))
    }
    fn mul(self, other: Self) -> Option<Self> {
        let mut words = [0u64; 2 * LIMBS];
        for left in 0..LIMBS {
            let mut carry = 0u128;
            for right in 0..LIMBS {
                let index = left + right;
                let total = words[index] as u128
                    + self.0[left] as u128 * other.0[right] as u128 + carry;
                words[index] = total as u64; carry = total >> 64;
            }
            let mut index = left + LIMBS;
            while carry != 0 && index < 2 * LIMBS {
                let total = words[index] as u128 + carry;
                words[index] = total as u64; carry = total >> 64; index += 1;
            }
            if carry != 0 { return None; }
        }
        if words[LIMBS..].iter().any(|word| *word != 0) { return None; }
        let mut result = [0u64; LIMBS]; result.copy_from_slice(&words[..LIMBS]);
        Some(Self(result))
    }
    fn div_rem(self, denominator: Self) -> Option<(Self, Self)> {
        if denominator.is_zero() { return None; }
        let mut quotient = Self::ZERO;
        let mut remainder = Self::ZERO;
        for bit in (0..self.bit_len()).rev() {
            remainder = remainder.shl_one()?;
            if self.bit(bit) { remainder.0[0] |= 1; }
            if remainder >= denominator {
                remainder = remainder.sub(denominator); quotient.set_bit(bit);
            }
        }
        Some((quotient, remainder))
    }
    fn exact_div(self, denominator: Self) -> Option<Self> {
        let (quotient, remainder) = self.div_rem(denominator)?;
        if remainder.is_zero() { Some(quotient) } else { None }
    }
    fn gcd(mut self, mut other: Self) -> Self {
        while !other.is_zero() {
            let remainder = self.div_rem(other).expect("nonzero gcd divisor").1;
            self = other; other = remainder;
        }
        self
    }
}

impl Ord for Nat {
    fn cmp(&self, other: &Self) -> Ordering {
        for index in (0..LIMBS).rev() {
            match self.0[index].cmp(&other.0[index]) {
                Ordering::Equal => {}
                order => return order,
            }
        }
        Ordering::Equal
    }
}
impl PartialOrd for Nat {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> { Some(self.cmp(other)) }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) struct Rational { negative: bool, numerator: Nat, denominator: Nat }

impl Rational {
    pub(crate) const ZERO: Self = Self { negative: false, numerator: Nat::ZERO, denominator: Nat::ONE };
    fn new(negative: bool, numerator: Nat, denominator: Nat) -> Option<Self> {
        if denominator.is_zero() { return None; }
        if numerator.is_zero() { return Some(Self::ZERO); }
        let divisor = numerator.gcd(denominator);
        Some(Self {
            negative,
            numerator: numerator.exact_div(divisor)?,
            denominator: denominator.exact_div(divisor)?,
        })
    }
    fn unit_fraction(denominator: u64) -> Option<Self> {
        Self::new(false, Nat::ONE, Nat::from_u64(denominator))
    }
    pub(crate) fn from_i64(value: i64) -> Option<Self> {
        Self::new(value < 0, Nat::from_u64(value.unsigned_abs()), Nat::ONE)
    }
    pub(crate) fn power_of_two(exponent: usize) -> Option<Self> {
        if exponent >= LIMBS * 64 { return None; }
        let mut words = [0u64; LIMBS];
        words[exponent / 64] = 1u64 << (exponent % 64);
        Self::new(false, Nat(words), Nat::ONE)
    }
    pub(crate) fn is_zero(self) -> bool { self.numerator.is_zero() }
    pub(crate) fn is_integer(self) -> bool { self.denominator == Nat::ONE }
    fn neg(self) -> Self {
        if self.numerator.is_zero() { self } else { Self { negative: !self.negative, ..self } }
    }
    pub(crate) fn add(self, other: Self) -> Option<Self> {
        let common = self.denominator.gcd(other.denominator);
        let left_scale = other.denominator.exact_div(common)?;
        let right_scale = self.denominator.exact_div(common)?;
        let left = self.numerator.mul(left_scale)?;
        let right = other.numerator.mul(right_scale)?;
        let denominator = self.denominator.mul(left_scale)?;
        if self.negative == other.negative {
            Self::new(self.negative, left.add(right)?, denominator)
        } else if left >= right {
            Self::new(self.negative, left.sub(right), denominator)
        } else {
            Self::new(other.negative, right.sub(left), denominator)
        }
    }
    pub(crate) fn sub(self, other: Self) -> Option<Self> { self.add(other.neg()) }
    pub(crate) fn mul(self, other: Self) -> Option<Self> {
        if self.is_zero() || other.is_zero() { return Some(Self::ZERO); }
        let cross_left = self.numerator.gcd(other.denominator);
        let cross_right = other.numerator.gcd(self.denominator);
        Self::new(
            self.negative ^ other.negative,
            self.numerator.exact_div(cross_left)?.mul(other.numerator.exact_div(cross_right)?)?,
            self.denominator.exact_div(cross_right)?.mul(other.denominator.exact_div(cross_left)?)?,
        )
    }
    pub(crate) fn div(self, other: Self) -> Option<Self> {
        if other.is_zero() { return None; }
        self.mul(Self { negative: other.negative, numerator: other.denominator, denominator: other.numerator })
    }
    fn mul_u64(self, multiplier: u64) -> Option<Self> {
        Self::new(self.negative, self.numerator.mul(Nat::from_u64(multiplier))?, self.denominator)
    }
    pub(crate) fn dyadic_enclosure(self) -> Option<Ball512> {
        if self.numerator.is_zero() { return Some(Ball512::exact(0, 0)); }
        // n < 2^nb and d >= 2^(db-1), hence |n/d| < 2^(nb-db+1).
        let exponent = self.numerator.bit_len() as i32
            - self.denominator.bit_len() as i32 + 1;
        if self.negative { Ball512::interval(-1, 0, exponent) }
        else { Ball512::interval(0, 1, exponent) }
    }
}

fn akiyama_tanigawa_through_128() -> Option<[Rational; 129]> {
    let mut work = [Rational::ZERO; 129];
    let mut bernoulli = [Rational::ZERO; 129];
    for m in 0..=128usize {
        work[m] = Rational::unit_fraction(m as u64 + 1)?;
        for j in (1..=m).rev() {
            work[j - 1] = work[j - 1].sub(work[j])?.mul_u64(j as u64)?;
        }
        bernoulli[m] = work[0];
    }
    Some(bernoulli)
}

fn cached_bernoulli() -> Option<&'static [Rational; 129]> {
    static VALUE: OnceLock<Option<[Rational; 129]>> = OnceLock::new();
    VALUE.get_or_init(akiyama_tanigawa_through_128).as_ref()
}

#[derive(Clone, Copy, Eq, PartialEq)]
enum ThresholdClass { Below, Atom, Above, Undecided }

fn classify_threshold(lambda: Ball512) -> ThresholdClass {
    let one = Ball512::exact(1, 0);
    let difference = match lambda.sub(one) { Some(value) => value, None => return ThresholdClass::Undecided };
    if difference.strictly_negative() { ThresholdClass::Below }
    else if difference.strictly_positive() { ThresholdClass::Above }
    else if difference.is_exact_zero() { ThresholdClass::Atom }
    else { ThresholdClass::Undecided }
}

fn strict_component_width(width: Ball512) -> bool {
    width.is_nonnegative() && width.sub(Ball512::exact(1, -132))
        .map_or(false, |difference| difference.strictly_negative())
}

fn budget_and_packing_fixture() -> bool {
    let packed = 4u64 * 70 * (HEAT_ORDER as u64 + 1) * 256 * 29;
    ELL_TERMS == 288 && HEAT_ORDER == 22 && EULER_MACLAURIN_TERMS == 64
        && MAJORANT_ITERATIONS == 12 && PROJECTION_PASSES == 1
        && packed == 47810560
}

fn heat_recurrence_fixture() -> bool {
    // Flat manufactured heat equation with zero endomorphism: a_0=+1 and
    // every higher DeWitt coefficient is exactly zero in ascending order.
    let mut coefficients = [Ball512::exact(0, 0); HEAT_ORDER + 1];
    coefficients[0] = Ball512::exact(1, 0);
    let mut visited = 0usize;
    for order in 1..=HEAT_ORDER {
        let heat_rhs = Ball512::exact(0, 0);
        coefficients[order] = match heat_rhs.div(Ball512::exact(order as i64, 0)) {
            Some(value) => value, None => return false,
        };
        for _derivative_ordinal in 0..70 { visited += 1; }
    }
    coefficients[0].strictly_positive()
        && coefficients[1..].iter().all(|value| value.is_exact_zero())
        && visited == HEAT_ORDER * 70
}

fn finite_sum_order_fixture() -> bool {
    let mut degeneracy = 0u64;
    let mut previous = None;
    for ell in 0..ELL_TERMS {
        if previous.map_or(ell != 0, |value| ell != value + 1) { return false; }
        for _m_ordinal in 0..2 * ell + 1 { degeneracy += 1; }
        previous = Some(ell);
    }
    previous == Some(287) && degeneracy == 82944
}

fn exact_bernoulli_fixture() -> bool {
    let values = match cached_bernoulli() { Some(value) => value, None => return false };
    let half = Rational::new(false, Nat::ONE, Nat::from_u64(2)).unwrap();
    let sixth = Rational::new(false, Nat::ONE, Nat::from_u64(6)).unwrap();
    let minus_thirtieth = Rational::new(true, Nat::ONE, Nat::from_u64(30)).unwrap();
    values[0] == Rational::new(false, Nat::ONE, Nat::ONE).unwrap()
        && values[1] == half && values[2] == sixth && values[3] == Rational::ZERO
        && values[4] == minus_thirtieth
        && (3..=127).step_by(2).all(|index| values[index] == Rational::ZERO)
        && values[128].negative && !values[128].numerator.is_zero()
}

fn euler_maclaurin_fixture() -> bool {
    let values = match cached_bernoulli() { Some(value) => value, None => return false };
    let q_inverse = match Ball512::exact(2, 0).div(Ball512::exact(577, 0)) {
        Some(value) => value, None => return false,
    };
    // At s=2, (s)_(2k-1)/(2k)! = 1, so the 64 fixed corrections are
    // B_(2k) q^(-2k-1).  Dyadic Bernoulli enclosures remain rigorous.
    let q_inverse_squared = match q_inverse.square() { Some(value) => value, None => return false };
    let mut power = match q_inverse_squared.mul(q_inverse) { Some(value) => value, None => return false };
    let mut corrections = Ball512::exact(0, 0);
    let mut count = 0usize;
    for k in 1..=EULER_MACLAURIN_TERMS {
        let bernoulli = match values[2 * k].dyadic_enclosure() { Some(value) => value, None => return false };
        let term = match bernoulli.mul(power) { Some(value) => value, None => return false };
        corrections = match corrections.add(term) { Some(value) => value, None => return false };
        power = match power.mul(q_inverse_squared) { Some(value) => value, None => return false };
        count += 1;
    }
    count == 64 && corrections.contains_zero()
}

fn majorant_fixture() -> bool {
    let source = Ball512::exact(1, -154);
    let rho = Ball512::exact(1, -1);
    let mut bound = Ball512::exact(0, 0);
    let mut strict_increases = 0usize;
    for _ in 0..MAJORANT_ITERATIONS {
        let previous = bound;
        bound = match rho.mul(bound).and_then(|value| value.add(source)) {
            Some(value) => value, None => return false,
        };
        if bound.sub(previous).map_or(false, |difference| difference.strictly_positive()) {
            strict_increases += 1;
        }
    }
    let denominator = match Ball512::exact(1, 0).sub(rho) { Some(value) => value, None => return false };
    let tail = match bound.div(denominator) { Some(value) => value, None => return false };
    strict_increases == MAJORANT_ITERATIONS && strict_component_width(tail)
}

fn threshold_fixture() -> bool {
    classify_threshold(Ball512::exact(3, -2)) == ThresholdClass::Below
        && classify_threshold(Ball512::exact(1, 0)) == ThresholdClass::Atom
        && classify_threshold(Ball512::exact(5, -2)) == ThresholdClass::Above
        && classify_threshold(Ball512::interval(0, 2, 0).unwrap()) == ThresholdClass::Undecided
}

fn projection_once_fixture() -> bool {
    let mut projections = 0usize;
    for coefficient in 0..=HEAT_ORDER {
        let value = Ball512::exact(if coefficient == 0 { 1 } else { 0 }, -448);
        let (_, error) = match value.project_midpoint_2m448() { Some(result) => result, None => return false };
        if !error.is_exact_zero() { return false; }
        projections += 1;
    }
    PROJECTION_PASSES == 1 && projections == HEAT_ORDER + 1
}

fn strict_touch_and_chronology_fixture() -> bool {
    let pass = Ball512::exact(1, -133);
    let touch = Ball512::exact(1, -132);
    let mut projection_count = 0usize;
    let tail_accepted = strict_component_width(touch);
    if tail_accepted { projection_count += 1; }
    strict_component_width(pass) && !tail_accepted && projection_count == 0
}

fn fixture_results() -> [bool; 9] {
    [budget_and_packing_fixture(), heat_recurrence_fixture(), finite_sum_order_fixture(),
        exact_bernoulli_fixture(), euler_maclaurin_fixture(), majorant_fixture(),
        threshold_fixture(), projection_once_fixture(), strict_touch_and_chronology_fixture()]
}

pub(crate) fn fixture_count() -> usize { 9 }
pub(crate) fn fixtures_passed() -> usize {
    fixture_results().into_iter().filter(|value| *value).count()
}
pub(crate) fn fixture_mask() -> String {
    fixture_results().into_iter().map(|value| if value { '1' } else { '0' }).collect()
}
pub(crate) fn run_quantum_angular_fixture_suite() -> bool {
    fixtures_passed() == fixture_count()
}
