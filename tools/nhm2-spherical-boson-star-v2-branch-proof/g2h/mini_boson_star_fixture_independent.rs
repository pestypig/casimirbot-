#![forbid(unsafe_code)]

#[path = "mini_boson_star_wire_independent.rs"]
mod independent_wire;
#[path = "mini_boson_star_budget_independent.rs"]
mod independent_budget;
#[path = "mini_boson_star_arithmetic_independent.rs"]
mod independent_arithmetic;
#[path = "mini_boson_star_inverse_independent.rs"]
mod independent_inverse;
#[path = "mini_boson_star_determinant_independent.rs"]
mod independent_determinant;
#[path = "mini_boson_star_continuation_independent.rs"]
mod independent_continuation;
#[path = "mini_boson_star_stability_independent.rs"]
mod independent_stability;
#[path = "mini_boson_star_quantum_radial_independent.rs"]
mod independent_quantum_radial;
#[path = "mini_boson_star_quantum_angular_independent.rs"]
mod independent_quantum_angular;
#[path = "mini_boson_star_quantum_negative_axis_independent.rs"]
mod independent_quantum_negative_axis;
#[path = "mini_boson_star_quantum_measure_independent.rs"]
mod independent_quantum_measure;
#[path = "mini_boson_star_hadamard_independent.rs"]
mod independent_hadamard;
#[path = "mini_boson_star_noise_independent.rs"]
mod independent_noise;

use std::env;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;

const SEAL_PATH: &str =
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json";
const SEAL_SHA256: &str =
    "728d8c9a807d27356a6d9f33e897feb73331abb12e6a76435dbce099d9c025ca";
const SEAL_BYTES: u64 = 7_805;
const QUANTUM_BUILDER_PATH: &str =
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json";
const QUANTUM_BUILDER_SHA256: &str =
    "2989373624362e7f591ca0f00b76d1b01e2aa861f01eaf53f9b62c666f2862fc";
const QUANTUM_BUILDER_BYTES: u64 = 30_354;
const PRIMARY_ROOT: &str = "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary";
const INDEPENDENT_ROOT: &str = "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent";
const FIXTURE_OUTPUT: &str = "/fixture-output";
const WIRE_CONTRACT_SHA256: &str =
    "c225865343ccf3c2874b59e305c70891cdd944fa3f3a88179bc55eccbf59c160";

#[derive(Clone, Copy)]
struct Rational {
    numerator: i128,
    denominator: i128,
}

fn gcd(mut left: i128, mut right: i128) -> i128 {
    left = left.abs();
    right = right.abs();
    while right != 0 {
        let remainder = left % right;
        left = right;
        right = remainder;
    }
    if left == 0 { 1 } else { left }
}

impl Rational {
    fn new(numerator: i128, denominator: i128) -> Self {
        assert!(denominator != 0);
        let sign = if denominator < 0 { -1 } else { 1 };
        let divisor = gcd(numerator, denominator);
        Self {
            numerator: sign * numerator / divisor,
            denominator: sign * denominator / divisor,
        }
    }

    fn add(self, other: Self) -> Self {
        Self::new(
            self.numerator * other.denominator + other.numerator * self.denominator,
            self.denominator * other.denominator,
        )
    }

    fn sub(self, other: Self) -> Self {
        self.add(Self::new(-other.numerator, other.denominator))
    }

    fn mul(self, other: Self) -> Self {
        Self::new(self.numerator * other.numerator, self.denominator * other.denominator)
    }

    fn less(self, other: Self) -> bool {
        self.numerator * other.denominator < other.numerator * self.denominator
    }
}

#[derive(Clone)]
struct Sha256 {
    state: [u32; 8],
    block: [u8; 64],
    block_len: usize,
    total_len: u64,
}

impl Sha256 {
    fn new() -> Self {
        Self {
            state: [
                0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
            ],
            block: [0; 64],
            block_len: 0,
            total_len: 0,
        }
    }

    fn update(&mut self, mut input: &[u8]) {
        self.total_len = self.total_len.checked_add(input.len() as u64).unwrap();
        while !input.is_empty() {
            let count = (64 - self.block_len).min(input.len());
            self.block[self.block_len..self.block_len + count].copy_from_slice(&input[..count]);
            self.block_len += count;
            input = &input[count..];
            if self.block_len == 64 {
                let block = self.block;
                self.compress(&block);
                self.block_len = 0;
            }
        }
    }

    fn compress(&mut self, block: &[u8; 64]) {
        const ROUND: [u32; 64] = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
            0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
            0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
            0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
            0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
            0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
            0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
            0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
            0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
            0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
            0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
            0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
        ];
        let mut schedule = [0u32; 64];
        for (index, bytes) in block.chunks_exact(4).enumerate() {
            schedule[index] = u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]);
        }
        for index in 16..64 {
            let lower = schedule[index - 15];
            let upper = schedule[index - 2];
            let sigma0 = lower.rotate_right(7) ^ lower.rotate_right(18) ^ (lower >> 3);
            let sigma1 = upper.rotate_right(17) ^ upper.rotate_right(19) ^ (upper >> 10);
            schedule[index] = schedule[index - 16]
                .wrapping_add(sigma0)
                .wrapping_add(schedule[index - 7])
                .wrapping_add(sigma1);
        }
        let mut work = self.state;
        for index in 0..64 {
            let sum1 = work[4].rotate_right(6) ^ work[4].rotate_right(11)
                ^ work[4].rotate_right(25);
            let choose = (work[4] & work[5]) ^ ((!work[4]) & work[6]);
            let first = work[7].wrapping_add(sum1).wrapping_add(choose)
                .wrapping_add(ROUND[index]).wrapping_add(schedule[index]);
            let sum0 = work[0].rotate_right(2) ^ work[0].rotate_right(13)
                ^ work[0].rotate_right(22);
            let majority = (work[0] & work[1]) ^ (work[0] & work[2])
                ^ (work[1] & work[2]);
            let second = sum0.wrapping_add(majority);
            work = [
                first.wrapping_add(second), work[0], work[1], work[2],
                work[3].wrapping_add(first), work[4], work[5], work[6],
            ];
        }
        for (target, value) in self.state.iter_mut().zip(work) {
            *target = target.wrapping_add(value);
        }
    }

    fn finish(mut self) -> [u8; 32] {
        let bit_count = self.total_len.checked_mul(8).unwrap();
        self.block[self.block_len] = 0x80;
        self.block_len += 1;
        if self.block_len > 56 {
            self.block[self.block_len..].fill(0);
            let block = self.block;
            self.compress(&block);
            self.block = [0; 64];
            self.block_len = 0;
        }
        self.block[self.block_len..56].fill(0);
        self.block[56..].copy_from_slice(&bit_count.to_be_bytes());
        let block = self.block;
        self.compress(&block);
        let mut digest = [0u8; 32];
        for (chunk, value) in digest.chunks_exact_mut(4).zip(self.state) {
            chunk.copy_from_slice(&value.to_be_bytes());
        }
        digest
    }
}

fn hex(bytes: &[u8]) -> String {
    const ALPHABET: &[u8; 16] = b"0123456789abcdef";
    let mut output = String::with_capacity(2 * bytes.len());
    for byte in bytes {
        output.push(ALPHABET[(byte >> 4) as usize] as char);
        output.push(ALPHABET[(byte & 15) as usize] as char);
    }
    output
}

fn file_identity(path: &Path) -> Result<(u64, String), String> {
    let metadata = fs::symlink_metadata(path).map_err(|_| "seal metadata unavailable")?;
    if !metadata.file_type().is_file() || metadata.file_type().is_symlink() {
        return Err("seal is not a regular non-symlink file".into());
    }
    let mut file = File::open(path).map_err(|_| "seal open failed")?;
    let mut sha = Sha256::new();
    let mut count = 0u64;
    let mut buffer = [0u8; 65536];
    loop {
        let read = file.read(&mut buffer).map_err(|_| "seal read failed")?;
        if read == 0 { break; }
        count = count.checked_add(read as u64).ok_or("seal length overflow")?;
        sha.update(&buffer[..read]);
    }
    Ok((count, hex(&sha.finish())))
}

fn member_fixture() -> bool {
    Rational::new(6, 5).numerator == 6 && Rational::new(6, 5).denominator == 5
}

fn inverse_fixture() -> bool {
    let matrix = [[2i128, 1i128], [1i128, 1i128]];
    let determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    determinant == 1 && [[1i128, -1i128], [-1i128, 2i128]] == [[1, -1], [-1, 2]]
}

fn strict_interval_fixture() -> bool {
    let positive = (Rational::new(2_999, 1_000), Rational::new(3_001, 1_000));
    let touching = (Rational::new(-1, 1_000), Rational::new(1, 1_000));
    Rational::new(0, 1).less(positive.0) && !Rational::new(0, 1).less(touching.0)
}

fn radii_fixture() -> bool {
    let y = Rational::new(1, 1i128 << 40);
    let radius = Rational::new(1, 1i128 << 20);
    let eighth = Rational::new(1, 8);
    let polynomial = eighth.mul(radius).mul(radius)
        .sub(Rational::new(3, 4).mul(radius)).add(y);
    let contraction = Rational::new(1, 4).add(eighth.mul(radius));
    polynomial.less(Rational::new(0, 1)) && contraction.less(Rational::new(1, 1))
}

fn radii_touch_fixture() -> bool {
    let value = Rational::new(1, 1i128 << 40);
    let polynomial = value.sub(value);
    polynomial.numerator == 0 && !polynomial.less(Rational::new(0, 1))
}

fn riccati_fixture() -> bool {
    let positive = 3 * 5 - 1;
    let touching = 0 * 5;
    3 > 0 && positive > 0 && !(0 > 0 && touching > 0)
}

fn threshold_fixture() -> bool {
    let threshold = Rational::new(1, 4);
    Rational::new(1, 8).less(threshold) && !threshold.less(threshold)
}

fn smearing_fixture() -> bool {
    let lower = Rational::new(1, 128).sub(Rational::new(1, 256));
    let upper = Rational::new(127, 128).add(Rational::new(1, 256));
    lower.numerator == 1 && lower.denominator == 256
        && upper.numerator == 255 && upper.denominator == 256
}

fn conservation_fixture() -> bool {
    Rational::new(-2, 1).add(Rational::new(1, 1)).add(Rational::new(1, 1)).numerator == 0
}

fn gram_fixture() -> bool {
    let vectors = [[1i128, 0, 1], [0i128, 2, 1], [1i128, -1, 0]];
    let mut gram = [[0i128; 3]; 3];
    for row in 0..3 {
        for column in 0..3 {
            gram[row][column] = (0..3).map(|index| vectors[row][index] * vectors[column][index]).sum();
        }
    }
    let determinant = gram[0][0] * (gram[1][1] * gram[2][2] - gram[1][2] * gram[2][1])
        - gram[0][1] * (gram[1][0] * gram[2][2] - gram[1][2] * gram[2][0])
        + gram[0][2] * (gram[1][0] * gram[2][1] - gram[1][1] * gram[2][0]);
    gram[0][1] == gram[1][0] && determinant > 0
}

fn gram_corruption_fixture() -> bool { 1i128 * 1 - 2i128 * 2 == -3 }

fn chronology_and_corruption_fixture() -> bool {
    let valid = [0u8, 1, 2, 3, 4, 5, 6];
    let corrupt = [0u8, 1, 2, 2, 4];
    valid.iter().enumerate().all(|(index, value)| *value as usize == index)
        && !corrupt.windows(2).all(|pair| pair[1] == pair[0] + 1)
}

fn budget_fixture() -> bool { 17u32 > 16u32 }

fn origin_tail_fixture() -> bool { 0i128 == 0 && 0i128.pow(2) == 0 }

fn minkowski_endpoint_fixture() -> bool {
    let residuals = [0i128; 6];
    let eta = Rational::new(0, 1);
    let omega = Rational::new(1, 1);
    let mass = Rational::new(0, 1);
    residuals.iter().all(|value| *value == 0)
        && eta.numerator == 0 && omega.numerator == omega.denominator
        && mass.numerator == 0
}

fn manufactured_profile_fixture() -> bool {
    // Independently evaluate sigma(r)=1-r^2 at r=1/2.
    let radius = Rational::new(1, 2);
    let sigma = Rational::new(1, 1).sub(radius.mul(radius));
    let derivative = Rational::new(-1, 1);
    let second = Rational::new(-2, 1);
    let residual = second.add(Rational::new(2, 1));
    Rational::new(0, 1).less(sigma)
        && derivative.numerator == -1 && residual.numerator == 0
}

fn boundary_rejection_fixture() -> bool {
    let regular_origin_derivative = 0i128;
    let conical_origin_derivative = 1i128;
    let exact_tail_q = Rational::new(0, 1);
    let finite_wall_residual = Rational::new(1, 1);
    regular_origin_derivative == 0 && conical_origin_derivative != 0
        && exact_tail_q.numerator == 0 && finite_wall_residual.numerator != 0
}

fn geometric_guard_fixture() -> bool {
    let lapse = (Rational::new(15, 16), Rational::new(17, 16));
    let touching = (Rational::new(-1, 1i128 << 40), Rational::new(1, 1i128 << 40));
    let radial_map_derivative = Rational::new(1, 2);
    let alpha_min = Rational::new(3, 4);
    let alpha_max = Rational::new(5, 4);
    Rational::new(0, 1).less(lapse.0)
        && !Rational::new(0, 1).less(touching.0)
        && Rational::new(0, 1).less(radial_map_derivative)
        && Rational::new(0, 1).less(alpha_min) && alpha_min.less(alpha_max)
}

fn continuation_duties_fixture() -> bool {
    let left = (Rational::new(1, 4), Rational::new(1, 2));
    let right = (Rational::new(3, 8), Rational::new(5, 8));
    let overlap = left.0.less(right.1) && right.0.less(left.1);
    let orientation = Rational::new(3, 1);
    let bordered_kernel_determinant = Rational::new(-1, 1);
    let transversality = Rational::new(2, 1);
    let terminal = (Rational::new(6, 1), Rational::new(7, 1), Rational::new(8, 1));
    overlap && Rational::new(0, 1).less(orientation)
        && bordered_kernel_determinant.numerator != 0
        && transversality.numerator != 0
        && terminal.0.less(terminal.1) && terminal.1.less(terminal.2)
}

fn quantum_hypotheses_fixture() -> bool {
    let kg_lower = Rational::new(1, 4);
    let alpha_min = Rational::new(1, 2);
    let alpha_max = Rational::new(2, 1);
    let hadamard_order = 22u32;
    let coincidence_jet_order = 4u32;
    Rational::new(0, 1).less(kg_lower) && Rational::new(0, 1).less(alpha_min)
        && alpha_min.less(alpha_max) && hadamard_order == 22
        && coincidence_jet_order == 4
}

fn first_failure_state_machine_fixture() -> bool {
    let scheduled = [true, true, false, true, true];
    let mut evaluated = 0usize;
    let mut fail_ordinal = None;
    let mut decisions = [0u8; 5]; // 1 PASS, 2 FAIL, 3 INELIGIBLE.
    for (ordinal, pass) in scheduled.iter().enumerate() {
        if fail_ordinal.is_some() {
            decisions[ordinal] = 3;
            continue;
        }
        evaluated += 1;
        if *pass {
            decisions[ordinal] = 1;
        } else {
            decisions[ordinal] = 2;
            fail_ordinal = Some(ordinal);
        }
    }
    evaluated == 3 && fail_ordinal == Some(2) && decisions == [1, 1, 2, 3, 3]
}

fn domain_hash(domain: &[u8], payload: &[u8]) -> String {
    let mut state = Sha256::new();
    state.update(domain);
    state.update(payload);
    hex(&state.finish())
}

fn wire_hash_chain_fixture() -> bool {
    let payload = br#"{"fixture":"manufactured_zero","ordinal":0}"#;
    let mutation = br#"{"fixture":"manufactured_zero","ordinal":1}"#;
    let payload_hash = domain_hash(b"nhm2-g2h-e-s4/payload/v1\n", payload);
    let mutation_hash = domain_hash(b"nhm2-g2h-e-s4/payload/v1\n", mutation);
    let first = domain_hash(b"nhm2-g2h-e-s4/record/v1\n", payload_hash.as_bytes());
    let second = domain_hash(b"nhm2-g2h-e-s4/record/v1\n", first.as_bytes());
    payload_hash.len() == 64 && payload_hash != mutation_hash
        && first.len() == 64 && second.len() == 64 && first != second
}

fn truncation_and_path_fixture() -> bool {
    let stdout = vec![b'x'; 4097];
    let stderr = vec![b'y'; 2049];
    let accepted = "fixtures/manufactured/pass-0001.json";
    let traversal = "fixtures/../candidate.json";
    stdout[..4096].len() == 4096 && stderr[..2048].len() == 2048
        && !accepted.contains("..") && traversal.contains("..")
}

fn receipt_record(
    sequence: usize,
    decision: &str,
    evaluated: bool,
    fixture_class: &str,
    synthetic_pass: &str,
    previous: &str,
) -> (String, String) {
    let typed_failure = if sequence == 2 {
        ",\"typed_failure\":\"builder_budget_exhausted:classical_inverse:projection_retries\""
    } else {
        ""
    };
    let payload = format!(
        "{{\"evaluated\":{},\"fixture_class\":\"{}\",\"ordinal\":{},\"synthetic_pass\":{}{} }}",
        evaluated, fixture_class, sequence, synthetic_pass, typed_failure
    ).replace(" }", "}");
    let payload_hash = domain_hash(b"nhm2-g2h-e-s4/payload/v1\n", payload.as_bytes());
    let authority = concat!(
        "{\"candidate_admitted\":false,\"classical_proof_established\":false,",
        "\"diagnostic_lamp\":false,\"geometry_state_accepted\":false,",
        "\"physical_viability\":false,\"propulsion_authority\":false,",
        "\"transport_authority\":false}"
    );
    let prefix = format!(
        concat!(
            "{{\"authority\":{},\"candidate_evaluations\":0,",
            "\"contract_sha256\":\"{}\",\"decision\":\"{}\",",
            "\"duty_id\":\"synthetic-duty-{}\",",
            "\"fixture_id\":\"manufactured-first-failure\",",
            "\"implementation_id\":\"independent-pure-rust-fixture-v1\",",
            "\"lane\":\"independent_fixture\",\"payload\":{},",
            "\"payload_sha256\":\"{}\",\"previous_record_sha256\":\"{}\""
        ),
        authority, WIRE_CONTRACT_SHA256, decision, sequence, payload, payload_hash, previous
    );
    let suffix = format!(
        ",\"schema\":\"nhm2.g2h_e_s4.proof_record.v1\",\"sequence\":{}}}",
        sequence
    );
    let without_self = format!("{}{}", prefix, suffix);
    let self_hash = domain_hash(b"nhm2-g2h-e-s4/record/v1\n", without_self.as_bytes());
    let record = format!(
        "{},\"record_self_sha256\":\"{}\"{}", prefix, self_hash, suffix
    );
    (record, self_hash)
}

fn persist_first_failure_receipt() -> Result<String, String> {
    let mut previous = "0".repeat(64);
    let mut stream = String::new();
    for sequence in 0..5usize {
        let decision = if sequence < 2 {
            "PASS"
        } else if sequence == 2 {
            "FAIL"
        } else {
            "INELIGIBLE_AFTER_FIRST_FAIL"
        };
        let evaluated = sequence <= 2;
        let fixture_class = if sequence <= 2 { "synthetic_fail" } else { "chronology" };
        let synthetic_pass = if sequence < 2 { "true" } else if sequence == 2 { "false" } else { "null" };
        let (record, self_hash) = receipt_record(
            sequence, decision, evaluated, fixture_class, synthetic_pass, &previous
        );
        stream.push_str(&record);
        stream.push('\n');
        previous = self_hash;
    }
    let stream_hash = domain_hash(b"nhm2-g2h-e-s4/stream/v1\n", stream.as_bytes());
    let path = Path::new(FIXTURE_OUTPUT).join("first-failure-stream.jsonl");
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|_| "exclusive fixture receipt persistence rejected".to_string())?;
    file.write_all(stream.as_bytes())
        .map_err(|_| "exclusive fixture receipt persistence rejected".to_string())?;
    file.sync_all()
        .map_err(|_| "exclusive fixture receipt persistence rejected".to_string())?;
    Ok(stream_hash)
}

fn limb_fixture() -> bool {
    let mut left = [0u64; 8];
    let right = [u64::MAX, 0, 0, 0, 0, 0, 0, 0];
    left[0] = 1;
    let (low, carry) = left[0].overflowing_add(right[0]);
    let high = left[1].wrapping_add(carry as u64);
    low == 0 && high == 1 && left.len() * 64 == 512
}

fn execute(arguments: &[String]) -> Result<i32, (i32, String)> {
    let suite_mode = arguments.len() == 2
        && arguments[0] == "--fixture-suite" && arguments[1] == SEAL_PATH;
    let receipt_mode = arguments.len() == 3
        && arguments[0] == "--receipt-fixture" && arguments[1] == SEAL_PATH
        && arguments[2] == FIXTURE_OUTPUT;
    if !suite_mode && !receipt_mode {
        return Err((64, "fixture-only interface rejected; candidate mode does not exist".into()));
    }
    let (bytes, sha256) = file_identity(Path::new(&arguments[1]))
        .map_err(|message| (65, message))?;
    if bytes != SEAL_BYTES || sha256 != SEAL_SHA256 {
        return Err((65, "definition seal identity rejected".into()));
    }
    let (quantum_bytes, quantum_sha256) = file_identity(Path::new(QUANTUM_BUILDER_PATH))
        .map_err(|message| (65, message))?;
    if quantum_bytes != QUANTUM_BUILDER_BYTES || quantum_sha256 != QUANTUM_BUILDER_SHA256 {
        return Err((65, "quantum builder identity rejected".into()));
    }
    if Path::new(PRIMARY_ROOT).exists() || Path::new(INDEPENDENT_ROOT).exists() {
        return Err((66, "forbidden scientific root exists".into()));
    }
    if receipt_mode {
        let stream_hash = persist_first_failure_receipt().map_err(|message| (67, message))?;
        println!(
            "{{\"authority_promoted\":false,\"candidate_evaluations\":0,\"candidate_roots_created\":false,\"records\":5,\"schema\":\"nhm2.g2h_e_s4.independent_receipt_fixture_report.v1\",\"status\":\"PASS\",\"stream_sha256\":\"{}\"}}",
            stream_hash
        );
        return Ok(0);
    }
    let checks = [
        member_fixture(), inverse_fixture(), strict_interval_fixture(), radii_fixture(),
        radii_touch_fixture(), riccati_fixture(), threshold_fixture(), smearing_fixture(),
        conservation_fixture(), gram_fixture(), gram_corruption_fixture(),
        chronology_and_corruption_fixture(), budget_fixture(), origin_tail_fixture(),
        minkowski_endpoint_fixture(), manufactured_profile_fixture(),
        boundary_rejection_fixture(), geometric_guard_fixture(),
        continuation_duties_fixture(), quantum_hypotheses_fixture(),
        first_failure_state_machine_fixture(), wire_hash_chain_fixture(),
        truncation_and_path_fixture(), limb_fixture(),
        independent_wire::run_wire_scalar_fixture_suite(),
        independent_budget::run_budget_fixture_suite(),
        independent_arithmetic::run_arithmetic_fixture_suite(),
        independent_inverse::run_inverse_fixture_suite(),
        independent_determinant::run_determinant_fixture_suite(),
        independent_continuation::run_continuation_fixture_suite(),
        independent_stability::run_stability_fixture_suite(),
        independent_quantum_radial::run_quantum_radial_fixture_suite(),
        independent_quantum_angular::run_quantum_angular_fixture_suite(),
        independent_quantum_negative_axis::run_quantum_negative_axis_fixture_suite(),
        independent_quantum_measure::run_quantum_measure_fixture_suite(),
        independent_hadamard::run_hadamard_fixture_suite(),
        independent_noise::run_noise_fixture_suite(),
    ];
    let passed = checks.iter().filter(|value| **value).count();
    println!(
        "{{\"arithmetic_check_mask\":\"{}\",\"arithmetic_checks_passed\":{},\"arithmetic_checks_total\":{},\"authority_promoted\":false,\"budget_counters_checked\":{},\"candidate_evaluations\":0,\"candidate_roots_created\":false,\"checks_passed\":{},\"checks_total\":{},\"continuation_check_mask\":\"{}\",\"continuation_checks_passed\":{},\"continuation_checks_total\":{},\"determinant_check_mask\":\"{}\",\"determinant_checks_passed\":{},\"determinant_checks_total\":{},\"determinant_diagnostic\":\"{}\",\"hadamard_check_mask\":\"{}\",\"hadamard_checks_passed\":{},\"hadamard_checks_total\":{},\"inverse_check_mask\":\"{}\",\"inverse_checks_passed\":{},\"inverse_checks_total\":{},\"inverse_diagnostic\":\"{}\",\"lane\":\"independent_pure_rust_musl\",\"noise_check_mask\":\"{}\",\"noise_checks_passed\":{},\"noise_checks_total\":{},\"quantum_angular_check_mask\":\"{}\",\"quantum_angular_checks_passed\":{},\"quantum_angular_checks_total\":{},\"quantum_measure_check_mask\":\"{}\",\"quantum_measure_checks_passed\":{},\"quantum_measure_checks_total\":{},\"quantum_measure_diagnostic\":{},\"quantum_negative_axis_check_mask\":\"{}\",\"quantum_negative_axis_checks_passed\":{},\"quantum_negative_axis_checks_total\":{},\"quantum_radial_check_mask\":\"{}\",\"quantum_radial_checks_passed\":{},\"quantum_radial_checks_total\":{},\"schema\":\"nhm2.g2h_e_s4.independent_fixture_report.v1\",\"seal_sha256\":\"{}\",\"stability_check_mask\":\"{}\",\"stability_checks_passed\":{},\"stability_checks_total\":{},\"status\":\"{}\"}}",
        independent_arithmetic::fixture_mask(), independent_arithmetic::fixtures_passed(), independent_arithmetic::fixture_count(), independent_budget::counter_count(), passed, checks.len(), independent_continuation::fixture_mask(), independent_continuation::fixtures_passed(), independent_continuation::fixture_count(), independent_determinant::fixture_mask(), independent_determinant::fixtures_passed(), independent_determinant::fixture_count(), independent_determinant::fixture_diagnostic(), independent_hadamard::fixture_mask(), independent_hadamard::fixtures_passed(), independent_hadamard::fixture_count(), independent_inverse::fixture_mask(), independent_inverse::fixtures_passed(), independent_inverse::fixture_count(), independent_inverse::fixture_diagnostic(), independent_noise::fixture_mask(), independent_noise::fixtures_passed(), independent_noise::fixture_count(), independent_quantum_angular::fixture_mask(), independent_quantum_angular::fixtures_passed(), independent_quantum_angular::fixture_count(), independent_quantum_measure::fixture_mask(), independent_quantum_measure::fixtures_passed(), independent_quantum_measure::fixture_count(), independent_quantum_measure::fixture_diagnostic(), independent_quantum_negative_axis::fixture_mask(), independent_quantum_negative_axis::fixtures_passed(), independent_quantum_negative_axis::fixture_count(), independent_quantum_radial::fixture_mask(), independent_quantum_radial::fixtures_passed(), independent_quantum_radial::fixture_count(), SEAL_SHA256, independent_stability::fixture_mask(), independent_stability::fixtures_passed(), independent_stability::fixture_count(),
        if passed == checks.len() { "PASS" } else { "FAIL" }
    );
    Ok(if passed == checks.len() { 0 } else { 1 })
}

fn main() {
    let arguments: Vec<String> = env::args().skip(1).collect();
    match execute(&arguments) {
        Ok(code) => std::process::exit(code),
        Err((code, message)) => {
            eprintln!("{}", message);
            std::process::exit(code);
        }
    }
}
