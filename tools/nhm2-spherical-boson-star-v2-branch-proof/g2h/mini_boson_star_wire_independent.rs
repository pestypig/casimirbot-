#![forbid(unsafe_code)]

#[derive(Clone, Debug, Eq, PartialEq)]
struct BigNat {
    words: Vec<u32>,
}

impl BigNat {
    fn zero() -> Self { Self { words: Vec::new() } }

    fn from_decimal(value: &str) -> Option<Self> {
        let digits = value.strip_prefix('-').unwrap_or(value);
        let mut result = Self::zero();
        for byte in digits.bytes() {
            if !byte.is_ascii_digit() { return None; }
            result.mul_small(10);
            result.add_small((byte - b'0') as u32);
        }
        Some(result)
    }

    fn normalize(&mut self) {
        while self.words.last() == Some(&0) { self.words.pop(); }
    }

    fn mul_small(&mut self, factor: u32) {
        let mut carry = 0u64;
        for word in &mut self.words {
            let product = (*word as u64) * (factor as u64) + carry;
            *word = product as u32;
            carry = product >> 32;
        }
        if carry != 0 { self.words.push(carry as u32); }
    }

    fn add_small(&mut self, value: u32) {
        let mut carry = value as u64;
        let mut index = 0usize;
        while carry != 0 {
            if index == self.words.len() { self.words.push(0); }
            let sum = self.words[index] as u64 + carry;
            self.words[index] = sum as u32;
            carry = sum >> 32;
            index += 1;
        }
    }

    fn is_zero(&self) -> bool { self.words.is_empty() }
    fn is_one(&self) -> bool { self.words == [1] }
    fn is_even(&self) -> bool { self.words.first().map_or(true, |word| word & 1 == 0) }

    fn shift_right_one(&mut self) {
        let mut carry = 0u32;
        for word in self.words.iter_mut().rev() {
            let next = *word & 1;
            *word = (*word >> 1) | (carry << 31);
            carry = next;
        }
        self.normalize();
    }

    fn compare(&self, other: &Self) -> std::cmp::Ordering {
        self.words.len().cmp(&other.words.len()).then_with(|| {
            self.words.iter().rev().cmp(other.words.iter().rev())
        })
    }

    fn subtract(&mut self, other: &Self) {
        let mut borrow = 0u64;
        for index in 0..self.words.len() {
            let right = other.words.get(index).copied().unwrap_or(0) as u64 + borrow;
            let left = self.words[index] as u64;
            self.words[index] = left.wrapping_sub(right) as u32;
            borrow = (left < right) as u64;
        }
        self.normalize();
    }
}

fn binary_gcd(mut left: BigNat, mut right: BigNat) -> BigNat {
    if left.is_zero() { return right; }
    if right.is_zero() { return left; }
    let mut common = 0usize;
    while left.is_even() && right.is_even() {
        left.shift_right_one();
        right.shift_right_one();
        common += 1;
    }
    while left.is_even() { left.shift_right_one(); }
    loop {
        while right.is_even() { right.shift_right_one(); }
        if left.compare(&right).is_gt() { std::mem::swap(&mut left, &mut right); }
        right.subtract(&left);
        if right.is_zero() { break; }
    }
    for _ in 0..common { left.mul_small(2); }
    left
}

struct Parser<'a> {
    bytes: &'a [u8],
    position: usize,
}

impl<'a> Parser<'a> {
    fn new(bytes: &'a [u8]) -> Self { Self { bytes, position: 0 } }

    fn parse(mut self) -> bool {
        if self.bytes.starts_with(&[0xef, 0xbb, 0xbf]) { return false; }
        self.space();
        if !self.value() { return false; }
        self.space();
        self.position == self.bytes.len()
    }

    fn value(&mut self) -> bool {
        match self.peek() {
            Some(b'{') => self.object(),
            Some(b'[') => self.array(),
            Some(b'"') => self.string().is_some(),
            Some(b't') => self.literal(b"true"),
            Some(b'f') => self.literal(b"false"),
            Some(b'n') => self.literal(b"null"),
            _ => self.number(),
        }
    }

    fn object(&mut self) -> bool {
        self.position += 1;
        self.space();
        if self.take(b'}') { return true; }
        let mut keys: Vec<Vec<u8>> = Vec::new();
        loop {
            let key = match self.string() { Some(value) => value, None => return false };
            if key.is_empty() || key.iter().any(|byte| !(0x20..=0x7e).contains(byte))
                || keys.iter().any(|known| *known == key) { return false; }
            keys.push(key);
            self.space();
            if !self.take(b':') { return false; }
            self.space();
            if !self.value() { return false; }
            self.space();
            if self.take(b'}') { return true; }
            if !self.take(b',') { return false; }
            self.space();
        }
    }

    fn array(&mut self) -> bool {
        self.position += 1;
        self.space();
        if self.take(b']') { return true; }
        loop {
            if !self.value() { return false; }
            self.space();
            if self.take(b']') { return true; }
            if !self.take(b',') { return false; }
            self.space();
        }
    }

    fn string(&mut self) -> Option<Vec<u8>> {
        if !self.take(b'"') { return None; }
        let mut decoded = Vec::new();
        loop {
            let byte = *self.bytes.get(self.position)?;
            self.position += 1;
            match byte {
                b'"' => return Some(decoded),
                0x00..=0x1f => return None,
                b'\\' => {
                    let escape = *self.bytes.get(self.position)?;
                    self.position += 1;
                    match escape {
                        b'"' | b'\\' | b'/' => decoded.push(escape),
                        b'b' => decoded.push(8), b'f' => decoded.push(12),
                        b'n' => decoded.push(10), b'r' => decoded.push(13),
                        b't' => decoded.push(9),
                        b'u' => {
                            let mut scalar = self.hex_quad()?;
                            if (0xd800..=0xdbff).contains(&scalar) {
                                if self.bytes.get(self.position..self.position + 2)? != b"\\u" { return None; }
                                self.position += 2;
                                let low = self.hex_quad()?;
                                if !(0xdc00..=0xdfff).contains(&low) { return None; }
                                scalar = 0x10000 + ((scalar - 0xd800) << 10) + low - 0xdc00;
                            } else if (0xdc00..=0xdfff).contains(&scalar) { return None; }
                            let character = char::from_u32(scalar)?;
                            let mut buffer = [0u8; 4];
                            decoded.extend_from_slice(character.encode_utf8(&mut buffer).as_bytes());
                        }
                        _ => return None,
                    }
                }
                0x20..=0x7f => decoded.push(byte),
                _ => {
                    self.position -= 1;
                    let start = self.position;
                    let width = match byte {
                        0xc2..=0xdf => 2, 0xe0..=0xef => 3, 0xf0..=0xf4 => 4, _ => return None,
                    };
                    let end = start.checked_add(width)?;
                    let raw = self.bytes.get(start..end)?;
                    let text = std::str::from_utf8(raw).ok()?;
                    if text.chars().count() != 1 { return None; }
                    decoded.extend_from_slice(raw);
                    self.position = end;
                }
            }
        }
    }

    fn hex_quad(&mut self) -> Option<u32> {
        let mut value = 0u32;
        for _ in 0..4 {
            let byte = *self.bytes.get(self.position)?;
            self.position += 1;
            value = (value << 4) | match byte {
                b'0'..=b'9' => (byte - b'0') as u32,
                b'a'..=b'f' => 10 + (byte - b'a') as u32,
                b'A'..=b'F' => 10 + (byte - b'A') as u32,
                _ => return None,
            };
        }
        Some(value)
    }

    fn number(&mut self) -> bool {
        let negative = self.take(b'-');
        let start = self.position;
        match self.peek() {
            Some(b'0') => {
                self.position += 1;
                if self.peek().is_some_and(|byte| byte.is_ascii_digit()) { return false; }
            }
            Some(b'1'..=b'9') => while self.peek().is_some_and(|byte| byte.is_ascii_digit()) {
                self.position += 1;
            },
            _ => return false,
        }
        if self.peek().is_some_and(|byte| matches!(byte, b'.' | b'e' | b'E')) { return false; }
        let digits = &self.bytes[start..self.position];
        let mut value = 0u64;
        for digit in digits {
            value = match value.checked_mul(10).and_then(|v| v.checked_add((digit - b'0') as u64)) {
                Some(next) => next, None => return false,
            };
        }
        let _ = negative;
        value <= 9_007_199_254_740_991
    }

    fn literal(&mut self, expected: &[u8]) -> bool {
        if !self.bytes.get(self.position..).is_some_and(|rest| rest.starts_with(expected)) { return false; }
        self.position += expected.len();
        true
    }

    fn peek(&self) -> Option<u8> { self.bytes.get(self.position).copied() }

    fn take(&mut self, expected: u8) -> bool {
        if self.peek() != Some(expected) { return false; }
        self.position += 1;
        true
    }

    fn space(&mut self) {
        while self.peek().is_some_and(|byte| matches!(byte, b' ' | b'\t' | b'\r' | b'\n')) {
            self.position += 1;
        }
    }
}

fn integer_decimal(value: &str) -> bool {
    if value.is_empty() || value == "-0" { return false; }
    let digits = value.strip_prefix('-').unwrap_or(value);
    !digits.is_empty() && (digits == "0" || !digits.starts_with('0'))
        && digits.bytes().all(|byte| byte.is_ascii_digit())
}

fn positive_decimal(value: &str) -> bool {
    integer_decimal(value) && !value.starts_with('-') && value != "0"
}

fn reduced_rational(numerator: &str, denominator: &str) -> bool {
    if !integer_decimal(numerator) || !positive_decimal(denominator) { return false; }
    let left = match BigNat::from_decimal(numerator) { Some(value) => value, None => return false };
    let right = match BigNat::from_decimal(denominator) { Some(value) => value, None => return false };
    let zero_normal = !left.is_zero() || right.is_one();
    zero_normal && binary_gcd(left, right).is_one()
}

fn normal_dyadic(mantissa: &str, exponent: i64) -> bool {
    if !integer_decimal(mantissa) { return false; }
    if mantissa == "0" { exponent == 0 } else {
        (mantissa.as_bytes().last().copied().unwrap() - b'0') & 1 == 1
    }
}

fn parse_wire(value: &[u8]) -> bool { Parser::new(value).parse() }

pub fn run_wire_scalar_fixture_suite() -> bool {
    let ingress = parse_wire(br#"{"a":1,"b":[true,false,null],"text":"ok"}"#)
        && parse_wire(br#"{"text":"\ud83d\ude80"}"#)
        && parse_wire("{\"text\":\"🚀\"}".as_bytes())
        && !parse_wire(br#"{"a":1,"a":2}"#)
        && !parse_wire(br#"{"a":1,"\u0061":2}"#)
        && !parse_wire(b"\xef\xbb\xbf{}") && !parse_wire(b"\"\xff\"")
        && !parse_wire(br#""\ud800""#) && !parse_wire(br#""\udc00""#)
        && !parse_wire(b"{}{}") && !parse_wire(b"9007199254740992")
        && parse_wire(b"-9007199254740991") && !parse_wire(b"0.5")
        && !parse_wire(b"1e2") && !parse_wire(br#"{"\u00e9":1}"#);
    let scalars = integer_decimal("0") && integer_decimal("-42")
        && !integer_decimal("-0") && !integer_decimal("01")
        && reduced_rational("6", "5") && !reduced_rational("12", "10")
        && reduced_rational("0", "1") && !reduced_rational("0", "2")
        && normal_dyadic("3", -4) && !normal_dyadic("6", -5)
        && normal_dyadic("0", 0) && !normal_dyadic("0", 4)
        && normal_dyadic("-1", 0)
        && reduced_rational("100000000000000000000000000000000000003", "2");
    let canonical = br#"{"authority":{"candidate_admitted":false},"candidate_evaluations":0,"schema":"fixture","sequence":0}"#;
    ingress && scalars && parse_wire(canonical) && !canonical.contains(&b' ')
}
