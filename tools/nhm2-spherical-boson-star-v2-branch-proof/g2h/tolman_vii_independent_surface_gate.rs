#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Rational {
    numerator: i128,
    denominator: i128,
}

impl Rational {
    pub fn new(numerator: i128, denominator: i128) -> Self {
        assert!(denominator != 0);
        let sign = if denominator < 0 { -1 } else { 1 };
        let mut left = numerator.abs();
        let mut right = denominator.abs();
        while right != 0 {
            let remainder = left % right;
            left = right;
            right = remainder;
        }
        let divisor = if left == 0 { 1 } else { left };
        Self {
            numerator: sign * numerator / divisor,
            denominator: denominator.abs() / divisor,
        }
    }

    pub fn add(self, other: Self) -> Self {
        Self::new(
            self.numerator * other.denominator + other.numerator * self.denominator,
            self.denominator * other.denominator,
        )
    }

    pub fn subtract(self, other: Self) -> Self {
        self.add(Self::new(-other.numerator, other.denominator))
    }

    pub fn multiply(self, other: Self) -> Self {
        Self::new(
            self.numerator * other.numerator,
            self.denominator * other.denominator,
        )
    }

    pub fn divide(self, other: Self) -> Self {
        assert!(other.numerator != 0);
        Self::new(
            self.numerator * other.denominator,
            self.denominator * other.numerator,
        )
    }

    pub fn canonical(self) -> String {
        if self.denominator == 1 {
            self.numerator.to_string()
        } else {
            format!("{}/{}", self.numerator, self.denominator)
        }
    }
}

pub struct IndependentSurfaceGateReport {
    pub pass: bool,
    pub typed_result: &'static str,
    pub coefficient: &'static str,
    pub first_disjoint_order: u32,
    pub interior_exact: String,
    pub exterior_exact: String,
}

fn reciprocal_second(value: Rational, first: Rational, second: Rational) -> Rational {
    let two = Rational::new(2, 1);
    let first_term = two
        .multiply(first.multiply(first))
        .divide(value.multiply(value).multiply(value));
    let second_term = second.divide(value.multiply(value));
    first_term.subtract(second_term)
}

pub fn independent_surface_regularity_gate() -> IndependentSurfaceGateReport {
    let value = Rational::new(3, 5);
    let first = Rational::new(2, 5);
    let interior_second_source = Rational::new(26, 5);
    let exterior_second_source = Rational::new(-4, 5);

    let value_interior = Rational::new(1, 1).divide(value);
    let value_exterior = Rational::new(1, 1).divide(value);
    let first_interior = Rational::new(-1, 1)
        .multiply(first)
        .divide(value.multiply(value));
    let first_exterior = Rational::new(-1, 1)
        .multiply(first)
        .divide(value.multiply(value));
    let second_interior = reciprocal_second(value, first, interior_second_source);
    let second_exterior = reciprocal_second(value, first, exterior_second_source);

    let lower_jets_match =
        value_interior == value_exterior && first_interior == first_exterior;
    let second_jets_disjoint = second_interior != second_exterior;
    let pass = lower_jets_match && !second_jets_disjoint;

    IndependentSurfaceGateReport {
        pass,
        typed_result: if pass {
            "GLOBAL_STATIC_STATE_SURFACE_GERMS_IDENTICAL"
        } else {
            "GLOBAL_STATIC_STATE_FAIL"
        },
        coefficient: "B",
        first_disjoint_order: if second_jets_disjoint { 2 } else { 0 },
        interior_exact: second_interior.canonical(),
        exterior_exact: second_exterior.canonical(),
    }
}
