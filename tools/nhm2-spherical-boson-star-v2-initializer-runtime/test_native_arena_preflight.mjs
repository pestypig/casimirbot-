import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, "../..");
const source = path.join(here, "native_arena_preflight.rs");
const expectedSourceSha256 =
  "282271256ff58ffa08f85b46fdfdb228295aa7d0f6131b51a60a0470af4f9853";
const expectedMpfrSha256 =
  "95b280f52d24a1fe1e024877ee325a629c3424e12961d27f84daec73d02c4bd8";
const expectedGmpSha256 =
  "829adcf025d22e641c6816b431fbe5b226a39b390c7205192d480151646fe9c9";

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function u64le(value) {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function discoverMpfr() {
  const output = execFileSync(
    "python",
    [
      "-c",
      "import gmpy2,pathlib; print(pathlib.Path(gmpy2.__file__).resolve().parent.parent / 'gmpy2.libs' / 'libmpfr-6.dll')",
    ],
    { encoding: "utf8" },
  ).trim();
  assert.ok(path.isAbsolute(output));
  assert.ok(existsSync(output));
  return output;
}

function discoverGmp(mpfr) {
  const result = path.join(path.dirname(mpfr), "libgmp-10.dll");
  assert.ok(existsSync(result));
  return result;
}

const actualSourceSha256 = sha256(source);
if (!expectedSourceSha256.startsWith("PENDING_")) {
  assert.equal(actualSourceSha256, expectedSourceSha256);
}

const mpfr = discoverMpfr();
assert.equal(sha256(mpfr), expectedMpfrSha256);
const gmp = discoverGmp(mpfr);
assert.equal(sha256(gmp), expectedGmpSha256);
const livePrimaryNumerics = JSON.parse(
  execFileSync(
    process.execPath,
    [
      path.join(repositoryRoot, "node_modules", "tsx", "dist", "cli.mjs"),
      "-e",
      "import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256 as sha256, NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES as size } from './shared/contracts/nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1.ts'; console.log(JSON.stringify({sha256,size}));",
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  ),
);
assert.deepEqual(livePrimaryNumerics, {
  sha256: "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
  size: 80055,
});

const scratch = mkdtempSync(path.join(tmpdir(), "nhm2-native-arena-"));
try {
  const addon = path.join(scratch, "native_arena_preflight.node");
  const sysroot = execFileSync("rustc", ["--print", "sysroot"], {
    encoding: "utf8",
  }).trim();
  const linker = path.join(
    sysroot,
    "lib",
    "rustlib",
    "x86_64-pc-windows-msvc",
    "bin",
    "rust-lld.exe",
  );
  assert.ok(existsSync(linker));
  execFileSync(
    "rustc",
    [
      "--edition=2021",
      "--crate-type=cdylib",
      "-C",
      `linker=${linker}`,
      "-C",
      "opt-level=2",
      "-C",
      "link-arg=/Brepro",
      "-o",
      addon,
      source,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NHM2_TRUSTED_MPFR_DLL: mpfr,
        NHM2_TRUSTED_GMP_DLL: gmp,
      },
    },
  );

  const worker = String.raw`
    const assert = require("node:assert/strict");
    const fs = require("node:fs");
    const native = require(process.argv[1]);
    assert.equal(typeof native.runTrustedNativeArenaPreflight, "function");
    assert.equal(typeof native.runDiagnosticNativeArenaPreflight, "function");
    assert.equal(typeof native.acquireTrustedNativeArenaLease, "function");
    const trusted = native.runTrustedNativeArenaPreflight();
    assert.equal(trusted.trustedRuntimeManifestInstalled, true);
    const lease = native.acquireTrustedNativeArenaLease();
    assert.equal(lease.leaseActive, true);
    assert.equal(lease.trustedRuntimeManifestInstalled, true);
    assert.equal(lease.gmpVersion, "6.3.0");
    assert.equal(lease.fixedIndexOperationsAvailable, true);
    assert.equal(lease.fixedIndexCoreOperationsAvailable, true);
    assert.equal(lease.fixedIndexSetZ2ExpAvailable, true);
    assert.equal(lease.abandonmentFinalizerInstalled, true);
    assert.equal(lease.loadedModuleFileIdentityMatchedHeldSources, true);
    assert.equal(lease.sourceFilesHeldWithoutWriteOrDeleteSharing, true);
    assert.equal(lease.postLoadSourceRehashMatched, true);
    assert.equal(lease.binary64EnvironmentInstalled, true);
    assert.equal(lease.binary64EnvironmentOwningThreadBound, true);
    assert.equal(
      lease.binary64EnvironmentRuntimeFamily,
      "windows_amd64_ucrt_full_fenv",
    );
    assert.equal(
      lease.binary64EnvironmentSourceSha256,
      "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4",
    );
    assert.equal(lease.binary64EnvironmentSourceSizeBytes, 14980);
    assert.equal(lease.productionRuntimeReady, false);
    assert.ok(lease.binary64Arena instanceof Float64Array);
    assert.ok(lease.permutationArena instanceof Uint32Array);
    assert.equal(lease.binary64Arena.length, 262144);
    assert.equal(lease.binary64Arena.byteLength, 2097152);
    assert.equal(lease.permutationArena.length, 257);
    assert.equal(lease.permutationArena.byteLength, 1028);
    assert.ok(lease.binary64Arena.every((value) => Object.is(value, 0)));
    assert.ok(lease.permutationArena.every((value) => value === 0));
    assert.throws(() => fs.openSync(process.argv[2], "r+"), /EBUSY|EPERM|EACCES/);
    assert.throws(() => fs.openSync(process.argv[3], "r+"), /EBUSY|EPERM|EACCES/);
    assert.equal(lease.setUiAt(0, 7), 0);
    assert.equal(lease.setUiAt(1, 8), 0);
    assert.equal(lease.addAt(2, 0, 1), 0);
    assert.equal(lease.getDAt(2), 15);
    assert.equal(lease.setDAt(3, 0.5), 0);
    assert.equal(lease.mulAt(4, 2, 3), 0);
    assert.equal(lease.getDAt(4), 7.5);
    assert.equal(lease.setSiAt(5, -2), 0);
    assert.equal(lease.negAt(6, 5), 0);
    assert.equal(lease.getDAt(6), 2);
    assert.equal(lease.divAt(7, 1, 6), 0);
    assert.equal(lease.sqrtAt(8, 7), 0);
    assert.equal(lease.getDAt(8), 2);
    assert.notEqual(lease.logAt(9, 8), 0);
    assert.notEqual(lease.expAt(10, 9), 0);
    assert.equal(lease.getDAt(10), 2);
    assert.notEqual(lease.constPiAt(11), 0);
    assert.notEqual(lease.cosAt(12, 11), 0);
    assert.equal(lease.getDAt(12), -1);
    assert.equal(lease.subAt(13, 0, 1), 0);
    assert.equal(lease.setAt(14, 13), 0);
    assert.equal(lease.cmpAt(14, 13), 0);
    assert.equal(lease.setPositiveZeroAt(15), 0);
    assert.ok(Object.is(lease.getDAt(15), 0));
    const unitSignificand = "8" + "0".repeat(63);
    assert.equal(lease.setZ2ExpAt(16, 1, unitSignificand, -255), 0);
    assert.equal(lease.getDAt(16), 1);
    assert.equal(lease.setZ2ExpAt(17, -1, unitSignificand, -255), 0);
    assert.equal(lease.getDAt(17), -1);
    assert.throws(
      () => lease.setZ2ExpAt(18, 1, unitSignificand, -255, "extra"),
      /fixed_index_operation_arity_invalid/,
    );
    assert.throws(
      () => lease.setZ2ExpAt(18, 0, unitSignificand, -255),
      /fixed_index_dyadic_sign_invalid/,
    );
    assert.throws(
      () => lease.setZ2ExpAt(18, 1, "7" + "f".repeat(63), -255),
      /fixed_index_dyadic_significand_invalid/,
    );
    assert.throws(
      () => lease.setZ2ExpAt(18, 1, unitSignificand, -255.5),
      /fixed_index_dyadic_exponent_invalid/,
    );
    let proxyReads = 0;
    const hostileSignificand = new Proxy(
      {},
      {
        get() {
          proxyReads += 1;
          throw new Error("must not traverse");
        },
      },
    );
    assert.throws(
      () => lease.setZ2ExpAt(18, 1, hostileSignificand, -255),
      /fixed_index_dyadic_significand_invalid/,
    );
    assert.equal(proxyReads, 0);
    assert.throws(
      () => ({ getDAt: lease.getDAt }).getDAt(0),
      /native_arena_lease_identity_mismatch/,
    );
    assert.throws(
      () => lease.addAt(0, 0, 1),
      /fixed_index_destination_alias_invalid/,
    );
    assert.throws(
      () => lease.getDAt(65536),
      /fixed_index_mpfr_slot_out_of_range/,
    );
    assert.throws(
      () => lease.setDAt(0, {}),
      /fixed_index_numeric_argument_invalid/,
    );
    assert.throws(
      () => native.acquireTrustedNativeArenaLease(),
      /native_arena_lease_already_active/,
    );
    const closed = lease.close();
    assert.equal(closed.leaseClosed, true);
    assert.equal(closed.decreasingClearObserved, true);
    assert.equal(closed.exponentRangeRestored, true);
    assert.equal(closed.nativeModuleUnloaded, true);
    assert.equal(closed.binary64EnvironmentHeldUntilCleanup, true);
    assert.equal(closed.binary64EnvironmentCallerStateRestored, true);
    assert.equal(closed.binary64EnvironmentCleanupOnOwningThread, true);
    assert.equal(closed.fixedIndexOperationCount, 28);
    assert.equal(closed.fixedIndexOperationFailureLatched, false);
    fs.closeSync(fs.openSync(process.argv[2], "r+"));
    fs.closeSync(fs.openSync(process.argv[3], "r+"));
    assert.equal(closed.executionAuthority, false);
    assert.equal(closed.physicalAuthority, false);
    assert.throws(() => lease.close(), /native_arena_lease_stale/);
    assert.throws(
      () => native.acquireTrustedNativeArenaLease(),
      /native_arena_lease_already_consumed/,
    );
    const receipt = native.runDiagnosticNativeArenaPreflight();
    assert.ok(receipt.binary64Arena instanceof Float64Array);
    assert.ok(receipt.permutationArena instanceof Uint32Array);
    assert.ok(receipt.binary64Arena.every((value) => Object.is(value, 0)));
    assert.ok(receipt.permutationArena.every((value) => value === 0));
    delete process.env.NHM2_DIAGNOSTIC_MPFR_DLL;
    assert.throws(
      () => native.runDiagnosticNativeArenaPreflight(),
      /diagnostic_mpfr_dll_path_absent/,
    );
    console.log(JSON.stringify({
      mpfrElementCount: receipt.mpfrElementCount,
      mpfrDescriptorSizeBytes: receipt.mpfrDescriptorSizeBytes,
      mpfrPrecisionBits: receipt.mpfrPrecisionBits,
      mpfrVersion: receipt.mpfrVersion,
      binary64ElementCount: receipt.binary64Arena.length,
      binary64ByteLength: receipt.binary64Arena.byteLength,
      permutationElementCount: receipt.permutationArena.length,
      permutationByteLength: receipt.permutationArena.byteLength,
      increasingInitializationObserved: receipt.increasingInitializationObserved,
      everyMpfrSlotPrecisionAndPositiveZeroVerified:
        receipt.everyMpfrSlotPrecisionAndPositiveZeroVerified,
      decreasingClearObserved: receipt.decreasingClearObserved,
      exponentRangeRestored: receipt.exponentRangeRestored,
      trustedRuntimeManifestInstalled: receipt.trustedRuntimeManifestInstalled,
      trustedPathManifestInstalled: trusted.trustedRuntimeManifestInstalled,
      retainedLeaseClosed: closed.leaseClosed,
      retainedLeaseNativeModuleUnloaded: closed.nativeModuleUnloaded,
      productionRuntimeReady: receipt.productionRuntimeReady,
      candidateNumericReadPerformed: receipt.candidateNumericReadPerformed,
      executionAuthority: receipt.executionAuthority,
      physicalAuthority: receipt.physicalAuthority,
      propulsionAuthority: receipt.propulsionAuthority,
      transportAuthority: receipt.transportAuthority,
    }));
  `;
  const receipt = JSON.parse(
    execFileSync(process.execPath, ["-e", worker, addon, mpfr, gmp], {
      encoding: "utf8",
      env: { ...process.env, NHM2_DIAGNOSTIC_MPFR_DLL: mpfr },
    }),
  );

  assert.equal(receipt.mpfrElementCount, 65_536);
  assert.equal(receipt.mpfrDescriptorSizeBytes, 24);
  assert.equal(receipt.mpfrPrecisionBits, 256);
  assert.equal(receipt.mpfrVersion, "4.2.2");
  assert.equal(receipt.binary64ElementCount, 262_144);
  assert.equal(receipt.binary64ByteLength, 2_097_152);
  assert.equal(receipt.permutationElementCount, 257);
  assert.equal(receipt.permutationByteLength, 1_028);
  assert.equal(receipt.increasingInitializationObserved, true);
  assert.equal(receipt.everyMpfrSlotPrecisionAndPositiveZeroVerified, true);
  assert.equal(receipt.decreasingClearObserved, true);
  assert.equal(receipt.exponentRangeRestored, true);
  assert.equal(receipt.trustedRuntimeManifestInstalled, false);
  assert.equal(receipt.trustedPathManifestInstalled, true);
  assert.equal(receipt.retainedLeaseClosed, true);
  assert.equal(receipt.retainedLeaseNativeModuleUnloaded, true);
  assert.equal(receipt.productionRuntimeReady, false);
  assert.equal(receipt.candidateNumericReadPerformed, false);
  assert.equal(receipt.executionAuthority, false);
  assert.equal(receipt.physicalAuthority, false);
  assert.equal(receipt.propulsionAuthority, false);
  assert.equal(receipt.transportAuthority, false);

  const nativeCoreEvidence = JSON.parse(
    execFileSync(
      process.execPath,
      [
        "-e",
        String.raw`
        const assert = require("node:assert/strict");
        const { createHash } = require("node:crypto");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        assert.equal(lease.frozenN64SpectralGraphAvailable, true);
        assert.equal(typeof lease.materializeFrozenN64SpectralGraph, "function");
        assert.throws(
          () => lease.materializeFrozenN64SpectralGraph("extra"),
          /frozen_n64_spectral_callback_arity_invalid/,
        );
        assert.throws(
          () => ({ materializeFrozenN64SpectralGraph:
            lease.materializeFrozenN64SpectralGraph
          }).materializeFrozenN64SpectralGraph(),
          /native_arena_lease_identity_mismatch/,
        );
        const graph = lease.materializeFrozenN64SpectralGraph();
        assert.deepEqual(
          {
            frozenN64SpectralGraphBound: graph.frozenN64SpectralGraphBound,
            nodeCount: graph.nodeCount,
            fixedIndexOperationCount: graph.fixedIndexOperationCount,
            primaryNumericsPolicySha256: graph.primaryNumericsPolicySha256,
            primaryNumericsPolicyCanonicalSizeBytes:
              graph.primaryNumericsPolicyCanonicalSizeBytes,
            candidateNumericReadPerformed: graph.candidateNumericReadPerformed,
            productionRuntimeReady: graph.productionRuntimeReady,
            executionAuthority: graph.executionAuthority,
            physicalAuthority: graph.physicalAuthority,
            propulsionAuthority: graph.propulsionAuthority,
            transportAuthority: graph.transportAuthority,
          },
          {
            frozenN64SpectralGraphBound: true,
            nodeCount: 64,
            fixedIndexOperationCount: 823988,
            primaryNumericsPolicySha256:
              "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
            primaryNumericsPolicyCanonicalSizeBytes: 80055,
            candidateNumericReadPerformed: false,
            productionRuntimeReady: false,
            executionAuthority: false,
            physicalAuthority: false,
            propulsionAuthority: false,
            transportAuthority: false,
          },
        );
        const hashSlice = (start, length) => createHash("sha256")
          .update(Buffer.from(
            lease.binary64Arena.buffer,
            lease.binary64Arena.byteOffset + start * 8,
            length * 8,
          ))
          .digest("hex");
        assert.equal(
          hashSlice(0, 64),
          "1f42876204af11c7eebab8bba8cbcd8694270e106f19479bbbd74fc47521ecab",
        );
        assert.equal(
          hashSlice(128, 4096),
          "16f67212db733eade1b09c0dcaf21f4c817472c7fd5f311701aaed0fce564c70",
        );
        assert.equal(
          hashSlice(16512, 4096),
          "708ca1b0c4033c4873403000beb6027d22682ba2f5432af07cac9b2bed7d7d76",
        );
        assert.ok(Object.is(lease.binary64Arena[0], 0));
        assert.equal(lease.binary64Arena[63], 1);
        assert.ok(lease.binary64Arena
          .subarray(64, 128)
          .every((value) => Object.is(value, 0)));
        assert.ok(lease.binary64Arena
          .subarray(4224, 16512)
          .every((value) => Object.is(value, 0)));
        assert.ok(lease.binary64Arena
          .subarray(20608, 32896)
          .every((value) => Object.is(value, 0)));
        assert.equal(lease.frozenN64CoreInitializerAvailable, true);
        assert.equal(
          typeof lease.materializeFrozenN64CoreInitializer,
          "function",
        );
        assert.throws(
          () => lease.materializeFrozenN64CoreInitializer("extra"),
          /frozen_n64_core_initializer_callback_arity_invalid/,
        );
        assert.throws(
          () => ({ materializeFrozenN64CoreInitializer:
            lease.materializeFrozenN64CoreInitializer
          }).materializeFrozenN64CoreInitializer(),
          /native_arena_lease_identity_mismatch/,
        );
        const initializer = lease.materializeFrozenN64CoreInitializer();
        assert.equal(initializer.frozenN64CoreInitializerBound, true);
        assert.equal(initializer.nodeCount, 64);
        assert.equal(initializer.fixedIndexOperationCount, 837901);
        assert.equal(
          initializer.expectedStateF64leSha256,
          "cdac4932d5f11808a7a443fe8cb40e56c69418396f28409e9094e354722b95c5",
        );
        assert.equal(
          hashSlice(32896, 129),
          initializer.expectedStateF64leSha256,
        );
        const bits = (value) => {
          const result = Buffer.alloc(8);
          result.writeDoubleBE(value);
          return result.toString("hex");
        };
        assert.equal(bits(initializer.kg), "3feef30abf082e7f");
        assert.equal(bits(initializer.nu), "bfddeeea11683f4a");
        assert.equal(bits(lease.binary64Arena[32896]), "3ff0000000000000");
        assert.equal(bits(lease.binary64Arena[32960]), "bff33e28c20c28af");
        assert.equal(bits(lease.binary64Arena[33024]), "bfddeeea11683f4a");
        assert.ok(lease.binary64Arena
          .subarray(33025, 33153)
          .every((value) => Object.is(value, 0)));
        assert.throws(
          () => lease.materializeFrozenN64CoreInitializer(),
          /frozen_n64_core_initializer_already_materialized/,
        );
        assert.equal(lease.frozenN64CoreSolveDiagnosticAvailable, true);
        assert.equal(
          typeof lease.evaluateFrozenN64CoreSolveDiagnostic,
          "function",
        );
        assert.throws(
          () => lease.evaluateFrozenN64CoreSolveDiagnostic("extra"),
          /frozen_n64_core_solve_callback_arity_invalid/,
        );
        assert.throws(
          () => ({ evaluateFrozenN64CoreSolveDiagnostic:
            lease.evaluateFrozenN64CoreSolveDiagnostic
          }).evaluateFrozenN64CoreSolveDiagnostic(),
          /native_arena_lease_identity_mismatch/,
        );
        const core = lease.evaluateFrozenN64CoreSolveDiagnostic();
        assert.equal(core.coreSolveAttempted, true);
        assert.equal(core.coreSolveConverged, false);
        assert.equal(
          core.failureCode,
          "armijo_schedule_exhausted_without_retry",
        );
        assert.equal(core.acceptedUpdateCount, 9);
        assert.equal(core.fullEvaluationCount, 53);
        assert.equal(core.trialAttemptCount, 52);
        assert.equal(core.denseLuSolveCount, 10);
        assert.equal(core.acceptedAlphaExponents, "0,0,0,0,0,1,3,6,8");
        assert.equal(core.equationLinf, 6.052214285290347e-11);
        assert.equal(core.scaledStepLinf, 3.043268818520606e-17);
        assert.equal(core.projectionResidualPresent, false);
        assert.equal(
          core.currentStateF64leSha256,
          "601af0c0de01be4bb5a2abc0dc743cae57397a50c9406720856ae396c7325e50",
        );
        assert.equal(
          core.currentResidualF64leSha256,
          "13418bbf6f97925754b7dd999b1e70e2d2495d2efb4993f61ee98cf4be62dc17",
        );
        assert.equal(core.candidateNumericReadPerformed, false);
        assert.equal(core.executionAuthority, false);
        assert.equal(core.candidateAuthority, false);
        assert.equal(core.theoryGraphAuthority, false);
        assert.throws(
          () => lease.evaluateFrozenN64CoreSolveDiagnostic(),
          /frozen_n64_core_solve_precondition_failed/,
        );
        const weights = Buffer.alloc(64 * 8);
        for (let index = 0; index < 64; index += 1) {
          weights.writeDoubleLE(lease.getDAt(128 + index), index * 8);
        }
        assert.equal(
          createHash("sha256").update(weights).digest("hex"),
          "a28c4a929a2ec377ca6743afd3c15d0817a7cd8398e610acef054bda57f9820d",
        );
        assert.throws(
          () => lease.materializeFrozenN64SpectralGraph(),
          /frozen_n64_spectral_already_materialized/,
        );
        const closed = lease.close();
        assert.equal(closed.frozenN64SpectralGraphMaterialized, true);
        assert.equal(closed.frozenN64CoreInitializerMaterialized, true);
        assert.equal(closed.frozenN64CoreSolveAttempted, true);
        assert.equal(closed.frozenN64CoreSolveConverged, false);
        assert.equal(
          closed.fixedIndexOperationCount,
          core.fixedIndexOperationCount + 64,
        );
        assert.equal(closed.fixedIndexOperationFailureLatched, false);
        assert.equal(closed.executionAuthority, false);
        console.log(JSON.stringify({ core, closed }));
      `,
        addon,
      ],
      { encoding: "utf8" },
    ),
  );
  const pythonReplayCode = String.raw`
import hashlib
import json
import pathlib
import struct
import sys

root = pathlib.Path.cwd()
producer = root / "tools" / "nhm2-spherical-boson-star-seed" / "producer"
sys.path.insert(0, str(producer))

import core_initializer
import core_newton

spectral = core_initializer._spectral_module.generate_lobatto_spectral_primitive(64)
initializer = core_initializer.materialize_fixed_l0_initializer(spectral)
result = core_newton.solve_primary_core_newton(
    spectral=spectral,
    initial_state=initializer.z,
)
operator = core_newton._load_bound_core_operator()
bound_spectral = core_newton._bind_spectral_payload(operator, spectral)
evaluation = operator.evaluate_primary_core_residual_only(
    bound_spectral,
    result.current_state,
)

def f64le_sha256(values):
    payload = b"".join(struct.pack("<d", value) for value in values)
    return hashlib.sha256(payload).hexdigest()

print(json.dumps({
    "failureCode": result.failure_code,
    "acceptedUpdateCount": result.accepted_update_count,
    "fullEvaluationCount": result.full_evaluation_count,
    "trialAttemptCount": result.trial_attempt_count,
    "denseLuSolveCount": result.dense_lu_solve_count,
    "acceptedAlphaExponents": list(result.accepted_alpha_exponents),
    "equationLinf": result.equation_linf,
    "scaledStepLinf": result.scaled_step_linf,
    "currentStateF64leSha256": f64le_sha256(result.current_state),
    "currentResidualF64leSha256": f64le_sha256(evaluation.residual),
    "candidateExecuted": result.candidate_executed,
    "candidateAuthority": result.candidate_authority,
    "theoryGraphAuthority": result.theory_graph_authority,
    "physicalAuthority": result.physical_authority,
    "propulsionAuthority": result.propulsion_authority,
    "transportAuthority": result.transport_authority,
}, sort_keys=True, separators=(",", ":")))
`;
  const pythonCoreEvidence = JSON.parse(
    execFileSync("python", ["-c", pythonReplayCode], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }),
  );
  const normalizedNativeCoreEvidence = {
    failureCode: nativeCoreEvidence.core.failureCode,
    acceptedUpdateCount: nativeCoreEvidence.core.acceptedUpdateCount,
    fullEvaluationCount: nativeCoreEvidence.core.fullEvaluationCount,
    trialAttemptCount: nativeCoreEvidence.core.trialAttemptCount,
    denseLuSolveCount: nativeCoreEvidence.core.denseLuSolveCount,
    acceptedAlphaExponents: nativeCoreEvidence.core.acceptedAlphaExponents
      .split(",")
      .map(Number),
    equationLinf: nativeCoreEvidence.core.equationLinf,
    scaledStepLinf: nativeCoreEvidence.core.scaledStepLinf,
    currentStateF64leSha256: nativeCoreEvidence.core.currentStateF64leSha256,
    currentResidualF64leSha256:
      nativeCoreEvidence.core.currentResidualF64leSha256,
    candidateExecuted: false,
    candidateAuthority: nativeCoreEvidence.core.candidateAuthority,
    theoryGraphAuthority: nativeCoreEvidence.core.theoryGraphAuthority,
    physicalAuthority: nativeCoreEvidence.core.physicalAuthority,
    propulsionAuthority: nativeCoreEvidence.core.propulsionAuthority,
    transportAuthority: nativeCoreEvidence.core.transportAuthority,
  };
  assert.deepEqual(pythonCoreEvidence, normalizedNativeCoreEvidence);

  const binary64RestoreFailureAddon = path.join(
    scratch,
    "binary64_restore_failure.node",
  );
  execFileSync(
    "rustc",
    [
      "--edition=2021",
      "--crate-type=cdylib",
      "-C",
      `linker=${linker}`,
      "-C",
      "opt-level=2",
      "-o",
      binary64RestoreFailureAddon,
      source,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NHM2_TRUSTED_MPFR_DLL: mpfr,
        NHM2_TRUSTED_GMP_DLL: gmp,
        NHM2_TEST_FORCE_BINARY64_RESTORE_FAILURE: "1",
      },
    },
  );
  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        assert.equal(lease.binary64EnvironmentInstalled, true);
        assert.throws(
          () => lease.close(),
          /windows_caller_fenv_not_exactly_restored/,
        );
        assert.throws(
          () => native.acquireTrustedNativeArenaLease(),
          /native_arena_runtime_poisoned/,
        );
      `,
      binary64RestoreFailureAddon,
    ],
    { stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        assert.throws(
          () => lease.materializeFrozenN64CoreInitializer(),
          /frozen_n64_initializer_spectral_prerequisite_absent/,
        );
        const closed = lease.close();
        assert.equal(closed.frozenN64CoreInitializerMaterialized, false);
        assert.equal(closed.fixedIndexOperationCount, 0);
      `,
      addon,
    ],
    { stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        lease.materializeFrozenN64SpectralGraph();
        lease.binary64Arena[1] += Number.EPSILON;
        assert.throws(
          () => lease.materializeFrozenN64CoreInitializer(),
          /frozen_n64_spectral_binary_hash_mismatch/,
        );
        const closed = lease.close();
        assert.equal(closed.frozenN64CoreInitializerMaterialized, false);
        assert.equal(closed.fixedIndexOperationFailureLatched, true);
      `,
      addon,
    ],
    { stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        const transferred = structuredClone(lease.binary64Arena.buffer, {
          transfer: [lease.binary64Arena.buffer],
        });
        assert.equal(transferred.byteLength, 2097152);
        assert.equal(lease.binary64Arena.byteLength, 0);
        assert.throws(
          () => lease.materializeFrozenN64SpectralGraph(),
          /frozen_n64_spectral_binary64_backing_identity_mismatch/,
        );
        const closed = lease.close();
        assert.equal(closed.frozenN64SpectralGraphMaterialized, false);
        assert.equal(closed.fixedIndexOperationFailureLatched, false);
      `,
      addon,
    ],
    { stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        lease.binary64Arena = new Float64Array(262144);
        assert.throws(
          () => lease.materializeFrozenN64SpectralGraph(),
          /frozen_n64_spectral_binary64_backing_identity_mismatch/,
        );
        const closed = lease.close();
        assert.equal(closed.frozenN64SpectralGraphMaterialized, false);
      `,
      addon,
    ],
    { stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        lease.binary64Arena[32895] = 1;
        assert.throws(
          () => lease.materializeFrozenN64SpectralGraph(),
          /frozen_n64_spectral_binary64_precondition_failed/,
        );
        const closed = lease.close();
        assert.equal(closed.frozenN64SpectralGraphMaterialized, false);
        assert.equal(closed.fixedIndexOperationFailureLatched, true);
      `,
      addon,
    ],
    { stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        lease.setUiAt(0, 1);
        assert.throws(
          () => lease.materializeFrozenN64SpectralGraph(),
          /frozen_n64_spectral_requires_pristine_lease/,
        );
        const closed = lease.close();
        assert.equal(closed.frozenN64SpectralGraphMaterialized, false);
        assert.equal(closed.fixedIndexOperationFailureLatched, false);
      `,
      addon,
    ],
    { stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    [
      "--expose-gc",
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        (async () => {
          let finalized = false;
          const registry = new FinalizationRegistry(() => {
            finalized = true;
          });
          let lease = native.acquireTrustedNativeArenaLease();
          assert.equal(lease.abandonmentFinalizerInstalled, true);
          const weak = new WeakRef(lease);
          registry.register(lease, 1);
          lease = null;
          for (let index = 0; index < 100 && !finalized; index += 1) {
            global.gc();
            await new Promise((resolve) => setImmediate(resolve));
          }
          assert.equal(finalized, true);
          assert.equal(weak.deref(), undefined);
          assert.throws(
            () => native.acquireTrustedNativeArenaLease(),
            /native_arena_lease_already_consumed/,
          );
        })().catch((error) => {
          console.error(error);
          process.exitCode = 1;
        });
      `,
      addon,
    ],
    { stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        assert.equal(lease.setDAt(0, 1_000_000), 0);
        assert.throws(
          () => lease.expAt(1, 0),
          /fixed_index_primitive_postcondition_failed/,
        );
        assert.throws(
          () => lease.getDAt(0),
          /fixed_index_operation_failure_latched/,
        );
        const closed = lease.close();
        assert.equal(closed.fixedIndexOperationCount, 2);
        assert.equal(closed.fixedIndexOperationFailureLatched, true);
        assert.equal(closed.executionAuthority, false);
      `,
      addon,
    ],
    { stdio: "inherit" },
  );

  const corruptedDll = path.join(scratch, "corrupted-libmpfr-6.dll");
  const corruptedBytes = readFileSync(mpfr);
  corruptedBytes[0] ^= 0x01;
  writeFileSync(corruptedDll, corruptedBytes);
  const corruptedManifestGmp = path.join(scratch, "libgmp-10.dll");
  writeFileSync(corruptedManifestGmp, readFileSync(gmp));
  const corruptedAddon = path.join(scratch, "corrupted_manifest.node");
  execFileSync(
    "rustc",
    [
      "--edition=2021",
      "--crate-type=cdylib",
      "-C",
      `linker=${linker}`,
      "-C",
      "opt-level=2",
      "-o",
      corruptedAddon,
      source,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NHM2_TRUSTED_MPFR_DLL: corruptedDll,
        NHM2_TRUSTED_GMP_DLL: corruptedManifestGmp,
      },
    },
  );
  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        assert.throws(
          () => native.runTrustedNativeArenaPreflight(),
          /trusted_mpfr_sha256_mismatch/,
        );
        assert.throws(
          () => native.acquireTrustedNativeArenaLease(),
          /trusted_mpfr_sha256_mismatch/,
        );
      `,
      corruptedAddon,
    ],
    { stdio: "inherit" },
  );

  const corruptedGmpDirectory = mkdtempSync(path.join(scratch, "gmp-corrupt-"));
  const goodMpfrCopy = path.join(corruptedGmpDirectory, "libmpfr-6.dll");
  const corruptedGmp = path.join(corruptedGmpDirectory, "libgmp-10.dll");
  writeFileSync(goodMpfrCopy, readFileSync(mpfr));
  const corruptedGmpBytes = readFileSync(gmp);
  corruptedGmpBytes[0] ^= 0x01;
  writeFileSync(corruptedGmp, corruptedGmpBytes);
  const corruptedGmpAddon = path.join(scratch, "corrupted_gmp_manifest.node");
  execFileSync(
    "rustc",
    [
      "--edition=2021",
      "--crate-type=cdylib",
      "-C",
      `linker=${linker}`,
      "-C",
      "opt-level=2",
      "-o",
      corruptedGmpAddon,
      source,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NHM2_TRUSTED_MPFR_DLL: goodMpfrCopy,
        NHM2_TRUSTED_GMP_DLL: corruptedGmp,
      },
    },
  );
  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        assert.throws(
          () => native.runTrustedNativeArenaPreflight(),
          /trusted_gmp_sha256_mismatch/,
        );
        assert.throws(
          () => native.acquireTrustedNativeArenaLease(),
          /trusted_gmp_sha256_mismatch/,
        );
      `,
      corruptedGmpAddon,
    ],
    { stdio: "inherit" },
  );

  const absentManifestAddon = path.join(scratch, "absent_manifest.node");
  const buildEnvironment = { ...process.env };
  delete buildEnvironment.NHM2_TRUSTED_MPFR_DLL;
  delete buildEnvironment.NHM2_TRUSTED_GMP_DLL;
  execFileSync(
    "rustc",
    [
      "--edition=2021",
      "--crate-type=cdylib",
      "-C",
      `linker=${linker}`,
      "-C",
      "opt-level=2",
      "-o",
      absentManifestAddon,
      source,
    ],
    { stdio: "inherit", env: buildEnvironment },
  );
  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        assert.throws(
          () => native.runTrustedNativeArenaPreflight(),
          /trusted_runtime_manifest_not_installed/,
        );
        assert.throws(
          () => native.acquireTrustedNativeArenaLease(),
          /trusted_runtime_manifest_not_installed/,
        );
      `,
      absentManifestAddon,
    ],
    { stdio: "inherit" },
  );

  const poisonedAddon = path.join(scratch, "poisoned_cleanup.node");
  execFileSync(
    "rustc",
    [
      "--edition=2021",
      "--crate-type=cdylib",
      "-C",
      `linker=${linker}`,
      "-C",
      "opt-level=2",
      "-o",
      poisonedAddon,
      source,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NHM2_TRUSTED_MPFR_DLL: mpfr,
        NHM2_TRUSTED_GMP_DLL: gmp,
        NHM2_TEST_FORCE_CLEANUP_FAILURE: "1",
      },
    },
  );
  execFileSync(
    process.execPath,
    [
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        const lease = native.acquireTrustedNativeArenaLease();
        assert.throws(
          () => lease.close(),
          /native_arena_lease_cleanup_failed/,
        );
        assert.throws(
          () => native.acquireTrustedNativeArenaLease(),
          /native_arena_runtime_poisoned/,
        );
      `,
      poisonedAddon,
    ],
    { stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [
      "--expose-gc",
      "-e",
      String.raw`
        const assert = require("node:assert/strict");
        const native = require(process.argv[1]);
        (async () => {
          let finalized = false;
          const registry = new FinalizationRegistry(() => {
            finalized = true;
          });
          let lease = native.acquireTrustedNativeArenaLease();
          registry.register(lease, 1);
          lease = null;
          for (let index = 0; index < 100 && !finalized; index += 1) {
            global.gc();
            await new Promise((resolve) => setImmediate(resolve));
          }
          assert.equal(finalized, true);
          assert.throws(
            () => native.acquireTrustedNativeArenaLease(),
            /native_arena_runtime_poisoned/,
          );
        })().catch((error) => {
          console.error(error);
          process.exitCode = 1;
        });
      `,
      poisonedAddon,
    ],
    { stdio: "inherit" },
  );

  const rustcExecutable = execFileSync("where.exe", ["rustc"], {
    encoding: "utf8",
  })
    .trim()
    .split(/\r?\n/u)[0];
  const pythonRuntime = JSON.parse(
    execFileSync(
      "python",
      [
        "-c",
        "import json,platform,sys; print(json.dumps({'executable':sys.executable,'version':platform.python_version()},sort_keys=True,separators=(',',':')))",
      ],
      { encoding: "utf8" },
    ),
  );
  const producerRoot = path.join(
    repositoryRoot,
    "tools",
    "nhm2-spherical-boson-star-seed",
    "producer",
  );
  const fileBinding = (file) => {
    const bytes = readFileSync(file);
    return {
      rawSha256: sha256Bytes(bytes),
      sizeBytes: bytes.length,
    };
  };
  const rustcVersionVerbose = execFileSync("rustc", ["-Vv"], {
    encoding: "utf8",
  }).replaceAll("\r\n", "\n");
  const receiptDomain =
    "nhm2-spherical-boson-star-v2/initializer-core-first-failure-receipt/v1\n";
  const unsignedFailureReceipt = {
    artifactId:
      "nhm2.spherical_boson_star_v2_initializer_core_first_failure_receipt",
    authority: {
      candidateAdmission: false,
      candidateExecution: false,
      diagnosticTheoryGraphLamp: false,
      execution: false,
      physicalViability: false,
      propulsion: false,
      replay: false,
      transport: false,
    },
    blockers: [
      "runtime_lineage_disjoint_independent_replay_absent",
      "scientific_preseal_absent",
      "server_authenticated_observer_absent",
      "six_payload_initializer_unreachable_after_core_failure",
      "candidate_numeric_read_not_performed",
    ],
    candidateId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1",
    checkpoint: {
      amplitude: "2^-16",
      gridNodeCount: 64,
      requestedCandidateCheckpointReached: false,
      reachedBoundary: "frozen_n64_initializer_core_solve_diagnostic",
    },
    chronology: {
      authenticatedMonotonicChronologyEstablished: false,
      candidateNumericReadPerformed: false,
      coreFailurePrecedesProjection: true,
      coreFailurePrecedesSixPayloadMaterialization: true,
      nativeCleanupCompletedAfterObservation: true,
    },
    comparison: {
      exactFailureFieldsMatched: true,
      independentReplayAuthority: false,
      qualifiesAsRuntimeDisjointIndependentReplay: false,
      runtimeLineageDisjoint: false,
      sharedGmpRawSha256: expectedGmpSha256,
      sharedMpfrRawSha256: expectedMpfrSha256,
      sourceImplementationDisjoint: true,
    },
    contractVersion:
      "nhm2_spherical_boson_star_v2_initializer_core_first_failure_receipt/v1",
    frozenBindings: {
      binary64Environment: {
        rawSha256:
          "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4",
        sizeBytes: 14980,
      },
      branchSelectionSemantic: {
        canonicalSizeBytes: 41280,
        sha256:
          "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa",
      },
      initializerEvaluatorSemantic: {
        canonicalSizeBytes: 24711,
        sha256:
          "2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5",
      },
      primaryNumericsSemantic: livePrimaryNumerics,
    },
    nativeImplementation: {
      addon: fileBinding(addon),
      command: {
        argv: [
          "--edition=2021",
          "--crate-type=cdylib",
          "-C",
          "linker=<bound-rust-lld>",
          "-C",
          "opt-level=2",
          "-C",
          "link-arg=/Brepro",
          "-o",
          "<content-observed-addon>",
          "native_arena_preflight.rs",
        ],
        candidateArgumentsAccepted: false,
        workingDirectory: "repository_root",
      },
      dependencies: {
        gmp: {
          rawSha256: expectedGmpSha256,
          sizeBytes: readFileSync(gmp).length,
          version: "6.3.0",
        },
        mpfr: {
          rawSha256: expectedMpfrSha256,
          sizeBytes: readFileSync(mpfr).length,
          version: "4.2.2",
        },
      },
      observed: normalizedNativeCoreEvidence,
      runtime: {
        nodeExecutable: fileBinding(process.execPath),
        nodeVersion: process.version,
      },
      source: {
        rawSha256: actualSourceSha256,
        sizeBytes: readFileSync(source).length,
      },
      toolchain: {
        linker: fileBinding(linker),
        rustcExecutable: fileBinding(rustcExecutable),
        rustcVersionVerboseSha256: sha256Bytes(
          Buffer.from(rustcVersionVerbose, "utf8"),
        ),
      },
    },
    noRetuneAttestation: {
      alternateGridAttempted: false,
      alternateInitializerAttempted: false,
      alternatePrecisionAttempted: false,
      alternateSolverAttempted: false,
      candidateIdentityChanged: false,
      failureRuleChanged: false,
      lineSearchChanged: false,
      toleranceChanged: false,
    },
    observedFailure: normalizedNativeCoreEvidence,
    pythonComparisonImplementation: {
      command: {
        argv: ["python", "-c", "<bound-independent-source-script>"],
        candidateArgumentsAccepted: false,
        scriptSha256: sha256Bytes(Buffer.from(pythonReplayCode, "utf8")),
        workingDirectory: "repository_root",
      },
      observed: pythonCoreEvidence,
      runtime: {
        executable: fileBinding(pythonRuntime.executable),
        version: pythonRuntime.version,
      },
      sources: Object.fromEntries(
        [
          "binary64_environment.py",
          "core_initializer.py",
          "core_newton.py",
          "core_operator.py",
          "dense_lu.py",
          "spectral.py",
        ].map((name) => [name, fileBinding(path.join(producerRoot, name))]),
      ),
    },
    receiptHashDomain: receiptDomain,
    serverAuthenticatedObservation: false,
    status: "diagnostic_first_failure_observed",
  };
  const unsignedCanonicalBytes = Buffer.from(
    canonicalJson(unsignedFailureReceipt),
    "utf8",
  );
  const failureReceiptSha256 = sha256Bytes(
    Buffer.concat([
      Buffer.from(receiptDomain, "utf8"),
      u64le(unsignedCanonicalBytes.length),
      unsignedCanonicalBytes,
    ]),
  );
  const failureReceipt = {
    ...unsignedFailureReceipt,
    receiptSha256: failureReceiptSha256,
  };
  const failureReceiptBytes = Buffer.from(
    `${canonicalJson(failureReceipt)}\n`,
    "utf8",
  );
  const artifactDirectory = path.join(repositoryRoot, "docs", "research");
  assert.ok(existsSync(artifactDirectory));
  const failureReceiptPath = path.join(
    artifactDirectory,
    `nhm2-spherical-boson-star-v2-initializer-core-first-failure-${failureReceiptSha256}.json`,
  );
  const failureReceiptPersistenceRequested =
    process.env.NHM2_WRITE_FAILURE_RECEIPT === "1";
  if (failureReceiptPersistenceRequested) {
    if (existsSync(failureReceiptPath)) {
      assert.deepEqual(readFileSync(failureReceiptPath), failureReceiptBytes);
    } else {
      writeFileSync(failureReceiptPath, failureReceiptBytes, { flag: "wx" });
    }
  }
  const reparsedFailureReceipt = JSON.parse(
    failureReceiptBytes.toString("utf8"),
  );
  assert.deepEqual(reparsedFailureReceipt, failureReceipt);
  assert.equal(reparsedFailureReceipt.receiptSha256, failureReceiptSha256);
  const { receiptSha256: reparsedSelfHash, ...reparsedUnsignedReceipt } =
    reparsedFailureReceipt;
  const reparsedUnsignedBytes = Buffer.from(
    canonicalJson(reparsedUnsignedReceipt),
    "utf8",
  );
  assert.equal(
    sha256Bytes(
      Buffer.concat([
        Buffer.from(receiptDomain, "utf8"),
        u64le(reparsedUnsignedBytes.length),
        reparsedUnsignedBytes,
      ]),
    ),
    reparsedSelfHash,
  );
  assert.equal(
    reparsedFailureReceipt.comparison
      .qualifiesAsRuntimeDisjointIndependentReplay,
    false,
  );
  assert.ok(
    reparsedFailureReceipt.blockers.includes(
      "runtime_lineage_disjoint_independent_replay_absent",
    ),
  );

  console.log(
    JSON.stringify({
      status: "PASS_DIAGNOSTIC_ONLY",
      sourceSha256: actualSourceSha256,
      mpfrSha256: expectedMpfrSha256,
      gmpSha256: expectedGmpSha256,
      mpfrElementCount: receipt.mpfrElementCount,
      binary64ElementCount: receipt.binary64ElementCount,
      permutationElementCount: receipt.permutationElementCount,
      failureReceiptPath: path.relative(repositoryRoot, failureReceiptPath),
      failureReceiptPersisted: failureReceiptPersistenceRequested,
      failureReceiptSha256,
      productionRuntimeReady: false,
      executionAuthority: false,
    }),
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
