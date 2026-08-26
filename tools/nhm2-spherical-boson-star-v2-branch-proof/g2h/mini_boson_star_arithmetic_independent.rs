use std::cmp::Ordering;

const LIMBS: usize = 8;
const WIDE_LIMBS: usize = 16;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct U512([u64; LIMBS]);

impl U512 {
    const ZERO: Self = Self([0; LIMBS]);

    fn from_u64(value: u64) -> Self {
        let mut words = [0; LIMBS];
        words[0] = value;
        Self(words)
    }

    fn is_zero(self) -> bool {
        self.0.iter().all(|word| *word == 0)
    }

    fn bit_len(self) -> usize {
        for index in (0..LIMBS).rev() {
            if self.0[index] != 0 {
                return index * 64 + (64 - self.0[index].leading_zeros() as usize);
            }
        }
        0
    }

    fn is_odd(self) -> bool {
        self.0[0] & 1 == 1
    }

    fn with_bit(mut self, index: usize) -> Self {
        self.0[index / 64] |= 1u64 << (index % 64);
        self
    }

    fn checked_add(self, other: Self) -> Option<Self> {
        let mut result = [0; LIMBS];
        let mut carry = false;
        for index in 0..LIMBS {
            let (sum0, carry0) = self.0[index].overflowing_add(other.0[index]);
            let (sum1, carry1) = sum0.overflowing_add(carry as u64);
            result[index] = sum1;
            carry = carry0 || carry1;
        }
        if carry { None } else { Some(Self(result)) }
    }

    fn checked_add_one(self) -> Option<Self> {
        self.checked_add(Self::from_u64(1))
    }

    fn sub(self, other: Self) -> Self {
        debug_assert!(self >= other);
        let mut result = [0; LIMBS];
        let mut borrow = false;
        for index in 0..LIMBS {
            let (difference0, borrow0) = self.0[index].overflowing_sub(other.0[index]);
            let (difference1, borrow1) = difference0.overflowing_sub(borrow as u64);
            result[index] = difference1;
            borrow = borrow0 || borrow1;
        }
        debug_assert!(!borrow);
        Self(result)
    }

    fn checked_shl(self, shift: usize) -> Option<Self> {
        if self.is_zero() { return Some(self); }
        if shift >= 512 || self.bit_len() + shift > 512 { return None; }
        let whole = shift / 64;
        let bits = shift % 64;
        let mut result = [0; LIMBS];
        for source in 0..LIMBS {
            let target = source + whole;
            if target < LIMBS {
                result[target] |= self.0[source] << bits;
                if bits != 0 && target + 1 < LIMBS {
                    result[target + 1] |= self.0[source] >> (64 - bits);
                }
            }
        }
        Some(Self(result))
    }

    fn shr(self, shift: usize) -> (Self, bool) {
        if shift == 0 { return (self, false); }
        if shift >= 512 { return (Self::ZERO, !self.is_zero()); }
        let whole = shift / 64;
        let bits = shift % 64;
        let mut result = [0; LIMBS];
        for target in 0..LIMBS - whole {
            let source = target + whole;
            result[target] = self.0[source] >> bits;
            if bits != 0 && source + 1 < LIMBS {
                result[target] |= self.0[source + 1] << (64 - bits);
            }
        }
        let mut remainder = self.0[..whole].iter().any(|word| *word != 0);
        if bits != 0 {
            remainder |= self.0[whole] & ((1u64 << bits) - 1) != 0;
        }
        (Self(result), remainder)
    }
}

impl Ord for U512 {
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

impl PartialOrd for U512 {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> { Some(self.cmp(other)) }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) struct I512 {
    negative: bool,
    magnitude: U512,
}

impl I512 {
    const ZERO: Self = Self { negative: false, magnitude: U512::ZERO };

    fn from_i64(value: i64) -> Self {
        if value < 0 {
            Self { negative: true, magnitude: U512::from_u64(value.unsigned_abs()) }
        } else {
            Self { negative: false, magnitude: U512::from_u64(value as u64) }
        }
    }

    pub(crate) fn from_u64(value: u64) -> Self {
        Self { negative: false, magnitude: U512::from_u64(value) }
    }

    fn canonical(mut self) -> Self {
        if self.magnitude.is_zero() { self.negative = false; }
        self
    }

    fn neg(self) -> Self {
        Self { negative: !self.negative, magnitude: self.magnitude }.canonical()
    }

    fn checked_add(self, other: Self) -> Option<Self> {
        if self.negative == other.negative {
            Some(Self { negative: self.negative, magnitude: self.magnitude.checked_add(other.magnitude)? }.canonical())
        } else if self.magnitude >= other.magnitude {
            Some(Self { negative: self.negative, magnitude: self.magnitude.sub(other.magnitude) }.canonical())
        } else {
            Some(Self { negative: other.negative, magnitude: other.magnitude.sub(self.magnitude) }.canonical())
        }
    }

    fn checked_shl(self, shift: usize) -> Option<Self> {
        Some(Self { negative: self.negative, magnitude: self.magnitude.checked_shl(shift)? }.canonical())
    }

    pub(crate) fn checked_mul_div_u64(self, multiplier: u64, divisor: u64) -> Option<Self> {
        if divisor == 0 { return None; }
        let product = multiply(self.magnitude, U512::from_u64(multiplier));
        let (quotient, remainder) = divide(product, Wide::from_u512(U512::from_u64(divisor)));
        if !remainder.is_zero() { return None; }
        Some(Self {
            negative: self.negative,
            magnitude: quotient.shr_to_u512(0, false)?,
        }.canonical())
    }

    pub(crate) fn checked_mul(self, other: Self) -> Option<Self> {
        Some(Self {
            negative: self.negative ^ other.negative,
            magnitude: multiply(self.magnitude, other.magnitude).shr_to_u512(0, false)?,
        }.canonical())
    }

    pub(crate) fn sign_and_words(self) -> (bool, [u64; LIMBS]) {
        (self.negative, self.magnitude.0)
    }
}

impl Ord for I512 {
    fn cmp(&self, other: &Self) -> Ordering {
        match (self.negative, other.negative) {
            (true, false) => if self.magnitude.is_zero() && other.magnitude.is_zero() { Ordering::Equal } else { Ordering::Less },
            (false, true) => if self.magnitude.is_zero() && other.magnitude.is_zero() { Ordering::Equal } else { Ordering::Greater },
            (false, false) => self.magnitude.cmp(&other.magnitude),
            (true, true) => other.magnitude.cmp(&self.magnitude),
        }
    }
}

impl PartialOrd for I512 {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> { Some(self.cmp(other)) }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct Wide([u64; WIDE_LIMBS]);

impl Wide {
    const ZERO: Self = Self([0; WIDE_LIMBS]);

    fn from_u512(value: U512) -> Self {
        let mut words = [0; WIDE_LIMBS];
        words[..LIMBS].copy_from_slice(&value.0);
        Self(words)
    }

    fn from_u512_shifted(value: U512, shift: usize) -> Option<Self> {
        if value.is_zero() { return Some(Self::ZERO); }
        if shift >= 1024 || value.bit_len() + shift > 1024 { return None; }
        let whole = shift / 64;
        let bits = shift % 64;
        let mut words = [0; WIDE_LIMBS];
        for source in 0..LIMBS {
            let target = source + whole;
            if target >= WIDE_LIMBS {
                if value.0[source] != 0 { return None; }
                continue;
            }
            words[target] |= value.0[source] << bits;
            if bits != 0 && target + 1 < WIDE_LIMBS {
                words[target + 1] |= value.0[source] >> (64 - bits);
            }
        }
        Some(Self(words))
    }

    fn bit_len(self) -> usize {
        for index in (0..WIDE_LIMBS).rev() {
            if self.0[index] != 0 {
                return index * 64 + (64 - self.0[index].leading_zeros() as usize);
            }
        }
        0
    }

    fn is_zero(self) -> bool { self.0.iter().all(|word| *word == 0) }

    fn checked_add(self, other: Self) -> Option<Self> {
        let mut words = [0; WIDE_LIMBS];
        let mut carry = false;
        for index in 0..WIDE_LIMBS {
            let (sum0, carry0) = self.0[index].overflowing_add(other.0[index]);
            let (sum1, carry1) = sum0.overflowing_add(carry as u64);
            words[index] = sum1;
            carry = carry0 || carry1;
        }
        if carry { None } else { Some(Self(words)) }
    }

    fn bit(self, index: usize) -> bool { (self.0[index / 64] >> (index % 64)) & 1 == 1 }

    fn set_bit(&mut self, index: usize) { self.0[index / 64] |= 1u64 << (index % 64); }

    fn shl_one(&mut self) -> bool {
        let mut carry = 0u64;
        for word in &mut self.0 {
            let next = *word >> 63;
            *word = (*word << 1) | carry;
            carry = next;
        }
        carry != 0
    }

    fn checked_shl(self, shift: usize) -> Option<Self> {
        if self.is_zero() { return Some(self); }
        if shift >= 1024 || self.bit_len() + shift > 1024 { return None; }
        let whole = shift / 64;
        let bits = shift % 64;
        let mut words = [0; WIDE_LIMBS];
        for source in 0..WIDE_LIMBS {
            let target = source + whole;
            if target < WIDE_LIMBS {
                words[target] |= self.0[source] << bits;
                if bits != 0 && target + 1 < WIDE_LIMBS {
                    words[target + 1] |= self.0[source] >> (64 - bits);
                }
            }
        }
        Some(Self(words))
    }

    fn sub(self, other: Self) -> Self {
        debug_assert!(self >= other);
        let mut words = [0; WIDE_LIMBS];
        let mut borrow = false;
        for index in 0..WIDE_LIMBS {
            let (part0, borrow0) = self.0[index].overflowing_sub(other.0[index]);
            let (part1, borrow1) = part0.overflowing_sub(borrow as u64);
            words[index] = part1;
            borrow = borrow0 || borrow1;
        }
        debug_assert!(!borrow);
        Self(words)
    }

    fn shr_to_u512(self, shift: usize, round_up: bool) -> Option<U512> {
        if shift >= 1024 {
            return if self.is_zero() { Some(U512::ZERO) } else if round_up { Some(U512::from_u64(1)) } else { Some(U512::ZERO) };
        }
        let whole = shift / 64;
        let bits = shift % 64;
        let mut words = [0; LIMBS];
        for target in 0..LIMBS {
            let source = target + whole;
            if source < WIDE_LIMBS {
                words[target] = self.0[source] >> bits;
                if bits != 0 && source + 1 < WIDE_LIMBS {
                    words[target] |= self.0[source + 1] << (64 - bits);
                }
            }
        }
        let cutoff = shift + 512;
        if cutoff < 1024 {
            let cutoff_word = cutoff / 64;
            let cutoff_bits = cutoff % 64;
            if cutoff_bits == 0 {
                if self.0[cutoff_word..].iter().any(|word| *word != 0) { return None; }
            } else if self.0[cutoff_word] >> cutoff_bits != 0
                || self.0[cutoff_word + 1..].iter().any(|word| *word != 0) {
                return None;
            }
        }
        let mut discarded = self.0[..whole.min(WIDE_LIMBS)].iter().any(|word| *word != 0);
        if bits != 0 && whole < WIDE_LIMBS {
            discarded |= self.0[whole] & ((1u64 << bits) - 1) != 0;
        }
        let value = U512(words);
        if round_up && discarded { value.checked_add_one() } else { Some(value) }
    }
}

impl Ord for Wide {
    fn cmp(&self, other: &Self) -> Ordering {
        for index in (0..WIDE_LIMBS).rev() {
            match self.0[index].cmp(&other.0[index]) {
                Ordering::Equal => {}
                order => return order,
            }
        }
        Ordering::Equal
    }
}

impl PartialOrd for Wide {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> { Some(self.cmp(other)) }
}

fn multiply(left: U512, right: U512) -> Wide {
    let mut words = [0u64; WIDE_LIMBS];
    for i in 0..LIMBS {
        let mut carry = 0u128;
        for j in 0..LIMBS {
            let index = i + j;
            let total = words[index] as u128 + left.0[i] as u128 * right.0[j] as u128 + carry;
            words[index] = total as u64;
            carry = total >> 64;
        }
        let mut index = i + LIMBS;
        while carry != 0 {
            let total = words[index] as u128 + carry;
            words[index] = total as u64;
            carry = total >> 64;
            index += 1;
        }
    }
    Wide(words)
}

fn divide(numerator: Wide, denominator: Wide) -> (Wide, Wide) {
    assert!(!denominator.is_zero());
    let mut quotient = Wide::ZERO;
    let mut remainder = Wide::ZERO;
    for index in (0..1024).rev() {
        let overflow = remainder.shl_one();
        debug_assert!(!overflow);
        if numerator.bit(index) { remainder.0[0] |= 1; }
        if remainder >= denominator {
            remainder = remainder.sub(denominator);
            quotient.set_bit(index);
        }
    }
    (quotient, remainder)
}

fn integer_sqrt(value: Wide) -> (U512, bool) {
    let mut root = U512::ZERO;
    for bit in (0..512).rev() {
        let trial = root.with_bit(bit);
        if multiply(trial, trial) <= value { root = trial; }
    }
    (root, multiply(root, root) == value)
}

fn compare_nonnegative(left: U512, left_exp: i32, right: U512, right_exp: i32) -> Ordering {
    if left.is_zero() { return if right.is_zero() { Ordering::Equal } else { Ordering::Less }; }
    if right.is_zero() { return Ordering::Greater; }
    let left_top = left.bit_len() as i64 + left_exp as i64;
    let right_top = right.bit_len() as i64 + right_exp as i64;
    match left_top.cmp(&right_top) {
        Ordering::Equal => {
            let target = left_exp.min(right_exp);
            let left_wide = Wide::from_u512_shifted(left, (left_exp - target) as usize).unwrap();
            let right_wide = Wide::from_u512_shifted(right, (right_exp - target) as usize).unwrap();
            left_wide.cmp(&right_wide)
        }
        order => order,
    }
}

#[derive(Clone, Copy)]
enum Direction { Lower, Upper }

fn rescale(value: I512, source_exp: i32, target_exp: i32, direction: Direction) -> Option<I512> {
    if source_exp >= target_exp {
        return value.checked_shl((source_exp - target_exp) as usize);
    }
    let (mut magnitude, discarded) = value.magnitude.shr((target_exp - source_exp) as usize);
    let away = match direction {
        Direction::Lower => value.negative,
        Direction::Upper => !value.negative,
    };
    if away && discarded { magnitude = magnitude.checked_add_one()?; }
    Some(I512 { negative: value.negative, magnitude }.canonical())
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct Ball512 {
    lower: I512,
    upper: I512,
    exponent: i32,
}

impl Ball512 {
    pub(crate) fn exact(value: i64, exponent: i32) -> Self {
        let endpoint = I512::from_i64(value);
        Self { lower: endpoint, upper: endpoint, exponent }
    }

    pub(crate) fn exact_integer(value: I512) -> Self {
        Self { lower: value, upper: value, exponent: 0 }
    }

    pub(crate) fn interval(lower: i64, upper: i64, exponent: i32) -> Option<Self> {
        let result = Self { lower: I512::from_i64(lower), upper: I512::from_i64(upper), exponent };
        if result.lower <= result.upper { Some(result) } else { None }
    }

    pub(crate) fn contains_zero(self) -> bool {
        self.lower <= I512::ZERO && self.upper >= I512::ZERO
    }

    pub(crate) fn is_nonnegative(self) -> bool { !self.lower.negative }

    pub(crate) fn strictly_positive(self) -> bool {
        !self.lower.negative && !self.lower.magnitude.is_zero()
    }

    pub(crate) fn strictly_negative(self) -> bool {
        self.upper.negative && !self.upper.magnitude.is_zero()
    }

    pub(crate) fn is_exact_zero(self) -> bool {
        self.lower == I512::ZERO && self.upper == I512::ZERO
    }

    pub(crate) fn debug_shape(self) -> String {
        format!("{}:{}:{}:{}:{}", self.lower.negative as u8, self.lower.magnitude.bit_len(), self.upper.negative as u8, self.upper.magnitude.bit_len(), self.exponent)
    }

    pub(crate) fn neg(self) -> Self {
        Self { lower: self.upper.neg(), upper: self.lower.neg(), exponent: self.exponent }
    }

    pub(crate) fn abs(self) -> Self {
        if self.strictly_negative() { return self.neg(); }
        if !self.contains_zero() { return self; }
        Self {
            lower: I512::ZERO,
            upper: I512 { negative: false, magnitude: self.lower.magnitude.max(self.upper.magnitude) },
            exponent: self.exponent,
        }
    }

    pub(crate) fn hull(self, other: Self) -> Option<Self> {
        let minimum = self.exponent.min(other.exponent);
        let maximum = self.exponent.max(other.exponent);
        let mut target = minimum.max(maximum.saturating_sub(511));
        for _ in 0..514 {
            if let (Some(left_lower), Some(left_upper), Some(right_lower), Some(right_upper)) = (
                rescale(self.lower, self.exponent, target, Direction::Lower),
                rescale(self.upper, self.exponent, target, Direction::Upper),
                rescale(other.lower, other.exponent, target, Direction::Lower),
                rescale(other.upper, other.exponent, target, Direction::Upper),
            ) {
                return Some(Self {
                    lower: left_lower.min(right_lower),
                    upper: left_upper.max(right_upper),
                    exponent: target,
                });
            }
            target = target.checked_add(1)?;
        }
        None
    }

    pub(crate) fn width(self) -> Option<Self> {
        Self { lower: self.upper, upper: self.upper, exponent: self.exponent }
            .sub(Self { lower: self.lower, upper: self.lower, exponent: self.exponent })
    }

    pub(crate) fn midpoint(self) -> Option<Self> {
        let sum = self.lower.checked_add(self.upper)?;
        Some(Self { lower: sum, upper: sum, exponent: self.exponent.checked_sub(1)? })
    }

    pub(crate) fn lower_nonnegative_cmp(self, other: Self) -> Option<Ordering> {
        if self.lower.negative || other.lower.negative { return None; }
        Some(compare_nonnegative(self.lower.magnitude, self.exponent, other.lower.magnitude, other.exponent))
    }

    pub(crate) fn add(self, other: Self) -> Option<Self> {
        let minimum = self.exponent.min(other.exponent);
        let maximum = self.exponent.max(other.exponent);
        let mut target = minimum.max(maximum.saturating_sub(511));
        for _ in 0..514 {
            let left_lower = rescale(self.lower, self.exponent, target, Direction::Lower);
            let left_upper = rescale(self.upper, self.exponent, target, Direction::Upper);
            let right_lower = rescale(other.lower, other.exponent, target, Direction::Lower);
            let right_upper = rescale(other.upper, other.exponent, target, Direction::Upper);
            if let (Some(ll), Some(lu), Some(rl), Some(ru)) = (left_lower, left_upper, right_lower, right_upper) {
                if let (Some(lower), Some(upper)) = (ll.checked_add(rl), lu.checked_add(ru)) {
                    return Some(Self { lower, upper, exponent: target });
                }
            }
            target = target.checked_add(1)?;
        }
        None
    }

    pub(crate) fn sub(self, other: Self) -> Option<Self> {
        self.add(Self { lower: other.upper.neg(), upper: other.lower.neg(), exponent: other.exponent })
    }

    pub(crate) fn mul(self, other: Self) -> Option<Self> {
        let corners = [
            (self.lower, other.lower), (self.lower, other.upper),
            (self.upper, other.lower), (self.upper, other.upper),
        ];
        let mut signed_products = [(false, Wide::ZERO); 4];
        let mut maximum_bits = 0usize;
        for (index, (left, right)) in corners.into_iter().enumerate() {
            let product = multiply(left.magnitude, right.magnitude);
            maximum_bits = maximum_bits.max(product.bit_len());
            signed_products[index] = (left.negative ^ right.negative, product);
        }
        let shift = maximum_bits.saturating_sub(512);
        let exponent = self.exponent.checked_add(other.exponent)?.checked_add(shift as i32)?;
        let mut lower: Option<I512> = None;
        let mut upper: Option<I512> = None;
        for (negative, magnitude) in signed_products {
            let low_mag = magnitude.shr_to_u512(shift, negative)?;
            let high_mag = magnitude.shr_to_u512(shift, !negative)?;
            let low = I512 { negative, magnitude: low_mag }.canonical();
            let high = I512 { negative, magnitude: high_mag }.canonical();
            lower = Some(lower.map_or(low, |value| value.min(low)));
            upper = Some(upper.map_or(high, |value| value.max(high)));
        }
        Some(Self { lower: lower?, upper: upper?, exponent })
    }

    pub(crate) fn square(self) -> Option<Self> {
        if !self.contains_zero() { return self.mul(self); }
        let maximum = self.lower.magnitude.max(self.upper.magnitude);
        let endpoint = Self {
            lower: I512 { negative: false, magnitude: maximum }.canonical(),
            upper: I512 { negative: false, magnitude: maximum }.canonical(),
            exponent: self.exponent,
        };
        let mut result = endpoint.mul(endpoint)?;
        result.lower = I512::ZERO;
        Some(result)
    }

    pub(crate) fn div(self, other: Self) -> Option<Self> {
        if other.contains_zero() { return None; }
        let corners = [
            (self.lower, other.lower), (self.lower, other.upper),
            (self.upper, other.lower), (self.upper, other.upper),
        ];
        let mut bounds: Vec<(I512, I512, i32)> = Vec::with_capacity(4);
        for (left, right) in corners {
            if right.magnitude.is_zero() { return None; }
            if left.magnitude.is_zero() {
                bounds.push((I512::ZERO, I512::ZERO, 0));
                continue;
            }
            let shift = 511i32 + right.magnitude.bit_len() as i32 - left.magnitude.bit_len() as i32;
            let (numerator, denominator) = if shift >= 0 {
                (Wide::from_u512_shifted(left.magnitude, shift as usize)?, Wide::from_u512(right.magnitude))
            } else {
                (Wide::from_u512(left.magnitude), Wide::from_u512_shifted(right.magnitude, (-shift) as usize)?)
            };
            let (quotient, remainder) = divide(numerator, denominator);
            let negative = left.negative ^ right.negative;
            let q = quotient.shr_to_u512(0, false)?;
            let q_away = if remainder.is_zero() { q } else { q.checked_add_one()? };
            let low = I512 { negative, magnitude: if negative { q_away } else { q } }.canonical();
            let high = I512 { negative, magnitude: if negative { q } else { q_away } }.canonical();
            bounds.push((low, high, self.exponent.checked_sub(other.exponent)?.checked_sub(shift)?));
        }
        let mut target = bounds.iter().map(|item| item.2).min()?;
        for _ in 0..514 {
            let mut lower: Option<I512> = None;
            let mut upper: Option<I512> = None;
            let mut valid = true;
            for (low, high, exponent) in &bounds {
                match (rescale(*low, *exponent, target, Direction::Lower), rescale(*high, *exponent, target, Direction::Upper)) {
                    (Some(l), Some(u)) => {
                        lower = Some(lower.map_or(l, |value| value.min(l)));
                        upper = Some(upper.map_or(u, |value| value.max(u)));
                    }
                    _ => { valid = false; break; }
                }
            }
            if valid { return Some(Self { lower: lower?, upper: upper?, exponent: target }); }
            target = target.checked_add(1)?;
        }
        None
    }

    pub(crate) fn sqrt(self) -> Option<Self> {
        if self.lower.negative { return None; }
        let endpoints = [(self.lower, Direction::Lower), (self.upper, Direction::Upper)];
        let mut rounded: Vec<(I512, i32)> = Vec::with_capacity(2);
        for (endpoint, direction) in endpoints {
            if endpoint.magnitude.is_zero() {
                rounded.push((I512::ZERO, 0));
                continue;
            }
            let even_exponent = if self.exponent & 1 == 0 { self.exponent } else { self.exponent.checked_sub(1)? };
            let base = Wide::from_u512(endpoint.magnitude)
                .checked_shl((self.exponent - even_exponent) as usize)?;
            let scale = 512usize.saturating_sub((base.bit_len() + 1) / 2);
            let scaled = base.checked_shl(2 * scale)?;
            let (floor, exact) = integer_sqrt(scaled);
            let magnitude = match direction {
                Direction::Lower => floor,
                Direction::Upper => if exact { floor } else { floor.checked_add_one()? },
            };
            rounded.push((I512 { negative: false, magnitude }.canonical(), even_exponent / 2 - scale as i32));
        }
        let mut target = rounded.iter().map(|item| item.1).min()?;
        for _ in 0..514 {
            if let (Some(lower), Some(upper)) = (
                rescale(rounded[0].0, rounded[0].1, target, Direction::Lower),
                rescale(rounded[1].0, rounded[1].1, target, Direction::Upper),
            ) {
                return Some(Self { lower, upper, exponent: target });
            }
            target = target.checked_add(1)?;
        }
        None
    }

    pub(crate) fn contains_dyadic(self, value: i64, exponent: i32) -> bool {
        let exact = I512::from_i64(value);
        let target = self.exponent.min(exponent);
        match (
            rescale(self.lower, self.exponent, target, Direction::Lower),
            rescale(self.upper, self.exponent, target, Direction::Upper),
            rescale(exact, exponent, target, Direction::Lower),
        ) {
            (Some(lower), Some(upper), Some(point)) => lower <= point && point <= upper,
            _ => false,
        }
    }

    pub(crate) fn project_midpoint_2m448(self) -> Option<(I512, Self)> {
        let (negative, sum) = if self.lower.negative == self.upper.negative {
            (
                self.lower.negative,
                Wide::from_u512(self.lower.magnitude)
                    .checked_add(Wide::from_u512(self.upper.magnitude))?,
            )
        } else if self.lower.magnitude >= self.upper.magnitude {
            (
                self.lower.negative,
                Wide::from_u512(self.lower.magnitude).sub(Wide::from_u512(self.upper.magnitude)),
            )
        } else {
            (
                self.upper.negative,
                Wide::from_u512(self.upper.magnitude).sub(Wide::from_u512(self.lower.magnitude)),
            )
        };
        let power = self.exponent.checked_add(447)?;
        let magnitude = if power >= 0 {
            sum.checked_shl(power as usize)?.shr_to_u512(0, false)?
        } else {
            let shift = (-power) as usize;
            let quotient = sum.shr_to_u512(shift, false)?;
            let half_bit = shift - 1;
            let half = half_bit < 1024 && sum.bit(half_bit);
            let lower_limit = half_bit.min(1024);
            let lower_nonzero = (0..lower_limit).any(|bit| sum.bit(bit));
            if half && (lower_nonzero || quotient.is_odd()) { quotient.checked_add_one()? } else { quotient }
        };
        let lattice = I512 { negative, magnitude }.canonical();
        let projected = Self { lower: lattice, upper: lattice, exponent: -448 };
        Some((lattice, projected.sub(self)?))
    }
}

fn arithmetic_fixture() -> bool {
    let one_third_enclosure = Ball512::interval(21, 22, -6).unwrap();
    let one_seventh_enclosure = Ball512::interval(9, 10, -6).unwrap();
    let sum = one_third_enclosure.add(one_seventh_enclosure).unwrap();
    let difference = one_third_enclosure.sub(one_seventh_enclosure).unwrap();
    let product = one_third_enclosure.mul(one_seventh_enclosure).unwrap();
    let quotient = one_third_enclosure.div(one_seventh_enclosure).unwrap();
    sum.contains_dyadic(30, -6)
        && difference.contains_dyadic(12, -6)
        && product.contains_dyadic(3, -6)
        && quotient.contains_dyadic(9, -2)
}

fn division_guard_fixture() -> bool {
    Ball512::exact(1, 0).div(Ball512::interval(-1, 1, -20).unwrap()).is_none()
}

fn projection_fixture() -> bool {
    let cases = [
        (5, -449, 2), (7, -449, 4), (-5, -449, -2), (-7, -449, -4),
        (9, -450, 2), (11, -450, 3), (-9, -450, -2), (-11, -450, -3),
    ];
    cases.into_iter().all(|(value, exponent, expected)| {
        let (lattice, _) = Ball512::exact(value, exponent).project_midpoint_2m448().unwrap();
        lattice == I512::from_i64(expected)
    })
}

fn directed_error_fixture() -> bool {
    let input = Ball512::interval(5 * 32 - 1, 5 * 32 + 1, -454).unwrap();
    let (lattice, error) = input.project_midpoint_2m448().unwrap();
    lattice == I512::from_i64(2)
        && error.contains_dyadic(-33, -454)
        && error.contains_dyadic(-31, -454)
}

fn wide_fixture() -> bool {
    let maximal = U512([u64::MAX; LIMBS]);
    let product = multiply(maximal, maximal);
    product.bit_len() == 1024
        && maximal.checked_add_one().is_none()
        && U512::from_u64(1).checked_shl(511).unwrap().bit_len() == 512
}

fn sqrt_fixture() -> bool {
    let exact = Ball512::exact(9, -4).sqrt().unwrap();
    let irrational = Ball512::exact(2, 0).sqrt().unwrap();
    exact.contains_dyadic(3, -2)
        && irrational.exponent == -511
        && irrational.lower.magnitude.checked_add_one() == Some(irrational.upper.magnitude)
        && Ball512::exact(-1, 0).sqrt().is_none()
}

fn wide_midpoint_projection_fixture() -> bool {
    Ball512::exact(2, 0).sqrt()
        .and_then(|value| value.project_midpoint_2m448())
        .is_some()
}

pub fn fixture_count() -> usize { 8 }

fn fixture_results() -> [bool; 8] {
    let checks = [
        LIMBS * 64 == 512,
        arithmetic_fixture(),
        division_guard_fixture(),
        projection_fixture(),
        directed_error_fixture(),
        wide_fixture(),
        sqrt_fixture(),
        wide_midpoint_projection_fixture(),
    ];
    checks
}

pub fn fixtures_passed() -> usize {
    fixture_results().into_iter().filter(|value| *value).count()
}

pub fn fixture_mask() -> String {
    fixture_results().into_iter().map(|value| if value { '1' } else { '0' }).collect()
}

pub fn run_arithmetic_fixture_suite() -> bool {
    fixtures_passed() == fixture_count()
}
