#![forbid(unsafe_code)]

use std::collections::BTreeMap;
use std::env;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};

#[path = "tolman_vii_independent_surface_gate.rs"]
mod surface_gate;

const CONTRACT_SHA256: &str =
    "30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d";
const CONTRACT_BYTES: u64 = 15_569;
const TOKEN_SHA256: &str =
    "33524fdff6e69b40ae75cdff3b3ee1d049a718d70996e08a9397ff18b3e2960a";
const PRIMARY_ROOT: &str = "artifacts/research/nhm2/g2h/tolman-vii-primary-v1";
const INDEPENDENT_ROOT: &str = "artifacts/research/nhm2/g2h/tolman-vii-independent-v1";
const PRIMARY_MANIFEST: &str =
    "artifacts/research/nhm2/g2h/tolman-vii-primary-v1/proof-manifest.json";
const ZERO_HASH: &str =
    "0000000000000000000000000000000000000000000000000000000000000000";

struct FrozenInput {
    file_name: &'static str,
    byte_count: u64,
    sha256: &'static str,
}

const FROZEN_INPUTS: [FrozenInput; 7] = [
    FrozenInput {
        file_name: "tolman_vii_exact.pdf",
        byte_count: 684_526,
        sha256: "a36fe51c5e54b306260f7950a831c527cced0892e24fbc8bd54dce39093f3438",
    },
    FrozenInput {
        file_name: "tolman_vii_independent.pdf",
        byte_count: 119_321,
        sha256: "81389455a1d94d1b46bc5f16e242f8f1f873a2aa551c41fc4aa34bc7f9aa51ac",
    },
    FrozenInput {
        file_name: "static_hadamard.pdf",
        byte_count: 621_871,
        sha256: "d65a9f9f82212aeabc1ae99e41315ebea2595d4c2676deeac89e9c188294aea6",
    },
    FrozenInput {
        file_name: "hadamard_rset.pdf",
        byte_count: 448_374,
        sha256: "676f41aac1dcff7f622ac147936e58e5e2ff60939a9688043d1657b92db29977",
    },
    FrozenInput {
        file_name: "noise_kernel.pdf",
        byte_count: 283_952,
        sha256: "38f2698b3f1dbefb3eda28d8aa24520818a021fb3f648376c56247c62bf2e820",
    },
    FrozenInput {
        file_name: "renormalized_fluctuations.pdf",
        byte_count: 452_153,
        sha256: "8642014b6bc46c5965fed0a7de217fd9ad0ffc3786418e684d3b05bba495df3e",
    },
    FrozenInput {
        file_name: "radial_stability.pdf",
        byte_count: 968_364,
        sha256: "be355176953fa63691948105a7e2e4f0ef3ed63d13adb34265b02c6c76cd509a",
    },
];

const DUTIES: [(&str, &str); 18] = [
    ("G2G-C01", "bounded byte ingress and independent exact member decoding"),
    ("G2G-C02", "normalized i128 rational dual-route mass polynomial proof"),
    ("G2G-C03", "independent dyadic jet isotropy residual and endpoint proof"),
    ("G2G-C04", "Bernstein rational Einstein and TOV residual proof"),
    ("G2G-C05", "even dyadic origin series with explicit integer remainder"),
    ("G2G-C06", "fixed 256-cell dyadic sign and monotonicity proof"),
    ("G2G-C07", "normalized rational polynomial minimum proof"),
    ("G2G-C08", "Bernstein sound-speed quotient and endpoint-limit proof"),
    ("G2G-C09", "Bernstein energy-condition enclosure proof"),
    ("G2G-C10", "Bernstein adiabatic-index lower-bound proof"),
    ("G2G-C11", "dyadic Sturm bracketing and Rayleigh remainder proof"),
    ("G2G-C12", "independent exact junction forms and q-series infinity proof"),
    ("G2G-Q01", "analytic-germ static global-hyperbolicity assumption proof"),
    ("G2G-Q02", "pure-Rust quadratic-form Friedrichs lower-bound proof"),
    ("G2G-Q03", "static spectral ground-state theorem-assumption proof"),
    ("G2G-Q04", "state scale and ambiguity tuple identity proof"),
    ("G2G-Q05", "distributional conservation symmetry and smeared positivity proof"),
    ("G2G-Q06", "immutable primary-independent agreement record proof"),
];

struct Sha256 {
    chaining: [u32; 8],
    pending: [u8; 64],
    pending_len: usize,
    total_len: u64,
}

impl Sha256 {
    fn new() -> Self {
        Self {
            chaining: [
                0x6a09e667,
                0xbb67ae85,
                0x3c6ef372,
                0xa54ff53a,
                0x510e527f,
                0x9b05688c,
                0x1f83d9ab,
                0x5be0cd19,
            ],
            pending: [0; 64],
            pending_len: 0,
            total_len: 0,
        }
    }

    fn absorb(&mut self, mut bytes: &[u8]) {
        self.total_len = self.total_len.checked_add(bytes.len() as u64).unwrap();
        while !bytes.is_empty() {
            let count = (64 - self.pending_len).min(bytes.len());
            self.pending[self.pending_len..self.pending_len + count]
                .copy_from_slice(&bytes[..count]);
            self.pending_len += count;
            bytes = &bytes[count..];
            if self.pending_len == 64 {
                let block = self.pending;
                self.compress(&block);
                self.pending_len = 0;
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
        for (index, word) in block.chunks_exact(4).enumerate() {
            schedule[index] = u32::from_be_bytes([word[0], word[1], word[2], word[3]]);
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
        let mut work = self.chaining;
        for index in 0..64 {
            let sum1 = work[4].rotate_right(6)
                ^ work[4].rotate_right(11)
                ^ work[4].rotate_right(25);
            let choice = (work[4] & work[5]) ^ ((!work[4]) & work[6]);
            let first = work[7]
                .wrapping_add(sum1)
                .wrapping_add(choice)
                .wrapping_add(ROUND[index])
                .wrapping_add(schedule[index]);
            let sum0 = work[0].rotate_right(2)
                ^ work[0].rotate_right(13)
                ^ work[0].rotate_right(22);
            let majority =
                (work[0] & work[1]) ^ (work[0] & work[2]) ^ (work[1] & work[2]);
            let second = sum0.wrapping_add(majority);
            work = [
                first.wrapping_add(second),
                work[0],
                work[1],
                work[2],
                work[3].wrapping_add(first),
                work[4],
                work[5],
                work[6],
            ];
        }
        for (target, value) in self.chaining.iter_mut().zip(work) {
            *target = target.wrapping_add(value);
        }
    }

    fn finish(mut self) -> [u8; 32] {
        let bits = self.total_len.checked_mul(8).unwrap();
        self.pending[self.pending_len] = 0x80;
        self.pending_len += 1;
        if self.pending_len > 56 {
            self.pending[self.pending_len..].fill(0);
            let block = self.pending;
            self.compress(&block);
            self.pending = [0; 64];
            self.pending_len = 0;
        }
        self.pending[self.pending_len..56].fill(0);
        self.pending[56..].copy_from_slice(&bits.to_be_bytes());
        let block = self.pending;
        self.compress(&block);
        let mut digest = [0u8; 32];
        for (chunk, value) in digest.chunks_exact_mut(4).zip(self.chaining) {
            chunk.copy_from_slice(&value.to_be_bytes());
        }
        digest
    }
}

fn encode_hex(bytes: &[u8]) -> String {
    const ALPHABET: &[u8; 16] = b"0123456789abcdef";
    let mut output = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        output.push(ALPHABET[(byte >> 4) as usize] as char);
        output.push(ALPHABET[(byte & 15) as usize] as char);
    }
    output
}

fn digest_bytes(bytes: &[u8]) -> String {
    let mut state = Sha256::new();
    state.absorb(bytes);
    encode_hex(&state.finish())
}

fn digest_file(path: &Path) -> Result<(u64, String), String> {
    let metadata = fs::symlink_metadata(path).map_err(|_| "file metadata unavailable")?;
    if !metadata.file_type().is_file() || metadata.file_type().is_symlink() {
        return Err("input is not a regular non-symlink file".into());
    }
    let mut file = File::open(path).map_err(|_| "file open failed")?;
    let mut state = Sha256::new();
    let mut buffer = [0u8; 65_536];
    let mut bytes = 0u64;
    loop {
        let count = file.read(&mut buffer).map_err(|_| "file read failed")?;
        if count == 0 {
            break;
        }
        bytes = bytes.checked_add(count as u64).ok_or("file length overflow")?;
        state.absorb(&buffer[..count]);
    }
    Ok((bytes, encode_hex(&state.finish())))
}

fn safe_relative(path: &str) -> bool {
    !path.is_empty()
        && path.len() < 512
        && !path.contains('\\')
        && Path::new(path).components().all(|component| {
            matches!(component, Component::Normal(_) | Component::CurDir)
        })
}

fn verify_scientific_inputs(contract: &Path, sources: &Path) -> Result<(), String> {
    let (contract_bytes, contract_hash) = digest_file(contract)?;
    if contract_bytes != CONTRACT_BYTES || contract_hash != CONTRACT_SHA256 {
        return Err("contract identity mismatch".into());
    }
    for frozen in &FROZEN_INPUTS {
        let (byte_count, sha256) = digest_file(&sources.join(frozen.file_name))?;
        if byte_count != frozen.byte_count || sha256 != frozen.sha256 {
            return Err(format!("source identity mismatch: {}", frozen.file_name));
        }
    }
    Ok(())
}

fn parse_authorization(path: &Path) -> Result<BTreeMap<String, String>, String> {
    let metadata = fs::symlink_metadata(path).map_err(|_| "authorization missing")?;
    if !metadata.file_type().is_file() || metadata.file_type().is_symlink() || metadata.len() > 4096 {
        return Err("authorization file shape rejected".into());
    }
    let bytes = fs::read(path).map_err(|_| "authorization read failed")?;
    if bytes.is_empty() || *bytes.last().unwrap() != b'\n' || !bytes.is_ascii() {
        return Err("authorization encoding rejected".into());
    }
    let text = std::str::from_utf8(&bytes).map_err(|_| "authorization UTF-8 rejected")?;
    let mut fields = BTreeMap::new();
    for line in text.lines() {
        let mut split = line.split('=');
        let key = split.next().unwrap_or_default();
        let value = split.next().unwrap_or_default();
        if key.is_empty() || value.is_empty() || split.next().is_some() {
            return Err("authorization line rejected".into());
        }
        if fields.insert(key.to_string(), value.to_string()).is_some() {
            return Err("duplicate authorization field".into());
        }
    }
    let allowed = [
        "schema",
        "decision",
        "lane",
        "token_sha256",
        "contract_sha256",
        "executable_sha256",
        "output_root",
        "primary_manifest_sha256",
    ];
    if fields.len() != allowed.len() || fields.keys().any(|key| !allowed.contains(&key.as_str())) {
        return Err("authorization inventory rejected".into());
    }
    Ok(fields)
}

fn verify_authorization(
    path: &Path,
    token: &str,
    executable_sha256: &str,
    primary_manifest_sha256: &str,
) -> Result<(), String> {
    if token.len() != 64 || digest_bytes(token.as_bytes()) != TOKEN_SHA256 {
        return Err("token rejected".into());
    }
    let fields = parse_authorization(path)?;
    let expected = [
        ("schema", "nhm2.g2h_execution_authorization.v1"),
        ("decision", "AUTHORIZED"),
        ("lane", "independent"),
        ("token_sha256", TOKEN_SHA256),
        ("contract_sha256", CONTRACT_SHA256),
        ("executable_sha256", executable_sha256),
        ("output_root", INDEPENDENT_ROOT),
        ("primary_manifest_sha256", primary_manifest_sha256),
    ];
    if expected
        .iter()
        .any(|(key, value)| fields.get(*key).map(String::as_str) != Some(*value))
    {
        return Err("authorization values rejected".into());
    }
    Ok(())
}

fn write_exclusive(root: &Path, name: &str, contents: &str) -> Result<String, String> {
    let path = root.join(name);
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|_| "exclusive receipt creation failed")?;
    file.write_all(contents.as_bytes())
        .map_err(|_| "receipt write failed")?;
    file.sync_all().map_err(|_| "receipt persistence failed")?;
    Ok(digest_bytes(contents.as_bytes()))
}

fn ineligible_record(
    sequence: usize,
    duty: &str,
    algorithm: &str,
    previous: &str,
) -> String {
    format!(
        "{{\"algorithm\":\"{}\",\"authority\":{{\"candidate_admitted\":false,\"classical_proof_established\":false,\"diagnostic_lamp\":false,\"geometry_state_accepted\":false,\"physical_viability\":false,\"propulsion_authority\":false,\"transport_authority\":false}},\"candidate_evaluations\":1,\"decision\":\"INELIGIBLE_AFTER_FIRST_FAIL\",\"duty\":\"{}\",\"lane\":\"independent\",\"previous_record_sha256\":\"{}\",\"schema\":\"nhm2.g2h.proof_duty.v1\",\"sequence\":{},\"typed_failure\":\"GLOBAL_STATIC_STATE_FAIL\"}}\n",
        algorithm, duty, previous, sequence
    )
}

fn execute(arguments: &[String]) -> Result<i32, String> {
    if arguments.len() != 11
        || arguments[0] != "--candidate"
        || arguments[1] != "--contract"
        || arguments[3] != "--sources"
        || arguments[5] != "--output-root"
        || arguments[7] != "--authorization"
        || arguments[9] != "--token"
    {
        return Err("candidate execution unavailable without exact guarded G2H-E command".into());
    }
    let contract = &arguments[2];
    let sources = &arguments[4];
    let output_root = &arguments[6];
    let authorization = &arguments[8];
    let token = &arguments[10];
    if !safe_relative(contract)
        || !safe_relative(sources)
        || !safe_relative(authorization)
        || output_root != INDEPENDENT_ROOT
        || Path::new(INDEPENDENT_ROOT).exists()
        || !Path::new(PRIMARY_ROOT).is_dir()
    {
        return Err("path, root or chronology preflight rejected".into());
    }
    verify_scientific_inputs(Path::new(contract), Path::new(sources))?;
    let (self_bytes, self_sha256) = digest_file(Path::new("/proc/self/exe"))?;
    if self_bytes == 0 {
        return Err("self executable identity rejected".into());
    }
    let (_, primary_manifest_sha256) = digest_file(Path::new(PRIMARY_MANIFEST))?;
    verify_authorization(
        Path::new(authorization),
        token,
        &self_sha256,
        &primary_manifest_sha256,
    )?;

    fs::create_dir_all("artifacts/research/nhm2/g2h")
        .map_err(|_| "evidence parent creation failed")?;
    fs::create_dir(INDEPENDENT_ROOT).map_err(|_| "exclusive independent root creation failed")?;
    let root = PathBuf::from(INDEPENDENT_ROOT);
    let preflight = format!(
        "{{\"candidate_evaluations\":0,\"contract_sha256\":\"{}\",\"decision\":\"PASS\",\"executable_sha256\":\"{}\",\"lane\":\"independent\",\"previous_record_sha256\":\"{}\",\"primary_manifest_sha256\":\"{}\",\"schema\":\"nhm2.g2h.proof_preflight.v1\",\"sequence\":0,\"sources_verified\":7}}\n",
        CONTRACT_SHA256, self_sha256, ZERO_HASH, primary_manifest_sha256
    );
    let mut previous = write_exclusive(&root, "00-preflight.json", &preflight)?;

    let surface = surface_gate::independent_surface_regularity_gate();
    let surface_record = format!(
        "{{\"candidate_evaluations\":1,\"coefficient\":\"{}\",\"decision\":\"{}\",\"exterior_exact\":\"{}\",\"first_disjoint_order\":{},\"interior_exact\":\"{}\",\"lane\":\"independent\",\"previous_record_sha256\":\"{}\",\"schema\":\"nhm2.g2h.surface_regularity.v1\",\"sequence\":1,\"typed_result\":\"{}\"}}\n",
        surface.coefficient,
        if surface.pass { "PASS" } else { "FAIL" },
        surface.exterior_exact,
        surface.first_disjoint_order,
        surface.interior_exact,
        previous,
        surface.typed_result
    );
    previous = write_exclusive(&root, "01-surface-regularity.json", &surface_record)?;
    if surface.pass {
        return Err("surface gate unexpectedly passed; duty engine remains fail-closed".into());
    }

    for (index, (duty, algorithm)) in DUTIES.iter().enumerate() {
        let sequence = index + 2;
        let record = ineligible_record(sequence, duty, algorithm, &previous);
        previous = write_exclusive(
            &root,
            &format!("{:02}-{}.json", sequence, duty),
            &record,
        )?;
    }
    let manifest = "{\"candidate_admitted\":false,\"candidate_evaluations\":1,\"candidate_execution_authorized\":true,\"classical_proof_established\":false,\"decision\":\"FAIL\",\"diagnostic_lamp\":false,\"first_failure\":\"GLOBAL_STATIC_STATE_FAIL\",\"geometry_state_accepted\":false,\"lane\":\"independent\",\"physical_viability\":false,\"propulsion_authority\":false,\"schema\":\"nhm2.g2h.proof_manifest.v1\",\"transport_authority\":false}\n";
    let manifest_hash = write_exclusive(&root, "proof-manifest.json", manifest)?;
    println!("{}", manifest_hash);
    Ok(1)
}

fn main() {
    let arguments: Vec<String> = env::args().skip(1).collect();
    match execute(&arguments) {
        Ok(code) => std::process::exit(code),
        Err(error) => {
            eprintln!("{}", error);
            std::process::exit(64);
        }
    }
}
