#![deny(unsafe_op_in_unsafe_fn)]

//! Authority-neutral native runtime boundary for the frozen spherical seed.
//!
//! One Node process owns the exact JavaScript binary64/permutation arenas and
//! the contiguous MPFR descriptor arena.  The retained lease now binds the
//! first frozen numerical components: the N=64 Lobatto spectral graph and its
//! fixed analytic L0 initializer.  It is not a candidate solver, payload
//! issuer, proof, or authority surface.

use std::ffi::{c_char, c_int, c_long, c_ulong, c_void, CStr, CString, OsStr};
use std::fs::File;
use std::io::Read;
use std::mem::MaybeUninit;
use std::os::windows::ffi::{OsStrExt, OsStringExt};
use std::os::windows::io::{AsRawHandle, FromRawHandle};
use std::path::Path;
use std::ptr::{null, null_mut};
use std::sync::Mutex;

const MPFR_ELEMENT_COUNT: usize = 65_536;
const MPFR_PRECISION_BITS: c_long = 256;
const MPFR_EMIN: c_long = -1_000_000;
const MPFR_EMAX: c_long = 1_000_000;
const BINARY64_ELEMENT_COUNT: usize = 262_144;
const BINARY64_BYTE_LENGTH: usize = 2_097_152;
const PERMUTATION_ELEMENT_COUNT: usize = 257;
const PERMUTATION_BYTE_LENGTH: usize = 1_028;
const FROZEN_N64_NODE_COUNT: usize = 64;
const MPFR_RHO_OFFSET: usize = 0;
const MPFR_WEIGHT_OFFSET: usize = 128;
const MPFR_D_OFFSET: usize = 256;
const MPFR_D2_OFFSET: usize = 16_640;
const MPFR_SCRATCH_OFFSET: usize = 33_024;
const BINARY64_RHO_OFFSET: usize = 0;
const BINARY64_D_OFFSET: usize = 128;
const BINARY64_D2_OFFSET: usize = 16_512;
const BINARY64_CURRENT_STATE_OFFSET: usize = 32_896;
const BINARY64_PROJECTED_STATE_OFFSET: usize = 33_153;
const BINARY64_TRIAL_STATE_OFFSET: usize = 33_410;
const BINARY64_CURRENT_RESIDUAL_OFFSET: usize = 33_667;
const BINARY64_TRIAL_RESIDUAL_OFFSET: usize = 33_924;
const BINARY64_DELTA_OFFSET: usize = 34_181;
const BINARY64_RHS_OFFSET: usize = 34_438;
const BINARY64_JACOBIAN_OFFSET: usize = 34_695;
const BINARY64_LU_OFFSET: usize = 100_744;
const BINARY64_REFINEMENT_RESIDUAL_OFFSET: usize = 166_793;
const BINARY64_REFINEMENT_CORRECTION_OFFSET: usize = 167_050;
const BINARY64_FORWARD_OFFSET: usize = 167_307;
const BINARY64_ACCEPTED_STEP_OFFSET: usize = 167_564;
const FROZEN_N64_CORE_ORDER: usize = 129;
const CORE_REFINEMENT_MPFR_OFFSET: usize = 33_024;
const FROZEN_N64_SPECTRAL_OPERATION_COUNT: u64 = 823_988;
const FROZEN_N64_CORE_INITIALIZER_OPERATION_COUNT: u64 = 837_901;
const NAPI_FLOAT64_ARRAY: c_int = 8;
const NAPI_UINT32_ARRAY: c_int = 6;
const NAPI_AUTO_LENGTH: usize = usize::MAX;
const LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR: u32 = 0x0000_0100;
const GENERIC_READ: u32 = 0x8000_0000;
const FILE_SHARE_READ: u32 = 0x0000_0001;
const OPEN_EXISTING: u32 = 3;
const FILE_ATTRIBUTE_NORMAL: u32 = 0x0000_0080;
const INVALID_HANDLE_VALUE: *mut c_void = usize::MAX as *mut c_void;
const TRUSTED_MPFR_SHA256: &str =
    "95b280f52d24a1fe1e024877ee325a629c3424e12961d27f84daec73d02c4bd8";
const TRUSTED_MPFR_SIZE_BYTES: u64 = 904_297;
const TRUSTED_MPFR_PATH: Option<&str> = option_env!("NHM2_TRUSTED_MPFR_DLL");
const TRUSTED_GMP_SHA256: &str = "829adcf025d22e641c6816b431fbe5b226a39b390c7205192d480151646fe9c9";
const TRUSTED_GMP_SIZE_BYTES: u64 = 1_083_865;
const TRUSTED_GMP_PATH: Option<&str> = option_env!("NHM2_TRUSTED_GMP_DLL");
const PRIMARY_NUMERICS_POLICY_SHA256: &str =
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4";
const PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: u32 = 80_055;
const BINARY64_ENVIRONMENT_SOURCE_SHA256: &str =
    "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4";
const BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: u32 = 14_980;
const WINDOWS_REQUIRED_FENV_CONTROL: u32 = 0x3f00_003f;
const WINDOWS_REQUIRED_FENV_STATUS: u32 = 0;
const WINDOWS_CONTROLFP_MASK: u32 = 0x0308_031f;
const WINDOWS_REQUIRED_CONTROLFP: u32 = 0x0008_001f;

type NapiEnv = *mut c_void;
type NapiValue = *mut c_void;
type NapiCallbackInfo = *mut c_void;
type NapiStatus = c_int;
type NapiCallback = unsafe extern "C" fn(NapiEnv, NapiCallbackInfo) -> NapiValue;
type NapiRef = *mut c_void;
type NapiFinalize = unsafe extern "C" fn(NapiEnv, *mut c_void, *mut c_void);

type NapiCreateFunction = unsafe extern "C" fn(
    NapiEnv,
    *const c_char,
    usize,
    Option<NapiCallback>,
    *mut c_void,
    *mut NapiValue,
) -> NapiStatus;
type NapiSetNamedProperty =
    unsafe extern "C" fn(NapiEnv, NapiValue, *const c_char, NapiValue) -> NapiStatus;
type NapiGetNamedProperty =
    unsafe extern "C" fn(NapiEnv, NapiValue, *const c_char, *mut NapiValue) -> NapiStatus;
type NapiCreateObject = unsafe extern "C" fn(NapiEnv, *mut NapiValue) -> NapiStatus;
type NapiCreateUint32 = unsafe extern "C" fn(NapiEnv, u32, *mut NapiValue) -> NapiStatus;
type NapiGetBoolean = unsafe extern "C" fn(NapiEnv, bool, *mut NapiValue) -> NapiStatus;
type NapiCreateStringUtf8 =
    unsafe extern "C" fn(NapiEnv, *const c_char, usize, *mut NapiValue) -> NapiStatus;
type NapiCreateArrayBuffer =
    unsafe extern "C" fn(NapiEnv, usize, *mut *mut c_void, *mut NapiValue) -> NapiStatus;
type NapiCreateTypedArray =
    unsafe extern "C" fn(NapiEnv, c_int, usize, NapiValue, usize, *mut NapiValue) -> NapiStatus;
type NapiGetTypedArrayInfo = unsafe extern "C" fn(
    NapiEnv,
    NapiValue,
    *mut c_int,
    *mut usize,
    *mut *mut c_void,
    *mut NapiValue,
    *mut usize,
) -> NapiStatus;
type NapiThrowError = unsafe extern "C" fn(NapiEnv, *const c_char, *const c_char) -> NapiStatus;
type NapiGetCbInfo = unsafe extern "C" fn(
    NapiEnv,
    NapiCallbackInfo,
    *mut usize,
    *mut NapiValue,
    *mut NapiValue,
    *mut *mut c_void,
) -> NapiStatus;
type NapiGetValueDouble = unsafe extern "C" fn(NapiEnv, NapiValue, *mut f64) -> NapiStatus;
type NapiCreateDouble = unsafe extern "C" fn(NapiEnv, f64, *mut NapiValue) -> NapiStatus;
type NapiCreateInt32 = unsafe extern "C" fn(NapiEnv, i32, *mut NapiValue) -> NapiStatus;
type NapiCreateReference =
    unsafe extern "C" fn(NapiEnv, NapiValue, u32, *mut NapiRef) -> NapiStatus;
type NapiGetReferenceValue = unsafe extern "C" fn(NapiEnv, NapiRef, *mut NapiValue) -> NapiStatus;
type NapiDeleteReference = unsafe extern "C" fn(NapiEnv, NapiRef) -> NapiStatus;
type NapiStrictEquals =
    unsafe extern "C" fn(NapiEnv, NapiValue, NapiValue, *mut bool) -> NapiStatus;
type NapiAddFinalizer = unsafe extern "C" fn(
    NapiEnv,
    NapiValue,
    *mut c_void,
    Option<NapiFinalize>,
    *mut c_void,
    *mut NapiRef,
) -> NapiStatus;
type NapiGetValueStringUtf8 =
    unsafe extern "C" fn(NapiEnv, NapiValue, *mut c_char, usize, *mut usize) -> NapiStatus;

#[link(name = "kernel32")]
unsafe extern "system" {
    fn GetModuleHandleW(name: *const u16) -> *mut c_void;
    fn LoadLibraryExW(name: *const u16, file: *mut c_void, flags: u32) -> *mut c_void;
    fn FreeLibrary(module: *mut c_void) -> c_int;
    fn GetProcAddress(module: *mut c_void, name: *const c_char) -> *mut c_void;
    fn CreateFileW(
        name: *const u16,
        desired_access: u32,
        share_mode: u32,
        security_attributes: *mut c_void,
        creation_disposition: u32,
        flags_and_attributes: u32,
        template_file: *mut c_void,
    ) -> *mut c_void;
    fn GetFileInformationByHandle(
        file: *mut c_void,
        information: *mut ByHandleFileInformation,
    ) -> c_int;
    fn GetModuleFileNameW(module: *mut c_void, filename: *mut u16, size: u32) -> u32;
    fn GetCurrentThreadId() -> u32;
}

#[repr(C)]
struct FileTime {
    low: u32,
    high: u32,
}

#[repr(C)]
struct ByHandleFileInformation {
    attributes: u32,
    creation_time: FileTime,
    last_access_time: FileTime,
    last_write_time: FileTime,
    volume_serial_number: u32,
    file_size_high: u32,
    file_size_low: u32,
    number_of_links: u32,
    file_index_high: u32,
    file_index_low: u32,
}

#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq)]
struct WindowsUcrtFenv {
    control: u32,
    status: u32,
}

type FeGetEnv = unsafe extern "C" fn(*mut WindowsUcrtFenv) -> c_int;
type FeSetEnv = unsafe extern "C" fn(*const WindowsUcrtFenv) -> c_int;
type ControlFpS = unsafe extern "C" fn(*mut u32, u32, u32) -> c_int;

struct Binary64Environment {
    caller_fenv: WindowsUcrtFenv,
    caller_controlfp_masked: u32,
    owner_thread_id: u32,
    fegetenv: FeGetEnv,
    fesetenv: FeSetEnv,
    controlfp_s: ControlFpS,
}

#[derive(Clone, Copy, PartialEq, Eq)]
struct FileIdentity {
    volume_serial_number: u32,
    file_index_high: u32,
    file_index_low: u32,
    size_bytes: u64,
}

#[repr(C)]
#[derive(Clone, Copy)]
struct Mpfr {
    precision: c_long,
    sign: c_int,
    exponent: c_long,
    limbs: *mut c_void,
}

#[repr(C)]
struct Mpz {
    allocated: c_int,
    size: c_int,
    limbs: *mut c_void,
}

type MpfrInit2 = unsafe extern "C" fn(*mut Mpfr, c_long);
type MpfrClear = unsafe extern "C" fn(*mut Mpfr);
type MpfrSetZero = unsafe extern "C" fn(*mut Mpfr, c_int);
type MpfrGetEmin = unsafe extern "C" fn() -> c_long;
type MpfrGetEmax = unsafe extern "C" fn() -> c_long;
type MpfrSetEmin = unsafe extern "C" fn(c_long) -> c_int;
type MpfrSetEmax = unsafe extern "C" fn(c_long) -> c_int;
type MpfrGetVersion = unsafe extern "C" fn() -> *const c_char;
type MpfrGetPrec = unsafe extern "C" fn(*const Mpfr) -> c_long;
type MpfrZeroP = unsafe extern "C" fn(*const Mpfr) -> c_int;
type MpfrSignbit = unsafe extern "C" fn(*const Mpfr) -> c_int;
type MpfrClearFlags = unsafe extern "C" fn();
type MpfrFlagP = unsafe extern "C" fn() -> c_int;
type MpfrSetUi = unsafe extern "C" fn(*mut Mpfr, c_ulong, c_int) -> c_int;
type MpfrSetSi = unsafe extern "C" fn(*mut Mpfr, c_long, c_int) -> c_int;
type MpfrSetD = unsafe extern "C" fn(*mut Mpfr, f64, c_int) -> c_int;
type MpfrSet = unsafe extern "C" fn(*mut Mpfr, *const Mpfr, c_int) -> c_int;
type MpfrConstPi = unsafe extern "C" fn(*mut Mpfr, c_int) -> c_int;
type MpfrBinary = unsafe extern "C" fn(*mut Mpfr, *const Mpfr, *const Mpfr, c_int) -> c_int;
type MpfrUnary = unsafe extern "C" fn(*mut Mpfr, *const Mpfr, c_int) -> c_int;
type MpfrGetD = unsafe extern "C" fn(*const Mpfr, c_int) -> f64;
type MpfrCmp = unsafe extern "C" fn(*const Mpfr, *const Mpfr) -> c_int;
type MpfrCmpUi = unsafe extern "C" fn(*const Mpfr, c_ulong) -> c_int;
type MpfrNumberP = unsafe extern "C" fn(*const Mpfr) -> c_int;
type MpfrSetZ2Exp = unsafe extern "C" fn(*mut Mpfr, *const Mpz, c_long, c_int) -> c_int;
type GmpzInit = unsafe extern "C" fn(*mut Mpz);
type GmpzClear = unsafe extern "C" fn(*mut Mpz);
type GmpzSetStr = unsafe extern "C" fn(*mut Mpz, *const c_char, c_int) -> c_int;

const MPFR_RNDN: c_int = 0;
const OP_SET_ZERO: usize = 1;
const OP_SET_UI: usize = 2;
const OP_SET_SI: usize = 3;
const OP_SET_D: usize = 4;
const OP_SET: usize = 5;
const OP_CONST_PI: usize = 6;
const OP_ADD: usize = 7;
const OP_SUB: usize = 8;
const OP_MUL: usize = 9;
const OP_DIV: usize = 10;
const OP_NEG: usize = 11;
const OP_COS: usize = 12;
const OP_SQRT: usize = 13;
const OP_EXP: usize = 14;
const OP_LOG: usize = 15;
const OP_GET_D: usize = 16;
const OP_CMP: usize = 17;
const OP_SET_Z_2EXP: usize = 18;

struct Napi {
    create_function: NapiCreateFunction,
    set_named_property: NapiSetNamedProperty,
    get_named_property: NapiGetNamedProperty,
    create_object: NapiCreateObject,
    create_uint32: NapiCreateUint32,
    get_boolean: NapiGetBoolean,
    create_string_utf8: NapiCreateStringUtf8,
    create_arraybuffer: NapiCreateArrayBuffer,
    create_typedarray: NapiCreateTypedArray,
    get_typedarray_info: NapiGetTypedArrayInfo,
    throw_error: NapiThrowError,
    get_cb_info: NapiGetCbInfo,
    get_value_double: NapiGetValueDouble,
    create_double: NapiCreateDouble,
    create_int32: NapiCreateInt32,
    create_reference: NapiCreateReference,
    get_reference_value: NapiGetReferenceValue,
    delete_reference: NapiDeleteReference,
    strict_equals: NapiStrictEquals,
    add_finalizer: NapiAddFinalizer,
    get_value_string_utf8: NapiGetValueStringUtf8,
}

struct LeaseState {
    descriptors: Vec<MaybeUninit<Mpfr>>,
    initialized: usize,
    previous_emin: c_long,
    previous_emax: c_long,
    mpfr_module: *mut c_void,
    gmp_module: *mut c_void,
    clear: MpfrClear,
    set_emin: MpfrSetEmin,
    set_emax: MpfrSetEmax,
    set_zero: MpfrSetZero,
    zero_p: MpfrZeroP,
    number_p: MpfrNumberP,
    clear_flags: MpfrClearFlags,
    nanflag_p: MpfrFlagP,
    divby0_p: MpfrFlagP,
    overflow_p: MpfrFlagP,
    underflow_p: MpfrFlagP,
    erange_p: MpfrFlagP,
    inexflag_p: MpfrFlagP,
    set_ui: MpfrSetUi,
    set_si: MpfrSetSi,
    set_d: MpfrSetD,
    set: MpfrSet,
    const_pi: MpfrConstPi,
    add: MpfrBinary,
    sub: MpfrBinary,
    mul: MpfrBinary,
    div: MpfrBinary,
    neg: MpfrUnary,
    cos: MpfrUnary,
    sqrt: MpfrUnary,
    exp: MpfrUnary,
    log: MpfrUnary,
    get_d: MpfrGetD,
    cmp: MpfrCmp,
    cmp_ui: MpfrCmpUi,
    operation_count: u64,
    operation_failed: bool,
    set_z_2exp: MpfrSetZ2Exp,
    gmpz_init: GmpzInit,
    gmpz_clear: GmpzClear,
    gmpz_set_str: GmpzSetStr,
    binary64_data: *mut f64,
    permutation_data: *mut u32,
    binary64_environment: Option<Binary64Environment>,
    frozen_n64_spectral_materialized: bool,
    frozen_n64_core_initializer_materialized: bool,
    frozen_n64_core_solve_attempted: bool,
    frozen_n64_core_solve_converged: bool,
    _mpfr_source_handle: File,
    _gmp_source_handle: File,
}

struct LibraryGuard(*mut c_void);

impl Drop for LibraryGuard {
    fn drop(&mut self) {
        if !self.0.is_null() {
            unsafe {
                FreeLibrary(self.0);
            }
        }
    }
}

unsafe impl Send for LeaseState {}

struct LeaseSlot {
    active: Option<LeaseState>,
    ever_acquired: bool,
    poisoned: bool,
    lease_reference: usize,
}

static LEASE: Mutex<LeaseSlot> = Mutex::new(LeaseSlot {
    active: None,
    ever_acquired: false,
    poisoned: false,
    lease_reference: 0,
});

unsafe fn symbol<T: Copy>(module: *mut c_void, name: &'static [u8]) -> Result<T, String> {
    let pointer = unsafe { GetProcAddress(module, name.as_ptr().cast()) };
    if pointer.is_null() {
        return Err(format!(
            "required_symbol_absent:{}",
            String::from_utf8_lossy(&name[..name.len() - 1])
        ));
    }
    Ok(unsafe { std::mem::transmute_copy::<*mut c_void, T>(&pointer) })
}

unsafe fn napi() -> Result<Napi, String> {
    let process = unsafe { GetModuleHandleW(null()) };
    if process.is_null() {
        return Err("node_process_module_unavailable".to_owned());
    }
    Ok(Napi {
        create_function: unsafe { symbol(process, b"napi_create_function\0")? },
        set_named_property: unsafe { symbol(process, b"napi_set_named_property\0")? },
        get_named_property: unsafe { symbol(process, b"napi_get_named_property\0")? },
        create_object: unsafe { symbol(process, b"napi_create_object\0")? },
        create_uint32: unsafe { symbol(process, b"napi_create_uint32\0")? },
        get_boolean: unsafe { symbol(process, b"napi_get_boolean\0")? },
        create_string_utf8: unsafe { symbol(process, b"napi_create_string_utf8\0")? },
        create_arraybuffer: unsafe { symbol(process, b"napi_create_arraybuffer\0")? },
        create_typedarray: unsafe { symbol(process, b"napi_create_typedarray\0")? },
        get_typedarray_info: unsafe { symbol(process, b"napi_get_typedarray_info\0")? },
        throw_error: unsafe { symbol(process, b"napi_throw_error\0")? },
        get_cb_info: unsafe { symbol(process, b"napi_get_cb_info\0")? },
        get_value_double: unsafe { symbol(process, b"napi_get_value_double\0")? },
        create_double: unsafe { symbol(process, b"napi_create_double\0")? },
        create_int32: unsafe { symbol(process, b"napi_create_int32\0")? },
        create_reference: unsafe { symbol(process, b"napi_create_reference\0")? },
        get_reference_value: unsafe { symbol(process, b"napi_get_reference_value\0")? },
        delete_reference: unsafe { symbol(process, b"napi_delete_reference\0")? },
        strict_equals: unsafe { symbol(process, b"napi_strict_equals\0")? },
        add_finalizer: unsafe { symbol(process, b"napi_add_finalizer\0")? },
        get_value_string_utf8: unsafe { symbol(process, b"napi_get_value_string_utf8\0")? },
    })
}

fn wide(value: &OsStr) -> Vec<u16> {
    value.encode_wide().chain(std::iter::once(0)).collect()
}

unsafe fn capture_windows_fenv(fegetenv: FeGetEnv) -> Result<WindowsUcrtFenv, String> {
    let mut captured = MaybeUninit::<WindowsUcrtFenv>::zeroed();
    if unsafe { fegetenv(captured.as_mut_ptr()) } != 0 {
        return Err("windows_fegetenv_failed".to_owned());
    }
    Ok(unsafe { captured.assume_init() })
}

unsafe fn read_windows_controlfp(controlfp_s: ControlFpS) -> Result<u32, String> {
    let mut observed = 0u32;
    if unsafe { controlfp_s(&mut observed, 0, 0) } != 0 {
        return Err("windows_controlfp_read_failed".to_owned());
    }
    Ok(observed)
}

unsafe fn restore_binary64_environment(environment: &Binary64Environment) -> Result<(), String> {
    if unsafe { GetCurrentThreadId() } != environment.owner_thread_id {
        return Err("binary64_environment_owner_thread_mismatch".to_owned());
    }
    if unsafe { (environment.fesetenv)(&environment.caller_fenv) } != 0 {
        return Err("windows_fesetenv_restore_failed".to_owned());
    }
    let restored = unsafe { capture_windows_fenv(environment.fegetenv)? };
    let restored_controlfp =
        unsafe { read_windows_controlfp(environment.controlfp_s)? } & WINDOWS_CONTROLFP_MASK;
    if restored != environment.caller_fenv
        || restored_controlfp != environment.caller_controlfp_masked
        || option_env!("NHM2_TEST_FORCE_BINARY64_RESTORE_FAILURE").is_some()
    {
        return Err("windows_caller_fenv_not_exactly_restored".to_owned());
    }
    Ok(())
}

unsafe fn install_binary64_environment() -> Result<Binary64Environment, String> {
    if std::mem::size_of::<WindowsUcrtFenv>() != 8 {
        return Err("windows_ucrt_fenv_layout_invalid".to_owned());
    }
    let module_name = wide(OsStr::new("ucrtbase.dll"));
    let module = unsafe { GetModuleHandleW(module_name.as_ptr()) };
    if module.is_null() {
        return Err("windows_ucrt_module_unavailable".to_owned());
    }
    let fegetenv: FeGetEnv = unsafe { symbol(module, b"fegetenv\0")? };
    let fesetenv: FeSetEnv = unsafe { symbol(module, b"fesetenv\0")? };
    let controlfp_s: ControlFpS = unsafe { symbol(module, b"_controlfp_s\0")? };
    let caller_fenv = unsafe { capture_windows_fenv(fegetenv)? };
    let caller_controlfp_masked =
        unsafe { read_windows_controlfp(controlfp_s)? } & WINDOWS_CONTROLFP_MASK;
    let environment = Binary64Environment {
        caller_fenv,
        caller_controlfp_masked,
        owner_thread_id: unsafe { GetCurrentThreadId() },
        fegetenv,
        fesetenv,
        controlfp_s,
    };
    let required = WindowsUcrtFenv {
        control: WINDOWS_REQUIRED_FENV_CONTROL,
        status: WINDOWS_REQUIRED_FENV_STATUS,
    };
    if unsafe { fesetenv(&required) } != 0 {
        return match unsafe { restore_binary64_environment(&environment) } {
            Ok(()) => Err("windows_fesetenv_default_failed".to_owned()),
            Err(_) => Err("binary64_restore_failed_after_setup_failure".to_owned()),
        };
    }
    let install_result = (|| unsafe {
        let observed = capture_windows_fenv(fegetenv)?;
        let observed_controlfp = read_windows_controlfp(controlfp_s)? & WINDOWS_CONTROLFP_MASK;
        if observed != required {
            return Err("windows_required_fenv_not_established".to_owned());
        }
        if observed_controlfp != WINDOWS_REQUIRED_CONTROLFP {
            return Err("windows_required_controls_not_established".to_owned());
        }
        Ok(())
    })();
    if let Err(error) = install_result {
        return match unsafe { restore_binary64_environment(&environment) } {
            Ok(()) => Err(error),
            Err(_) => Err("binary64_restore_failed_after_setup_failure".to_owned()),
        };
    }
    Ok(environment)
}

unsafe fn require_binary64_environment(state: &mut LeaseState) -> Result<(), String> {
    let environment = state
        .binary64_environment
        .as_ref()
        .ok_or_else(|| "binary64_environment_not_installed".to_owned())?;
    let result = (|| unsafe {
        if GetCurrentThreadId() != environment.owner_thread_id {
            return Err("binary64_environment_owner_thread_mismatch".to_owned());
        }
        let observed = capture_windows_fenv(environment.fegetenv)?;
        let observed_controlfp =
            read_windows_controlfp(environment.controlfp_s)? & WINDOWS_CONTROLFP_MASK;
        if observed.control != WINDOWS_REQUIRED_FENV_CONTROL
            || observed_controlfp != WINDOWS_REQUIRED_CONTROLFP
        {
            return Err("binary64_environment_controls_drifted".to_owned());
        }
        Ok(())
    })();
    if result.is_err() {
        state.operation_failed = true;
    }
    result
}

fn held_source(
    path: &Path,
    expected_size: u64,
    label: &str,
) -> Result<(File, FileIdentity), String> {
    let handle = unsafe {
        CreateFileW(
            wide(path.as_os_str()).as_ptr(),
            GENERIC_READ,
            FILE_SHARE_READ,
            null_mut(),
            OPEN_EXISTING,
            FILE_ATTRIBUTE_NORMAL,
            null_mut(),
        )
    };
    if handle.is_null() || handle == INVALID_HANDLE_VALUE {
        return Err(format!("{label}_held_source_open_failed"));
    }
    let file = unsafe { File::from_raw_handle(handle) };
    let identity = file_identity(&file, label)?;
    if identity.size_bytes != expected_size {
        return Err(format!("{label}_size_mismatch"));
    }
    Ok((file, identity))
}

fn file_identity(file: &File, label: &str) -> Result<FileIdentity, String> {
    let mut information = MaybeUninit::<ByHandleFileInformation>::zeroed();
    if unsafe { GetFileInformationByHandle(file.as_raw_handle(), information.as_mut_ptr()) } == 0 {
        return Err(format!("{label}_file_identity_failed"));
    }
    let information = unsafe { information.assume_init() };
    Ok(FileIdentity {
        volume_serial_number: information.volume_serial_number,
        file_index_high: information.file_index_high,
        file_index_low: information.file_index_low,
        size_bytes: ((information.file_size_high as u64) << 32) | information.file_size_low as u64,
    })
}

fn loaded_module_identity(
    module: *mut c_void,
    expected_size: u64,
    label: &str,
) -> Result<FileIdentity, String> {
    let mut buffer = vec![0u16; 32_768];
    let length = unsafe { GetModuleFileNameW(module, buffer.as_mut_ptr(), buffer.len() as u32) };
    if length == 0 || length as usize >= buffer.len() {
        return Err(format!("{label}_loaded_path_unavailable"));
    }
    buffer.truncate(length as usize);
    let path = std::path::PathBuf::from(std::ffi::OsString::from_wide(&buffer));
    let (file, identity) = held_source(&path, expected_size, label)?;
    drop(file);
    Ok(identity)
}

fn sha256_file(path: &Path, expected_size: u64, label: &str) -> Result<String, String> {
    const INITIAL: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];

    fn compress(state: &mut [u32; 8], block: &[u8; 64]) {
        let mut words = [0u32; 64];
        for index in 0..16 {
            words[index] = u32::from_be_bytes(block[index * 4..index * 4 + 4].try_into().unwrap());
        }
        for index in 16..64 {
            let s0 = words[index - 15].rotate_right(7)
                ^ words[index - 15].rotate_right(18)
                ^ (words[index - 15] >> 3);
            let s1 = words[index - 2].rotate_right(17)
                ^ words[index - 2].rotate_right(19)
                ^ (words[index - 2] >> 10);
            words[index] = words[index - 16]
                .wrapping_add(s0)
                .wrapping_add(words[index - 7])
                .wrapping_add(s1);
        }
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut h] = *state;
        for index in 0..64 {
            let sum1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let choice = (e & f) ^ ((!e) & g);
            let first = h
                .wrapping_add(sum1)
                .wrapping_add(choice)
                .wrapping_add(K[index])
                .wrapping_add(words[index]);
            let sum0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let second = sum0.wrapping_add((a & b) ^ (a & c) ^ (b & c));
            h = g;
            g = f;
            f = e;
            e = d.wrapping_add(first);
            d = c;
            c = b;
            b = a;
            a = first.wrapping_add(second);
        }
        for (target, value) in state.iter_mut().zip([a, b, c, d, e, f, g, h]) {
            *target = target.wrapping_add(value);
        }
    }

    let mut file = File::open(path).map_err(|_| format!("{label}_open_failed"))?;
    let length = file
        .metadata()
        .map_err(|_| format!("{label}_metadata_failed"))?
        .len();
    if length != expected_size {
        return Err(format!("{label}_size_mismatch"));
    }
    let mut state = INITIAL;
    let mut pending = Vec::with_capacity(65_600);
    let mut input = [0u8; 65_536];
    loop {
        let count = file
            .read(&mut input)
            .map_err(|_| format!("{label}_read_failed"))?;
        if count == 0 {
            break;
        }
        pending.extend_from_slice(&input[..count]);
        let complete = pending.len() / 64 * 64;
        for chunk in pending[..complete].chunks_exact(64) {
            compress(&mut state, chunk.try_into().unwrap());
        }
        pending.drain(..complete);
    }
    pending.push(0x80);
    while pending.len() % 64 != 56 {
        pending.push(0);
    }
    pending.extend_from_slice(&(length * 8).to_be_bytes());
    for chunk in pending.chunks_exact(64) {
        compress(&mut state, chunk.try_into().unwrap());
    }
    Ok(state.iter().map(|word| format!("{word:08x}")).collect())
}

fn sha256_bytes(input: &[u8]) -> String {
    const INITIAL: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];
    fn compress(state: &mut [u32; 8], block: &[u8; 64]) {
        let mut words = [0u32; 64];
        for index in 0..16 {
            words[index] = u32::from_be_bytes(block[index * 4..index * 4 + 4].try_into().unwrap());
        }
        for index in 16..64 {
            let s0 = words[index - 15].rotate_right(7)
                ^ words[index - 15].rotate_right(18)
                ^ (words[index - 15] >> 3);
            let s1 = words[index - 2].rotate_right(17)
                ^ words[index - 2].rotate_right(19)
                ^ (words[index - 2] >> 10);
            words[index] = words[index - 16]
                .wrapping_add(s0)
                .wrapping_add(words[index - 7])
                .wrapping_add(s1);
        }
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut h] = *state;
        for index in 0..64 {
            let sum1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let choice = (e & f) ^ ((!e) & g);
            let first = h
                .wrapping_add(sum1)
                .wrapping_add(choice)
                .wrapping_add(K[index])
                .wrapping_add(words[index]);
            let sum0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let second = sum0.wrapping_add((a & b) ^ (a & c) ^ (b & c));
            h = g;
            g = f;
            f = e;
            e = d.wrapping_add(first);
            d = c;
            c = b;
            b = a;
            a = first.wrapping_add(second);
        }
        for (target, value) in state.iter_mut().zip([a, b, c, d, e, f, g, h]) {
            *target = target.wrapping_add(value);
        }
    }

    let mut state = INITIAL;
    let complete = input.len() / 64 * 64;
    for chunk in input[..complete].chunks_exact(64) {
        compress(&mut state, chunk.try_into().unwrap());
    }
    let mut pending = input[complete..].to_vec();
    pending.push(0x80);
    while pending.len() % 64 != 56 {
        pending.push(0);
    }
    pending.extend_from_slice(&((input.len() as u64) * 8).to_be_bytes());
    for chunk in pending.chunks_exact(64) {
        compress(&mut state, chunk.try_into().unwrap());
    }
    state.iter().map(|word| format!("{word:08x}")).collect()
}

unsafe fn binary64_range_sha256(
    state: &LeaseState,
    offset: usize,
    element_count: usize,
) -> Result<String, String> {
    let end = offset
        .checked_add(element_count)
        .ok_or_else(|| "binary64_hash_range_overflow".to_owned())?;
    if state.binary64_data.is_null() || end > BINARY64_ELEMENT_COUNT {
        return Err("binary64_hash_range_invalid".to_owned());
    }
    let bytes = unsafe {
        std::slice::from_raw_parts(
            state.binary64_data.add(offset).cast::<u8>(),
            element_count * std::mem::size_of::<f64>(),
        )
    };
    Ok(sha256_bytes(bytes))
}

unsafe fn set_property(
    api: &Napi,
    env: NapiEnv,
    object: NapiValue,
    key: &str,
    value: NapiValue,
) -> Result<(), String> {
    let key = CString::new(key).map_err(|_| "property_key_invalid".to_owned())?;
    if unsafe { (api.set_named_property)(env, object, key.as_ptr(), value) } != 0 {
        return Err("napi_set_named_property_failed".to_owned());
    }
    Ok(())
}

unsafe fn uint32(api: &Napi, env: NapiEnv, value: u32) -> Result<NapiValue, String> {
    let mut result = null_mut();
    if unsafe { (api.create_uint32)(env, value, &mut result) } != 0 {
        return Err("napi_create_uint32_failed".to_owned());
    }
    Ok(result)
}

unsafe fn boolean(api: &Napi, env: NapiEnv, value: bool) -> Result<NapiValue, String> {
    let mut result = null_mut();
    if unsafe { (api.get_boolean)(env, value, &mut result) } != 0 {
        return Err("napi_get_boolean_failed".to_owned());
    }
    Ok(result)
}

unsafe fn string(api: &Napi, env: NapiEnv, value: &str) -> Result<NapiValue, String> {
    let value = CString::new(value).map_err(|_| "receipt_string_invalid".to_owned())?;
    let mut result = null_mut();
    if unsafe { (api.create_string_utf8)(env, value.as_ptr(), NAPI_AUTO_LENGTH, &mut result) } != 0
    {
        return Err("napi_create_string_failed".to_owned());
    }
    Ok(result)
}

unsafe fn typed_array(
    api: &Napi,
    env: NapiEnv,
    kind: c_int,
    element_count: usize,
    byte_length: usize,
) -> Result<NapiValue, String> {
    Ok(unsafe { typed_array_with_data(api, env, kind, element_count, byte_length)? }.0)
}

unsafe fn typed_array_with_data(
    api: &Napi,
    env: NapiEnv,
    kind: c_int,
    element_count: usize,
    byte_length: usize,
) -> Result<(NapiValue, *mut c_void), String> {
    let mut data = null_mut();
    let mut buffer = null_mut();
    if unsafe { (api.create_arraybuffer)(env, byte_length, &mut data, &mut buffer) } != 0
        || data.is_null()
    {
        return Err("napi_create_arraybuffer_failed".to_owned());
    }
    unsafe { std::ptr::write_bytes(data, 0, byte_length) };
    let mut view = null_mut();
    if unsafe { (api.create_typedarray)(env, kind, element_count, buffer, 0, &mut view) } != 0 {
        return Err("napi_create_typedarray_failed".to_owned());
    }
    Ok((view, data))
}

unsafe fn int32(api: &Napi, env: NapiEnv, value: i32) -> Result<NapiValue, String> {
    let mut result = null_mut();
    if unsafe { (api.create_int32)(env, value, &mut result) } != 0 {
        return Err("napi_create_int32_failed".to_owned());
    }
    Ok(result)
}

unsafe fn double(api: &Napi, env: NapiEnv, value: f64) -> Result<NapiValue, String> {
    let mut result = null_mut();
    if unsafe { (api.create_double)(env, value, &mut result) } != 0 {
        return Err("napi_create_double_failed".to_owned());
    }
    Ok(result)
}

unsafe fn numeric_argument(api: &Napi, env: NapiEnv, value: NapiValue) -> Result<f64, String> {
    let mut result = 0.0;
    if unsafe { (api.get_value_double)(env, value, &mut result) } != 0 || !result.is_finite() {
        return Err("fixed_index_numeric_argument_invalid".to_owned());
    }
    Ok(result)
}

unsafe fn dyadic_significand_argument(
    api: &Napi,
    env: NapiEnv,
    value: NapiValue,
) -> Result<String, String> {
    let mut length = 0usize;
    if unsafe { (api.get_value_string_utf8)(env, value, null_mut(), 0, &mut length) } != 0
        || length != 64
    {
        return Err("fixed_index_dyadic_significand_invalid".to_owned());
    }
    let mut bytes = [0u8; 65];
    let mut written = 0usize;
    if unsafe {
        (api.get_value_string_utf8)(
            env,
            value,
            bytes.as_mut_ptr().cast(),
            bytes.len(),
            &mut written,
        )
    } != 0
        || written != 64
        || !matches!(bytes[0], b'8'..=b'9' | b'a'..=b'f')
        || !bytes[..64]
            .iter()
            .all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'f'))
    {
        return Err("fixed_index_dyadic_significand_invalid".to_owned());
    }
    String::from_utf8(bytes[..64].to_vec())
        .map_err(|_| "fixed_index_dyadic_significand_invalid".to_owned())
}

unsafe fn index_argument(api: &Napi, env: NapiEnv, value: NapiValue) -> Result<usize, String> {
    let value = unsafe { numeric_argument(api, env, value)? };
    if value.fract() != 0.0 || value < 0.0 || value >= MPFR_ELEMENT_COUNT as f64 {
        return Err("fixed_index_mpfr_slot_out_of_range".to_owned());
    }
    Ok(value as usize)
}

unsafe fn require_lease_identity(
    api: &Napi,
    env: NapiEnv,
    this_argument: NapiValue,
    slot: &LeaseSlot,
) -> Result<(), String> {
    if slot.lease_reference == 0 {
        return Err("native_arena_lease_stale_or_closed".to_owned());
    }
    let mut expected = null_mut();
    if unsafe { (api.get_reference_value)(env, slot.lease_reference as NapiRef, &mut expected) }
        != 0
        || expected.is_null()
    {
        return Err("native_arena_lease_reference_invalid".to_owned());
    }
    let mut equal = false;
    if unsafe { (api.strict_equals)(env, this_argument, expected, &mut equal) } != 0 || !equal {
        return Err("native_arena_lease_identity_mismatch".to_owned());
    }
    Ok(())
}

unsafe fn require_binary64_backing_identity(
    api: &Napi,
    env: NapiEnv,
    lease: NapiValue,
    expected_data: *mut f64,
) -> Result<(), String> {
    let key = b"binary64Arena\0";
    let mut view = null_mut();
    if unsafe { (api.get_named_property)(env, lease, key.as_ptr().cast(), &mut view) } != 0
        || view.is_null()
    {
        return Err("frozen_n64_spectral_binary64_view_absent".to_owned());
    }
    let mut kind = -1;
    let mut element_count = 0usize;
    let mut data = null_mut();
    let mut buffer = null_mut();
    let mut byte_offset = usize::MAX;
    if unsafe {
        (api.get_typedarray_info)(
            env,
            view,
            &mut kind,
            &mut element_count,
            &mut data,
            &mut buffer,
            &mut byte_offset,
        )
    } != 0
        || kind != NAPI_FLOAT64_ARRAY
        || element_count != BINARY64_ELEMENT_COUNT
        || data != expected_data.cast()
        || buffer.is_null()
        || byte_offset != 0
    {
        return Err("frozen_n64_spectral_binary64_backing_identity_mismatch".to_owned());
    }
    Ok(())
}

unsafe fn require_permutation_backing_identity(
    api: &Napi,
    env: NapiEnv,
    lease: NapiValue,
    expected_data: *mut u32,
) -> Result<(), String> {
    let key = b"permutationArena\0";
    let mut view = null_mut();
    if unsafe { (api.get_named_property)(env, lease, key.as_ptr().cast(), &mut view) } != 0
        || view.is_null()
    {
        return Err("frozen_n64_core_permutation_view_absent".to_owned());
    }
    let mut kind = -1;
    let mut element_count = 0usize;
    let mut data = null_mut();
    let mut buffer = null_mut();
    let mut byte_offset = usize::MAX;
    if unsafe {
        (api.get_typedarray_info)(
            env,
            view,
            &mut kind,
            &mut element_count,
            &mut data,
            &mut buffer,
            &mut byte_offset,
        )
    } != 0
        || kind != NAPI_UINT32_ARRAY
        || element_count != PERMUTATION_ELEMENT_COUNT
        || data != expected_data.cast()
        || buffer.is_null()
        || byte_offset != 0
    {
        return Err("frozen_n64_core_permutation_backing_identity_mismatch".to_owned());
    }
    Ok(())
}

unsafe fn forbidden_flags(state: &LeaseState) -> bool {
    unsafe {
        (state.nanflag_p)() != 0
            || (state.divby0_p)() != 0
            || (state.overflow_p)() != 0
            || (state.underflow_p)() != 0
            || (state.erange_p)() != 0
    }
}

unsafe fn canonicalize_destination(state: &LeaseState, destination: *mut Mpfr) {
    if unsafe { (state.zero_p)(destination) } != 0 {
        unsafe { (state.set_zero)(destination, 1) };
    }
}

unsafe fn graph_record_operation(state: &mut LeaseState) -> Result<(), String> {
    state.operation_count = state
        .operation_count
        .checked_add(1)
        .ok_or_else(|| "fixed_index_operation_count_overflow".to_owned())?;
    Ok(())
}

unsafe fn graph_finish_destination(
    state: &mut LeaseState,
    destination: *mut Mpfr,
    ternary: c_int,
    exact: bool,
) -> Result<(), String> {
    let inexact = unsafe { (state.inexflag_p)() != 0 };
    let failed = unsafe {
        forbidden_flags(state)
            || (state.number_p)(destination) == 0
            || (exact && (ternary != 0 || inexact))
            || (!exact && ((ternary == 0) == inexact))
    };
    unsafe { graph_record_operation(state)? };
    if failed {
        state.operation_failed = true;
        return Err("frozen_n64_spectral_primitive_postcondition_failed".to_owned());
    }
    unsafe { canonicalize_destination(state, destination) };
    Ok(())
}

unsafe fn graph_set_ui(
    state: &mut LeaseState,
    destination_index: usize,
    value: c_ulong,
) -> Result<(), String> {
    let destination = state.descriptors[destination_index].as_mut_ptr();
    unsafe { (state.clear_flags)() };
    let ternary = unsafe { (state.set_ui)(destination, value, MPFR_RNDN) };
    unsafe { graph_finish_destination(state, destination, ternary, true) }
}

unsafe fn graph_set_si(
    state: &mut LeaseState,
    destination_index: usize,
    value: c_long,
) -> Result<(), String> {
    let destination = state.descriptors[destination_index].as_mut_ptr();
    unsafe { (state.clear_flags)() };
    let ternary = unsafe { (state.set_si)(destination, value, MPFR_RNDN) };
    unsafe { graph_finish_destination(state, destination, ternary, true) }
}

unsafe fn graph_set_d(
    state: &mut LeaseState,
    destination_index: usize,
    value: f64,
) -> Result<(), String> {
    if !value.is_finite() || (value == 0.0 && value.to_bits() != 0) {
        return Err("frozen_n64_initializer_binary64_input_invalid".to_owned());
    }
    let destination = state.descriptors[destination_index].as_mut_ptr();
    unsafe { (state.clear_flags)() };
    let ternary = unsafe { (state.set_d)(destination, value, MPFR_RNDN) };
    unsafe { graph_finish_destination(state, destination, ternary, true) }
}

unsafe fn graph_set(
    state: &mut LeaseState,
    destination_index: usize,
    source_index: usize,
) -> Result<(), String> {
    if destination_index == source_index {
        return Err("frozen_n64_spectral_destination_alias_invalid".to_owned());
    }
    let destination = state.descriptors[destination_index].as_mut_ptr();
    let source = state.descriptors[source_index].as_ptr();
    if unsafe { (state.number_p)(source) == 0 } {
        state.operation_failed = true;
        return Err("frozen_n64_spectral_nonfinite_operand".to_owned());
    }
    unsafe { (state.clear_flags)() };
    let ternary = unsafe { (state.set)(destination, source, MPFR_RNDN) };
    unsafe { graph_finish_destination(state, destination, ternary, true) }
}

unsafe fn graph_const_pi(state: &mut LeaseState, destination_index: usize) -> Result<(), String> {
    let destination = state.descriptors[destination_index].as_mut_ptr();
    unsafe { (state.clear_flags)() };
    let ternary = unsafe { (state.const_pi)(destination, MPFR_RNDN) };
    unsafe { graph_finish_destination(state, destination, ternary, false) }
}

unsafe fn graph_unary(
    state: &mut LeaseState,
    destination_index: usize,
    source_index: usize,
    function: MpfrUnary,
) -> Result<(), String> {
    if destination_index == source_index {
        return Err("frozen_n64_spectral_destination_alias_invalid".to_owned());
    }
    let destination = state.descriptors[destination_index].as_mut_ptr();
    let source = state.descriptors[source_index].as_ptr();
    if unsafe { (state.number_p)(source) == 0 } {
        state.operation_failed = true;
        return Err("frozen_n64_spectral_nonfinite_operand".to_owned());
    }
    unsafe { (state.clear_flags)() };
    let ternary = unsafe { function(destination, source, MPFR_RNDN) };
    unsafe { graph_finish_destination(state, destination, ternary, false) }
}

unsafe fn graph_binary(
    state: &mut LeaseState,
    destination_index: usize,
    left_index: usize,
    right_index: usize,
    function: MpfrBinary,
    division: bool,
) -> Result<(), String> {
    if destination_index == left_index || destination_index == right_index {
        return Err("frozen_n64_spectral_destination_alias_invalid".to_owned());
    }
    let destination = state.descriptors[destination_index].as_mut_ptr();
    let left = state.descriptors[left_index].as_ptr();
    let right = state.descriptors[right_index].as_ptr();
    if unsafe { (state.number_p)(left) == 0 || (state.number_p)(right) == 0 } {
        state.operation_failed = true;
        return Err("frozen_n64_spectral_nonfinite_operand".to_owned());
    }
    if division && unsafe { (state.cmp_ui)(right, 0) == 0 } {
        state.operation_failed = true;
        return Err("frozen_n64_spectral_division_by_zero".to_owned());
    }
    unsafe { (state.clear_flags)() };
    let ternary = unsafe { function(destination, left, right, MPFR_RNDN) };
    unsafe { graph_finish_destination(state, destination, ternary, false) }
}

unsafe fn graph_get_d(state: &mut LeaseState, source_index: usize) -> Result<f64, String> {
    let source = state.descriptors[source_index].as_ptr();
    if unsafe { (state.number_p)(source) == 0 } {
        state.operation_failed = true;
        return Err("frozen_n64_spectral_nonfinite_operand".to_owned());
    }
    unsafe { (state.clear_flags)() };
    let mut result = unsafe { (state.get_d)(source, MPFR_RNDN) };
    let failed = !result.is_finite() || unsafe { forbidden_flags(state) };
    unsafe { graph_record_operation(state)? };
    if failed {
        state.operation_failed = true;
        return Err("frozen_n64_spectral_get_d_failed".to_owned());
    }
    if result == 0.0 {
        result = 0.0;
    }
    Ok(result)
}

unsafe fn require_frozen_n64_spectral_binary_hashes(state: &LeaseState) -> Result<(), String> {
    let rho = unsafe { binary64_range_sha256(state, BINARY64_RHO_OFFSET, 64)? };
    let first = unsafe { binary64_range_sha256(state, BINARY64_D_OFFSET, 4_096)? };
    let second = unsafe { binary64_range_sha256(state, BINARY64_D2_OFFSET, 4_096)? };
    if rho != "1f42876204af11c7eebab8bba8cbcd8694270e106f19479bbbd74fc47521ecab"
        || first != "16f67212db733eade1b09c0dcaf21f4c817472c7fd5f311701aaed0fce564c70"
        || second != "708ca1b0c4033c4873403000beb6027d22682ba2f5432af07cac9b2bed7d7d76"
    {
        return Err("frozen_n64_spectral_binary_hash_mismatch".to_owned());
    }
    Ok(())
}

unsafe fn materialize_frozen_n64_spectral_graph(state: &mut LeaseState) -> Result<u64, String> {
    if state.binary64_data.is_null() {
        return Err("frozen_n64_spectral_binary64_arena_absent".to_owned());
    }
    if state.operation_failed {
        return Err("fixed_index_operation_failure_latched".to_owned());
    }
    if state.frozen_n64_spectral_materialized {
        return Err("frozen_n64_spectral_already_materialized".to_owned());
    }
    if state.operation_count != 0 {
        return Err("frozen_n64_spectral_requires_pristine_lease".to_owned());
    }
    for index in BINARY64_RHO_OFFSET..32_896 {
        if unsafe { (*state.binary64_data.add(index)).to_bits() != 0 } {
            state.operation_failed = true;
            return Err("frozen_n64_spectral_binary64_precondition_failed".to_owned());
        }
    }

    let pi = MPFR_SCRATCH_OFFSET;
    let j_value = MPFR_SCRATCH_OFFSET + 1;
    let denominator = MPFR_SCRATCH_OFFSET + 2;
    let pi_times_j = MPFR_SCRATCH_OFFSET + 3;
    let theta = MPFR_SCRATCH_OFFSET + 4;
    let cosine = MPFR_SCRATCH_OFFSET + 5;
    let one = MPFR_SCRATCH_OFFSET + 6;
    let difference = MPFR_SCRATCH_OFFSET + 7;
    let two = MPFR_SCRATCH_OFFSET + 8;

    for j in 0..FROZEN_N64_NODE_COUNT {
        unsafe { graph_set_ui(state, j_value, j as c_ulong)? };
        unsafe { graph_set_ui(state, denominator, (FROZEN_N64_NODE_COUNT - 1) as c_ulong)? };
        let rho = MPFR_RHO_OFFSET + j;
        if j == 0 {
            unsafe { graph_set_ui(state, rho, 0)? };
        } else if j == FROZEN_N64_NODE_COUNT - 1 {
            unsafe { graph_set_ui(state, rho, 1)? };
        } else {
            unsafe { graph_const_pi(state, pi)? };
            unsafe { graph_binary(state, pi_times_j, pi, j_value, state.mul, false)? };
            unsafe { graph_binary(state, theta, pi_times_j, denominator, state.div, true)? };
            unsafe { graph_unary(state, cosine, theta, state.cos)? };
            unsafe { graph_set_ui(state, one, 1)? };
            unsafe { graph_binary(state, difference, one, cosine, state.sub, false)? };
            unsafe { graph_set_ui(state, two, 2)? };
            unsafe { graph_binary(state, rho, difference, two, state.div, true)? };
        }
        let value = unsafe { graph_get_d(state, rho)? };
        unsafe { *state.binary64_data.add(BINARY64_RHO_OFFSET + j) = value };
    }

    let magnitude = MPFR_SCRATCH_OFFSET;
    let weight_two = MPFR_SCRATCH_OFFSET + 1;
    let unsigned_weight = MPFR_SCRATCH_OFFSET + 2;
    for j in 0..FROZEN_N64_NODE_COUNT {
        let weight = MPFR_WEIGHT_OFFSET + j;
        unsafe { graph_set_ui(state, magnitude, 1)? };
        if j == 0 || j == FROZEN_N64_NODE_COUNT - 1 {
            unsafe { graph_set_ui(state, weight_two, 2)? };
            unsafe {
                graph_binary(
                    state,
                    unsigned_weight,
                    magnitude,
                    weight_two,
                    state.div,
                    true,
                )?
            };
        } else {
            unsafe { graph_set(state, unsigned_weight, magnitude)? };
        }
        if j % 2 == 1 {
            unsafe { graph_unary(state, weight, unsigned_weight, state.neg)? };
        } else {
            unsafe { graph_set(state, weight, unsigned_weight)? };
        }
    }

    let d_difference = MPFR_SCRATCH_OFFSET;
    let d_denominator = MPFR_SCRATCH_OFFSET + 1;
    for row in 0..FROZEN_N64_NODE_COUNT {
        for column in 0..FROZEN_N64_NODE_COUNT {
            if row == column {
                continue;
            }
            let destination = MPFR_D_OFFSET + row * FROZEN_N64_NODE_COUNT + column;
            unsafe {
                graph_binary(
                    state,
                    d_difference,
                    MPFR_RHO_OFFSET + row,
                    MPFR_RHO_OFFSET + column,
                    state.sub,
                    false,
                )?;
                graph_binary(
                    state,
                    d_denominator,
                    MPFR_WEIGHT_OFFSET + row,
                    d_difference,
                    state.mul,
                    false,
                )?;
                graph_binary(
                    state,
                    destination,
                    MPFR_WEIGHT_OFFSET + column,
                    d_denominator,
                    state.div,
                    true,
                )?;
            }
        }
    }
    let accumulator = MPFR_SCRATCH_OFFSET;
    let next_accumulator = MPFR_SCRATCH_OFFSET + 1;
    for row in 0..FROZEN_N64_NODE_COUNT {
        unsafe { graph_set_ui(state, accumulator, 0)? };
        for column in 0..FROZEN_N64_NODE_COUNT {
            if row == column {
                continue;
            }
            unsafe {
                graph_binary(
                    state,
                    next_accumulator,
                    accumulator,
                    MPFR_D_OFFSET + row * FROZEN_N64_NODE_COUNT + column,
                    state.add,
                    false,
                )?;
                graph_set(state, accumulator, next_accumulator)?;
            }
        }
        unsafe {
            graph_unary(
                state,
                MPFR_D_OFFSET + row * FROZEN_N64_NODE_COUNT + row,
                accumulator,
                state.neg,
            )?
        };
    }
    for index in 0..FROZEN_N64_NODE_COUNT.pow(2) {
        let value = unsafe { graph_get_d(state, MPFR_D_OFFSET + index)? };
        unsafe { *state.binary64_data.add(BINARY64_D_OFFSET + index) = value };
    }

    let d2_accumulator = MPFR_SCRATCH_OFFSET;
    let term = MPFR_SCRATCH_OFFSET + 1;
    let d2_next = MPFR_SCRATCH_OFFSET + 2;
    for row in 0..FROZEN_N64_NODE_COUNT {
        for column in 0..FROZEN_N64_NODE_COUNT {
            unsafe { graph_set_ui(state, d2_accumulator, 0)? };
            for inner in 0..FROZEN_N64_NODE_COUNT {
                unsafe {
                    graph_binary(
                        state,
                        term,
                        MPFR_D_OFFSET + row * FROZEN_N64_NODE_COUNT + inner,
                        MPFR_D_OFFSET + inner * FROZEN_N64_NODE_COUNT + column,
                        state.mul,
                        false,
                    )?;
                    graph_binary(state, d2_next, d2_accumulator, term, state.add, false)?;
                    graph_set(state, d2_accumulator, d2_next)?;
                }
            }
            let destination = MPFR_D2_OFFSET + row * FROZEN_N64_NODE_COUNT + column;
            unsafe { graph_set(state, destination, d2_accumulator)? };
            let value = unsafe { graph_get_d(state, destination)? };
            unsafe {
                *state
                    .binary64_data
                    .add(BINARY64_D2_OFFSET + row * FROZEN_N64_NODE_COUNT + column) = value
            };
        }
    }
    unsafe { require_frozen_n64_spectral_binary_hashes(state)? };
    state.frozen_n64_spectral_materialized = true;
    Ok(state.operation_count)
}

unsafe fn materialize_frozen_n64_core_initializer_graph(
    state: &mut LeaseState,
) -> Result<(u64, f64, f64), String> {
    if state.frozen_n64_core_initializer_materialized {
        return Err("frozen_n64_core_initializer_already_materialized".to_owned());
    }
    if !state.frozen_n64_spectral_materialized
        || state.operation_count != FROZEN_N64_SPECTRAL_OPERATION_COUNT
    {
        return Err("frozen_n64_initializer_spectral_prerequisite_absent".to_owned());
    }
    if state.operation_failed {
        return Err("fixed_index_operation_failure_latched".to_owned());
    }
    if let Err(error) = unsafe { require_frozen_n64_spectral_binary_hashes(state) } {
        state.operation_failed = true;
        return Err(error);
    }
    for index in BINARY64_CURRENT_STATE_OFFSET..BINARY64_CURRENT_STATE_OFFSET + 257 {
        if unsafe { (*state.binary64_data.add(index)).to_bits() != 0 } {
            state.operation_failed = true;
            return Err("frozen_n64_initializer_state_precondition_failed".to_owned());
        }
    }

    let base = MPFR_SCRATCH_OFFSET;
    unsafe {
        graph_set_ui(state, base, 7)?;
        graph_set_ui(state, base + 1, 8)?;
        graph_binary(state, base + 2, base, base + 1, state.div, true)?;
        graph_unary(state, base + 3, base + 2, state.sqrt)?;
        graph_unary(state, base + 4, base + 3, state.sqrt)?;
    }
    let kg64 = unsafe { graph_get_d(state, base + 4)? };
    unsafe {
        graph_set_d(state, base, kg64)?;
        graph_binary(state, base + 1, base, base, state.mul, false)?;
        graph_unary(state, base + 2, base + 1, state.neg)?;
        graph_set_ui(state, base + 3, 2)?;
        graph_binary(state, base + 4, base + 2, base + 3, state.div, true)?;
    }
    let nu64 = unsafe { graph_get_d(state, base + 4)? };

    for node in 0..FROZEN_N64_NODE_COUNT {
        let (u_index, v_index) = if node == 0 {
            unsafe {
                graph_set_ui(state, base, 1)?;
                graph_set_d(state, base + 1, kg64)?;
                graph_binary(state, base + 2, base + 1, base + 1, state.mul, false)?;
                graph_set_ui(state, base + 3, 8)?;
                graph_binary(state, base + 4, base + 3, base + 2, state.mul, false)?;
                graph_set_si(state, base + 5, -9)?;
                graph_binary(state, base + 6, base + 5, base + 4, state.div, true)?;
            }
            (base, base + 6)
        } else if node == FROZEN_N64_NODE_COUNT - 1 {
            unsafe {
                graph_set_ui(state, base, 0)?;
                graph_set_ui(state, base + 1, 0)?;
            }
            (base, base + 1)
        } else {
            let rho64 = unsafe { *state.binary64_data.add(BINARY64_RHO_OFFSET + node) };
            if !rho64.is_finite() || !(0.0 < rho64 && rho64 < 1.0) {
                state.operation_failed = true;
                return Err("frozen_n64_initializer_rho_domain_invalid".to_owned());
            }
            unsafe {
                graph_set_d(state, base, rho64)?;
                graph_set_ui(state, base + 1, 1)?;
                graph_binary(state, base + 2, base + 1, base, state.sub, false)?;
                graph_binary(state, base + 3, base, base + 2, state.div, true)?;
                graph_set_d(state, base + 4, kg64)?;
                graph_binary(state, base + 5, base + 4, base + 3, state.mul, false)?;
                graph_unary(state, base + 6, base + 5, state.neg)?;
                graph_unary(state, base + 7, base + 6, state.exp)?;
                graph_set_ui(state, base + 8, 2)?;
                graph_binary(state, base + 9, base + 8, base + 4, state.mul, false)?;
                graph_binary(state, base + 10, base + 9, base + 3, state.mul, false)?;
                graph_unary(state, base + 11, base + 10, state.neg)?;
                graph_unary(state, base + 12, base + 11, state.exp)?;
            }

            let i_base = base + 13;
            let j_base = base + 17;
            let last_one = base + 21;
            for n in 1..=4usize {
                let factorial = base + 22;
                let factor_value = base + 23;
                let next_factorial = base + 24;
                unsafe { graph_set_ui(state, factorial, 1)? };
                for factor in 2..=n {
                    unsafe {
                        graph_set_ui(state, factor_value, factor as c_ulong)?;
                        graph_binary(
                            state,
                            next_factorial,
                            factorial,
                            factor_value,
                            state.mul,
                            false,
                        )?;
                        graph_set(state, factorial, next_factorial)?;
                    }
                }

                let series = base + 23;
                let power = base + 24;
                let j_factorial = base + 25;
                let j_value = base + 26;
                let next_power = base + 27;
                let next_j_factorial = base + 28;
                let term = base + 29;
                let next_series = base + 30;
                unsafe {
                    graph_set_ui(state, series, 0)?;
                    graph_set_ui(state, power, 1)?;
                    graph_set_ui(state, j_factorial, 1)?;
                }
                for j in 0..=n {
                    if j > 0 {
                        unsafe {
                            graph_set_ui(state, j_value, j as c_ulong)?;
                            graph_binary(state, next_power, power, base + 10, state.mul, false)?;
                            graph_set(state, power, next_power)?;
                            graph_binary(
                                state,
                                next_j_factorial,
                                j_factorial,
                                j_value,
                                state.mul,
                                false,
                            )?;
                            graph_set(state, j_factorial, next_j_factorial)?;
                        }
                    }
                    unsafe {
                        graph_binary(state, term, power, j_factorial, state.div, true)?;
                        graph_binary(state, next_series, series, term, state.add, false)?;
                        graph_set(state, series, next_series)?;
                    }
                }

                let one = base + 31;
                let exp_series = base + 32;
                let one_minus_exp_series = base + 33;
                let denominator = base + 34;
                let next_denominator = base + 35;
                let prefactor = base + 36;
                let i_value = base + 37;
                let j_result = base + 38;
                unsafe {
                    graph_set_ui(state, one, 1)?;
                    graph_binary(state, exp_series, base + 12, series, state.mul, false)?;
                    graph_binary(
                        state,
                        one_minus_exp_series,
                        one,
                        exp_series,
                        state.sub,
                        false,
                    )?;
                    graph_set_ui(state, denominator, 1)?;
                }
                for _ in 0..=n {
                    unsafe {
                        graph_binary(
                            state,
                            next_denominator,
                            denominator,
                            base + 9,
                            state.mul,
                            false,
                        )?;
                        graph_set(state, denominator, next_denominator)?;
                    }
                }
                unsafe {
                    graph_binary(state, prefactor, factorial, denominator, state.div, true)?;
                    graph_binary(
                        state,
                        i_value,
                        prefactor,
                        one_minus_exp_series,
                        state.mul,
                        false,
                    )?;
                    graph_binary(state, j_result, prefactor, exp_series, state.mul, false)?;
                    graph_set(state, i_base + n - 1, i_value)?;
                    graph_set(state, j_base + n - 1, j_result)?;
                    graph_set(state, last_one, one)?;
                }
            }

            let u_linear = base + 22;
            let u_linear_plus_one = base + 23;
            let u_value = base + 24;
            let kg_squared = base + 25;
            let two_kg_i3 = base + 26;
            let kg_squared_i4 = base + 27;
            let i_partial = base + 28;
            let i_total = base + 29;
            let i_over_x = base + 30;
            let negative_i_over_x = base + 31;
            let two_kg_j2 = base + 32;
            let kg_squared_j3 = base + 33;
            let j_partial = base + 34;
            let j_total = base + 35;
            let v_value = base + 36;
            unsafe {
                graph_binary(state, u_linear, base + 4, base + 3, state.mul, false)?;
                graph_binary(
                    state,
                    u_linear_plus_one,
                    last_one,
                    u_linear,
                    state.add,
                    false,
                )?;
                graph_binary(
                    state,
                    u_value,
                    u_linear_plus_one,
                    base + 7,
                    state.mul,
                    false,
                )?;
                graph_binary(state, kg_squared, base + 4, base + 4, state.mul, false)?;
                graph_binary(state, two_kg_i3, base + 9, i_base + 2, state.mul, false)?;
                graph_binary(
                    state,
                    kg_squared_i4,
                    kg_squared,
                    i_base + 3,
                    state.mul,
                    false,
                )?;
                graph_binary(state, i_partial, i_base + 1, two_kg_i3, state.add, false)?;
                graph_binary(state, i_total, i_partial, kg_squared_i4, state.add, false)?;
                graph_binary(state, i_over_x, i_total, base + 3, state.div, true)?;
                graph_unary(state, negative_i_over_x, i_over_x, state.neg)?;
                graph_binary(state, two_kg_j2, base + 9, j_base + 1, state.mul, false)?;
                graph_binary(
                    state,
                    kg_squared_j3,
                    kg_squared,
                    j_base + 2,
                    state.mul,
                    false,
                )?;
                graph_binary(state, j_partial, j_base, two_kg_j2, state.add, false)?;
                graph_binary(state, j_total, j_partial, kg_squared_j3, state.add, false)?;
                graph_binary(state, v_value, negative_i_over_x, j_total, state.sub, false)?;
            }
            (u_value, v_value)
        };
        let u64_value = unsafe { graph_get_d(state, u_index)? };
        let v64_value = unsafe { graph_get_d(state, v_index)? };
        if u64_value < 0.0 || v64_value > 0.0 {
            state.operation_failed = true;
            return Err("frozen_n64_initializer_field_domain_invalid".to_owned());
        }
        unsafe {
            *state
                .binary64_data
                .add(BINARY64_CURRENT_STATE_OFFSET + node) = u64_value;
            *state
                .binary64_data
                .add(BINARY64_CURRENT_STATE_OFFSET + FROZEN_N64_NODE_COUNT + node) = v64_value;
        }
    }
    if !(-0.5 < nu64 && nu64 < 0.0)
        || unsafe { (*state.binary64_data.add(BINARY64_CURRENT_STATE_OFFSET)).to_bits() }
            != 1.0f64.to_bits()
        || unsafe {
            (*state
                .binary64_data
                .add(BINARY64_CURRENT_STATE_OFFSET + FROZEN_N64_NODE_COUNT - 1))
            .to_bits()
        } != 0
        || unsafe {
            (*state
                .binary64_data
                .add(BINARY64_CURRENT_STATE_OFFSET + 2 * FROZEN_N64_NODE_COUNT - 1))
            .to_bits()
        } != 0
    {
        state.operation_failed = true;
        return Err("frozen_n64_initializer_output_invariant_failed".to_owned());
    }
    unsafe {
        *state
            .binary64_data
            .add(BINARY64_CURRENT_STATE_OFFSET + 2 * FROZEN_N64_NODE_COUNT) = nu64;
    }
    let state_hash = unsafe {
        binary64_range_sha256(
            state,
            BINARY64_CURRENT_STATE_OFFSET,
            2 * FROZEN_N64_NODE_COUNT + 1,
        )?
    };
    if state_hash != "cdac4932d5f11808a7a443fe8cb40e56c69418396f28409e9094e354722b95c5" {
        state.operation_failed = true;
        return Err("frozen_n64_initializer_state_hash_mismatch".to_owned());
    }
    if state.operation_count != FROZEN_N64_CORE_INITIALIZER_OPERATION_COUNT {
        state.operation_failed = true;
        return Err("frozen_n64_initializer_operation_count_mismatch".to_owned());
    }
    state.frozen_n64_core_initializer_materialized = true;
    Ok((state.operation_count, kg64, nu64))
}

#[inline(never)]
fn core_finish64(value: f64) -> Result<f64, String> {
    if !value.is_finite() {
        return Err("frozen_n64_core_binary64_nonfinite_intermediate".to_owned());
    }
    Ok(if value == 0.0 { 0.0 } else { value })
}

#[inline(never)]
fn core_add64(left: f64, right: f64) -> Result<f64, String> {
    core_finish64(left + right)
}

#[inline(never)]
fn core_sub64(left: f64, right: f64) -> Result<f64, String> {
    core_finish64(left - right)
}

#[inline(never)]
fn core_mul64(left: f64, right: f64) -> Result<f64, String> {
    core_finish64(left * right)
}

#[inline(never)]
fn core_div64(numerator: f64, denominator: f64) -> Result<f64, String> {
    if denominator == 0.0 {
        return Err("frozen_n64_core_binary64_division_by_zero".to_owned());
    }
    core_finish64(numerator / denominator)
}

#[inline(never)]
fn core_neg64(value: f64) -> Result<f64, String> {
    core_finish64(-value)
}

unsafe fn core_read(state: &LeaseState, offset: usize) -> f64 {
    unsafe { *state.binary64_data.add(offset) }
}

unsafe fn core_write(state: &mut LeaseState, offset: usize, value: f64) {
    unsafe { *state.binary64_data.add(offset) = value };
}

unsafe fn core_zero_range(state: &mut LeaseState, offset: usize, length: usize) {
    for index in 0..length {
        unsafe { core_write(state, offset + index, 0.0) };
    }
}

unsafe fn core_dot64(
    state: &LeaseState,
    matrix_offset: usize,
    row: usize,
    vector_offset: usize,
) -> Result<f64, String> {
    let mut accumulator = 0.0;
    for column in 0..FROZEN_N64_NODE_COUNT {
        let matrix =
            unsafe { core_read(state, matrix_offset + row * FROZEN_N64_NODE_COUNT + column) };
        let vector = unsafe { core_read(state, vector_offset + column) };
        let product = core_mul64(matrix, vector)?;
        accumulator = core_add64(accumulator, product)?;
    }
    Ok(accumulator)
}

unsafe fn core_one_minus_four(state: &LeaseState, row: usize) -> Result<f64, String> {
    let rho = unsafe { core_read(state, BINARY64_RHO_OFFSET + row) };
    let one_minus = core_sub64(1.0, rho)?;
    let squared = core_mul64(one_minus, one_minus)?;
    core_mul64(squared, squared)
}

unsafe fn core_radial_laplacian(
    state: &LeaseState,
    row: usize,
    vector_offset: usize,
) -> Result<f64, String> {
    let derivative = unsafe { core_dot64(state, BINARY64_D_OFFSET, row, vector_offset)? };
    let second = unsafe { core_dot64(state, BINARY64_D2_OFFSET, row, vector_offset)? };
    let one_minus_four = unsafe { core_one_minus_four(state, row)? };
    let twice_derivative = core_mul64(2.0, derivative)?;
    let rho = unsafe { core_read(state, BINARY64_RHO_OFFSET + row) };
    let quotient = core_div64(twice_derivative, rho)?;
    let inside = core_add64(second, quotient)?;
    core_mul64(one_minus_four, inside)
}

unsafe fn core_interior_l_entry(
    state: &LeaseState,
    row: usize,
    column: usize,
) -> Result<f64, String> {
    let one_minus_four = unsafe { core_one_minus_four(state, row)? };
    let d = unsafe {
        core_read(
            state,
            BINARY64_D_OFFSET + row * FROZEN_N64_NODE_COUNT + column,
        )
    };
    let d2 = unsafe {
        core_read(
            state,
            BINARY64_D2_OFFSET + row * FROZEN_N64_NODE_COUNT + column,
        )
    };
    let twice_d = core_mul64(2.0, d)?;
    let rho = unsafe { core_read(state, BINARY64_RHO_OFFSET + row) };
    let quotient = core_div64(twice_d, rho)?;
    let inside = core_add64(d2, quotient)?;
    core_mul64(one_minus_four, inside)
}

unsafe fn evaluate_frozen_n64_core(
    state: &mut LeaseState,
    selected_state_offset: usize,
    residual_offset: usize,
    with_jacobian: bool,
) -> Result<bool, String> {
    unsafe { core_zero_range(state, residual_offset, FROZEN_N64_CORE_ORDER) };
    if with_jacobian {
        unsafe {
            core_zero_range(
                state,
                BINARY64_JACOBIAN_OFFSET,
                FROZEN_N64_CORE_ORDER * FROZEN_N64_CORE_ORDER,
            )
        };
    }
    let nu = unsafe { core_read(state, selected_state_offset + 128) };
    for row in 0..FROZEN_N64_NODE_COUNT {
        let value = if row == 0 {
            unsafe { core_dot64(state, BINARY64_D_OFFSET, 0, selected_state_offset)? }
        } else if row == FROZEN_N64_NODE_COUNT - 1 {
            unsafe { core_read(state, selected_state_offset + row) }
        } else {
            let laplacian = unsafe { core_radial_laplacian(state, row, selected_state_offset)? };
            let half_laplacian = core_mul64(0.5, laplacian)?;
            let negative_half = core_neg64(half_laplacian)?;
            let potential =
                unsafe { core_read(state, selected_state_offset + FROZEN_N64_NODE_COUNT + row) };
            let difference = core_sub64(potential, nu)?;
            let u = unsafe { core_read(state, selected_state_offset + row) };
            let product = core_mul64(difference, u)?;
            core_add64(negative_half, product)?
        };
        unsafe { core_write(state, residual_offset + row, value) };
    }
    for row in 0..FROZEN_N64_NODE_COUNT {
        let value = if row == 0 {
            unsafe {
                core_dot64(
                    state,
                    BINARY64_D_OFFSET,
                    0,
                    selected_state_offset + FROZEN_N64_NODE_COUNT,
                )?
            }
        } else if row == FROZEN_N64_NODE_COUNT - 1 {
            unsafe { core_read(state, selected_state_offset + 127) }
        } else {
            let laplacian = unsafe {
                core_radial_laplacian(state, row, selected_state_offset + FROZEN_N64_NODE_COUNT)?
            };
            let u = unsafe { core_read(state, selected_state_offset + row) };
            core_sub64(laplacian, core_mul64(u, u)?)?
        };
        unsafe { core_write(state, residual_offset + FROZEN_N64_NODE_COUNT + row, value) };
    }
    let gauge = core_sub64(unsafe { core_read(state, selected_state_offset) }, 1.0)?;
    unsafe { core_write(state, residual_offset + 128, gauge) };

    if with_jacobian {
        for row in 0..FROZEN_N64_CORE_ORDER {
            for column in 0..FROZEN_N64_CORE_ORDER {
                let value = if row < FROZEN_N64_NODE_COUNT {
                    if row == 0 {
                        if column < FROZEN_N64_NODE_COUNT {
                            unsafe { core_read(state, BINARY64_D_OFFSET + column) }
                        } else {
                            0.0
                        }
                    } else if row == FROZEN_N64_NODE_COUNT - 1 {
                        if column == FROZEN_N64_NODE_COUNT - 1 {
                            1.0
                        } else {
                            0.0
                        }
                    } else if column < FROZEN_N64_NODE_COUNT {
                        let l_entry = unsafe { core_interior_l_entry(state, row, column)? };
                        let negative_half = core_mul64(-0.5, l_entry)?;
                        let diagonal = if column == row {
                            let potential = unsafe {
                                core_read(
                                    state,
                                    selected_state_offset + FROZEN_N64_NODE_COUNT + row,
                                )
                            };
                            core_sub64(potential, nu)?
                        } else {
                            0.0
                        };
                        core_add64(negative_half, diagonal)?
                    } else if column < 2 * FROZEN_N64_NODE_COUNT {
                        if column == FROZEN_N64_NODE_COUNT + row {
                            unsafe { core_read(state, selected_state_offset + row) }
                        } else {
                            0.0
                        }
                    } else {
                        core_neg64(unsafe { core_read(state, selected_state_offset + row) })?
                    }
                } else if row < 2 * FROZEN_N64_NODE_COUNT {
                    let potential_row = row - FROZEN_N64_NODE_COUNT;
                    if potential_row == 0 {
                        if (FROZEN_N64_NODE_COUNT..2 * FROZEN_N64_NODE_COUNT).contains(&column) {
                            unsafe {
                                core_read(state, BINARY64_D_OFFSET + column - FROZEN_N64_NODE_COUNT)
                            }
                        } else {
                            0.0
                        }
                    } else if potential_row == FROZEN_N64_NODE_COUNT - 1 {
                        if column == 2 * FROZEN_N64_NODE_COUNT - 1 {
                            1.0
                        } else {
                            0.0
                        }
                    } else if column < FROZEN_N64_NODE_COUNT {
                        if column == potential_row {
                            core_mul64(-2.0, unsafe {
                                core_read(state, selected_state_offset + potential_row)
                            })?
                        } else {
                            0.0
                        }
                    } else if column < 2 * FROZEN_N64_NODE_COUNT {
                        unsafe {
                            core_interior_l_entry(
                                state,
                                potential_row,
                                column - FROZEN_N64_NODE_COUNT,
                            )?
                        }
                    } else {
                        0.0
                    }
                } else if column == 0 {
                    1.0
                } else {
                    0.0
                };
                unsafe {
                    core_write(
                        state,
                        BINARY64_JACOBIAN_OFFSET + row * FROZEN_N64_CORE_ORDER + column,
                        value,
                    )
                };
            }
        }
    }

    for index in 0..FROZEN_N64_CORE_ORDER {
        if !unsafe { core_read(state, selected_state_offset + index) }.is_finite()
            || !unsafe { core_read(state, residual_offset + index) }.is_finite()
        {
            return Err("frozen_n64_core_domain_nonfinite".to_owned());
        }
    }
    if with_jacobian {
        for index in 0..FROZEN_N64_CORE_ORDER * FROZEN_N64_CORE_ORDER {
            if !unsafe { core_read(state, BINARY64_JACOBIAN_OFFSET + index) }.is_finite() {
                return Err("frozen_n64_core_domain_nonfinite".to_owned());
            }
        }
    }
    let scaled_nu = core_mul64(2.0f64.powi(-10), nu)?;
    Ok(nu < 0.0 && scaled_nu > -0.5 && scaled_nu < 0.0)
}

unsafe fn solve_frozen_n64_factored(
    state: &mut LeaseState,
    right_hand_side_offset: usize,
    solution_offset: usize,
) -> Result<(), String> {
    unsafe { core_zero_range(state, BINARY64_FORWARD_OFFSET, FROZEN_N64_CORE_ORDER) };
    unsafe { core_zero_range(state, solution_offset, FROZEN_N64_CORE_ORDER) };
    for row in 0..FROZEN_N64_CORE_ORDER {
        let permutation = unsafe { *state.permutation_data.add(row) as usize };
        if permutation >= FROZEN_N64_CORE_ORDER {
            return Err("frozen_n64_core_permutation_invalid".to_owned());
        }
        let mut accumulator = unsafe { core_read(state, right_hand_side_offset + permutation) };
        for column in 0..row {
            let factor = unsafe {
                core_read(
                    state,
                    BINARY64_LU_OFFSET + row * FROZEN_N64_CORE_ORDER + column,
                )
            };
            let forward = unsafe { core_read(state, BINARY64_FORWARD_OFFSET + column) };
            accumulator = core_sub64(accumulator, core_mul64(factor, forward)?)?;
        }
        unsafe { core_write(state, BINARY64_FORWARD_OFFSET + row, accumulator) };
    }
    for row in (0..FROZEN_N64_CORE_ORDER).rev() {
        let mut accumulator = unsafe { core_read(state, BINARY64_FORWARD_OFFSET + row) };
        for column in row + 1..FROZEN_N64_CORE_ORDER {
            let factor = unsafe {
                core_read(
                    state,
                    BINARY64_LU_OFFSET + row * FROZEN_N64_CORE_ORDER + column,
                )
            };
            let solution = unsafe { core_read(state, solution_offset + column) };
            accumulator = core_sub64(accumulator, core_mul64(factor, solution)?)?;
        }
        let pivot = unsafe {
            core_read(
                state,
                BINARY64_LU_OFFSET + row * FROZEN_N64_CORE_ORDER + row,
            )
        };
        if !pivot.is_finite() || pivot == 0.0 {
            return Err("frozen_n64_core_dense_lu_back_pivot_invalid".to_owned());
        }
        let solution = core_div64(accumulator, pivot)?;
        unsafe { core_write(state, solution_offset + row, solution) };
    }
    Ok(())
}

unsafe fn factor_frozen_n64_jacobian(state: &mut LeaseState) -> Result<(), String> {
    for index in 0..FROZEN_N64_CORE_ORDER * FROZEN_N64_CORE_ORDER {
        let value = unsafe { core_read(state, BINARY64_JACOBIAN_OFFSET + index) };
        unsafe { core_write(state, BINARY64_LU_OFFSET + index, value) };
    }
    for index in 0..FROZEN_N64_CORE_ORDER {
        unsafe { *state.permutation_data.add(index) = index as u32 };
    }
    for step in 0..FROZEN_N64_CORE_ORDER {
        let mut selected_row = step;
        let mut selected_magnitude = unsafe {
            core_read(
                state,
                BINARY64_LU_OFFSET + step * FROZEN_N64_CORE_ORDER + step,
            )
        }
        .abs();
        for row in step + 1..FROZEN_N64_CORE_ORDER {
            let candidate = unsafe {
                core_read(
                    state,
                    BINARY64_LU_OFFSET + row * FROZEN_N64_CORE_ORDER + step,
                )
            }
            .abs();
            if candidate > selected_magnitude {
                selected_magnitude = candidate;
                selected_row = row;
            }
        }
        if !selected_magnitude.is_finite() || selected_magnitude == 0.0 {
            return Err("frozen_n64_core_dense_lu_pivot_invalid".to_owned());
        }
        if selected_row != step {
            for column in 0..FROZEN_N64_CORE_ORDER {
                let first = BINARY64_LU_OFFSET + step * FROZEN_N64_CORE_ORDER + column;
                let second = BINARY64_LU_OFFSET + selected_row * FROZEN_N64_CORE_ORDER + column;
                let temporary = unsafe { core_read(state, first) };
                let selected = unsafe { core_read(state, second) };
                unsafe {
                    core_write(state, first, selected);
                    core_write(state, second, temporary);
                }
            }
            let temporary = unsafe { *state.permutation_data.add(step) };
            unsafe {
                *state.permutation_data.add(step) = *state.permutation_data.add(selected_row);
                *state.permutation_data.add(selected_row) = temporary;
            }
        }
        let pivot = unsafe {
            core_read(
                state,
                BINARY64_LU_OFFSET + step * FROZEN_N64_CORE_ORDER + step,
            )
        };
        if !pivot.is_finite() || pivot == 0.0 {
            return Err("frozen_n64_core_dense_lu_pivot_invalid".to_owned());
        }
        for row in step + 1..FROZEN_N64_CORE_ORDER {
            let entry = BINARY64_LU_OFFSET + row * FROZEN_N64_CORE_ORDER + step;
            let multiplier = core_div64(unsafe { core_read(state, entry) }, pivot)?;
            unsafe { core_write(state, entry, multiplier) };
            for column in step + 1..FROZEN_N64_CORE_ORDER {
                let target = BINARY64_LU_OFFSET + row * FROZEN_N64_CORE_ORDER + column;
                let pivot_entry = BINARY64_LU_OFFSET + step * FROZEN_N64_CORE_ORDER + column;
                let product = core_mul64(multiplier, unsafe { core_read(state, pivot_entry) })?;
                let updated = core_sub64(unsafe { core_read(state, target) }, product)?;
                unsafe { core_write(state, target, updated) };
            }
        }
    }
    Ok(())
}

unsafe fn frozen_n64_mpfr_refinement_residual(
    state: &mut LeaseState,
    solution_offset: usize,
) -> Result<(), String> {
    let accumulator = CORE_REFINEMENT_MPFR_OFFSET;
    let next_accumulator = accumulator + 1;
    let matrix_value = accumulator + 2;
    let solution_value = accumulator + 3;
    let product = accumulator + 4;
    let rhs_value = accumulator + 5;
    let residual_value = accumulator + 6;
    for row in 0..FROZEN_N64_CORE_ORDER {
        unsafe { graph_set_ui(state, accumulator, 0)? };
        for column in 0..FROZEN_N64_CORE_ORDER {
            let matrix = unsafe {
                core_read(
                    state,
                    BINARY64_JACOBIAN_OFFSET + row * FROZEN_N64_CORE_ORDER + column,
                )
            };
            let solution = unsafe { core_read(state, solution_offset + column) };
            unsafe {
                graph_set_d(state, matrix_value, matrix)?;
                graph_set_d(state, solution_value, solution)?;
                graph_binary(
                    state,
                    product,
                    matrix_value,
                    solution_value,
                    state.mul,
                    false,
                )?;
                graph_binary(
                    state,
                    next_accumulator,
                    accumulator,
                    product,
                    state.add,
                    false,
                )?;
                graph_set(state, accumulator, next_accumulator)?;
            }
        }
        let rhs = unsafe { core_read(state, BINARY64_RHS_OFFSET + row) };
        unsafe {
            graph_set_d(state, rhs_value, rhs)?;
            graph_binary(
                state,
                residual_value,
                rhs_value,
                accumulator,
                state.sub,
                false,
            )?;
        }
        let residual = unsafe { graph_get_d(state, residual_value)? };
        unsafe { core_write(state, BINARY64_REFINEMENT_RESIDUAL_OFFSET + row, residual) };
    }
    Ok(())
}

unsafe fn solve_frozen_n64_dense_lu(state: &mut LeaseState) -> Result<(), String> {
    unsafe {
        factor_frozen_n64_jacobian(state)?;
        solve_frozen_n64_factored(state, BINARY64_RHS_OFFSET, BINARY64_DELTA_OFFSET)?;
    }
    for _pass in 0..3 {
        unsafe { frozen_n64_mpfr_refinement_residual(state, BINARY64_DELTA_OFFSET)? };
        unsafe {
            solve_frozen_n64_factored(
                state,
                BINARY64_REFINEMENT_RESIDUAL_OFFSET,
                BINARY64_REFINEMENT_CORRECTION_OFFSET,
            )?
        };
        for index in 0..FROZEN_N64_CORE_ORDER {
            let updated = core_add64(
                unsafe { core_read(state, BINARY64_DELTA_OFFSET + index) },
                unsafe { core_read(state, BINARY64_REFINEMENT_CORRECTION_OFFSET + index) },
            )?;
            unsafe { core_write(state, BINARY64_DELTA_OFFSET + index, updated) };
        }
    }
    Ok(())
}

struct FrozenN64CoreSolveDiagnostic {
    converged: bool,
    failure_code: &'static str,
    accepted_update_count: u32,
    full_evaluation_count: u32,
    trial_attempt_count: u32,
    dense_lu_solve_count: u32,
    accepted_alpha_exponents: [u32; 48],
    accepted_alpha_count: usize,
    equation_linf: f64,
    scaled_step_linf: f64,
    projection_residual_linf: Option<f64>,
}

unsafe fn core_ordered_merit(
    state: &LeaseState,
    residual_offset: usize,
) -> Result<(f64, f64), String> {
    let mut sum_squares = 0.0;
    for row in 0..FROZEN_N64_CORE_ORDER {
        let residual = unsafe { core_read(state, residual_offset + row) };
        sum_squares = core_add64(sum_squares, core_mul64(residual, residual)?)?;
    }
    Ok((sum_squares, core_div64(sum_squares, 2.0)?))
}

unsafe fn core_equation_linf(state: &LeaseState, residual_offset: usize) -> f64 {
    let mut maximum = 0.0;
    for row in 0..FROZEN_N64_CORE_ORDER {
        let magnitude = unsafe { core_read(state, residual_offset + row) }.abs();
        if magnitude > maximum {
            maximum = magnitude;
        }
    }
    if maximum == 0.0 {
        0.0
    } else {
        maximum
    }
}

unsafe fn core_scaled_step_linf(state: &LeaseState) -> Result<f64, String> {
    let mut maximum = 0.0;
    for index in 0..FROZEN_N64_CORE_ORDER {
        let step = unsafe { core_read(state, BINARY64_ACCEPTED_STEP_OFFSET + index) }.abs();
        let accepted = unsafe { core_read(state, BINARY64_CURRENT_STATE_OFFSET + index) }.abs();
        let denominator = if accepted > 1.0 { accepted } else { 1.0 };
        let scaled = core_div64(step, denominator)?;
        if scaled > maximum {
            maximum = scaled;
        }
    }
    Ok(if maximum == 0.0 { 0.0 } else { maximum })
}

fn frozen_n64_core_failure(
    failure_code: &'static str,
    accepted_update_count: u32,
    full_evaluation_count: u32,
    trial_attempt_count: u32,
    dense_lu_solve_count: u32,
    accepted_alpha_exponents: [u32; 48],
    accepted_alpha_count: usize,
    equation_linf: f64,
    scaled_step_linf: f64,
) -> FrozenN64CoreSolveDiagnostic {
    FrozenN64CoreSolveDiagnostic {
        converged: false,
        failure_code,
        accepted_update_count,
        full_evaluation_count,
        trial_attempt_count,
        dense_lu_solve_count,
        accepted_alpha_exponents,
        accepted_alpha_count,
        equation_linf,
        scaled_step_linf,
        projection_residual_linf: None,
    }
}

unsafe fn evaluate_frozen_n64_core_solve_diagnostic(
    state: &mut LeaseState,
) -> Result<FrozenN64CoreSolveDiagnostic, String> {
    if !state.frozen_n64_spectral_materialized
        || !state.frozen_n64_core_initializer_materialized
        || state.frozen_n64_core_solve_attempted
        || state.operation_failed
    {
        return Err("frozen_n64_core_solve_precondition_failed".to_owned());
    }
    if unsafe { require_binary64_environment(state) }.is_err() {
        return Err("binary64_environment_controls_drifted".to_owned());
    }
    unsafe {
        core_zero_range(
            state,
            BINARY64_PROJECTED_STATE_OFFSET,
            FROZEN_N64_CORE_ORDER,
        );
        core_zero_range(state, BINARY64_TRIAL_STATE_OFFSET, FROZEN_N64_CORE_ORDER);
        core_zero_range(
            state,
            BINARY64_CURRENT_RESIDUAL_OFFSET,
            FROZEN_N64_CORE_ORDER,
        );
        core_zero_range(state, BINARY64_TRIAL_RESIDUAL_OFFSET, FROZEN_N64_CORE_ORDER);
        core_zero_range(state, BINARY64_DELTA_OFFSET, FROZEN_N64_CORE_ORDER);
        core_zero_range(state, BINARY64_RHS_OFFSET, FROZEN_N64_CORE_ORDER);
        core_zero_range(
            state,
            BINARY64_JACOBIAN_OFFSET,
            FROZEN_N64_CORE_ORDER * FROZEN_N64_CORE_ORDER,
        );
        core_zero_range(
            state,
            BINARY64_LU_OFFSET,
            FROZEN_N64_CORE_ORDER * FROZEN_N64_CORE_ORDER,
        );
        core_zero_range(
            state,
            BINARY64_REFINEMENT_RESIDUAL_OFFSET,
            FROZEN_N64_CORE_ORDER,
        );
        core_zero_range(
            state,
            BINARY64_REFINEMENT_CORRECTION_OFFSET,
            FROZEN_N64_CORE_ORDER,
        );
        core_zero_range(state, BINARY64_FORWARD_OFFSET, FROZEN_N64_CORE_ORDER);
        core_zero_range(state, BINARY64_ACCEPTED_STEP_OFFSET, FROZEN_N64_CORE_ORDER);
    }
    for index in 0..PERMUTATION_ELEMENT_COUNT {
        unsafe { *state.permutation_data.add(index) = 0 };
    }
    state.frozen_n64_core_solve_attempted = true;

    let mut full_evaluation_count = 1u32;
    let mut trial_attempt_count = 0u32;
    let mut dense_lu_solve_count = 0u32;
    let mut accepted_update_count = 0u32;
    let mut accepted_alpha_exponents = [0u32; 48];
    let mut accepted_alpha_count = 0usize;
    let mut consecutive = 0u32;
    let mut last_scaled_step = 0.0;

    let initial_domain = unsafe {
        evaluate_frozen_n64_core(
            state,
            BINARY64_CURRENT_STATE_OFFSET,
            BINARY64_CURRENT_RESIDUAL_OFFSET,
            true,
        )?
    };
    let mut equation_linf = unsafe { core_equation_linf(state, BINARY64_CURRENT_RESIDUAL_OFFSET) };
    if !initial_domain {
        return Ok(frozen_n64_core_failure(
            "initial_domain_invalid_without_retry",
            0,
            full_evaluation_count,
            0,
            0,
            accepted_alpha_exponents,
            0,
            equation_linf,
            0.0,
        ));
    }
    let (mut current_sum_squares, mut current_phi) =
        unsafe { core_ordered_merit(state, BINARY64_CURRENT_RESIDUAL_OFFSET)? };

    for _update_index in 0..48 {
        for row in 0..FROZEN_N64_CORE_ORDER {
            let rhs =
                core_neg64(unsafe { core_read(state, BINARY64_CURRENT_RESIDUAL_OFFSET + row) })?;
            unsafe { core_write(state, BINARY64_RHS_OFFSET + row, rhs) };
        }
        dense_lu_solve_count += 1;
        unsafe { solve_frozen_n64_dense_lu(state)? };
        let mut accepted_exponent = None;
        for exponent in 0..25u32 {
            trial_attempt_count += 1;
            let alpha = f64::from_bits(((1023u64 - exponent as u64) << 52) as u64);
            for index in 0..FROZEN_N64_CORE_ORDER {
                let step = core_mul64(alpha, unsafe {
                    core_read(state, BINARY64_DELTA_OFFSET + index)
                })?;
                let trial = core_add64(
                    unsafe { core_read(state, BINARY64_CURRENT_STATE_OFFSET + index) },
                    step,
                )?;
                unsafe {
                    core_write(state, BINARY64_ACCEPTED_STEP_OFFSET + index, step);
                    core_write(state, BINARY64_TRIAL_STATE_OFFSET + index, trial);
                }
            }
            full_evaluation_count += 1;
            let trial_domain = unsafe {
                evaluate_frozen_n64_core(
                    state,
                    BINARY64_TRIAL_STATE_OFFSET,
                    BINARY64_TRIAL_RESIDUAL_OFFSET,
                    true,
                )?
            };
            if !trial_domain {
                continue;
            }
            let (trial_sum_squares, trial_phi) =
                unsafe { core_ordered_merit(state, BINARY64_TRIAL_RESIDUAL_OFFSET)? };
            let c_alpha = core_mul64(2.0f64.powi(-12), alpha)?;
            let decrease = core_mul64(c_alpha, current_sum_squares)?;
            let armijo_rhs = core_sub64(current_phi, decrease)?;
            if trial_phi <= armijo_rhs {
                for index in 0..FROZEN_N64_CORE_ORDER {
                    let trial = unsafe { core_read(state, BINARY64_TRIAL_STATE_OFFSET + index) };
                    let residual =
                        unsafe { core_read(state, BINARY64_TRIAL_RESIDUAL_OFFSET + index) };
                    unsafe {
                        core_write(state, BINARY64_CURRENT_STATE_OFFSET + index, trial);
                        core_write(state, BINARY64_CURRENT_RESIDUAL_OFFSET + index, residual);
                    }
                }
                current_sum_squares = trial_sum_squares;
                current_phi = trial_phi;
                accepted_exponent = Some(exponent);
                break;
            }
        }
        let exponent = match accepted_exponent {
            Some(value) => value,
            None => {
                return Ok(frozen_n64_core_failure(
                    "armijo_schedule_exhausted_without_retry",
                    accepted_update_count,
                    full_evaluation_count,
                    trial_attempt_count,
                    dense_lu_solve_count,
                    accepted_alpha_exponents,
                    accepted_alpha_count,
                    equation_linf,
                    last_scaled_step,
                ));
            }
        };
        accepted_alpha_exponents[accepted_alpha_count] = exponent;
        accepted_alpha_count += 1;
        accepted_update_count += 1;
        equation_linf = unsafe { core_equation_linf(state, BINARY64_CURRENT_RESIDUAL_OFFSET) };
        last_scaled_step = unsafe { core_scaled_step_linf(state)? };
        if equation_linf <= 2.0f64.powi(-40) && last_scaled_step <= 2.0f64.powi(-42) {
            consecutive += 1;
        } else {
            consecutive = 0;
        }
        if consecutive == 2 {
            for index in 0..FROZEN_N64_CORE_ORDER {
                let value = unsafe { core_read(state, BINARY64_CURRENT_STATE_OFFSET + index) };
                unsafe { core_write(state, BINARY64_PROJECTED_STATE_OFFSET + index, value) };
            }
            unsafe {
                core_write(state, BINARY64_PROJECTED_STATE_OFFSET + 63, 0.0);
                core_write(state, BINARY64_PROJECTED_STATE_OFFSET + 127, 0.0);
            }
            let projected_domain = unsafe {
                evaluate_frozen_n64_core(
                    state,
                    BINARY64_PROJECTED_STATE_OFFSET,
                    BINARY64_TRIAL_RESIDUAL_OFFSET,
                    false,
                )?
            };
            let projection_linf =
                unsafe { core_equation_linf(state, BINARY64_TRIAL_RESIDUAL_OFFSET) };
            if !projected_domain || projection_linf > 2.0f64.powi(-40) {
                return Ok(FrozenN64CoreSolveDiagnostic {
                    converged: false,
                    failure_code: "projection_residual_gate_failed_without_retry",
                    accepted_update_count,
                    full_evaluation_count,
                    trial_attempt_count,
                    dense_lu_solve_count,
                    accepted_alpha_exponents,
                    accepted_alpha_count,
                    equation_linf,
                    scaled_step_linf: last_scaled_step,
                    projection_residual_linf: Some(projection_linf),
                });
            }
            state.frozen_n64_core_solve_converged = true;
            return Ok(FrozenN64CoreSolveDiagnostic {
                converged: true,
                failure_code: "none",
                accepted_update_count,
                full_evaluation_count,
                trial_attempt_count,
                dense_lu_solve_count,
                accepted_alpha_exponents,
                accepted_alpha_count,
                equation_linf,
                scaled_step_linf: last_scaled_step,
                projection_residual_linf: Some(projection_linf),
            });
        }
    }
    Ok(frozen_n64_core_failure(
        "maximum_updates_reached_without_retry",
        accepted_update_count,
        full_evaluation_count,
        trial_attempt_count,
        dense_lu_solve_count,
        accepted_alpha_exponents,
        accepted_alpha_count,
        equation_linf,
        last_scaled_step,
    ))
}

unsafe extern "C" fn frozen_n64_spectral_callback(
    env: NapiEnv,
    info: NapiCallbackInfo,
) -> NapiValue {
    let api = match unsafe { napi() } {
        Ok(value) => value,
        Err(_) => return null_mut(),
    };
    let result = (|| unsafe {
        let mut actual_count = 0usize;
        let mut this_argument = null_mut();
        let mut data = null_mut();
        if (api.get_cb_info)(
            env,
            info,
            &mut actual_count,
            null_mut(),
            &mut this_argument,
            &mut data,
        ) != 0
            || actual_count != 0
            || data as usize != 1
        {
            return Err("frozen_n64_spectral_callback_arity_invalid".to_owned());
        }
        let operation_count = {
            let mut slot = LEASE
                .lock()
                .map_err(|_| "native_arena_lease_lock_poisoned".to_owned())?;
            if slot.poisoned {
                return Err("native_arena_runtime_poisoned".to_owned());
            }
            require_lease_identity(&api, env, this_argument, &slot)?;
            let state = slot
                .active
                .as_mut()
                .ok_or_else(|| "native_arena_lease_stale_or_closed".to_owned())?;
            require_binary64_environment(state)?;
            require_binary64_backing_identity(&api, env, this_argument, state.binary64_data)?;
            materialize_frozen_n64_spectral_graph(state)?
        };
        let mut receipt = null_mut();
        if (api.create_object)(env, &mut receipt) != 0 {
            return Err("napi_create_frozen_n64_spectral_receipt_failed".to_owned());
        }
        for (name, value) in [
            ("frozenN64SpectralGraphBound", boolean(&api, env, true)?),
            (
                "nodeCount",
                uint32(&api, env, FROZEN_N64_NODE_COUNT as u32)?,
            ),
            (
                "fixedIndexOperationCount",
                double(&api, env, operation_count as f64)?,
            ),
            (
                "primaryNumericsPolicySha256",
                string(&api, env, PRIMARY_NUMERICS_POLICY_SHA256)?,
            ),
            (
                "primaryNumericsPolicyCanonicalSizeBytes",
                uint32(&api, env, PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES)?,
            ),
            ("candidateNumericReadPerformed", boolean(&api, env, false)?),
            ("productionRuntimeReady", boolean(&api, env, false)?),
            ("executionAuthority", boolean(&api, env, false)?),
            ("physicalAuthority", boolean(&api, env, false)?),
            ("propulsionAuthority", boolean(&api, env, false)?),
            ("transportAuthority", boolean(&api, env, false)?),
        ] {
            set_property(&api, env, receipt, name, value)?;
        }
        Ok(receipt)
    })();
    match result {
        Ok(value) => value,
        Err(message) => {
            if let Ok(message) = CString::new(message) {
                unsafe { (api.throw_error)(env, null(), message.as_ptr()) };
            }
            null_mut()
        }
    }
}

unsafe extern "C" fn frozen_n64_core_initializer_callback(
    env: NapiEnv,
    info: NapiCallbackInfo,
) -> NapiValue {
    let api = match unsafe { napi() } {
        Ok(value) => value,
        Err(_) => return null_mut(),
    };
    let result = (|| unsafe {
        let mut actual_count = 0usize;
        let mut this_argument = null_mut();
        let mut data = null_mut();
        if (api.get_cb_info)(
            env,
            info,
            &mut actual_count,
            null_mut(),
            &mut this_argument,
            &mut data,
        ) != 0
            || actual_count != 0
            || data as usize != 2
        {
            return Err("frozen_n64_core_initializer_callback_arity_invalid".to_owned());
        }
        let (operation_count, kg64, nu64) = {
            let mut slot = LEASE
                .lock()
                .map_err(|_| "native_arena_lease_lock_poisoned".to_owned())?;
            if slot.poisoned {
                return Err("native_arena_runtime_poisoned".to_owned());
            }
            require_lease_identity(&api, env, this_argument, &slot)?;
            let state = slot
                .active
                .as_mut()
                .ok_or_else(|| "native_arena_lease_stale_or_closed".to_owned())?;
            require_binary64_environment(state)?;
            require_binary64_backing_identity(&api, env, this_argument, state.binary64_data)?;
            materialize_frozen_n64_core_initializer_graph(state)?
        };
        let mut receipt = null_mut();
        if (api.create_object)(env, &mut receipt) != 0 {
            return Err("napi_create_frozen_n64_initializer_receipt_failed".to_owned());
        }
        for (name, value) in [
            ("frozenN64CoreInitializerBound", boolean(&api, env, true)?),
            (
                "nodeCount",
                uint32(&api, env, FROZEN_N64_NODE_COUNT as u32)?,
            ),
            (
                "fixedIndexOperationCount",
                double(&api, env, operation_count as f64)?,
            ),
            ("kg", double(&api, env, kg64)?),
            ("nu", double(&api, env, nu64)?),
            (
                "expectedStateF64leSha256",
                string(
                    &api,
                    env,
                    "cdac4932d5f11808a7a443fe8cb40e56c69418396f28409e9094e354722b95c5",
                )?,
            ),
            ("candidateNumericReadPerformed", boolean(&api, env, false)?),
            ("productionRuntimeReady", boolean(&api, env, false)?),
            ("executionAuthority", boolean(&api, env, false)?),
            ("physicalAuthority", boolean(&api, env, false)?),
            ("propulsionAuthority", boolean(&api, env, false)?),
            ("transportAuthority", boolean(&api, env, false)?),
        ] {
            set_property(&api, env, receipt, name, value)?;
        }
        Ok(receipt)
    })();
    match result {
        Ok(value) => value,
        Err(message) => {
            if let Ok(message) = CString::new(message) {
                unsafe { (api.throw_error)(env, null(), message.as_ptr()) };
            }
            null_mut()
        }
    }
}

unsafe extern "C" fn frozen_n64_core_solve_callback(
    env: NapiEnv,
    info: NapiCallbackInfo,
) -> NapiValue {
    let api = match unsafe { napi() } {
        Ok(value) => value,
        Err(_) => return null_mut(),
    };
    let result = (|| unsafe {
        let mut actual_count = 0usize;
        let mut this_argument = null_mut();
        let mut data = null_mut();
        if (api.get_cb_info)(
            env,
            info,
            &mut actual_count,
            null_mut(),
            &mut this_argument,
            &mut data,
        ) != 0
            || actual_count != 0
            || data as usize != 3
        {
            return Err("frozen_n64_core_solve_callback_arity_invalid".to_owned());
        }
        let (diagnostic, state_hash, residual_hash, operation_count) = {
            let mut slot = LEASE
                .lock()
                .map_err(|_| "native_arena_lease_lock_poisoned".to_owned())?;
            if slot.poisoned {
                return Err("native_arena_runtime_poisoned".to_owned());
            }
            require_lease_identity(&api, env, this_argument, &slot)?;
            let state = slot
                .active
                .as_mut()
                .ok_or_else(|| "native_arena_lease_stale_or_closed".to_owned())?;
            require_binary64_environment(state)?;
            require_binary64_backing_identity(&api, env, this_argument, state.binary64_data)?;
            require_permutation_backing_identity(&api, env, this_argument, state.permutation_data)?;
            let diagnostic = evaluate_frozen_n64_core_solve_diagnostic(state)?;
            let state_hash =
                binary64_range_sha256(state, BINARY64_CURRENT_STATE_OFFSET, FROZEN_N64_CORE_ORDER)?;
            let residual_hash = binary64_range_sha256(
                state,
                BINARY64_CURRENT_RESIDUAL_OFFSET,
                FROZEN_N64_CORE_ORDER,
            )?;
            (diagnostic, state_hash, residual_hash, state.operation_count)
        };
        let alpha_schedule = diagnostic.accepted_alpha_exponents[..diagnostic.accepted_alpha_count]
            .iter()
            .map(u32::to_string)
            .collect::<Vec<_>>()
            .join(",");
        let mut receipt = null_mut();
        if (api.create_object)(env, &mut receipt) != 0 {
            return Err("napi_create_frozen_n64_core_solve_receipt_failed".to_owned());
        }
        for (name, value) in [
            ("coreSolveAttempted", boolean(&api, env, true)?),
            (
                "coreSolveConverged",
                boolean(&api, env, diagnostic.converged)?,
            ),
            ("failureCode", string(&api, env, diagnostic.failure_code)?),
            (
                "acceptedUpdateCount",
                uint32(&api, env, diagnostic.accepted_update_count)?,
            ),
            (
                "fullEvaluationCount",
                uint32(&api, env, diagnostic.full_evaluation_count)?,
            ),
            (
                "trialAttemptCount",
                uint32(&api, env, diagnostic.trial_attempt_count)?,
            ),
            (
                "denseLuSolveCount",
                uint32(&api, env, diagnostic.dense_lu_solve_count)?,
            ),
            (
                "acceptedAlphaExponents",
                string(&api, env, &alpha_schedule)?,
            ),
            ("equationLinf", double(&api, env, diagnostic.equation_linf)?),
            (
                "scaledStepLinf",
                double(&api, env, diagnostic.scaled_step_linf)?,
            ),
            (
                "projectionResidualPresent",
                boolean(&api, env, diagnostic.projection_residual_linf.is_some())?,
            ),
            ("currentStateF64leSha256", string(&api, env, &state_hash)?),
            (
                "currentResidualF64leSha256",
                string(&api, env, &residual_hash)?,
            ),
            (
                "fixedIndexOperationCount",
                double(&api, env, operation_count as f64)?,
            ),
            ("candidateNumericReadPerformed", boolean(&api, env, false)?),
            ("productionRuntimeReady", boolean(&api, env, false)?),
            ("executionAuthority", boolean(&api, env, false)?),
            ("candidateAuthority", boolean(&api, env, false)?),
            ("theoryGraphAuthority", boolean(&api, env, false)?),
            ("physicalAuthority", boolean(&api, env, false)?),
            ("propulsionAuthority", boolean(&api, env, false)?),
            ("transportAuthority", boolean(&api, env, false)?),
        ] {
            set_property(&api, env, receipt, name, value)?;
        }
        Ok(receipt)
    })();
    match result {
        Ok(value) => value,
        Err(message) => {
            if let Ok(message) = CString::new(message) {
                unsafe { (api.throw_error)(env, null(), message.as_ptr()) };
            }
            null_mut()
        }
    }
}

unsafe extern "C" fn fixed_index_operation(env: NapiEnv, info: NapiCallbackInfo) -> NapiValue {
    let api = match unsafe { napi() } {
        Ok(value) => value,
        Err(_) => return null_mut(),
    };
    let result = (|| unsafe {
        let mut actual_count = 0usize;
        let mut this_argument = null_mut();
        let mut data = null_mut();
        if (api.get_cb_info)(
            env,
            info,
            &mut actual_count,
            null_mut(),
            &mut this_argument,
            &mut data,
        ) != 0
            || data.is_null()
        {
            return Err("fixed_index_callback_context_invalid".to_owned());
        }
        let operation = data as usize;
        let expected = match operation {
            OP_SET_ZERO | OP_CONST_PI | OP_GET_D => 1,
            OP_SET_UI | OP_SET_SI | OP_SET_D | OP_SET | OP_NEG | OP_COS | OP_SQRT | OP_EXP
            | OP_LOG | OP_CMP => 2,
            OP_ADD | OP_SUB | OP_MUL | OP_DIV => 3,
            OP_SET_Z_2EXP => 4,
            _ => return Err("fixed_index_operation_unknown".to_owned()),
        };
        if actual_count != expected {
            return Err("fixed_index_operation_arity_invalid".to_owned());
        }
        let mut probe_count = expected;
        let mut probe_arguments = [null_mut(); 4];
        if (api.get_cb_info)(
            env,
            info,
            &mut probe_count,
            probe_arguments.as_mut_ptr(),
            &mut this_argument,
            &mut data,
        ) != 0
            || probe_count != expected
        {
            return Err("fixed_index_callback_context_invalid".to_owned());
        }
        let mut slot = LEASE
            .lock()
            .map_err(|_| "native_arena_lease_lock_poisoned".to_owned())?;
        if slot.poisoned {
            return Err("native_arena_runtime_poisoned".to_owned());
        }
        require_lease_identity(&api, env, this_argument, &slot)?;
        let state = slot
            .active
            .as_mut()
            .ok_or_else(|| "native_arena_lease_stale_or_closed".to_owned())?;
        require_binary64_environment(state)?;
        if state.operation_failed {
            return Err("fixed_index_operation_failure_latched".to_owned());
        }
        if state.operation_count == u64::MAX {
            return Err("fixed_index_operation_count_overflow".to_owned());
        }
        let first = index_argument(&api, env, probe_arguments[0])?;
        let first_pointer = state.descriptors[first].as_mut_ptr();
        if operation == OP_GET_D {
            if (state.number_p)(first_pointer) == 0 {
                return Err("fixed_index_nonfinite_operand".to_owned());
            }
            (state.clear_flags)();
            let mut value = (state.get_d)(first_pointer, MPFR_RNDN);
            if !value.is_finite() || forbidden_flags(state) {
                state.operation_count += 1;
                state.operation_failed = true;
                return Err("fixed_index_forbidden_mpfr_flag".to_owned());
            }
            if value == 0.0 {
                value = 0.0;
            }
            state.operation_count += 1;
            return double(&api, env, value);
        }
        if operation == OP_CMP {
            let second = index_argument(&api, env, probe_arguments[1])?;
            let second_pointer = state.descriptors[second].as_ptr();
            if (state.number_p)(first_pointer) == 0 || (state.number_p)(second_pointer) == 0 {
                return Err("fixed_index_nonfinite_operand".to_owned());
            }
            (state.clear_flags)();
            let comparison = (state.cmp)(first_pointer, second_pointer).signum();
            if forbidden_flags(state) {
                state.operation_count += 1;
                state.operation_failed = true;
                return Err("fixed_index_forbidden_mpfr_flag".to_owned());
            }
            state.operation_count += 1;
            return int32(&api, env, comparison);
        }

        let mut exact_result_required = false;
        let ternary = match operation {
            OP_SET_ZERO => {
                (state.clear_flags)();
                (state.set_zero)(first_pointer, 1);
                exact_result_required = true;
                0
            }
            OP_SET_UI => {
                let value = numeric_argument(&api, env, probe_arguments[1])?;
                if value.fract() != 0.0 || value < 0.0 || value > c_ulong::MAX as f64 {
                    return Err("fixed_index_unsigned_integer_invalid".to_owned());
                }
                (state.clear_flags)();
                exact_result_required = true;
                (state.set_ui)(first_pointer, value as c_ulong, MPFR_RNDN)
            }
            OP_SET_SI => {
                let value = numeric_argument(&api, env, probe_arguments[1])?;
                if value.fract() != 0.0 || value < c_long::MIN as f64 || value > c_long::MAX as f64
                {
                    return Err("fixed_index_signed_integer_invalid".to_owned());
                }
                (state.clear_flags)();
                exact_result_required = true;
                (state.set_si)(first_pointer, value as c_long, MPFR_RNDN)
            }
            OP_SET_D => {
                let value = numeric_argument(&api, env, probe_arguments[1])?;
                (state.clear_flags)();
                exact_result_required = true;
                (state.set_d)(first_pointer, value, MPFR_RNDN)
            }
            OP_SET => {
                let source = index_argument(&api, env, probe_arguments[1])?;
                if source == first {
                    return Err("fixed_index_destination_alias_invalid".to_owned());
                }
                let source_pointer = state.descriptors[source].as_ptr();
                if (state.number_p)(source_pointer) == 0 {
                    return Err("fixed_index_nonfinite_operand".to_owned());
                }
                (state.clear_flags)();
                exact_result_required = true;
                (state.set)(first_pointer, source_pointer, MPFR_RNDN)
            }
            OP_SET_Z_2EXP => {
                let sign = numeric_argument(&api, env, probe_arguments[1])?;
                if sign != -1.0 && sign != 1.0 {
                    return Err("fixed_index_dyadic_sign_invalid".to_owned());
                }
                let significand = dyadic_significand_argument(&api, env, probe_arguments[2])?;
                let exponent = numeric_argument(&api, env, probe_arguments[3])?;
                if exponent.fract() != 0.0
                    || exponent < c_long::MIN as f64
                    || exponent > c_long::MAX as f64
                {
                    return Err("fixed_index_dyadic_exponent_invalid".to_owned());
                }
                let signed = if sign < 0.0 {
                    format!("-{significand}")
                } else {
                    significand
                };
                let signed = CString::new(signed)
                    .map_err(|_| "fixed_index_dyadic_significand_invalid".to_owned())?;
                let mut integer = Mpz {
                    allocated: 0,
                    size: 0,
                    limbs: null_mut(),
                };
                (state.gmpz_init)(&mut integer);
                let parsed = (state.gmpz_set_str)(&mut integer, signed.as_ptr(), 16) == 0;
                if !parsed {
                    (state.gmpz_clear)(&mut integer);
                    return Err("fixed_index_dyadic_parse_failed".to_owned());
                }
                (state.clear_flags)();
                exact_result_required = true;
                let ternary =
                    (state.set_z_2exp)(first_pointer, &integer, exponent as c_long, MPFR_RNDN);
                (state.gmpz_clear)(&mut integer);
                ternary
            }
            OP_CONST_PI => {
                (state.clear_flags)();
                (state.const_pi)(first_pointer, MPFR_RNDN)
            }
            OP_NEG | OP_COS | OP_SQRT | OP_EXP | OP_LOG => {
                let source = index_argument(&api, env, probe_arguments[1])?;
                if source == first {
                    return Err("fixed_index_destination_alias_invalid".to_owned());
                }
                let source_pointer = state.descriptors[source].as_ptr();
                if (state.number_p)(source_pointer) == 0 {
                    return Err("fixed_index_nonfinite_operand".to_owned());
                }
                let comparison = (state.cmp_ui)(source_pointer, 0);
                if operation == OP_SQRT && comparison < 0 {
                    return Err("fixed_index_sqrt_negative_argument".to_owned());
                }
                if operation == OP_LOG && comparison <= 0 {
                    return Err("fixed_index_log_nonpositive_argument".to_owned());
                }
                (state.clear_flags)();
                let function = match operation {
                    OP_NEG => state.neg,
                    OP_COS => state.cos,
                    OP_SQRT => state.sqrt,
                    OP_EXP => state.exp,
                    OP_LOG => state.log,
                    _ => unreachable!(),
                };
                function(first_pointer, source_pointer, MPFR_RNDN)
            }
            OP_ADD | OP_SUB | OP_MUL | OP_DIV => {
                let left = index_argument(&api, env, probe_arguments[1])?;
                let right = index_argument(&api, env, probe_arguments[2])?;
                if first == left || first == right {
                    return Err("fixed_index_destination_alias_invalid".to_owned());
                }
                let left_pointer = state.descriptors[left].as_ptr();
                let right_pointer = state.descriptors[right].as_ptr();
                if (state.number_p)(left_pointer) == 0 || (state.number_p)(right_pointer) == 0 {
                    return Err("fixed_index_nonfinite_operand".to_owned());
                }
                if operation == OP_DIV && (state.cmp_ui)(right_pointer, 0) == 0 {
                    return Err("fixed_index_division_by_zero".to_owned());
                }
                (state.clear_flags)();
                let function = match operation {
                    OP_ADD => state.add,
                    OP_SUB => state.sub,
                    OP_MUL => state.mul,
                    OP_DIV => state.div,
                    _ => unreachable!(),
                };
                function(first_pointer, left_pointer, right_pointer, MPFR_RNDN)
            }
            _ => return Err("fixed_index_operation_unknown".to_owned()),
        };
        let inexact = (state.inexflag_p)() != 0;
        if forbidden_flags(state)
            || (state.number_p)(first_pointer) == 0
            || (exact_result_required && (ternary != 0 || inexact))
            || (!exact_result_required && ((ternary == 0) == inexact))
        {
            state.operation_count += 1;
            state.operation_failed = true;
            return Err("fixed_index_primitive_postcondition_failed".to_owned());
        }
        canonicalize_destination(state, first_pointer);
        state.operation_count += 1;
        int32(&api, env, ternary.signum())
    })();
    match result {
        Ok(value) => value,
        Err(message) => {
            if let Ok(message) = CString::new(message) {
                unsafe { (api.throw_error)(env, null(), message.as_ptr()) };
            }
            null_mut()
        }
    }
}

unsafe fn cleanup_state(mut state: LeaseState) -> Result<(), String> {
    let environment_check = if state.binary64_environment.is_some() {
        unsafe { require_binary64_environment(&mut state) }
    } else {
        Ok(())
    };
    for index in (0..state.initialized).rev() {
        unsafe { (state.clear)(state.descriptors[index].as_mut_ptr()) };
    }
    state.initialized = 0;
    let range_restored = unsafe {
        (state.set_emin)(state.previous_emin) == 0 && (state.set_emax)(state.previous_emax) == 0
    };
    let mpfr_unloaded = unsafe { FreeLibrary(state.mpfr_module) } != 0;
    let gmp_unloaded = unsafe { FreeLibrary(state.gmp_module) } != 0;
    let environment_restored = match state.binary64_environment.take() {
        Some(environment) => unsafe { restore_binary64_environment(&environment) },
        None => Ok(()),
    };
    if let Err(error) = environment_check {
        return Err(error);
    }
    if let Err(error) = environment_restored {
        return Err(error);
    }
    if !range_restored
        || !mpfr_unloaded
        || !gmp_unloaded
        || option_env!("NHM2_TEST_FORCE_CLEANUP_FAILURE").is_some()
    {
        return Err("native_arena_lease_cleanup_failed".to_owned());
    }
    Ok(())
}

unsafe fn open_state(
    mpfr_path: &OsStr,
    gmp_path: &OsStr,
) -> Result<(LeaseState, String, String), String> {
    let mpfr_path = Path::new(mpfr_path);
    let gmp_path = Path::new(gmp_path);
    let (gmp_source_handle, gmp_source_identity) =
        held_source(gmp_path, TRUSTED_GMP_SIZE_BYTES, "trusted_gmp")?;
    let (mpfr_source_handle, mpfr_source_identity) =
        held_source(mpfr_path, TRUSTED_MPFR_SIZE_BYTES, "trusted_mpfr")?;
    if sha256_file(gmp_path, TRUSTED_GMP_SIZE_BYTES, "trusted_gmp")? != TRUSTED_GMP_SHA256 {
        return Err("trusted_gmp_sha256_mismatch".to_owned());
    }
    if sha256_file(mpfr_path, TRUSTED_MPFR_SIZE_BYTES, "trusted_mpfr")? != TRUSTED_MPFR_SHA256 {
        return Err("trusted_mpfr_sha256_mismatch".to_owned());
    }
    let gmp_module = unsafe {
        LoadLibraryExW(
            wide(gmp_path.as_os_str()).as_ptr(),
            null_mut(),
            LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR,
        )
    };
    if gmp_module.is_null() {
        return Err("trusted_gmp_dll_load_failed".to_owned());
    }
    let mut gmp_guard = LibraryGuard(gmp_module);
    let mpfr_module = unsafe {
        LoadLibraryExW(
            wide(mpfr_path.as_os_str()).as_ptr(),
            null_mut(),
            LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR,
        )
    };
    if mpfr_module.is_null() {
        return Err("trusted_mpfr_dll_load_failed".to_owned());
    }
    let mut mpfr_guard = LibraryGuard(mpfr_module);
    (|| unsafe {
        if loaded_module_identity(gmp_module, TRUSTED_GMP_SIZE_BYTES, "trusted_gmp")?
            != gmp_source_identity
            || loaded_module_identity(mpfr_module, TRUSTED_MPFR_SIZE_BYTES, "trusted_mpfr")?
                != mpfr_source_identity
        {
            return Err("trusted_loaded_module_identity_mismatch".to_owned());
        }
        if sha256_file(gmp_path, TRUSTED_GMP_SIZE_BYTES, "trusted_gmp")? != TRUSTED_GMP_SHA256
            || sha256_file(mpfr_path, TRUSTED_MPFR_SIZE_BYTES, "trusted_mpfr")?
                != TRUSTED_MPFR_SHA256
        {
            return Err("trusted_runtime_postload_sha256_mismatch".to_owned());
        }
        let init2: MpfrInit2 = symbol(mpfr_module, b"mpfr_init2\0")?;
        let clear: MpfrClear = symbol(mpfr_module, b"mpfr_clear\0")?;
        let set_zero: MpfrSetZero = symbol(mpfr_module, b"mpfr_set_zero\0")?;
        let get_emin: MpfrGetEmin = symbol(mpfr_module, b"mpfr_get_emin\0")?;
        let get_emax: MpfrGetEmax = symbol(mpfr_module, b"mpfr_get_emax\0")?;
        let set_emin: MpfrSetEmin = symbol(mpfr_module, b"mpfr_set_emin\0")?;
        let set_emax: MpfrSetEmax = symbol(mpfr_module, b"mpfr_set_emax\0")?;
        let get_version: MpfrGetVersion = symbol(mpfr_module, b"mpfr_get_version\0")?;
        let get_prec: MpfrGetPrec = symbol(mpfr_module, b"mpfr_get_prec\0")?;
        let zero_p: MpfrZeroP = symbol(mpfr_module, b"mpfr_zero_p\0")?;
        let signbit: MpfrSignbit = symbol(mpfr_module, b"mpfr_signbit\0")?;
        let number_p: MpfrNumberP = symbol(mpfr_module, b"mpfr_number_p\0")?;
        let clear_flags: MpfrClearFlags = symbol(mpfr_module, b"mpfr_clear_flags\0")?;
        let nanflag_p: MpfrFlagP = symbol(mpfr_module, b"mpfr_nanflag_p\0")?;
        let divby0_p: MpfrFlagP = symbol(mpfr_module, b"mpfr_divby0_p\0")?;
        let overflow_p: MpfrFlagP = symbol(mpfr_module, b"mpfr_overflow_p\0")?;
        let underflow_p: MpfrFlagP = symbol(mpfr_module, b"mpfr_underflow_p\0")?;
        let erange_p: MpfrFlagP = symbol(mpfr_module, b"mpfr_erangeflag_p\0")?;
        let inexflag_p: MpfrFlagP = symbol(mpfr_module, b"mpfr_inexflag_p\0")?;
        let set_ui: MpfrSetUi = symbol(mpfr_module, b"mpfr_set_ui\0")?;
        let set_si: MpfrSetSi = symbol(mpfr_module, b"mpfr_set_si\0")?;
        let set_d: MpfrSetD = symbol(mpfr_module, b"mpfr_set_d\0")?;
        let set: MpfrSet = symbol(mpfr_module, b"mpfr_set\0")?;
        let const_pi: MpfrConstPi = symbol(mpfr_module, b"mpfr_const_pi\0")?;
        let add: MpfrBinary = symbol(mpfr_module, b"mpfr_add\0")?;
        let sub: MpfrBinary = symbol(mpfr_module, b"mpfr_sub\0")?;
        let mul: MpfrBinary = symbol(mpfr_module, b"mpfr_mul\0")?;
        let div: MpfrBinary = symbol(mpfr_module, b"mpfr_div\0")?;
        let neg: MpfrUnary = symbol(mpfr_module, b"mpfr_neg\0")?;
        let cos: MpfrUnary = symbol(mpfr_module, b"mpfr_cos\0")?;
        let sqrt: MpfrUnary = symbol(mpfr_module, b"mpfr_sqrt\0")?;
        let exp: MpfrUnary = symbol(mpfr_module, b"mpfr_exp\0")?;
        let log: MpfrUnary = symbol(mpfr_module, b"mpfr_log\0")?;
        let get_d: MpfrGetD = symbol(mpfr_module, b"mpfr_get_d\0")?;
        let cmp: MpfrCmp = symbol(mpfr_module, b"mpfr_cmp\0")?;
        let cmp_ui: MpfrCmpUi = symbol(mpfr_module, b"mpfr_cmp_ui\0")?;
        let set_z_2exp: MpfrSetZ2Exp = symbol(mpfr_module, b"mpfr_set_z_2exp\0")?;
        let gmpz_init: GmpzInit = symbol(gmp_module, b"__gmpz_init\0")?;
        let gmpz_clear: GmpzClear = symbol(gmp_module, b"__gmpz_clear\0")?;
        let gmpz_set_str: GmpzSetStr = symbol(gmp_module, b"__gmpz_set_str\0")?;
        let gmp_version_symbol = GetProcAddress(gmp_module, b"__gmp_version\0".as_ptr().cast());
        if gmp_version_symbol.is_null() {
            return Err("required_symbol_absent:__gmp_version".to_owned());
        }
        let gmp_version_pointer = *(gmp_version_symbol as *const *const c_char);
        if gmp_version_pointer.is_null() {
            return Err("trusted_gmp_version_unavailable".to_owned());
        }
        let gmp_version = CStr::from_ptr(gmp_version_pointer)
            .to_str()
            .map_err(|_| "trusted_gmp_version_utf8_invalid".to_owned())?
            .to_owned();
        if gmp_version != "6.3.0" {
            return Err("trusted_gmp_version_mismatch".to_owned());
        }
        let previous_emin = get_emin();
        let previous_emax = get_emax();
        if set_emin(MPFR_EMIN) != 0 || set_emax(MPFR_EMAX) != 0 {
            let _ = set_emin(previous_emin);
            let _ = set_emax(previous_emax);
            return Err("mpfr_exponent_range_install_failed".to_owned());
        }
        let mut descriptors = Vec::new();
        if descriptors.try_reserve_exact(MPFR_ELEMENT_COUNT).is_err() {
            let _ = set_emin(previous_emin);
            let _ = set_emax(previous_emax);
            return Err("mpfr_descriptor_arena_allocation_failed".to_owned());
        }
        descriptors.resize_with(MPFR_ELEMENT_COUNT, MaybeUninit::zeroed);
        let mut initialized = 0usize;
        for index in 0..MPFR_ELEMENT_COUNT {
            let slot = descriptors[index].as_mut_ptr();
            init2(slot, MPFR_PRECISION_BITS);
            set_zero(slot, 1);
            initialized += 1;
        }
        let state = LeaseState {
            descriptors,
            initialized,
            previous_emin,
            previous_emax,
            mpfr_module,
            gmp_module,
            clear,
            set_emin,
            set_emax,
            set_zero,
            zero_p,
            number_p,
            clear_flags,
            nanflag_p,
            divby0_p,
            overflow_p,
            underflow_p,
            erange_p,
            inexflag_p,
            set_ui,
            set_si,
            set_d,
            set,
            const_pi,
            add,
            sub,
            mul,
            div,
            neg,
            cos,
            sqrt,
            exp,
            log,
            get_d,
            cmp,
            cmp_ui,
            operation_count: 0,
            operation_failed: false,
            set_z_2exp,
            gmpz_init,
            gmpz_clear,
            gmpz_set_str,
            binary64_data: null_mut(),
            permutation_data: null_mut(),
            binary64_environment: None,
            frozen_n64_spectral_materialized: false,
            frozen_n64_core_initializer_materialized: false,
            frozen_n64_core_solve_attempted: false,
            frozen_n64_core_solve_converged: false,
            _mpfr_source_handle: mpfr_source_handle,
            _gmp_source_handle: gmp_source_handle,
        };
        mpfr_guard.0 = null_mut();
        gmp_guard.0 = null_mut();
        for index in 0..state.initialized {
            let slot = state.descriptors[index].as_ptr();
            if get_prec(slot) != MPFR_PRECISION_BITS || zero_p(slot) == 0 || signbit(slot) != 0 {
                let _ = cleanup_state(state);
                return Err(format!("mpfr_slot_postcondition_failed:{index}"));
            }
        }
        let version_pointer = get_version();
        if version_pointer.is_null() {
            let _ = cleanup_state(state);
            return Err("mpfr_version_unavailable".to_owned());
        }
        let version = CStr::from_ptr(version_pointer)
            .to_str()
            .map_err(|_| "mpfr_version_utf8_invalid".to_owned())?
            .to_owned();
        if version != "4.2.2" {
            let _ = cleanup_state(state);
            return Err("trusted_mpfr_version_mismatch".to_owned());
        }
        Ok((state, version, gmp_version))
    })()
}

unsafe fn run_preflight(
    api: &Napi,
    env: NapiEnv,
    dll_path: &OsStr,
    trusted_manifest: bool,
) -> Result<NapiValue, String> {
    let module = unsafe {
        LoadLibraryExW(
            wide(dll_path).as_ptr(),
            null_mut(),
            LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR,
        )
    };
    if module.is_null() {
        return Err("diagnostic_mpfr_dll_load_failed".to_owned());
    }

    let result = (|| unsafe {
        let init2: MpfrInit2 = symbol(module, b"mpfr_init2\0")?;
        let clear: MpfrClear = symbol(module, b"mpfr_clear\0")?;
        let set_zero: MpfrSetZero = symbol(module, b"mpfr_set_zero\0")?;
        let get_emin: MpfrGetEmin = symbol(module, b"mpfr_get_emin\0")?;
        let get_emax: MpfrGetEmax = symbol(module, b"mpfr_get_emax\0")?;
        let set_emin: MpfrSetEmin = symbol(module, b"mpfr_set_emin\0")?;
        let set_emax: MpfrSetEmax = symbol(module, b"mpfr_set_emax\0")?;
        let get_version: MpfrGetVersion = symbol(module, b"mpfr_get_version\0")?;
        let get_prec: MpfrGetPrec = symbol(module, b"mpfr_get_prec\0")?;
        let zero_p: MpfrZeroP = symbol(module, b"mpfr_zero_p\0")?;
        let signbit: MpfrSignbit = symbol(module, b"mpfr_signbit\0")?;

        let previous_emin = get_emin();
        let previous_emax = get_emax();
        if set_emin(MPFR_EMIN) != 0 || set_emax(MPFR_EMAX) != 0 {
            let _ = set_emin(previous_emin);
            let _ = set_emax(previous_emax);
            return Err("mpfr_exponent_range_install_failed".to_owned());
        }

        let mut descriptors: Vec<MaybeUninit<Mpfr>> = Vec::new();
        descriptors
            .try_reserve_exact(MPFR_ELEMENT_COUNT)
            .map_err(|_| "mpfr_descriptor_arena_allocation_failed".to_owned())?;
        descriptors.resize_with(MPFR_ELEMENT_COUNT, MaybeUninit::zeroed);

        let mut initialized = 0usize;
        for index in 0..MPFR_ELEMENT_COUNT {
            let slot = descriptors[index].as_mut_ptr();
            init2(slot, MPFR_PRECISION_BITS);
            set_zero(slot, 1);
            initialized += 1;
        }
        for index in 0..initialized {
            let slot = descriptors[index].as_ptr();
            if get_prec(slot) != MPFR_PRECISION_BITS || zero_p(slot) == 0 || signbit(slot) != 0 {
                for clear_index in (0..initialized).rev() {
                    clear(descriptors[clear_index].as_mut_ptr());
                }
                let _ = set_emin(previous_emin);
                let _ = set_emax(previous_emax);
                return Err(format!("mpfr_slot_postcondition_failed:{index}"));
            }
        }

        let binary64 = typed_array(
            api,
            env,
            NAPI_FLOAT64_ARRAY,
            BINARY64_ELEMENT_COUNT,
            BINARY64_BYTE_LENGTH,
        );
        let permutation = typed_array(
            api,
            env,
            NAPI_UINT32_ARRAY,
            PERMUTATION_ELEMENT_COUNT,
            PERMUTATION_BYTE_LENGTH,
        );

        for index in (0..initialized).rev() {
            clear(descriptors[index].as_mut_ptr());
        }
        let restore_ok = set_emin(previous_emin) == 0 && set_emax(previous_emax) == 0;
        if !restore_ok {
            return Err("mpfr_exponent_range_restore_failed".to_owned());
        }
        let binary64 = binary64?;
        let permutation = permutation?;

        let version_pointer = get_version();
        if version_pointer.is_null() {
            return Err("mpfr_version_unavailable".to_owned());
        }
        let version = CStr::from_ptr(version_pointer)
            .to_str()
            .map_err(|_| "mpfr_version_utf8_invalid".to_owned())?;

        let mut receipt = null_mut();
        if (api.create_object)(env, &mut receipt) != 0 {
            return Err("napi_create_receipt_failed".to_owned());
        }
        set_property(
            api,
            env,
            receipt,
            "mpfrElementCount",
            uint32(api, env, MPFR_ELEMENT_COUNT as u32)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "mpfrDescriptorSizeBytes",
            uint32(api, env, std::mem::size_of::<Mpfr>() as u32)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "mpfrPrecisionBits",
            uint32(api, env, MPFR_PRECISION_BITS as u32)?,
        )?;
        set_property(api, env, receipt, "mpfrVersion", string(api, env, version)?)?;
        set_property(api, env, receipt, "binary64Arena", binary64)?;
        set_property(api, env, receipt, "permutationArena", permutation)?;
        set_property(
            api,
            env,
            receipt,
            "increasingInitializationObserved",
            boolean(api, env, true)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "everyMpfrSlotPrecisionAndPositiveZeroVerified",
            boolean(api, env, true)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "decreasingClearObserved",
            boolean(api, env, true)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "exponentRangeRestored",
            boolean(api, env, true)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "trustedRuntimeManifestInstalled",
            boolean(api, env, trusted_manifest)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "productionRuntimeReady",
            boolean(api, env, false)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "candidateNumericReadPerformed",
            boolean(api, env, false)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "executionAuthority",
            boolean(api, env, false)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "physicalAuthority",
            boolean(api, env, false)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "propulsionAuthority",
            boolean(api, env, false)?,
        )?;
        set_property(
            api,
            env,
            receipt,
            "transportAuthority",
            boolean(api, env, false)?,
        )?;
        Ok(receipt)
    })();

    unsafe { FreeLibrary(module) };
    result
}

unsafe extern "C" fn preflight(env: NapiEnv, _info: NapiCallbackInfo) -> NapiValue {
    let api = match unsafe { napi() } {
        Ok(value) => value,
        Err(_) => return null_mut(),
    };
    let dll_path = match std::env::var_os("NHM2_DIAGNOSTIC_MPFR_DLL") {
        Some(value) => value,
        None => {
            if let Ok(message) = CString::new("diagnostic_mpfr_dll_path_absent") {
                unsafe { (api.throw_error)(env, null(), message.as_ptr()) };
            }
            return null_mut();
        }
    };
    match unsafe { run_preflight(&api, env, &dll_path, false) } {
        Ok(value) => value,
        Err(message) => {
            if let Ok(message) = CString::new(message) {
                unsafe { (api.throw_error)(env, null(), message.as_ptr()) };
            }
            null_mut()
        }
    }
}

unsafe extern "C" fn trusted_preflight(env: NapiEnv, _info: NapiCallbackInfo) -> NapiValue {
    let api = match unsafe { napi() } {
        Ok(value) => value,
        Err(_) => return null_mut(),
    };
    let result = (|| {
        let path =
            TRUSTED_MPFR_PATH.ok_or_else(|| "trusted_runtime_manifest_not_installed".to_owned())?;
        let path = Path::new(path);
        let gmp_path =
            TRUSTED_GMP_PATH.ok_or_else(|| "trusted_runtime_manifest_not_installed".to_owned())?;
        let gmp_path = Path::new(gmp_path);
        if path.parent() != gmp_path.parent() {
            return Err("trusted_runtime_library_directory_mismatch".to_owned());
        }
        let observed = sha256_file(path, TRUSTED_MPFR_SIZE_BYTES, "trusted_mpfr")?;
        if observed != TRUSTED_MPFR_SHA256 {
            return Err("trusted_mpfr_sha256_mismatch".to_owned());
        }
        if sha256_file(gmp_path, TRUSTED_GMP_SIZE_BYTES, "trusted_gmp")? != TRUSTED_GMP_SHA256 {
            return Err("trusted_gmp_sha256_mismatch".to_owned());
        }
        unsafe { run_preflight(&api, env, path.as_os_str(), true) }
    })();
    match result {
        Ok(value) => value,
        Err(message) => {
            if let Ok(message) = CString::new(message) {
                unsafe { (api.throw_error)(env, null(), message.as_ptr()) };
            }
            null_mut()
        }
    }
}

unsafe extern "C" fn close_trusted_lease(env: NapiEnv, info: NapiCallbackInfo) -> NapiValue {
    let api = match unsafe { napi() } {
        Ok(value) => value,
        Err(_) => return null_mut(),
    };
    let result = (|| unsafe {
        let mut argument_count = 0usize;
        let mut this_argument = null_mut();
        let mut data = null_mut();
        if (api.get_cb_info)(
            env,
            info,
            &mut argument_count,
            null_mut(),
            &mut this_argument,
            &mut data,
        ) != 0
        {
            return Err("native_arena_lease_close_context_invalid".to_owned());
        }
        if argument_count != 0 || data as usize != 1 {
            return Err("native_arena_lease_close_capability_invalid".to_owned());
        }
        let (state, lease_reference) = {
            let mut slot = LEASE
                .lock()
                .map_err(|_| "native_arena_lease_lock_poisoned".to_owned())?;
            require_lease_identity(&api, env, this_argument, &slot)?;
            let state = slot
                .active
                .take()
                .ok_or_else(|| "native_arena_lease_stale_or_closed".to_owned())?;
            let reference = slot.lease_reference as NapiRef;
            slot.lease_reference = 0;
            (state, reference)
        };
        let operation_count = state.operation_count;
        let operation_failed = state.operation_failed;
        let frozen_n64_spectral_materialized = state.frozen_n64_spectral_materialized;
        let frozen_n64_core_initializer_materialized =
            state.frozen_n64_core_initializer_materialized;
        let frozen_n64_core_solve_attempted = state.frozen_n64_core_solve_attempted;
        let frozen_n64_core_solve_converged = state.frozen_n64_core_solve_converged;
        if !lease_reference.is_null() {
            let _ = (api.delete_reference)(env, lease_reference);
        }
        if let Err(error) = cleanup_state(state) {
            if let Ok(mut slot) = LEASE.lock() {
                slot.poisoned = true;
            }
            return Err(error);
        }
        let mut receipt = null_mut();
        if (api.create_object)(env, &mut receipt) != 0 {
            return Err("napi_create_close_receipt_failed".to_owned());
        }
        set_property(&api, env, receipt, "leaseClosed", boolean(&api, env, true)?)?;
        set_property(
            &api,
            env,
            receipt,
            "decreasingClearObserved",
            boolean(&api, env, true)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "exponentRangeRestored",
            boolean(&api, env, true)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "nativeModuleUnloaded",
            boolean(&api, env, true)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "binary64EnvironmentHeldUntilCleanup",
            boolean(&api, env, true)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "binary64EnvironmentCallerStateRestored",
            boolean(&api, env, true)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "binary64EnvironmentCleanupOnOwningThread",
            boolean(&api, env, true)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "fixedIndexOperationCount",
            double(&api, env, operation_count as f64)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "fixedIndexOperationFailureLatched",
            boolean(&api, env, operation_failed)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "frozenN64SpectralGraphMaterialized",
            boolean(&api, env, frozen_n64_spectral_materialized)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "frozenN64CoreInitializerMaterialized",
            boolean(&api, env, frozen_n64_core_initializer_materialized)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "frozenN64CoreSolveAttempted",
            boolean(&api, env, frozen_n64_core_solve_attempted)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "frozenN64CoreSolveConverged",
            boolean(&api, env, frozen_n64_core_solve_converged)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "executionAuthority",
            boolean(&api, env, false)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "physicalAuthority",
            boolean(&api, env, false)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "propulsionAuthority",
            boolean(&api, env, false)?,
        )?;
        set_property(
            &api,
            env,
            receipt,
            "transportAuthority",
            boolean(&api, env, false)?,
        )?;
        Ok(receipt)
    })();
    match result {
        Ok(value) => value,
        Err(message) => {
            if let Ok(message) = CString::new(message) {
                unsafe { (api.throw_error)(env, null(), message.as_ptr()) };
            }
            null_mut()
        }
    }
}

unsafe extern "C" fn finalize_trusted_lease(_env: NapiEnv, data: *mut c_void, _hint: *mut c_void) {
    if data as usize != 1 {
        return;
    }
    let state = match LEASE.lock() {
        Ok(mut slot) => {
            let state = slot.active.take();
            slot.lease_reference = 0;
            state
        }
        Err(_) => return,
    };
    if let Some(state) = state {
        if unsafe { cleanup_state(state) }.is_err() {
            if let Ok(mut slot) = LEASE.lock() {
                slot.poisoned = true;
            }
        }
    }
}

unsafe extern "C" fn acquire_trusted_lease(env: NapiEnv, _info: NapiCallbackInfo) -> NapiValue {
    let api = match unsafe { napi() } {
        Ok(value) => value,
        Err(_) => return null_mut(),
    };
    let result = (|| unsafe {
        let path =
            TRUSTED_MPFR_PATH.ok_or_else(|| "trusted_runtime_manifest_not_installed".to_owned())?;
        let path = Path::new(path);
        let gmp_path =
            TRUSTED_GMP_PATH.ok_or_else(|| "trusted_runtime_manifest_not_installed".to_owned())?;
        let gmp_path = Path::new(gmp_path);
        if path.parent() != gmp_path.parent() {
            return Err("trusted_runtime_library_directory_mismatch".to_owned());
        }
        if sha256_file(path, TRUSTED_MPFR_SIZE_BYTES, "trusted_mpfr")? != TRUSTED_MPFR_SHA256 {
            return Err("trusted_mpfr_sha256_mismatch".to_owned());
        }
        if sha256_file(gmp_path, TRUSTED_GMP_SIZE_BYTES, "trusted_gmp")? != TRUSTED_GMP_SHA256 {
            return Err("trusted_gmp_sha256_mismatch".to_owned());
        }
        let mut slot = LEASE
            .lock()
            .map_err(|_| "native_arena_lease_lock_poisoned".to_owned())?;
        if slot.poisoned {
            return Err("native_arena_runtime_poisoned".to_owned());
        }
        if slot.active.is_some() {
            return Err("native_arena_lease_already_active".to_owned());
        }
        if slot.ever_acquired {
            return Err("native_arena_lease_already_consumed".to_owned());
        }
        let (mut state, version, gmp_version) = open_state(path.as_os_str(), gmp_path.as_os_str())?;
        state.binary64_environment = match install_binary64_environment() {
            Ok(environment) => Some(environment),
            Err(error) => {
                let cleanup_error = cleanup_state(state).err();
                if cleanup_error.is_some() {
                    slot.poisoned = true;
                }
                return Err(cleanup_error.unwrap_or(error));
            }
        };
        let receipt_result = (|| {
            let (binary64, binary64_data) = typed_array_with_data(
                &api,
                env,
                NAPI_FLOAT64_ARRAY,
                BINARY64_ELEMENT_COUNT,
                BINARY64_BYTE_LENGTH,
            )?;
            state.binary64_data = binary64_data.cast();
            let (permutation, permutation_data) = typed_array_with_data(
                &api,
                env,
                NAPI_UINT32_ARRAY,
                PERMUTATION_ELEMENT_COUNT,
                PERMUTATION_BYTE_LENGTH,
            )?;
            state.permutation_data = permutation_data.cast();
            let mut receipt = null_mut();
            if (api.create_object)(env, &mut receipt) != 0 {
                return Err("napi_create_lease_failed".to_owned());
            }
            let close_name = b"close\0";
            let mut close = null_mut();
            if (api.create_function)(
                env,
                close_name.as_ptr().cast(),
                close_name.len() - 1,
                Some(close_trusted_lease),
                1usize as *mut c_void,
                &mut close,
            ) != 0
            {
                return Err("napi_create_lease_close_failed".to_owned());
            }
            set_property(&api, env, receipt, "close", close)?;
            let spectral_name = b"materializeFrozenN64SpectralGraph\0";
            let mut spectral = null_mut();
            if (api.create_function)(
                env,
                spectral_name.as_ptr().cast(),
                spectral_name.len() - 1,
                Some(frozen_n64_spectral_callback),
                1usize as *mut c_void,
                &mut spectral,
            ) != 0
            {
                return Err("napi_create_frozen_n64_spectral_function_failed".to_owned());
            }
            set_property(
                &api,
                env,
                receipt,
                "materializeFrozenN64SpectralGraph",
                spectral,
            )?;
            let initializer_name = b"materializeFrozenN64CoreInitializer\0";
            let mut initializer = null_mut();
            if (api.create_function)(
                env,
                initializer_name.as_ptr().cast(),
                initializer_name.len() - 1,
                Some(frozen_n64_core_initializer_callback),
                2usize as *mut c_void,
                &mut initializer,
            ) != 0
            {
                return Err("napi_create_frozen_n64_initializer_function_failed".to_owned());
            }
            set_property(
                &api,
                env,
                receipt,
                "materializeFrozenN64CoreInitializer",
                initializer,
            )?;
            let core_solve_name = b"evaluateFrozenN64CoreSolveDiagnostic\0";
            let mut core_solve = null_mut();
            if (api.create_function)(
                env,
                core_solve_name.as_ptr().cast(),
                core_solve_name.len() - 1,
                Some(frozen_n64_core_solve_callback),
                3usize as *mut c_void,
                &mut core_solve,
            ) != 0
            {
                return Err("napi_create_frozen_n64_core_solve_function_failed".to_owned());
            }
            set_property(
                &api,
                env,
                receipt,
                "evaluateFrozenN64CoreSolveDiagnostic",
                core_solve,
            )?;
            for (name, operation) in [
                (b"setPositiveZeroAt\0".as_slice(), OP_SET_ZERO),
                (b"setUiAt\0".as_slice(), OP_SET_UI),
                (b"setSiAt\0".as_slice(), OP_SET_SI),
                (b"setDAt\0".as_slice(), OP_SET_D),
                (b"setAt\0".as_slice(), OP_SET),
                (b"setZ2ExpAt\0".as_slice(), OP_SET_Z_2EXP),
                (b"constPiAt\0".as_slice(), OP_CONST_PI),
                (b"addAt\0".as_slice(), OP_ADD),
                (b"subAt\0".as_slice(), OP_SUB),
                (b"mulAt\0".as_slice(), OP_MUL),
                (b"divAt\0".as_slice(), OP_DIV),
                (b"negAt\0".as_slice(), OP_NEG),
                (b"cosAt\0".as_slice(), OP_COS),
                (b"sqrtAt\0".as_slice(), OP_SQRT),
                (b"expAt\0".as_slice(), OP_EXP),
                (b"logAt\0".as_slice(), OP_LOG),
                (b"getDAt\0".as_slice(), OP_GET_D),
                (b"cmpAt\0".as_slice(), OP_CMP),
            ] {
                let mut function = null_mut();
                if (api.create_function)(
                    env,
                    name.as_ptr().cast(),
                    name.len() - 1,
                    Some(fixed_index_operation),
                    operation as *mut c_void,
                    &mut function,
                ) != 0
                {
                    return Err("napi_create_fixed_index_operation_failed".to_owned());
                }
                if (api.set_named_property)(env, receipt, name.as_ptr().cast(), function) != 0 {
                    return Err("napi_set_fixed_index_operation_failed".to_owned());
                }
            }
            set_property(&api, env, receipt, "binary64Arena", binary64)?;
            set_property(&api, env, receipt, "permutationArena", permutation)?;
            set_property(
                &api,
                env,
                receipt,
                "mpfrVersion",
                string(&api, env, &version)?,
            )?;
            set_property(
                &api,
                env,
                receipt,
                "gmpVersion",
                string(&api, env, &gmp_version)?,
            )?;
            set_property(
                &api,
                env,
                receipt,
                "mpfrElementCount",
                uint32(&api, env, MPFR_ELEMENT_COUNT as u32)?,
            )?;
            for (name, value) in [
                ("leaseGeneration", uint32(&api, env, 1)?),
                ("leaseActive", boolean(&api, env, true)?),
                ("trustedRuntimeManifestInstalled", boolean(&api, env, true)?),
                ("fixedIndexOperationsAvailable", boolean(&api, env, true)?),
                (
                    "fixedIndexCoreOperationsAvailable",
                    boolean(&api, env, true)?,
                ),
                ("fixedIndexSetZ2ExpAvailable", boolean(&api, env, true)?),
                ("frozenN64SpectralGraphAvailable", boolean(&api, env, true)?),
                (
                    "frozenN64CoreInitializerAvailable",
                    boolean(&api, env, true)?,
                ),
                (
                    "frozenN64CoreSolveDiagnosticAvailable",
                    boolean(&api, env, true)?,
                ),
                ("abandonmentFinalizerInstalled", boolean(&api, env, true)?),
                (
                    "loadedModuleFileIdentityMatchedHeldSources",
                    boolean(&api, env, true)?,
                ),
                (
                    "sourceFilesHeldWithoutWriteOrDeleteSharing",
                    boolean(&api, env, true)?,
                ),
                ("postLoadSourceRehashMatched", boolean(&api, env, true)?),
                ("binary64EnvironmentInstalled", boolean(&api, env, true)?),
                (
                    "binary64EnvironmentOwningThreadBound",
                    boolean(&api, env, true)?,
                ),
                ("productionRuntimeReady", boolean(&api, env, false)?),
                ("candidateNumericReadPerformed", boolean(&api, env, false)?),
                ("executionAuthority", boolean(&api, env, false)?),
                ("physicalAuthority", boolean(&api, env, false)?),
                ("propulsionAuthority", boolean(&api, env, false)?),
                ("transportAuthority", boolean(&api, env, false)?),
            ] {
                set_property(&api, env, receipt, name, value)?;
            }
            set_property(
                &api,
                env,
                receipt,
                "binary64EnvironmentRuntimeFamily",
                string(&api, env, "windows_amd64_ucrt_full_fenv")?,
            )?;
            set_property(
                &api,
                env,
                receipt,
                "binary64EnvironmentSourceSha256",
                string(&api, env, BINARY64_ENVIRONMENT_SOURCE_SHA256)?,
            )?;
            set_property(
                &api,
                env,
                receipt,
                "binary64EnvironmentSourceSizeBytes",
                uint32(&api, env, BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES)?,
            )?;
            Ok(receipt)
        })();
        let receipt = match receipt_result {
            Ok(receipt) => receipt,
            Err(error) => {
                let cleanup_error = cleanup_state(state).err();
                if cleanup_error.is_some() {
                    slot.poisoned = true;
                }
                return Err(cleanup_error.unwrap_or(error));
            }
        };
        let mut lease_reference = null_mut();
        if (api.create_reference)(env, receipt, 0, &mut lease_reference) != 0
            || lease_reference.is_null()
        {
            let cleanup_error = cleanup_state(state).err();
            if cleanup_error.is_some() {
                slot.poisoned = true;
            }
            return Err(
                cleanup_error.unwrap_or_else(|| "napi_create_lease_reference_failed".to_owned())
            );
        }
        if (api.add_finalizer)(
            env,
            receipt,
            1usize as *mut c_void,
            Some(finalize_trusted_lease),
            null_mut(),
            null_mut(),
        ) != 0
        {
            let _ = (api.delete_reference)(env, lease_reference);
            let cleanup_error = cleanup_state(state).err();
            if cleanup_error.is_some() {
                slot.poisoned = true;
            }
            return Err(
                cleanup_error.unwrap_or_else(|| "napi_add_lease_finalizer_failed".to_owned())
            );
        }
        slot.active = Some(state);
        slot.ever_acquired = true;
        slot.lease_reference = lease_reference as usize;
        Ok(receipt)
    })();
    match result {
        Ok(value) => value,
        Err(message) => {
            if let Ok(message) = CString::new(message) {
                unsafe { (api.throw_error)(env, null(), message.as_ptr()) };
            }
            null_mut()
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn napi_register_module_v1(env: NapiEnv, exports: NapiValue) -> NapiValue {
    let api = match unsafe { napi() } {
        Ok(value) => value,
        Err(_) => return exports,
    };
    let name = b"runDiagnosticNativeArenaPreflight\0";
    let mut function = null_mut();
    if unsafe {
        (api.create_function)(
            env,
            name.as_ptr().cast(),
            name.len() - 1,
            Some(preflight),
            null_mut(),
            &mut function,
        )
    } != 0
    {
        return exports;
    }
    unsafe {
        (api.set_named_property)(env, exports, name.as_ptr().cast(), function);
    }
    let trusted_name = b"runTrustedNativeArenaPreflight\0";
    let mut trusted_function = null_mut();
    if unsafe {
        (api.create_function)(
            env,
            trusted_name.as_ptr().cast(),
            trusted_name.len() - 1,
            Some(trusted_preflight),
            null_mut(),
            &mut trusted_function,
        )
    } == 0
    {
        unsafe {
            (api.set_named_property)(env, exports, trusted_name.as_ptr().cast(), trusted_function);
        }
    }
    let acquire_name = b"acquireTrustedNativeArenaLease\0";
    let mut acquire_function = null_mut();
    if unsafe {
        (api.create_function)(
            env,
            acquire_name.as_ptr().cast(),
            acquire_name.len() - 1,
            Some(acquire_trusted_lease),
            null_mut(),
            &mut acquire_function,
        )
    } == 0
    {
        unsafe {
            (api.set_named_property)(env, exports, acquire_name.as_ptr().cast(), acquire_function);
        }
    }
    exports
}
