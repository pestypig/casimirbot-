# NHM2 spherical-boson-star v2 G2B-B3 Linux runtime admission

Program gate: G2B — replacement classical proof attempt  
Workstream: frozen four-grid classical branch  
Capability or component: authenticated integrated-runner Linux runtime  
Current maturity: pinned image built; runtime manifest unexecuted  
Target maturity: one admitted Linux x86_64/glibc full-fenv runtime identity  
Required frozen inputs: B1-R2 initializer, final branch policy, radial source closure, pinned runtime image  
Required evidence: loaded interpreter/library hashes, fenv observation, exact image and command binding  
Stop/fail criteria: first input, image, architecture, libc, loader, fenv, path, or output collision  
Explicit non-goals: candidate solve, alternate runtime, retune, replay authority, lamp or physical authority  
Downstream gate unlocked: integrated four-grid preexecution sealing  

This packet changes runtime authority only. It does not change mathematical
semantics, receipt thresholds, the immutable M5-R1 representation, or any claim
authority.

## Frozen predecessor bindings

- B1-R2 initializer persistence receipt raw SHA-256:
  `b4d585e834782e173e1a3d96118eb5756c728f509739ac5e126b72c895399424`,
  2,092 bytes.
- B1-R2 persistence self hash:
  `207922166d28f02c44da29a115f439d6e4185d8f48681c8416e0d53bd1ccdf5c`.
- Final branch-selection contract raw SHA-256:
  `d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82`,
  44,912 bytes.
- Final branch-selection semantic seal:
  `221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa`,
  41,280 canonical bytes.
- Radial-primary semantic seal:
  `f88e31544dfeccdbb43a5b956172c4b6b4b84f22de3b25ced762282cb5f271bc`,
  14,732 canonical bytes, including the exact eleven-source closure.

## Frozen runtime build

| Binding | Frozen value |
| --- | --- |
| Base image | `python@sha256:519591d6871b7bc437060736b9f7456b8731f1499a57e22e6c285135ae657bf7` |
| Base Python | CPython 3.12.11 |
| Runtime Dockerfile | SHA-256 `7b378a347a14e8ddc66b5f13d4aa27de81bb92cd4da125381e97f16bc818ff4d`, 1,283 bytes |
| Requirements file | SHA-256 `9ee7e73b1e5cb4ca2960a40959b1092627f202652ab2e02de765f2a613fa64fb`, 181 bytes |
| gmpy2 wheel | version 2.2.1, SHA-256 `30fba6f7cf43fb7f8474216701b5aaddfa5e6a06d560e88a67f814062934e863` |
| Built image identity | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |
| Built image OS/architecture | `linux/amd64` |
| Built image unpacked size | 47,156,614 bytes |

The image was built with `--pull=false --no-cache` from the exact base digest.
The image identity, not its mutable tag, is used for admission and every later
command. No package installation or network access is permitted in the
admission or candidate commands.

## Runtime observation graph

The bounded probe must fail closed unless it observes:

1. Linux and `x86_64`/`amd64` with an eight-byte pointer ABI;
2. glibc with a nonempty version;
3. loaded byte identities for the ELF loader, libc, GMP, MPFR, and the gmpy2
   extension;
4. `feclearexcept`, `fegetenv`, `fegetround`, `fesetenv`, `fesetround`, and
   `fetestexcept` in the process namespace;
5. `fegetround()==0`, the glibc `FE_TONEAREST` constant used by the frozen
   binary64 boundary;
6. exact interpreter size/hash and gmpy2/GMP/MPFR/MPC version strings;
7. an absent fixed output root before exclusive manifest creation and exact
   readback.

The probe source is frozen only after this packet's raw bytes are pinned into
it. A separate execution checkpoint must then bind the final probe source hash
and its static/container tests before the command below becomes eligible.

## Sole authorized admission command

From the canonical repository root on the named workstation:

```powershell
$repoPath=(Get-Location).Path
docker run --rm --volume "${repoPath}:/workspace:rw" sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_linux_runtime_probe.py --execute-once
```

The fixed output root is:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b3-linux-runtime-v1/
```

It must be absent before the sole command. Existing, partial, symlinked, or
unexpected output is terminal and must not be removed or overwritten within
this packet.

## Authority locks

Runtime admission grants only eligibility to seal the integrated runner. It
does not execute an initializer or candidate and keeps candidate, proof,
execution, replay, pair agreement, Theory Graph, diagnostic lamp, physical,
propulsion, and transport authority false.
