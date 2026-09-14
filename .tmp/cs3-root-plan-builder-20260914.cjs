"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// .tmp/cs3-root-plan-builder-20260914.ts
var cs3_root_plan_builder_20260914_exports = {};
__export(cs3_root_plan_builder_20260914_exports, {
  buildRoot: () => buildRoot
});
module.exports = __toCommonJS(cs3_root_plan_builder_20260914_exports);

// node_modules/@noble/hashes/esm/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var hasHexBuiltin = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
var Hash = class {
};
function createHasher(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}

// node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view, byteOffset, value, isLE) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE);
  const _32n = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE ? 4 : 0;
  const l = isLE ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE);
  view.setUint32(byteOffset + l, wl, isLE);
}
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class extends Hash {
  constructor(blockLen, outputLen, padOffset, isLE) {
    super();
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    data = toBytes(data);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/@noble/hashes/esm/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends HashMD {
  constructor(outputLen = 32) {
    super(64, outputLen, 8, false);
    this.A = SHA256_IV[0] | 0;
    this.B = SHA256_IV[1] | 0;
    this.C = SHA256_IV[2] | 0;
    this.D = SHA256_IV[3] | 0;
    this.E = SHA256_IV[4] | 0;
    this.F = SHA256_IV[5] | 0;
    this.G = SHA256_IV[6] | 0;
    this.H = SHA256_IV[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var sha256 = /* @__PURE__ */ createHasher(() => new SHA256());

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// shared/helix-environment-time.ts
var HELIX_ENVIRONMENT_TEMPORAL_PLAN_SCHEMA = "environment.temporal_action_plan.v1";
var HELIX_ENVIRONMENT_AFFORDANCE_FRONTIER_SCHEMA = "environment.affordance_frontier.v1";
var HELIX_ENVIRONMENT_INTERRUPT_RECEIPT_SCHEMA = "environment.interrupt_receipt.v1";
var HELIX_ENVIRONMENT_FEEDBACK_LATENCY_SCHEMA = "environment.feedback_latency.v1";
var HELIX_ENVIRONMENT_CAPACITY_SAMPLE_SCHEMA = "environment.capacity_sample.v1";
var HELIX_ENVIRONMENT_CAPACITY_REPORT_SCHEMA = "environment.capacity_report.v1";
var HELIX_ENVIRONMENT_PLAN_EVENT_SCHEMA = "environment.temporal_plan_event.v1";
var HELIX_ENVIRONMENT_CLOCK_KINDS = [
  "tick",
  "frame",
  "simulation_step",
  "provider_sequence",
  "revision",
  "event_sequence"
];
var HELIX_ENVIRONMENT_AFFORDANCE_STATES = [
  "available_now",
  "conditional",
  "blocked",
  "unknown"
];
var HELIX_ENVIRONMENT_INTERRUPT_KINDS = [
  "emergency_stop",
  "authority_revoked",
  "identity_lost",
  "epoch_changed",
  "manual_override",
  "hard_safety",
  "user_cancel",
  "user_steering",
  "postcondition_failed",
  "critical_hazard",
  "affordance_lost",
  "runway_low",
  "checkpoint",
  "informational_change"
];
var HELIX_ENVIRONMENT_INTERRUPT_PRIORITIES = [
  "sovereign_stop",
  "local_safety",
  "user_intent",
  "material_deviation",
  "planning_watermark",
  "informational"
];
var HELIX_ENVIRONMENT_PLAN_OUTCOMES = [
  "succeeded",
  "failed",
  "canceled",
  "timed_out",
  "interrupted",
  "not_started"
];
var identifierSchema = external_exports.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/u);
var timestampSchema = external_exports.string().datetime({ offset: true });
var sha256Schema = external_exports.string().regex(/^sha256:[a-f0-9]{64}$/u);
var sequenceSchema = external_exports.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
var boundedTextSchema = external_exports.string().trim().min(1).max(2e3);
var canonicalEnvironmentTimeValue = (value) => {
  if (Array.isArray(value)) return value.map(canonicalEnvironmentTimeValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, canonicalEnvironmentTimeValue(nested)])
  );
};
var helixEnvironmentTimeSha256 = (value) => `sha256:${bytesToHex(sha256(new TextEncoder().encode(JSON.stringify(canonicalEnvironmentTimeValue(value)))))}`;
var boundedRecordSchema = (maxBytes) => external_exports.record(external_exports.string(), external_exports.unknown()).superRefine((value, context) => {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalEnvironmentTimeValue(value))).byteLength;
  if (bytes > maxBytes) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: `Structured value exceeds the ${maxBytes}-byte limit.`
    });
  }
});
var helixEnvironmentTimeIdentitySchema = external_exports.object({
  environment_id: identifierSchema,
  source_id: identifierSchema,
  subject_id: identifierSchema,
  producer_epoch: identifierSchema,
  authority_id: identifierSchema,
  authority_revision: sequenceSchema,
  goal_id: identifierSchema,
  goal_revision: sequenceSchema,
  observation_revision: sequenceSchema,
  affordance_revision: sequenceSchema
}).strict();
var helixEnvironmentClockSchema = external_exports.object({
  kind: external_exports.enum(HELIX_ENVIRONMENT_CLOCK_KINDS),
  sequence: sequenceSchema,
  resolution_unit: identifierSchema,
  nominal_units_per_second: external_exports.number().finite().positive().nullable()
}).strict();
var helixEnvironmentThreeClockSchema = external_exports.object({
  environment: helixEnvironmentClockSchema,
  monotonic: external_exports.object({
    origin_id: identifierSchema,
    elapsed_ms: sequenceSchema
  }).strict(),
  audit_at: timestampSchema
}).strict();
var helixEnvironmentPlanConditionSchema = external_exports.discriminatedUnion(
  "kind",
  [
    external_exports.object({
      kind: external_exports.literal("boolean_equals"),
      fact_key: identifierSchema,
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      kind: external_exports.literal("number_compare"),
      fact_key: identifierSchema,
      operator: external_exports.enum(["lt", "lte", "eq", "gte", "gt"]),
      value: external_exports.number().finite()
    }).strict(),
    external_exports.object({
      kind: external_exports.literal("enum_equals"),
      fact_key: identifierSchema,
      expected: identifierSchema
    }).strict(),
    external_exports.object({
      kind: external_exports.literal("resource_available"),
      resource_key: identifierSchema
    }).strict(),
    external_exports.object({
      kind: external_exports.literal("prior_node_outcome"),
      node_id: identifierSchema,
      outcome: external_exports.enum(HELIX_ENVIRONMENT_PLAN_OUTCOMES)
    }).strict(),
    external_exports.object({
      kind: external_exports.literal("checkpoint_satisfied"),
      checkpoint_id: identifierSchema
    }).strict(),
    external_exports.object({
      kind: external_exports.literal("adapter_condition"),
      condition_id: identifierSchema,
      arguments: boundedRecordSchema(8 * 1024)
    }).strict()
  ]
);
var nodeTimingSchema = external_exports.object({
  earliest_start_unit: sequenceSchema,
  latest_start_unit: sequenceSchema,
  maximum_duration_units: external_exports.number().int().positive().max(1e6)
}).strict().superRefine((value, context) => {
  if (value.latest_start_unit < value.earliest_start_unit) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["latest_start_unit"],
      message: "Latest start cannot precede earliest start."
    });
  }
});
var effectBudgetSchema = external_exports.record(identifierSchema, external_exports.number().int().nonnegative().max(1e6)).superRefine((value, context) => {
  if (Object.keys(value).length > 64) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "Effect budget may contain at most 64 effect kinds."
    });
  }
});
var actionNodeSchema = external_exports.object({
  kind: external_exports.literal("action"),
  node_id: identifierSchema,
  lane_id: identifierSchema,
  capability_id: identifierSchema,
  capability_version: identifierSchema,
  arguments: boundedRecordSchema(32 * 1024),
  required_resources: external_exports.array(identifierSchema).max(32),
  timing: nodeTimingSchema,
  preconditions: external_exports.array(helixEnvironmentPlanConditionSchema).max(32),
  completion_conditions: external_exports.array(helixEnvironmentPlanConditionSchema).min(1).max(32),
  abort_guards: external_exports.array(helixEnvironmentPlanConditionSchema).max(32),
  effect_budget: effectBudgetSchema,
  on_success_node_id: identifierSchema,
  on_failure_node_id: identifierSchema,
  on_timeout_node_id: identifierSchema
}).strict();
var checkpointNodeSchema = external_exports.object({
  kind: external_exports.literal("checkpoint"),
  node_id: identifierSchema,
  checkpoint_id: identifierSchema,
  required_evidence_kinds: external_exports.array(identifierSchema).min(1).max(32),
  condition: helixEnvironmentPlanConditionSchema,
  wait_up_to_units: sequenceSchema,
  on_satisfied_node_id: identifierSchema,
  on_timeout_node_id: identifierSchema
}).strict();
var branchNodeSchema = external_exports.object({
  kind: external_exports.literal("branch"),
  node_id: identifierSchema,
  condition: helixEnvironmentPlanConditionSchema,
  true_node_id: identifierSchema,
  false_node_id: identifierSchema
}).strict();
var terminalNodeSchema = external_exports.object({
  kind: external_exports.literal("terminal"),
  node_id: identifierSchema,
  outcome: external_exports.enum(["succeeded", "failed", "canceled"]),
  reason_code: identifierSchema
}).strict();
var helixEnvironmentTemporalPlanNodeSchema = external_exports.discriminatedUnion(
  "kind",
  [
    actionNodeSchema,
    checkpointNodeSchema,
    branchNodeSchema,
    terminalNodeSchema
  ]
);
var laneSchema = external_exports.object({
  lane_id: identifierSchema,
  priority: external_exports.number().int().min(0).max(1e3),
  resource_keys: external_exports.array(identifierSchema).max(32)
}).strict();
var watermarkSchema = external_exports.object({
  decision_unit: sequenceSchema,
  stop_unit: sequenceSchema,
  committed_through_unit: sequenceSchema,
  stabilization_node_id: identifierSchema.nullable()
}).strict().superRefine((value, context) => {
  if (value.decision_unit > value.stop_unit || value.stop_unit > value.committed_through_unit) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "Watermarks must satisfy decision <= stop <= committed-through."
    });
  }
});
var temporalPlanBaseSchema = external_exports.object({
  schema: external_exports.literal(HELIX_ENVIRONMENT_TEMPORAL_PLAN_SCHEMA),
  plan_id: identifierSchema,
  previous_plan_id: identifierSchema.nullable(),
  previous_plan_hash: sha256Schema.nullable(),
  identity: helixEnvironmentTimeIdentitySchema,
  clocks: helixEnvironmentThreeClockSchema,
  adapter_id: identifierSchema,
  adapter_version: identifierSchema,
  compiler_version: identifierSchema,
  resident_executor_version: identifierSchema,
  start_node_id: identifierSchema,
  maximum_total_units: external_exports.number().int().positive().max(1e6),
  monotonic_deadline_elapsed_ms: sequenceSchema,
  watermarks: watermarkSchema,
  lanes: external_exports.array(laneSchema).min(1).max(32),
  effect_ceiling: effectBudgetSchema,
  nodes: external_exports.array(helixEnvironmentTemporalPlanNodeSchema).min(2).max(256),
  automatic_replay: external_exports.literal(false),
  adapter_strategy_authority: external_exports.literal(false),
  answer_authority: external_exports.literal(false),
  assistant_answer: external_exports.literal(false),
  terminal_eligible: external_exports.literal(false)
}).strict();
var nodeTargets = (node) => {
  if (node.kind === "action") {
    return [
      node.on_success_node_id,
      node.on_failure_node_id,
      node.on_timeout_node_id
    ];
  }
  if (node.kind === "checkpoint") {
    return [node.on_satisfied_node_id, node.on_timeout_node_id];
  }
  if (node.kind === "branch") return [node.true_node_id, node.false_node_id];
  return [];
};
var nodeConditions = (node) => {
  if (node.kind === "action") {
    return [
      ...node.preconditions,
      ...node.completion_conditions,
      ...node.abort_guards
    ];
  }
  if (node.kind === "checkpoint" || node.kind === "branch") {
    return [node.condition];
  }
  return [];
};
var validatePlanGraph = (plan, context) => {
  const nodes = new Map(plan.nodes.map((node) => [node.node_id, node]));
  if (nodes.size !== plan.nodes.length) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["nodes"],
      message: "Node ids must be unique."
    });
    return;
  }
  const lanes = new Map(plan.lanes.map((lane) => [lane.lane_id, lane]));
  if (lanes.size !== plan.lanes.length) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["lanes"],
      message: "Lane ids must be unique."
    });
  }
  if (!nodes.has(plan.start_node_id)) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["start_node_id"],
      message: "Start node is missing."
    });
    return;
  }
  if (plan.watermarks.committed_through_unit > plan.maximum_total_units) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["watermarks"],
      message: "Committed watermark exceeds plan horizon."
    });
  }
  if (plan.monotonic_deadline_elapsed_ms <= plan.clocks.monotonic.elapsed_ms) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["monotonic_deadline_elapsed_ms"],
      message: "Plan deadline must follow the starting monotonic clock."
    });
  }
  if (plan.watermarks.stabilization_node_id !== null && !nodes.has(plan.watermarks.stabilization_node_id)) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["watermarks", "stabilization_node_id"],
      message: "Stabilization node is missing."
    });
  }
  for (const [index, node] of plan.nodes.entries()) {
    for (const target of nodeTargets(node)) {
      if (!nodes.has(target)) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["nodes", index],
          message: `Node references missing target ${target}.`
        });
      }
    }
    for (const planCondition of nodeConditions(node)) {
      if (planCondition.kind === "prior_node_outcome" && !nodes.has(planCondition.node_id)) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["nodes", index],
          message: `Condition references missing node ${planCondition.node_id}.`
        });
      }
      if (planCondition.kind === "checkpoint_satisfied") {
        const found = plan.nodes.some(
          (candidate) => candidate.kind === "checkpoint" && candidate.checkpoint_id === planCondition.checkpoint_id
        );
        if (!found) {
          context.addIssue({
            code: external_exports.ZodIssueCode.custom,
            path: ["nodes", index],
            message: `Condition references missing checkpoint ${planCondition.checkpoint_id}.`
          });
        }
      }
    }
    if (node.kind !== "action") continue;
    const lane = lanes.get(node.lane_id);
    if (!lane) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["nodes", index, "lane_id"],
        message: "Action lane is missing."
      });
      continue;
    }
    if (node.required_resources.some(
      (resource) => !lane.resource_keys.includes(resource)
    )) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["nodes", index, "required_resources"],
        message: "Action resources must be declared by its lane."
      });
    }
    if (node.timing.latest_start_unit + node.timing.maximum_duration_units > plan.maximum_total_units) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["nodes", index, "timing"],
        message: "Action timing exceeds the plan horizon."
      });
    }
    for (const [effect, count] of Object.entries(node.effect_budget)) {
      if (!(effect in plan.effect_ceiling) || count > plan.effect_ceiling[effect]) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["nodes", index, "effect_budget", effect],
          message: "Action effect exceeds or is absent from the plan ceiling."
        });
      }
    }
  }
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  let terminalReachable = false;
  const visit = (nodeId) => {
    if (visiting.has(nodeId)) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["nodes"],
        message: "Temporal plan graph must be acyclic."
      });
      return;
    }
    if (visited.has(nodeId)) return;
    const node = nodes.get(nodeId);
    if (!node) return;
    visiting.add(nodeId);
    if (node.kind === "terminal") terminalReachable = true;
    nodeTargets(node).forEach(visit);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  visit(plan.start_node_id);
  if (visited.size !== plan.nodes.length) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["nodes"],
      message: "Every node must be reachable from the start node."
    });
  }
  if (!terminalReachable) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["nodes"],
      message: "At least one terminal must be reachable."
    });
  }
};
var helixEnvironmentTemporalPlanSchema = temporalPlanBaseSchema.extend({ plan_hash: sha256Schema }).superRefine((plan, context) => {
  const { plan_hash: suppliedHash, ...withoutHash } = plan;
  if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["plan_hash"],
      message: "Plan hash does not match canonical semantic content."
    });
  }
  validatePlanGraph(withoutHash, context);
});
var buildHelixEnvironmentTemporalPlan = (input) => {
  const base = {
    schema: HELIX_ENVIRONMENT_TEMPORAL_PLAN_SCHEMA,
    ...input,
    automatic_replay: false,
    adapter_strategy_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false
  };
  return helixEnvironmentTemporalPlanSchema.parse({
    ...base,
    plan_hash: helixEnvironmentTimeSha256(base)
  });
};
var temporalPlanEventPayloadSchema = external_exports.discriminatedUnion("kind", [
  external_exports.object({ kind: external_exports.literal("plan_admitted"), plan_hash: sha256Schema }).strict(),
  external_exports.object({ kind: external_exports.literal("execution_started") }).strict(),
  external_exports.object({
    kind: external_exports.literal("checkpoint_settled"),
    checkpoint_id: identifierSchema,
    observation_revision: sequenceSchema,
    affordance_revision: sequenceSchema,
    evidence_refs: external_exports.array(identifierSchema).min(1).max(256)
  }).strict(),
  external_exports.object({
    kind: external_exports.literal("extension_appended"),
    extension_plan_id: identifierSchema,
    extension_plan_hash: sha256Schema,
    after_checkpoint_id: identifierSchema
  }).strict(),
  external_exports.object({
    kind: external_exports.literal("replacement_committed"),
    replacement_plan_id: identifierSchema,
    replacement_plan_hash: sha256Schema,
    canceled_unexecuted_node_ids: external_exports.array(identifierSchema).max(256),
    performed_effects_preserved: external_exports.literal(true)
  }).strict(),
  external_exports.object({
    kind: external_exports.literal("runway_low"),
    remaining_units: sequenceSchema
  }).strict(),
  external_exports.object({
    kind: external_exports.literal("stabilization_required"),
    stabilization_node_id: identifierSchema.nullable(),
    reason_code: identifierSchema
  }).strict(),
  external_exports.object({
    kind: external_exports.literal("cancel_requested"),
    reason_code: identifierSchema,
    authority_reducing: external_exports.literal(true)
  }).strict(),
  external_exports.object({
    kind: external_exports.literal("plan_settled"),
    outcome: external_exports.enum(HELIX_ENVIRONMENT_PLAN_OUTCOMES),
    performed_effects: effectBudgetSchema,
    controls_released: external_exports.literal(true),
    resources_released: external_exports.literal(true),
    evidence_refs: external_exports.array(identifierSchema).max(256)
  }).strict()
]);
var helixEnvironmentTemporalPlanEventSchema = external_exports.object({
  schema: external_exports.literal(HELIX_ENVIRONMENT_PLAN_EVENT_SCHEMA),
  event_id: identifierSchema,
  plan_id: identifierSchema,
  sequence: external_exports.number().int().positive(),
  previous_event_hash: sha256Schema.nullable(),
  identity: helixEnvironmentTimeIdentitySchema,
  clocks: helixEnvironmentThreeClockSchema,
  payload: temporalPlanEventPayloadSchema,
  event_hash: sha256Schema,
  execution_authority: external_exports.literal(false),
  answer_authority: external_exports.literal(false),
  assistant_answer: external_exports.literal(false),
  terminal_eligible: external_exports.literal(false)
}).strict();
var affordanceEntrySchema = external_exports.object({
  capability_id: identifierSchema,
  capability_version: identifierSchema,
  subject_id: identifierSchema,
  state: external_exports.enum(HELIX_ENVIRONMENT_AFFORDANCE_STATES),
  reason_codes: external_exports.array(identifierSchema).max(32),
  required_authority_ids: external_exports.array(identifierSchema).max(16),
  held_resource_keys: external_exports.array(identifierSchema).max(32),
  parameter_bounds: boundedRecordSchema(8 * 1024),
  missing_observation_kinds: external_exports.array(identifierSchema).max(32),
  evidence_probe_capability_ids: external_exports.array(identifierSchema).max(16)
}).strict();
var helixEnvironmentAffordanceFrontierSchema = external_exports.object({
  schema: external_exports.literal(HELIX_ENVIRONMENT_AFFORDANCE_FRONTIER_SCHEMA),
  frontier_id: identifierSchema,
  identity: helixEnvironmentTimeIdentitySchema,
  clocks: helixEnvironmentThreeClockSchema,
  expires_at_environment_sequence: sequenceSchema,
  entries: external_exports.array(affordanceEntrySchema).max(256),
  newly_available_capability_ids: external_exports.array(identifierSchema).max(256),
  newly_blocked_capability_ids: external_exports.array(identifierSchema).max(256),
  materially_changed_capability_ids: external_exports.array(identifierSchema).max(256),
  expired_capability_ids: external_exports.array(identifierSchema).max(256),
  strategy_recommendation_included: external_exports.literal(false),
  execution_authority: external_exports.literal(false),
  answer_authority: external_exports.literal(false),
  assistant_answer: external_exports.literal(false),
  terminal_eligible: external_exports.literal(false)
}).strict().superRefine((frontier, context) => {
  if (frontier.expires_at_environment_sequence <= frontier.clocks.environment.sequence) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["expires_at_environment_sequence"],
      message: "Affordance frontier must expire after its observation sequence."
    });
  }
  const keys = frontier.entries.map(
    (entry) => `${entry.capability_id}@${entry.capability_version}:${entry.subject_id}`
  );
  if (new Set(keys).size !== keys.length) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["entries"],
      message: "Affordance entries must be unique by capability, version and subject."
    });
  }
});
var helixEnvironmentInterruptReceiptSchema = external_exports.object({
  schema: external_exports.literal(HELIX_ENVIRONMENT_INTERRUPT_RECEIPT_SCHEMA),
  interrupt_id: identifierSchema,
  plan_id: identifierSchema,
  plan_hash: sha256Schema,
  identity: helixEnvironmentTimeIdentitySchema,
  kind: external_exports.enum(HELIX_ENVIRONMENT_INTERRUPT_KINDS),
  priority: external_exports.enum(HELIX_ENVIRONMENT_INTERRUPT_PRIORITIES),
  detected_clocks: helixEnvironmentThreeClockSchema,
  preempted_clocks: helixEnvironmentThreeClockSchema,
  affected_node_ids: external_exports.array(identifierSchema).max(256),
  released_resource_keys: external_exports.array(identifierSchema).max(64),
  performed_effects: effectBudgetSchema,
  checkpoint_id: identifierSchema.nullable(),
  next_decision: external_exports.enum(["none", "resume", "replan", "cancel", "stabilize"]),
  controls_released: external_exports.boolean(),
  execution_authority: external_exports.literal(false),
  answer_authority: external_exports.literal(false),
  assistant_answer: external_exports.literal(false),
  terminal_eligible: external_exports.literal(false)
}).strict().superRefine((receipt, context) => {
  if (receipt.preempted_clocks.monotonic.elapsed_ms < receipt.detected_clocks.monotonic.elapsed_ms) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["preempted_clocks"],
      message: "Pre-emption cannot precede detection."
    });
  }
  if (receipt.kind === "user_steering" && receipt.next_decision === "resume") {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["next_decision"],
      message: "Steering that invalidates a plan must replan, cancel or stabilize rather than auto-resume."
    });
  }
  const expected = {
    emergency_stop: ["sovereign_stop", "cancel", true],
    authority_revoked: ["sovereign_stop", "cancel", true],
    identity_lost: ["sovereign_stop", "cancel", true],
    epoch_changed: ["sovereign_stop", "cancel", true],
    manual_override: ["sovereign_stop", "cancel", true],
    hard_safety: ["local_safety", "stabilize", true],
    user_cancel: ["user_intent", "cancel", true],
    user_steering: ["user_intent", "replan", true],
    postcondition_failed: ["material_deviation", "replan", true],
    critical_hazard: ["local_safety", "stabilize", true],
    affordance_lost: ["material_deviation", "replan", true],
    runway_low: ["planning_watermark", "stabilize", false],
    checkpoint: ["informational", "none", false],
    informational_change: ["informational", "none", false]
  }[receipt.kind];
  if (receipt.priority !== expected[0] || receipt.next_decision !== expected[1] || receipt.controls_released !== expected[2]) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "Interrupt priority, decision and control release must match the fixed authority-reducing policy."
    });
  }
  if (receipt.preempted_clocks.monotonic.origin_id !== receipt.detected_clocks.monotonic.origin_id || receipt.preempted_clocks.environment.kind !== receipt.detected_clocks.environment.kind || receipt.preempted_clocks.environment.resolution_unit !== receipt.detected_clocks.environment.resolution_unit || receipt.preempted_clocks.environment.sequence < receipt.detected_clocks.environment.sequence) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["preempted_clocks"],
      message: "Pre-emption clocks must preserve their domains and cannot regress."
    });
  }
});
var helixEnvironmentFeedbackLatencySchema = external_exports.object({
  schema: external_exports.literal(HELIX_ENVIRONMENT_FEEDBACK_LATENCY_SCHEMA),
  trace_id: identifierSchema,
  identity: helixEnvironmentTimeIdentitySchema,
  spans_ms: external_exports.object({
    manual_input_to_release: external_exports.number().int().nonnegative().nullable(),
    finalized_input_to_task_available: external_exports.number().int().nonnegative().nullable(),
    pickup_to_acknowledgement: external_exports.number().int().nonnegative().nullable(),
    arbitration_to_plan_stop: external_exports.number().int().nonnegative().nullable(),
    observation_to_replacement_proposal: external_exports.number().int().nonnegative().nullable(),
    proposal_to_admission: external_exports.number().int().nonnegative().nullable(),
    admission_to_first_execution_unit: external_exports.number().int().nonnegative().nullable(),
    final_observation_to_presentation: external_exports.number().int().nonnegative().nullable()
  }).strict(),
  speech_capture_and_finalization_ms: external_exports.number().int().nonnegative().nullable(),
  provider_id: identifierSchema.nullable(),
  credential_included: external_exports.literal(false),
  answer_authority: external_exports.literal(false),
  assistant_answer: external_exports.literal(false),
  terminal_eligible: external_exports.literal(false)
}).strict();
var nullableMillisecondsSchema = external_exports.number().int().nonnegative().nullable();
var helixEnvironmentCapacitySampleSchema = external_exports.object({
  schema: external_exports.literal(HELIX_ENVIRONMENT_CAPACITY_SAMPLE_SCHEMA),
  sample_id: identifierSchema,
  course: external_exports.enum(["controlled_n0", "unknown_world"]).nullable(),
  rolling_cycle_index: external_exports.number().int().positive(),
  identity: helixEnvironmentTimeIdentitySchema,
  exact_reasoning_binding_ref: identifierSchema,
  resident_computation_ms: external_exports.number().int().nonnegative(),
  dispatch_to_first_tick_ms: nullableMillisecondsSchema,
  scheduler_ticks: external_exports.number().int().positive(),
  active_control_ticks: external_exports.number().int().nonnegative(),
  stalled_ticks: external_exports.number().int().nonnegative(),
  missed_ticks: external_exports.number().int().nonnegative(),
  queue_depth_peak: external_exports.number().int().nonnegative(),
  lead_time_ticks: external_exports.number().int().nonnegative().nullable(),
  latencies_ms: external_exports.object({
    event_to_evidence: nullableMillisecondsSchema,
    evidence_to_pickup: nullableMillisecondsSchema,
    stop_to_replan: nullableMillisecondsSchema,
    finalized_steering_to_stop: nullableMillisecondsSchema,
    manual_or_safety_to_release: nullableMillisecondsSchema
  }).strict(),
  elapsed_ms: external_exports.number().int().positive(),
  replans: external_exports.number().int().nonnegative(),
  unnecessary_replans: external_exports.number().int().nonnegative(),
  observation_input_bytes: external_exports.number().int().nonnegative().nullable(),
  observation_output_bytes: external_exports.number().int().nonnegative().nullable(),
  observation_tokens: external_exports.number().int().nonnegative().nullable(),
  raw_event_count: external_exports.number().int().nonnegative(),
  emitted_observation_count: external_exports.number().int().nonnegative(),
  performed_effect_refs: external_exports.array(identifierSchema).max(2048),
  verified_progress_units: external_exports.number().finite().nonnegative(),
  model_tool_round_trips: external_exports.number().int().nonnegative(),
  changed_affordance_replan_observed: external_exports.boolean(),
  local_intervention_observed: external_exports.boolean(),
  user_steering_observed: external_exports.boolean(),
  reconnect_recovery_observed: external_exports.boolean(),
  revocation_observed: external_exports.boolean(),
  stale_after_revoke_rejected: external_exports.boolean(),
  evidence_reentered: external_exports.boolean(),
  controls_released: external_exports.boolean(),
  credential_included: external_exports.literal(false),
  hidden_reasoning_included: external_exports.literal(false),
  answer_authority: external_exports.literal(false),
  assistant_answer: external_exports.literal(false),
  terminal_eligible: external_exports.literal(false)
}).strict().superRefine((sample, context) => {
  if (sample.active_control_ticks > sample.scheduler_ticks) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["active_control_ticks"],
      message: "Active control ticks cannot exceed scheduler ticks."
    });
  }
  if (sample.stalled_ticks > sample.scheduler_ticks) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["stalled_ticks"],
      message: "Stalled ticks cannot exceed observed scheduler ticks."
    });
  }
  if (sample.unnecessary_replans > sample.replans) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["unnecessary_replans"],
      message: "Unnecessary replans cannot exceed total replans."
    });
  }
  if (sample.emitted_observation_count > sample.raw_event_count) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["emitted_observation_count"],
      message: "Emitted observations cannot exceed raw events."
    });
  }
});
var percentileSummarySchema = external_exports.object({
  sample_count: external_exports.number().int().nonnegative(),
  p50: external_exports.number().finite().nonnegative().nullable(),
  p95: external_exports.number().finite().nonnegative().nullable(),
  p99: external_exports.number().finite().nonnegative().nullable()
}).strict();
var helixEnvironmentCapacityReportSchema = external_exports.object({
  schema: external_exports.literal(HELIX_ENVIRONMENT_CAPACITY_REPORT_SCHEMA),
  report_id: identifierSchema,
  exact_reasoning_binding_ref: identifierSchema,
  sample_count: external_exports.number().int().positive(),
  rolling_cycle_count: external_exports.number().int().positive(),
  courses_observed: external_exports.array(external_exports.enum(["controlled_n0", "unknown_world"])),
  latency_percentiles_ms: external_exports.object({
    resident_computation: percentileSummarySchema,
    dispatch_to_first_tick: percentileSummarySchema,
    event_to_evidence: percentileSummarySchema,
    evidence_to_pickup: percentileSummarySchema,
    stop_to_replan: percentileSummarySchema,
    finalized_steering_to_stop: percentileSummarySchema,
    manual_or_safety_to_release: percentileSummarySchema
  }).strict(),
  continuous_control_ratio: external_exports.number().finite().min(0).max(1),
  stalled_tick_count: external_exports.number().int().nonnegative(),
  missed_tick_count: external_exports.number().int().nonnegative(),
  queue_depth_peak: external_exports.number().int().nonnegative(),
  lead_time_ticks_p50: external_exports.number().finite().nonnegative().nullable(),
  replans_per_minute: external_exports.number().finite().nonnegative(),
  unnecessary_replans_per_minute: external_exports.number().finite().nonnegative(),
  observation_input_bytes: external_exports.number().int().nonnegative().nullable(),
  observation_output_bytes: external_exports.number().int().nonnegative().nullable(),
  observation_tokens: external_exports.number().int().nonnegative().nullable(),
  observation_coalescing_ratio: external_exports.number().finite().min(0).max(1).nullable(),
  performed_effect_count: external_exports.number().int().nonnegative(),
  duplicate_effect_count: external_exports.number().int().nonnegative(),
  verified_progress_per_model_tool_round_trip: external_exports.number().finite().nonnegative().nullable(),
  missing_measurements: external_exports.array(identifierSchema),
  exit_criteria: external_exports.object({
    at_least_three_rolling_cycles: external_exports.boolean(),
    controlled_and_unknown_world_observed: external_exports.boolean(),
    changed_affordance_replan_observed: external_exports.boolean(),
    local_intervention_observed: external_exports.boolean(),
    user_steering_observed: external_exports.boolean(),
    reconnect_recovery_observed: external_exports.boolean(),
    zero_duplicate_effects: external_exports.boolean(),
    final_revocation_observed: external_exports.boolean(),
    stale_after_revoke_rejected: external_exports.boolean(),
    all_controls_released: external_exports.boolean(),
    all_evidence_reentered: external_exports.boolean(),
    required_measurements_complete: external_exports.boolean()
  }).strict(),
  exit_satisfied: external_exports.boolean(),
  evidence_refs: external_exports.array(identifierSchema).min(1).max(512),
  credential_included: external_exports.literal(false),
  hidden_reasoning_included: external_exports.literal(false),
  answer_authority: external_exports.literal(false),
  assistant_answer: external_exports.literal(false),
  terminal_eligible: external_exports.literal(false)
}).strict();

// shared/helix-minecraft-player-capabilities.ts
var HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY = "com.casimirbot.minecraft.player.workflow.status";
var HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY = "com.casimirbot.minecraft.player.navigate";
var HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY = "com.casimirbot.minecraft.player.look";
var HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY = "com.casimirbot.minecraft.player.camera.track";
var HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY = "com.casimirbot.minecraft.player.walk";
var HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY = "com.casimirbot.minecraft.player.jump";
var HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY = "com.casimirbot.minecraft.player.interact";
var HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY = "com.casimirbot.minecraft.player.combat.attack";
var HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY = "com.casimirbot.minecraft.player.combat.guard";
var HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY = "com.casimirbot.minecraft.player.hotbar.select";
var HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY = "com.casimirbot.minecraft.player.equipment.equip";
var HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY = "com.casimirbot.minecraft.player.workflow.cancel";
var HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY = "com.casimirbot.minecraft.player.workflow.resume";
var HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY = "com.casimirbot.minecraft.player.emergency_stop";
var HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY = "com.casimirbot.minecraft.player.follow";
var HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY = "com.casimirbot.minecraft.player.collect";
var HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY = "com.casimirbot.minecraft.player.mine";
var HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY = "com.casimirbot.minecraft.player.place";
var HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY = "com.casimirbot.minecraft.player.craft";
var HELIX_MINECRAFT_PLAYER_CONSUME_CAPABILITY = "com.casimirbot.minecraft.player.consume";
var HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY = "com.casimirbot.minecraft.player.inventory.transfer";
var HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY = "com.casimirbot.minecraft.player.sequence.execute";
var HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY = "com.casimirbot.minecraft.player.guardian.execute";
var HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY = "com.casimirbot.minecraft.player.viability_guardian.arm";
var HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY = "com.casimirbot.minecraft.player.viability_guardian.disarm";
var HELIX_MINECRAFT_PLAYER_MVP_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY
]);
var HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CONSUME_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY
]);
var HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY,
  ...HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS
]);
var HELIX_MINECRAFT_PLAYER_CAPABILITY_IDS = Object.freeze([
  ...HELIX_MINECRAFT_PLAYER_MVP_CAPABILITY_IDS,
  ...HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY
]);
var coordinateSchema = external_exports.number().finite().min(-3e7).max(3e7);
var yCoordinateSchema = external_exports.number().finite().min(-2048).max(2048);
var resourceLocationSchema = external_exports.string().trim().min(1).max(320).regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
var subjectRefSchema = external_exports.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/);
var helixMinecraftPositionSchema = external_exports.object({
  x: coordinateSchema,
  y: yCoordinateSchema,
  z: coordinateSchema
}).strict();
var helixMinecraftBlockPositionSchema = external_exports.object({
  x: external_exports.number().int().min(-3e7).max(3e7),
  y: external_exports.number().int().min(-2048).max(2048),
  z: external_exports.number().int().min(-3e7).max(3e7)
}).strict();
var helixMinecraftPlayerActionArgumentsSchema = external_exports.discriminatedUnion("action_kind", [
  external_exports.object({
    action_kind: external_exports.literal("navigate_to"),
    destination: helixMinecraftPositionSchema,
    arrival_radius: external_exports.number().finite().min(0.25).max(16),
    allow_sprint: external_exports.boolean(),
    allow_dig: external_exports.literal(false),
    allow_place: external_exports.literal(false),
    engine_preference: external_exports.enum([
      "adapter_selected",
      "native_fabric",
      "baritone"
    ])
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("look_at"),
    target: external_exports.discriminatedUnion("target_kind", [
      external_exports.object({
        target_kind: external_exports.literal("position"),
        position: helixMinecraftPositionSchema
      }).strict(),
      external_exports.object({
        target_kind: external_exports.literal("current_focus")
      }).strict(),
      external_exports.object({
        target_kind: external_exports.literal("relative_rotation"),
        yaw_delta_degrees: external_exports.number().finite().min(-180).max(180).describe(
          "Positive values turn right; negative values turn left."
        ),
        pitch_delta_degrees: external_exports.number().finite().min(-180).max(180).describe(
          "Positive values look down; negative values look up."
        )
      }).strict(),
      external_exports.object({
        target_kind: external_exports.literal("environment_subject"),
        subject_ref: subjectRefSchema
      }).strict()
    ]),
    max_turn_degrees_per_tick: external_exports.number().finite().positive().max(180)
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("track_target"),
    target: external_exports.discriminatedUnion("target_kind", [
      external_exports.object({
        target_kind: external_exports.literal("entity_type"),
        entity_type_id: resourceLocationSchema,
        selection: external_exports.literal("nearest")
      }).strict(),
      external_exports.object({
        target_kind: external_exports.literal("current_focus_entity")
      }).strict(),
      external_exports.object({
        target_kind: external_exports.literal("particle_type"),
        particle_type_id: resourceLocationSchema,
        selection: external_exports.literal("nearest"),
        continuity: external_exports.enum(["single_instance", "same_type_stream"]),
        handoff_radius: external_exports.number().finite().min(0).max(8),
        max_handoffs: external_exports.number().int().min(0).max(1e3)
      }).strict()
    ]),
    aim_point: external_exports.enum(["center", "render_center", "eyes", "feet"]),
    max_acquisition_distance: external_exports.number().finite().min(1).max(128),
    max_duration_ms: external_exports.number().int().min(1e3).max(5 * 6e4),
    max_turn_degrees_per_tick: external_exports.number().finite().min(0.1).max(180),
    max_angular_acceleration_degrees_per_tick_squared: external_exports.number().finite().min(0.01).max(180),
    prediction_ticks: external_exports.number().int().min(0).max(10),
    deadband_degrees: external_exports.number().finite().min(0).max(10),
    reacquire_ticks: external_exports.number().int().min(0).max(200),
    require_line_of_sight: external_exports.boolean(),
    stop_below_health: external_exports.number().finite().min(1).max(20)
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("walk"),
    direction: external_exports.enum(["forward", "back", "left", "right"]),
    duration_ms: external_exports.number().int().min(50).max(1e4),
    sprint: external_exports.boolean(),
    jump: external_exports.boolean().optional()
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("jump"),
    count: external_exports.number().int().min(1).max(10)
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("interact"),
    target: external_exports.enum([
      "current_focus",
      "looked_at_block",
      "looked_at_entity"
    ]),
    hand: external_exports.enum(["main_hand", "off_hand"]),
    interaction: external_exports.enum(["use", "interact"])
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("attack"),
    target_ref: subjectRefSchema.describe(
      "Opaque exact entity incarnation reference returned by a prior target-lock receipt."
    ),
    target_entity_type_id: resourceLocationSchema,
    target_classification: external_exports.literal("hostile"),
    max_acquisition_distance: external_exports.number().finite().min(1).max(16),
    require_line_of_sight: external_exports.literal(true),
    minimum_attack_cooldown: external_exports.number().finite().min(0.1).max(1),
    max_attack_pulses: external_exports.number().int().min(1).max(64),
    max_duration_ms: external_exports.number().int().min(1e3).max(6e4),
    stop_below_health: external_exports.number().finite().min(1).max(20),
    friendly_fire: external_exports.literal(false)
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("combat_guard"),
    hostile_entity_type_ids: external_exports.array(resourceLocationSchema).min(1).max(16),
    combat_mode: external_exports.enum(["engage", "disengage_to_distance"]).optional().describe(
      "engage permits admitted hostile attacks; disengage_to_distance suppresses attacks and succeeds only after every visible eligible hostile is at least retreat_stop_distance away."
    ),
    max_acquisition_distance: external_exports.number().finite().min(2).max(32),
    require_line_of_sight: external_exports.literal(true),
    minimum_attack_cooldown: external_exports.number().finite().min(0.1).max(1),
    max_attack_pulses: external_exports.number().int().min(1).max(256),
    max_target_switches: external_exports.number().int().min(0).max(64),
    target_commit_ticks: external_exports.number().int().min(0).max(200),
    retreat_start_distance: external_exports.number().finite().min(1).max(6),
    retreat_stop_distance: external_exports.number().finite().min(1).max(8),
    retreat_when_hostile_count_at_least: external_exports.number().int().min(1).max(16),
    max_duration_ms: external_exports.number().int().min(1e3).max(12e4),
    stop_below_health: external_exports.number().finite().min(1).max(20),
    friendly_fire: external_exports.literal(false),
    approach_policy: external_exports.enum(["none", "direct_bounded", "local_reroute_bounded"]).optional(),
    max_approach_ticks: external_exports.number().int().min(0).max(1200).optional(),
    cover_policy: external_exports.enum(["none", "lateral_bounded"]).optional(),
    max_cover_ticks: external_exports.number().int().min(0).max(1200).optional(),
    projectile_response: external_exports.enum(["none", "sidestep", "shield_or_sidestep"]).optional(),
    projectile_evasion_horizon_ticks: external_exports.number().int().min(1).max(20).optional(),
    max_evasion_ticks: external_exports.number().int().min(0).max(1200).optional(),
    shield_hand: external_exports.enum(["none", "off_hand"]).optional(),
    max_shield_hold_ticks: external_exports.number().int().min(0).max(1200).optional()
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("hotbar_select"),
    slot: external_exports.number().int().min(0).max(8)
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("equip"),
    item_id: resourceLocationSchema,
    destination: external_exports.enum([
      "main_hand",
      "off_hand",
      "head",
      "chest",
      "legs",
      "feet"
    ])
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("follow"),
    subject_ref: subjectRefSchema,
    distance: external_exports.number().finite().min(1).max(64),
    max_duration_ms: external_exports.number().int().min(1e3).max(30 * 6e4),
    stop_below_health: external_exports.number().finite().min(1).max(20)
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("collect"),
    item_or_block_id: resourceLocationSchema,
    count: external_exports.number().int().min(1).max(2304),
    search_radius: external_exports.number().finite().positive().max(128)
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("mine"),
    block_id: resourceLocationSchema,
    count: external_exports.number().int().min(1).max(4096),
    search_radius: external_exports.number().int().positive().max(32),
    target_position: helixMinecraftBlockPositionSchema.optional().describe(
      "Optional exact loaded block to mine. When supplied, count must be 1 and the block must still match block_id inside the admitted search radius."
    )
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("place"),
    block_id: resourceLocationSchema,
    positions: external_exports.array(helixMinecraftBlockPositionSchema).min(1).max(256).optional().describe(
      "Exact admitted integer placement cells. Supply either positions or position_binding, never both."
    ),
    position_binding: external_exports.object({
      binding_kind: external_exports.literal("predicted_collision_cell"),
      horizon_ticks: external_exports.number().int().min(1).max(20),
      max_distance_blocks: external_exports.number().finite().positive().max(6),
      require_replaceable: external_exports.literal(true)
    }).strict().optional().describe(
      "A bounded Fabric-local data binding that resolves the predicted landing cell from current measured trajectory. It does not choose strategy or permit arbitrary coordinates."
    ),
    placement_method: external_exports.enum(["block_item", "item_use"]).optional(),
    source_item_id: resourceLocationSchema.optional(),
    hand: external_exports.enum(["main_hand", "off_hand"]).optional(),
    cleanup_after_landing: external_exports.literal(true).optional()
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("craft"),
    output_item_id: resourceLocationSchema,
    count: external_exports.number().int().min(1).max(2304),
    recipe_id: resourceLocationSchema.nullable().optional()
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("consume"),
    item_id: resourceLocationSchema,
    count: external_exports.number().int().min(1).max(64),
    hand: external_exports.literal("main_hand"),
    max_duration_ms: external_exports.number().int().min(1e3).max(6e4),
    stop_below_health: external_exports.number().finite().min(1).max(20),
    minimum_food_gain: external_exports.number().int().min(0).max(20),
    expected_remainder_item_id: resourceLocationSchema.nullable().optional()
  }).strict(),
  external_exports.object({
    action_kind: external_exports.literal("inventory_transfer"),
    direction: external_exports.enum(["deposit", "withdraw"]),
    item_id: resourceLocationSchema,
    count: external_exports.number().int().min(1).max(2304),
    container_target: external_exports.enum([
      "current_open_container",
      "looked_at_container"
    ])
  }).strict()
]).superRefine((value, context) => {
  if (value.action_kind === "combat_guard") {
    if (value.retreat_stop_distance <= value.retreat_start_distance) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["retreat_stop_distance"],
        message: "retreat_stop_distance must exceed retreat_start_distance"
      });
    }
    const approachPolicy = value.approach_policy ?? "none";
    const maxApproachTicks = value.max_approach_ticks ?? 0;
    if (approachPolicy !== "none" !== maxApproachTicks > 0) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["max_approach_ticks"],
        message: "an approach policy requires a positive max_approach_ticks budget"
      });
    }
    const coverPolicy = value.cover_policy ?? "none";
    const maxCoverTicks = value.max_cover_ticks ?? 0;
    if (coverPolicy === "lateral_bounded" !== maxCoverTicks > 0) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["max_cover_ticks"],
        message: "lateral_bounded requires a positive max_cover_ticks budget"
      });
    }
    const projectileResponse = value.projectile_response ?? "none";
    const maxEvasionTicks = value.max_evasion_ticks ?? 0;
    const shieldHand = value.shield_hand ?? "none";
    const maxShieldHoldTicks = value.max_shield_hold_ticks ?? 0;
    if (projectileResponse !== "none" && maxEvasionTicks === 0) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["max_evasion_ticks"],
        message: "projectile response requires a positive evasion budget"
      });
    }
    if (projectileResponse === "shield_or_sidestep" ? shieldHand !== "off_hand" || maxShieldHoldTicks === 0 : shieldHand !== "none" || maxShieldHoldTicks !== 0) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["shield_hand"],
        message: "shield authority requires shield_or_sidestep, off_hand, and a positive hold budget"
      });
    }
    return;
  }
  if (value.action_kind === "mine" && value.target_position && value.count !== 1) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["count"],
      message: "Exact-target mining requires count to equal 1."
    });
    return;
  }
  if (value.action_kind === "place") {
    if (value.positions === void 0 === (value.position_binding === void 0)) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["positions"],
        message: "Placement requires exactly one target source: exact positions or one bounded position_binding."
      });
    }
    const method = value.placement_method ?? "block_item";
    if (method === "item_use") {
      if (!value.source_item_id) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["source_item_id"],
          message: "item_use placement requires the exact source item"
        });
      }
      if (!value.hand) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["hand"],
          message: "item_use placement requires the exact player hand"
        });
      }
      if (value.cleanup_after_landing === true && !(value.block_id === "minecraft:water" && value.source_item_id === "minecraft:water_bucket" && value.position_binding?.binding_kind === "predicted_collision_cell")) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["cleanup_after_landing"],
          message: "Landing cleanup is limited to a predicted-collision water-bucket rescue."
        });
      }
    } else if (value.source_item_id || value.hand) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["placement_method"],
        message: "block_item placement derives its source item and main hand from block_id"
      });
    } else if (value.cleanup_after_landing) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["cleanup_after_landing"],
        message: "Landing cleanup requires item_use placement."
      });
    }
    return;
  }
  if (value.action_kind !== "track_target" || value.target.target_kind !== "particle_type")
    return;
  const target = value.target;
  const valid = target.continuity === "single_instance" ? target.handoff_radius === 0 && target.max_handoffs === 0 : target.handoff_radius > 0 && target.max_handoffs > 0;
  if (!valid) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["target", "continuity"],
      message: "single_instance requires zero handoff scope; same_type_stream requires a positive handoff radius and budget"
    });
  }
});
var minecraftPlayerCapabilityForActionKind = (actionKind) => {
  switch (actionKind) {
    case "navigate_to":
      return HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY;
    case "look_at":
      return HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY;
    case "track_target":
      return HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY;
    case "walk":
      return HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY;
    case "jump":
      return HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY;
    case "interact":
      return HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY;
    case "attack":
      return HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY;
    case "combat_guard":
      return HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY;
    case "hotbar_select":
      return HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY;
    case "equip":
      return HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY;
    case "follow":
      return HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY;
    case "collect":
      return HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY;
    case "mine":
      return HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY;
    case "place":
      return HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY;
    case "craft":
      return HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY;
    case "consume":
      return HELIX_MINECRAFT_PLAYER_CONSUME_CAPABILITY;
    case "inventory_transfer":
      return HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY;
  }
};

// shared/helix-minecraft-fluid-sequence.ts
var HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA = "helix.minecraft.player_sequence.v1";
var HELIX_MINECRAFT_FLUID_CONDITION_KINDS = [
  "tick_at_least",
  "player_grounded",
  "health_at_least",
  "air_at_least",
  "submerged_is",
  "swimming_is",
  "on_fire_is",
  "in_lava_is",
  "food_at_least",
  "position_within",
  "inventory_count_at_least",
  "block_matches",
  "focus_kind_is",
  "focus_reachable",
  "vertical_velocity_at_most",
  "predicted_collision_within",
  "placement_reachable_within",
  "dimension_is",
  "equipment_item_is",
  "portal_nearby",
  "hazard_clear",
  "recipe_craftable",
  "node_outcome_is",
  "checkpoint_satisfied"
];
var HELIX_MINECRAFT_FLUID_RULESETS = [
  "survival_tas",
  "command_assisted_sandbox",
  "copilot_speedrun"
];
var HELIX_MINECRAFT_EXECUTABLE_FLUID_RULESETS = [
  "survival_tas"
];
var HELIX_MINECRAFT_FLUID_RULESET_DEFINITIONS = Object.freeze({
  survival_tas: {
    execution_plane: "player_embodiment",
    mutating: true,
    description: "Automated legal player inputs and typed client workflows. No server commands, host access, RCON, or arbitrary code."
  },
  command_assisted_sandbox: {
    execution_plane: "world_authority",
    mutating: true,
    description: "Separately authorized Minecraft server commands. This ruleset requires a World Authority capability and is not admitted by the Player Embodiment sequence tool."
  },
  copilot_speedrun: {
    execution_plane: "guidance_only",
    mutating: false,
    description: "Player-controlled guidance and checkpoint timing. It does not synthesize player input or server commands."
  }
});
var identifierSchema2 = external_exports.string().trim().min(1).max(160).regex(/^[a-zA-Z0-9:._/-]+$/);
var resourceLocationSchema2 = external_exports.string().trim().min(1).max(320).regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
var tickSchema = external_exports.number().int().nonnegative().max(36e3);
var nextNodeSchema = identifierSchema2;
var helixMinecraftFluidRulesetSchema = external_exports.enum(
  HELIX_MINECRAFT_FLUID_RULESETS
);
var isMinecraftFluidRulesetExecutable = (ruleset) => HELIX_MINECRAFT_EXECUTABLE_FLUID_RULESETS.includes(
  ruleset
);
var helixMinecraftFluidConditionSchema = external_exports.discriminatedUnion(
  "condition_kind",
  [
    external_exports.object({
      condition_kind: external_exports.literal("tick_at_least"),
      tick_index: tickSchema
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("player_grounded"),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("health_at_least"),
      health: external_exports.number().finite().min(0).max(20)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("air_at_least"),
      air: external_exports.number().int().min(0).max(300)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("submerged_is"),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("swimming_is"),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("on_fire_is"),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("in_lava_is"),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("food_at_least"),
      food: external_exports.number().int().min(0).max(20)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("position_within"),
      position: helixMinecraftPositionSchema,
      radius: external_exports.number().finite().positive().max(64)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("inventory_count_at_least"),
      item_id: resourceLocationSchema2,
      count: external_exports.number().int().nonnegative().max(2304)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("block_matches"),
      position: helixMinecraftBlockPositionSchema,
      block_id: resourceLocationSchema2
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("focus_kind_is"),
      focus_kind: external_exports.enum(["miss", "block", "entity"])
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("focus_reachable"),
      expected: external_exports.boolean(),
      max_distance: external_exports.number().finite().positive().max(6)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("vertical_velocity_at_most"),
      velocity_y: external_exports.number().finite().min(-16).max(16)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("predicted_collision_within"),
      max_ticks: external_exports.number().int().min(1).max(20),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("placement_reachable_within"),
      position: helixMinecraftBlockPositionSchema,
      horizon_ticks: external_exports.number().int().min(1).max(20),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("dimension_is"),
      dimension: resourceLocationSchema2
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("equipment_item_is"),
      destination: external_exports.enum([
        "main_hand",
        "off_hand",
        "head",
        "chest",
        "legs",
        "feet"
      ]),
      item_id: resourceLocationSchema2
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("portal_nearby"),
      portal_kind: external_exports.enum(["nether_portal", "end_portal", "end_gateway"]),
      radius: external_exports.number().int().positive().max(8),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("hazard_clear"),
      hazard_kinds: external_exports.array(
        external_exports.enum([
          "lava",
          "fire",
          "magma",
          "cactus",
          "powder_snow",
          "hostile",
          "void_fall"
        ])
      ).min(1).max(7),
      radius: external_exports.number().int().positive().max(8)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("recipe_craftable"),
      output_item_id: resourceLocationSchema2,
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("node_outcome_is"),
      node_id: identifierSchema2,
      outcome: external_exports.enum(["succeeded", "failed", "timed_out", "canceled"])
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("checkpoint_satisfied"),
      checkpoint_id: identifierSchema2
    }).strict()
  ]
);
var helixMinecraftFluidConditionObservationSchema = external_exports.object({
  node_id: identifierSchema2,
  tick_index: tickSchema,
  condition_kind: external_exports.enum(HELIX_MINECRAFT_FLUID_CONDITION_KINDS),
  satisfied: external_exports.boolean(),
  subject_item_id: resourceLocationSchema2.optional(),
  subject_output_item_id: resourceLocationSchema2.optional(),
  subject_dimension: resourceLocationSchema2.optional(),
  subject_destination: external_exports.enum(["main_hand", "off_hand", "head", "chest", "legs", "feet"]).optional(),
  subject_portal_kind: external_exports.enum(["nether_portal", "end_portal", "end_gateway"]).optional(),
  subject_checkpoint_id: identifierSchema2.optional(),
  subject_node_id: identifierSchema2.optional()
}).strict();
var inputControlStateSchema = external_exports.object({
  forward: external_exports.union([external_exports.literal(-1), external_exports.literal(0), external_exports.literal(1)]),
  strafe: external_exports.union([external_exports.literal(-1), external_exports.literal(0), external_exports.literal(1)]),
  sprint: external_exports.boolean(),
  sneak: external_exports.literal(false),
  jump: external_exports.enum(["idle", "pulse", "hold"]),
  use: external_exports.enum(["idle", "pulse"]),
  hotbar_slot: external_exports.number().int().min(0).max(8).nullable().optional(),
  look_delta: external_exports.object({
    yaw_degrees: external_exports.number().finite().min(-360).max(360),
    pitch_degrees: external_exports.number().finite().min(-180).max(180),
    max_degrees_per_tick: external_exports.number().finite().positive().max(180)
  }).strict().nullable().optional()
}).strict();
var inputSegmentNodeSchema = external_exports.object({
  node_id: identifierSchema2,
  node_kind: external_exports.literal("input_segment"),
  earliest_tick: tickSchema,
  duration_ticks: external_exports.number().int().positive().max(1200),
  controls: inputControlStateSchema,
  on_complete: nextNodeSchema,
  on_failure: nextNodeSchema
}).strict();
var workflowActionNodeSchema = external_exports.object({
  node_id: identifierSchema2,
  node_kind: external_exports.literal("workflow_action"),
  earliest_tick: tickSchema,
  latest_start_tick: tickSchema.optional(),
  timeout_ticks: external_exports.number().int().positive().max(36e3),
  action: helixMinecraftPlayerActionArgumentsSchema,
  on_success: nextNodeSchema,
  on_failure: nextNodeSchema
}).strict();
var checkpointNodeSchema2 = external_exports.object({
  node_id: identifierSchema2,
  node_kind: external_exports.literal("checkpoint"),
  earliest_tick: tickSchema,
  checkpoint_id: identifierSchema2,
  condition: helixMinecraftFluidConditionSchema,
  wait_up_to_ticks: external_exports.number().int().nonnegative().max(36e3),
  on_satisfied: nextNodeSchema,
  on_timeout: nextNodeSchema
}).strict();
var branchNodeSchema2 = external_exports.object({
  node_id: identifierSchema2,
  node_kind: external_exports.literal("branch"),
  earliest_tick: tickSchema,
  condition: helixMinecraftFluidConditionSchema,
  on_true: nextNodeSchema,
  on_false: nextNodeSchema
}).strict();
var terminalNodeSchema2 = external_exports.object({
  node_id: identifierSchema2,
  node_kind: external_exports.literal("terminal"),
  terminal_outcome: external_exports.enum(["succeeded", "failed"]),
  reason_code: identifierSchema2
}).strict();
var helixMinecraftFluidSequenceNodeSchema = external_exports.discriminatedUnion(
  "node_kind",
  [
    inputSegmentNodeSchema,
    workflowActionNodeSchema,
    checkpointNodeSchema2,
    branchNodeSchema2,
    terminalNodeSchema2
  ]
);
var helixMinecraftMutationRegionSchema = external_exports.object({
  min: helixMinecraftBlockPositionSchema,
  max: helixMinecraftBlockPositionSchema
}).strict().superRefine((region, context) => {
  for (const axis of ["x", "y", "z"]) {
    if (region.min[axis] > region.max[axis]) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["max", axis],
        message: "Mutation-region maxima must not be below their minima."
      });
    }
  }
});
var helixMinecraftFluidMutationScopeSchema = external_exports.object({
  world_mutation_allowed: external_exports.boolean(),
  max_block_mutations: external_exports.number().int().nonnegative().max(1e5),
  max_inventory_transfers: external_exports.number().int().nonnegative().max(1e4),
  allowed_block_ids: external_exports.array(resourceLocationSchema2).max(64),
  allowed_regions: external_exports.array(helixMinecraftMutationRegionSchema).max(16),
  combat_allowed: external_exports.literal(false)
}).strict();
var helixMinecraftFluidSequenceArgumentsSchema = external_exports.object({
  action_kind: external_exports.literal("execute_sequence"),
  sequence_schema: external_exports.literal(HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA),
  sequence_id: identifierSchema2,
  ruleset: helixMinecraftFluidRulesetSchema,
  execution_plane: external_exports.literal("player_embodiment"),
  scheduler_engine: external_exports.literal("native_fabric"),
  optimization: external_exports.object({
    primary: external_exports.literal("minimize_world_ticks"),
    record_wall_clock: external_exports.literal(true),
    stop_on_first_verified_success: external_exports.literal(true)
  }).strict(),
  start_node_id: identifierSchema2,
  max_total_ticks: external_exports.number().int().positive().max(36e3),
  required_checkpoint_ids: external_exports.array(identifierSchema2).max(64),
  mutation_scope: helixMinecraftFluidMutationScopeSchema,
  nodes: external_exports.array(helixMinecraftFluidSequenceNodeSchema).min(2).max(256)
}).strict().superRefine((sequence, context) => {
  if (!isMinecraftFluidRulesetExecutable(sequence.ruleset)) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["ruleset"],
      message: "The Player Embodiment sequence tool currently admits survival_tas only; other rulesets require their separately governed plane."
    });
  }
  const nodes = /* @__PURE__ */ new Map();
  for (const [index, node] of sequence.nodes.entries()) {
    if (nodes.has(node.node_id)) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["nodes", index, "node_id"],
        message: "Sequence node identifiers must be unique."
      });
    }
    nodes.set(node.node_id, node);
  }
  if (!nodes.has(sequence.start_node_id)) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["start_node_id"],
      message: "The sequence start node must exist."
    });
  }
  const transitions2 = (node) => {
    switch (node.node_kind) {
      case "input_segment":
        return [node.on_complete, node.on_failure];
      case "workflow_action":
        return [node.on_success, node.on_failure];
      case "checkpoint":
        return [node.on_satisfied, node.on_timeout];
      case "branch":
        return [node.on_true, node.on_false];
      case "terminal":
        return [];
    }
  };
  for (const [index, node] of sequence.nodes.entries()) {
    for (const target of transitions2(node)) {
      if (!nodes.has(target)) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["nodes", index],
          message: `Transition target ${target} does not exist.`
        });
      }
    }
  }
  const reachable = /* @__PURE__ */ new Set();
  const active = /* @__PURE__ */ new Set();
  let cycleReported = false;
  const visit = (nodeId) => {
    if (active.has(nodeId)) {
      if (!cycleReported) {
        cycleReported = true;
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["nodes"],
          message: "Fluid sequences must be acyclic; repetition belongs inside a bounded typed workflow node."
        });
      }
      return;
    }
    if (reachable.has(nodeId)) return;
    const node = nodes.get(nodeId);
    if (!node) return;
    reachable.add(nodeId);
    active.add(nodeId);
    for (const target of transitions2(node)) visit(target);
    active.delete(nodeId);
  };
  visit(sequence.start_node_id);
  for (const [index, node] of sequence.nodes.entries()) {
    if (!reachable.has(node.node_id)) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["nodes", index, "node_id"],
        message: "Every sequence node must be reachable from the start node."
      });
    }
  }
  if (!sequence.nodes.some(
    (node) => node.node_kind === "terminal" && node.terminal_outcome === "succeeded"
  )) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["nodes"],
      message: "A fluid sequence requires a reachable success terminal."
    });
  }
  const checkpointIds = /* @__PURE__ */ new Set();
  for (const [index, node] of sequence.nodes.entries()) {
    if (node.node_kind !== "checkpoint") continue;
    if (checkpointIds.has(node.checkpoint_id)) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["nodes", index, "checkpoint_id"],
        message: "Checkpoint identifiers must be unique."
      });
    }
    checkpointIds.add(node.checkpoint_id);
  }
  const required = /* @__PURE__ */ new Set();
  for (const [
    index,
    checkpointId
  ] of sequence.required_checkpoint_ids.entries()) {
    if (required.has(checkpointId)) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["required_checkpoint_ids", index],
        message: "Required checkpoint identifiers must be unique."
      });
    }
    required.add(checkpointId);
    if (!checkpointIds.has(checkpointId)) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["required_checkpoint_ids", index],
        message: "Every required checkpoint must name a checkpoint node."
      });
    }
  }
  let declaredBlockMutations = 0;
  let declaredInventoryTransfers = 0;
  const allowedBlocks = new Set(sequence.mutation_scope.allowed_block_ids);
  for (const [index, node] of sequence.nodes.entries()) {
    if (node.node_kind !== "workflow_action") continue;
    const action = node.action;
    if (action.action_kind === "mine") {
      declaredBlockMutations += action.count;
      declaredInventoryTransfers += action.count;
      if (!allowedBlocks.has(action.block_id)) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["nodes", index, "action", "block_id"],
          message: "Mined blocks must be named by the admitted mutation scope."
        });
      }
    } else if (action.action_kind === "place") {
      const placementCount = action.positions?.length ?? 1;
      declaredBlockMutations += placementCount;
      declaredInventoryTransfers += placementCount;
      if (!allowedBlocks.has(action.block_id)) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["nodes", index, "action", "block_id"],
          message: "Placed blocks must be named by the admitted mutation scope."
        });
      }
      if (sequence.mutation_scope.allowed_regions.length > 0 && action.positions) {
        for (const [positionIndex, position] of action.positions.entries()) {
          const admitted = sequence.mutation_scope.allowed_regions.some(
            (region) => position.x >= region.min.x && position.x <= region.max.x && position.y >= region.min.y && position.y <= region.max.y && position.z >= region.min.z && position.z <= region.max.z
          );
          if (!admitted) {
            context.addIssue({
              code: external_exports.ZodIssueCode.custom,
              path: ["nodes", index, "action", "positions", positionIndex],
              message: "Every exact placement position must lie inside an admitted mutation region."
            });
          }
        }
      }
    } else if (action.action_kind === "collect" || action.action_kind === "craft" || action.action_kind === "consume" || action.action_kind === "inventory_transfer") {
      declaredInventoryTransfers += action.count;
    } else if (action.action_kind === "equip") {
      declaredInventoryTransfers += 1;
    }
  }
  if (declaredBlockMutations > 0 && (!sequence.mutation_scope.world_mutation_allowed || sequence.mutation_scope.max_block_mutations < declaredBlockMutations)) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["mutation_scope", "max_block_mutations"],
      message: "The mutation scope must explicitly cover every declared mine/place effect."
    });
  }
  if (!sequence.mutation_scope.world_mutation_allowed && (sequence.mutation_scope.max_block_mutations !== 0 || sequence.mutation_scope.allowed_block_ids.length !== 0 || sequence.mutation_scope.allowed_regions.length !== 0)) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["mutation_scope"],
      message: "When world_mutation_allowed is false, max_block_mutations must be 0 and allowed_block_ids and allowed_regions must be empty. max_inventory_transfers is independent and must still cover declared collect, equip, craft, and inventory-transfer effects."
    });
  }
  if (declaredInventoryTransfers > sequence.mutation_scope.max_inventory_transfers) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["mutation_scope", "max_inventory_transfers"],
      message: "The inventory-transfer ceiling must cover every declared typed workflow effect."
    });
  }
});

// shared/helix-minecraft-reactive-program.ts
var HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA = "helix.minecraft.reactive_program.v1";
var HELIX_MINECRAFT_REACTIVE_LANE_KINDS = [
  "camera",
  "locomotion",
  "inventory",
  "hand",
  "world",
  "safety"
];
var HELIX_MINECRAFT_REACTIVE_RESOURCES = [
  "camera",
  "locomotion",
  "hotbar",
  "main_hand",
  "off_hand",
  "inventory",
  "world",
  "native_workflow",
  "safety"
];
var HELIX_MINECRAFT_RESIDENT_GUARDIAN_COVERAGE = [
  "unsafe_landing_recovery",
  "fire_recovery"
];
var identifierSchema3 = external_exports.string().trim().min(1).max(160).regex(/^[a-zA-Z0-9:._/-]+$/);
var tickSchema2 = external_exports.number().int().nonnegative().max(36e3);
var resourceSchema = external_exports.enum(HELIX_MINECRAFT_REACTIVE_RESOURCES);
var embeddedActionSchema = helixMinecraftPlayerActionArgumentsSchema;
var helixMinecraftReactiveMutationScopeSchema = helixMinecraftFluidMutationScopeSchema.extend({
  combat_allowed: external_exports.boolean()
});
var minecraftReactiveResourcesForAction = (action) => {
  switch (action.action_kind) {
    case "navigate_to":
      return ["camera", "locomotion"];
    case "look_at":
    case "track_target":
      return ["camera"];
    case "walk":
    case "jump":
      return ["locomotion"];
    case "interact":
      return [action.hand];
    case "attack":
      return ["camera", "main_hand"];
    case "combat_guard":
      return [
        "camera",
        "locomotion",
        "main_hand",
        "off_hand",
        "native_workflow"
      ];
    case "hotbar_select":
      return ["hotbar"];
    case "equip":
      return ["hotbar", "main_hand", "off_hand", "inventory"];
    case "follow":
      return ["camera", "locomotion", "native_workflow"];
    case "collect":
      return ["camera", "locomotion", "inventory", "native_workflow"];
    case "mine":
      return ["camera", "locomotion", "main_hand", "world", "native_workflow"];
    case "place":
      return action.placement_method === "item_use" && action.hand === "off_hand" ? [
        "camera",
        "locomotion",
        "off_hand",
        "inventory",
        "world",
        "native_workflow"
      ] : [
        "camera",
        "locomotion",
        "hotbar",
        "main_hand",
        "inventory",
        "world",
        "native_workflow"
      ];
    case "craft":
      return ["inventory", "native_workflow"];
    case "consume":
      return ["hotbar", "main_hand", "inventory", "native_workflow"];
    case "inventory_transfer":
      return ["inventory", "native_workflow"];
  }
};
var actionNodeSchema2 = external_exports.object({
  node_id: identifierSchema3,
  node_kind: external_exports.literal("action"),
  earliest_tick: tickSchema2,
  latest_start_tick: tickSchema2.optional(),
  timeout_ticks: external_exports.number().int().positive().max(36e3),
  action: embeddedActionSchema,
  on_success: identifierSchema3,
  on_failure: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var repeatNodeSchema = external_exports.object({
  node_id: identifierSchema3,
  node_kind: external_exports.literal("repeat"),
  earliest_tick: tickSchema2,
  action: embeddedActionSchema,
  max_iterations: external_exports.number().int().positive().max(256),
  timeout_ticks: external_exports.number().int().positive().max(36e3),
  until_condition: external_exports.discriminatedUnion("condition_kind", [
    external_exports.object({
      condition_kind: external_exports.literal("tick_at_least"),
      tick_index: tickSchema2
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("player_grounded"),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("health_at_least"),
      health: external_exports.number().finite().min(0).max(20)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("food_at_least"),
      food: external_exports.number().int().min(0).max(20)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("inventory_count_at_least"),
      item_id: external_exports.string().regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/),
      count: external_exports.number().int().nonnegative().max(2304)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("checkpoint_satisfied"),
      checkpoint_id: identifierSchema3
    }).strict()
  ]).optional(),
  on_complete: identifierSchema3,
  on_failure: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var maintainNodeSchema = external_exports.object({
  node_id: identifierSchema3,
  node_kind: external_exports.literal("maintain"),
  earliest_tick: tickSchema2,
  action: embeddedActionSchema,
  while_condition: external_exports.discriminatedUnion("condition_kind", [
    external_exports.object({
      condition_kind: external_exports.literal("player_grounded"),
      expected: external_exports.boolean()
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("health_at_least"),
      health: external_exports.number().finite().min(0).max(20)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("food_at_least"),
      food: external_exports.number().int().min(0).max(20)
    }).strict(),
    external_exports.object({
      condition_kind: external_exports.literal("hazard_clear"),
      hazard_kinds: external_exports.array(
        external_exports.enum([
          "lava",
          "fire",
          "magma",
          "cactus",
          "powder_snow",
          "hostile",
          "void_fall"
        ])
      ).min(1).max(7),
      radius: external_exports.number().int().positive().max(8)
    }).strict()
  ]),
  max_restarts: external_exports.number().int().nonnegative().max(256),
  max_duration_ticks: external_exports.number().int().positive().max(36e3),
  on_condition_false: identifierSchema3,
  on_failure: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var eventNodeSchema = external_exports.object({
  node_id: identifierSchema3,
  node_kind: external_exports.literal("event"),
  earliest_tick: tickSchema2,
  condition: helixMinecraftFluidConditionSchema,
  trigger_when: external_exports.enum(["satisfied", "not_satisfied"]),
  debounce_ticks: external_exports.number().int().positive().max(200),
  wait_up_to_ticks: external_exports.number().int().nonnegative().max(36e3),
  on_event: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var checkpointNodeSchema3 = external_exports.object({
  node_id: identifierSchema3,
  node_kind: external_exports.literal("checkpoint"),
  earliest_tick: tickSchema2,
  checkpoint_id: identifierSchema3,
  condition: helixMinecraftFluidConditionSchema,
  wait_up_to_ticks: external_exports.number().int().nonnegative().max(36e3),
  on_satisfied: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var branchNodeSchema3 = external_exports.object({
  node_id: identifierSchema3,
  node_kind: external_exports.literal("branch"),
  earliest_tick: tickSchema2,
  condition: helixMinecraftFluidConditionSchema,
  on_true: identifierSchema3,
  on_false: identifierSchema3
}).strict();
var terminalNodeSchema3 = external_exports.object({
  node_id: identifierSchema3,
  node_kind: external_exports.literal("terminal"),
  terminal_outcome: external_exports.enum(["succeeded", "failed", "canceled"]),
  reason_code: identifierSchema3
}).strict();
var helixMinecraftReactiveNodeSchema = external_exports.discriminatedUnion(
  "node_kind",
  [
    actionNodeSchema2,
    repeatNodeSchema,
    maintainNodeSchema,
    eventNodeSchema,
    checkpointNodeSchema3,
    branchNodeSchema3,
    terminalNodeSchema3
  ]
);
var laneSchema2 = external_exports.object({
  lane_id: identifierSchema3,
  lane_kind: external_exports.enum(HELIX_MINECRAFT_REACTIVE_LANE_KINDS),
  priority: external_exports.number().int().min(0).max(255),
  required: external_exports.boolean().describe(
    "Must be true for required immediate work and false for every interrupt-only lane."
  ),
  activation: external_exports.enum(["immediate", "interrupt_only"]).describe(
    "Immediate lanes start with the program. Interrupt-only lanes stay dormant until activated and must set required false."
  ),
  resource_ceiling: external_exports.array(resourceSchema).max(9),
  start_node_id: identifierSchema3,
  nodes: external_exports.array(helixMinecraftReactiveNodeSchema).min(1).max(128)
}).strict();
var interruptSchema = external_exports.object({
  interrupt_id: identifierSchema3,
  priority: external_exports.number().int().min(0).max(255),
  condition: helixMinecraftFluidConditionSchema,
  trigger_when: external_exports.enum(["satisfied", "not_satisfied"]),
  debounce_ticks: external_exports.number().int().positive().max(200),
  activate_lane_id: identifierSchema3.describe(
    "Exact ID of a lane declared with activation interrupt_only and required false."
  ),
  cancel_lane_ids: external_exports.array(identifierSchema3).max(8),
  max_activations: external_exports.literal(1)
}).strict();
var raceSchema = external_exports.object({
  race_id: identifierSchema3,
  lane_ids: external_exports.array(identifierSchema3).min(2).max(8),
  settle_on: external_exports.enum(["first_succeeded", "first_terminal"]),
  cancel_remaining: external_exports.literal(true)
}).strict();
var transitions = (node) => {
  switch (node.node_kind) {
    case "action":
      return [node.on_success, node.on_failure, node.on_timeout];
    case "repeat":
      return [node.on_complete, node.on_failure, node.on_timeout];
    case "maintain":
      return [node.on_condition_false, node.on_failure, node.on_timeout];
    case "event":
      return [node.on_event, node.on_timeout];
    case "checkpoint":
      return [node.on_satisfied, node.on_timeout];
    case "branch":
      return [node.on_true, node.on_false];
    case "terminal":
      return [];
  }
};
var negativeOutcomeTransitions = (node) => {
  switch (node.node_kind) {
    case "action":
    case "repeat":
      return [node.on_failure, node.on_timeout];
    case "maintain":
      return [node.on_failure, node.on_timeout];
    case "event":
    case "checkpoint":
      return [node.on_timeout];
    case "branch":
    case "terminal":
      return [];
  }
};
var nodeActions = (node) => node.node_kind === "action" || node.node_kind === "repeat" || node.node_kind === "maintain" ? [node.action] : [];
var helixMinecraftReactiveProgramArgumentsSchema = external_exports.object({
  action_kind: external_exports.literal("execute_reactive_program"),
  program_schema: external_exports.literal(HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA),
  program_id: identifierSchema3,
  ruleset: helixMinecraftFluidRulesetSchema,
  execution_plane: external_exports.literal("player_embodiment"),
  scheduler_engine: external_exports.literal("native_fabric_concurrent"),
  resident_guardian_coverage: external_exports.array(external_exports.enum(HELIX_MINECRAFT_RESIDENT_GUARDIAN_COVERAGE)).max(2).refine((values) => new Set(values).size === values.length, {
    message: "Resident guardian coverage entries must be unique."
  }).optional(),
  max_total_ticks: external_exports.number().int().positive().max(36e3),
  completion_policy: external_exports.object({
    mode: external_exports.enum(["all_required", "first_success"]),
    cancel_remaining_on_settle: external_exports.literal(true)
  }).strict(),
  mutation_scope: helixMinecraftReactiveMutationScopeSchema,
  lanes: external_exports.array(laneSchema2).min(1).max(8),
  races: external_exports.array(raceSchema).max(8),
  interrupts: external_exports.array(interruptSchema).max(16)
}).strict().superRefine((program, context) => {
  if (!isMinecraftFluidRulesetExecutable(program.ruleset)) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["ruleset"],
      message: "The Player Embodiment reactive program currently admits survival_tas only."
    });
  }
  const lanes = new Map(program.lanes.map((lane) => [lane.lane_id, lane]));
  if (lanes.size !== program.lanes.length) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["lanes"],
      message: "Reactive lane identifiers must be unique."
    });
  }
  if (!program.lanes.some((lane) => lane.activation === "immediate")) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["lanes"],
      message: "A reactive program requires at least one immediate lane."
    });
  }
  const residentCoverage = new Set(
    program.resident_guardian_coverage ?? []
  );
  const requiredImmediateLanes = program.lanes.filter(
    (lane) => lane.required && lane.activation === "immediate"
  );
  const hasHealthFloorInterrupt = program.interrupts.some(
    (interrupt) => interrupt.condition.condition_kind === "health_at_least" && interrupt.trigger_when === "not_satisfied" && interrupt.cancel_lane_ids.length > 0
  );
  if (residentCoverage.size > 0 && !hasHealthFloorInterrupt) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["interrupts"],
      message: "Resident guardian coverage requires an independent health-floor interrupt."
    });
  }
  if (residentCoverage.has("unsafe_landing_recovery")) {
    const validFallLane = requiredImmediateLanes.some((lane) => {
      const conditions = lane.nodes.flatMap(
        (node) => node.node_kind === "event" || node.node_kind === "checkpoint" || node.node_kind === "branch" ? [node.condition] : []
      );
      const actions = lane.nodes.flatMap(nodeActions);
      return conditions.some(
        (condition2) => condition2.condition_kind === "vertical_velocity_at_most"
      ) && conditions.some(
        (condition2) => condition2.condition_kind === "predicted_collision_within"
      ) && actions.some(
        (action) => action.action_kind === "place" && action.block_id === "minecraft:water" && action.placement_method === "item_use" && action.source_item_id === "minecraft:water_bucket" && action.position_binding?.binding_kind === "predicted_collision_cell" && action.position_binding.require_replaceable === true && action.cleanup_after_landing === true
      );
    });
    const boundedMutation = program.mutation_scope.world_mutation_allowed && program.mutation_scope.max_block_mutations >= 2 && program.mutation_scope.max_inventory_transfers >= 2 && program.mutation_scope.allowed_block_ids.includes("minecraft:water");
    if (!validFallLane || !boundedMutation) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["resident_guardian_coverage"],
        message: "Unsafe-landing coverage requires a required immediate predicted-collision water-bucket rescue with cleanup and a two-mutation water scope."
      });
    }
  }
  if (residentCoverage.has("fire_recovery")) {
    const validFireLane = requiredImmediateLanes.some((lane) => {
      const conditions = lane.nodes.flatMap(
        (node) => node.node_kind === "event" || node.node_kind === "checkpoint" || node.node_kind === "branch" ? [node.condition] : []
      );
      const actions = lane.nodes.flatMap(nodeActions);
      const observesMatchedHazardTransition = ["on_fire_is", "in_lava_is"].some(
        (conditionKind) => conditions.some(
          (condition2) => (condition2.condition_kind === "on_fire_is" || condition2.condition_kind === "in_lava_is") && condition2.condition_kind === conditionKind && condition2.expected
        ) && conditions.some(
          (condition2) => (condition2.condition_kind === "on_fire_is" || condition2.condition_kind === "in_lava_is") && condition2.condition_kind === conditionKind && !condition2.expected
        )
      );
      return observesMatchedHazardTransition && actions.some(
        (action) => action.action_kind === "walk" || action.action_kind === "navigate_to"
      );
    });
    if (!validFireLane) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["resident_guardian_coverage"],
        message: "Fire/lava coverage requires a required immediate lane that measures a matched hazard onset and clearance, performs bounded locomotion, and verifies stabilization."
      });
    }
  }
  const observationIds = [
    ...program.lanes.flatMap(
      (lane) => lane.nodes.map((node) => node.node_id)
    ),
    ...program.interrupts.map((interrupt) => interrupt.interrupt_id)
  ];
  if (new Set(observationIds).size !== observationIds.length) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["lanes"],
      message: "Reactive node and interrupt identifiers must be globally unique so condition evidence has one exact origin."
    });
  }
  let declaredBlockMutations = 0;
  let declaredInventoryTransfers = 0;
  const allowedBlocks = new Set(program.mutation_scope.allowed_block_ids);
  for (const [laneIndex, lane] of program.lanes.entries()) {
    const ceiling = new Set(lane.resource_ceiling);
    if (ceiling.size !== lane.resource_ceiling.length) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "resource_ceiling"],
        message: "A lane resource ceiling cannot contain duplicates."
      });
    }
    if (lane.lane_kind === "safety" && !ceiling.has("safety")) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "resource_ceiling"],
        message: "A safety lane must declare the safety resource."
      });
    }
    const nodes = new Map(lane.nodes.map((node) => [node.node_id, node]));
    if (nodes.size !== lane.nodes.length) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "nodes"],
        message: "Node identifiers must be unique inside each lane."
      });
    }
    if (!nodes.has(lane.start_node_id)) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "start_node_id"],
        message: "The lane start node must exist in that lane."
      });
    }
    if (lane.required && lane.activation !== "immediate") {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "required"],
        message: "A required lane must activate immediately."
      });
    }
    for (const [nodeIndex, node] of lane.nodes.entries()) {
      for (const target of transitions(node)) {
        if (!nodes.has(target)) {
          context.addIssue({
            code: external_exports.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes", nodeIndex],
            message: `Lane transition target ${target} does not exist.`
          });
        }
      }
      for (const target of negativeOutcomeTransitions(node)) {
        const terminal = nodes.get(target);
        if (terminal?.node_kind === "terminal" && terminal.terminal_outcome === "succeeded") {
          context.addIssue({
            code: external_exports.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes", nodeIndex],
            message: `Reactive ${node.node_kind} failure or timeout cannot transition directly to succeeded terminal ${target}; route it to a failed/canceled terminal or through explicit recovery work.`
          });
        }
      }
      for (const action of nodeActions(node)) {
        if ((action.action_kind === "attack" || action.action_kind === "combat_guard") && !program.mutation_scope.combat_allowed) {
          context.addIssue({
            code: external_exports.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes", nodeIndex, "action"],
            message: "Reactive combat actions require mutation_scope.combat_allowed=true."
          });
        }
        if (action.action_kind === "follow" || action.action_kind === "look_at" && action.target.target_kind === "environment_subject") {
          context.addIssue({
            code: external_exports.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes", nodeIndex, "action"],
            message: "Reactive subject-bound actions require nested room-identity resolution and are not yet admitted; use entity/particle tracking or a separate resolved follow action."
          });
        }
        for (const resource of minecraftReactiveResourcesForAction(action)) {
          if (!ceiling.has(resource)) {
            context.addIssue({
              code: external_exports.ZodIssueCode.custom,
              path: ["lanes", laneIndex, "nodes", nodeIndex, "action"],
              message: `Action ${action.action_kind} requires undeclared lane resource ${resource}.`
            });
          }
        }
        const multiplier = node.node_kind === "repeat" ? node.max_iterations : node.node_kind === "maintain" ? node.max_restarts + 1 : 1;
        if (action.action_kind === "mine") {
          declaredBlockMutations += action.count * multiplier;
          declaredInventoryTransfers += action.count * multiplier;
          if (!allowedBlocks.has(action.block_id)) {
            context.addIssue({
              code: external_exports.ZodIssueCode.custom,
              path: [
                "lanes",
                laneIndex,
                "nodes",
                nodeIndex,
                "action",
                "block_id"
              ],
              message: "Mined blocks must be named by the admitted mutation scope."
            });
          }
        } else if (action.action_kind === "place") {
          const placementCount = action.positions?.length ?? 1;
          const mutationFactor = action.cleanup_after_landing === true ? 2 : 1;
          declaredBlockMutations += placementCount * multiplier * mutationFactor;
          declaredInventoryTransfers += placementCount * multiplier * mutationFactor;
          if (!allowedBlocks.has(action.block_id)) {
            context.addIssue({
              code: external_exports.ZodIssueCode.custom,
              path: [
                "lanes",
                laneIndex,
                "nodes",
                nodeIndex,
                "action",
                "block_id"
              ],
              message: "Placed blocks must be named by the admitted mutation scope."
            });
          }
          if (program.mutation_scope.allowed_regions.length > 0 && action.positions) {
            for (const [
              positionIndex,
              position
            ] of action.positions.entries()) {
              const admitted = program.mutation_scope.allowed_regions.some(
                (region) => position.x >= region.min.x && position.x <= region.max.x && position.y >= region.min.y && position.y <= region.max.y && position.z >= region.min.z && position.z <= region.max.z
              );
              if (!admitted) {
                context.addIssue({
                  code: external_exports.ZodIssueCode.custom,
                  path: [
                    "lanes",
                    laneIndex,
                    "nodes",
                    nodeIndex,
                    "action",
                    "positions",
                    positionIndex
                  ],
                  message: "Every exact placement position must lie inside an admitted mutation region."
                });
              }
            }
          }
        } else if (action.action_kind === "collect" || action.action_kind === "craft" || action.action_kind === "consume" || action.action_kind === "inventory_transfer") {
          declaredInventoryTransfers += action.count * multiplier;
        } else if (action.action_kind === "equip") {
          declaredInventoryTransfers += multiplier;
        }
      }
    }
    if (!lane.nodes.some((node) => node.node_kind === "terminal")) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "nodes"],
        message: "Every reactive lane requires a terminal node."
      });
    }
    const reachable = /* @__PURE__ */ new Set();
    const active = /* @__PURE__ */ new Set();
    let cycleReported = false;
    const visit = (nodeId) => {
      if (active.has(nodeId)) {
        if (!cycleReported) {
          cycleReported = true;
          context.addIssue({
            code: external_exports.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes"],
            message: "Reactive lane graphs must be acyclic; bounded repetition belongs inside repeat or maintain nodes."
          });
        }
        return;
      }
      if (reachable.has(nodeId)) return;
      const node = nodes.get(nodeId);
      if (!node) return;
      reachable.add(nodeId);
      active.add(nodeId);
      for (const target of transitions(node)) visit(target);
      active.delete(nodeId);
    };
    visit(lane.start_node_id);
    for (const [nodeIndex, node] of lane.nodes.entries()) {
      if (!reachable.has(node.node_id)) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["lanes", laneIndex, "nodes", nodeIndex, "node_id"],
          message: "Every lane node must be reachable from its lane start node."
        });
      }
    }
  }
  for (const [raceIndex, race] of program.races.entries()) {
    const members = new Set(race.lane_ids);
    if (members.size !== race.lane_ids.length) {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["races", raceIndex, "lane_ids"],
        message: "Race lane identifiers must be unique."
      });
    }
    for (const laneId of members) {
      if (!lanes.has(laneId)) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["races", raceIndex, "lane_ids"],
          message: `Race lane ${laneId} does not exist.`
        });
      }
    }
  }
  for (const [interruptIndex, interrupt] of program.interrupts.entries()) {
    const activated = lanes.get(interrupt.activate_lane_id);
    if (!activated || activated.activation !== "interrupt_only") {
      context.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["interrupts", interruptIndex, "activate_lane_id"],
        message: "An interrupt must activate an interrupt-only lane."
      });
    }
    for (const laneId of interrupt.cancel_lane_ids) {
      if (!lanes.has(laneId)) {
        context.addIssue({
          code: external_exports.ZodIssueCode.custom,
          path: ["interrupts", interruptIndex, "cancel_lane_ids"],
          message: `Interrupted lane ${laneId} does not exist.`
        });
      }
    }
  }
  if (declaredBlockMutations > program.mutation_scope.max_block_mutations) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["mutation_scope", "max_block_mutations"],
      message: `The mutation ceiling must cover all bounded lane iterations: required at least ${declaredBlockMutations}, received ${program.mutation_scope.max_block_mutations}.`
    });
  }
  if (declaredInventoryTransfers > program.mutation_scope.max_inventory_transfers) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["mutation_scope", "max_inventory_transfers"],
      message: `The inventory-transfer ceiling must cover all bounded lane iterations: required at least ${declaredInventoryTransfers}, received ${program.mutation_scope.max_inventory_transfers}.`
    });
  }
  if (declaredBlockMutations > 0 && !program.mutation_scope.world_mutation_allowed) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["mutation_scope", "world_mutation_allowed"],
      message: "World-changing lanes require explicit mutation authority."
    });
  }
  if (!program.mutation_scope.world_mutation_allowed && (program.mutation_scope.max_block_mutations !== 0 || program.mutation_scope.allowed_block_ids.length !== 0 || program.mutation_scope.allowed_regions.length !== 0)) {
    context.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["mutation_scope"],
      message: "A non-world-mutating reactive program must carry an empty world mutation scope."
    });
  }
});
var helixMinecraftReactiveLaneObservationSchema = external_exports.object({
  lane_id: identifierSchema3,
  lane_kind: external_exports.enum(HELIX_MINECRAFT_REACTIVE_LANE_KINDS),
  state: external_exports.enum([
    "dormant",
    "waiting_for_resources",
    "running",
    "succeeded",
    "failed",
    "canceled",
    "timed_out"
  ]),
  node_id: identifierSchema3.nullable(),
  held_resources: external_exports.array(resourceSchema).max(9),
  iteration: external_exports.number().int().nonnegative().max(256),
  tick_index: tickSchema2,
  controls_released: external_exports.boolean()
}).strict();
var helixMinecraftReactiveProgramObservationSchema = external_exports.object({
  program_schema: external_exports.literal(HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA),
  program_id: identifierSchema3,
  tick_index: tickSchema2,
  active_lane_count: external_exports.number().int().nonnegative().max(8),
  lanes: external_exports.array(helixMinecraftReactiveLaneObservationSchema).min(1).max(8),
  condition_observations: external_exports.array(helixMinecraftFluidConditionObservationSchema).max(512),
  resource_conflict_count: external_exports.number().int().nonnegative(),
  interrupt_count: external_exports.number().int().nonnegative().max(16),
  controls_released: external_exports.boolean()
}).strict();

// server/services/environment-connectors/temporal-plans/minecraft-environment-time-compiler.ts
var MinecraftEnvironmentTimeCompileError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "MinecraftEnvironmentTimeCompileError";
  }
};
var wrapCompilation = (plan, targetSchema, argumentsValue) => {
  const base = {
    schema: "environment.minecraft_temporal_plan_compilation.v1",
    source_plan_id: plan.plan_id,
    source_plan_hash: plan.plan_hash,
    source_goal_id: plan.identity.goal_id,
    source_goal_revision: plan.identity.goal_revision,
    target_schema: targetSchema,
    arguments: argumentsValue,
    // Generated action postconditions are intentionally absent. Only explicit
    // source checkpoints can anchor a source-plan extension. Both current
    // compilers preserve these node/checkpoint IDs; the map is hash-bound.
    source_checkpoint_bindings: plan.nodes.flatMap((node) => node.kind === "checkpoint" ? [{
      source_node_id: node.node_id,
      source_checkpoint_id: node.checkpoint_id,
      native_node_id: node.node_id,
      native_checkpoint_id: node.checkpoint_id
    }] : []),
    execution_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false
  };
  return { ...base, compilation_hash: helixEnvironmentTimeSha256(base) };
};
var condition = (source) => {
  if (source.kind === "adapter_condition") {
    const conditionId = source.condition_id.startsWith("minecraft.") ? source.condition_id.slice("minecraft.".length) : source.condition_id;
    const parsed = helixMinecraftFluidConditionSchema.safeParse({
      condition_kind: conditionId,
      ...source.arguments
    });
    if (parsed.success) return parsed.data;
  }
  if (source.kind === "prior_node_outcome") {
    const outcome = source.outcome === "interrupted" || source.outcome === "not_started" ? null : source.outcome;
    if (outcome) {
      return helixMinecraftFluidConditionSchema.parse({
        condition_kind: "node_outcome_is",
        node_id: source.node_id,
        outcome
      });
    }
  }
  if (source.kind === "checkpoint_satisfied") {
    return helixMinecraftFluidConditionSchema.parse({
      condition_kind: "checkpoint_satisfied",
      checkpoint_id: source.checkpoint_id
    });
  }
  throw new MinecraftEnvironmentTimeCompileError(
    "unsupported_condition",
    `Minecraft cannot exactly compile shared condition ${source.kind}.`
  );
};
var validateBase = (planInput) => {
  const plan = helixEnvironmentTemporalPlanSchema.parse(planInput);
  if (plan.adapter_id !== "minecraft.fabric_client") {
    throw new MinecraftEnvironmentTimeCompileError(
      "adapter_mismatch",
      `Expected minecraft.fabric_client, received ${plan.adapter_id}.`
    );
  }
  if (plan.clocks.environment.kind !== "tick" || plan.clocks.environment.resolution_unit !== "minecraft_tick") {
    throw new MinecraftEnvironmentTimeCompileError(
      "clock_mismatch",
      "Minecraft plans require the tick/minecraft_tick clock domain."
    );
  }
  for (const node of plan.nodes) {
    if (node.kind !== "action") continue;
    if (node.abort_guards.length > 0) {
      throw new MinecraftEnvironmentTimeCompileError(
        "unsupported_semantics",
        `Action ${node.node_id} has abort guards that require a separately admitted resident interrupt lane.`
      );
    }
    const action = helixMinecraftPlayerActionArgumentsSchema.parse(node.arguments);
    if (minecraftPlayerCapabilityForActionKind(action.action_kind) !== node.capability_id || node.capability_version !== "1") {
      throw new MinecraftEnvironmentTimeCompileError(
        "capability_mismatch",
        `Action ${node.node_id} arguments do not match capability ${node.capability_id}@${node.capability_version}.`
      );
    }
  }
  return plan;
};
var minecraftAction = (plan, nodeId) => {
  const node = plan.nodes.find((candidate) => candidate.node_id === nodeId);
  if (!node || node.kind !== "action") {
    throw new MinecraftEnvironmentTimeCompileError(
      "unsupported_semantics",
      `Expected action node ${nodeId}.`
    );
  }
  return helixMinecraftPlayerActionArgumentsSchema.parse(node.arguments);
};
var assertResources = (declared, action, bindings) => {
  const required = minecraftReactiveResourcesForAction(action);
  const translated = new Set(declared.map((resource) => bindings[resource] ?? resource));
  const missing = required.filter((resource) => !translated.has(resource));
  if (missing.length > 0) {
    throw new MinecraftEnvironmentTimeCompileError(
      "resource_mismatch",
      `Minecraft action ${action.action_kind} is missing declared resources: ${missing.join(", ")}.`
    );
  }
};
var inferredEffects = (action) => {
  if (action.action_kind === "mine") {
    return { block_mutations: action.count, inventory_transfers: action.count };
  }
  if (action.action_kind === "place") {
    const count = (action.positions?.length ?? 1) * (action.cleanup_after_landing === true ? 2 : 1);
    return { block_mutations: count, inventory_transfers: count };
  }
  if (["collect", "craft", "consume", "inventory_transfer"].includes(action.action_kind)) {
    return { inventory_transfers: "count" in action ? action.count : 0 };
  }
  if (action.action_kind === "equip") return { inventory_transfers: 1 };
  if (action.action_kind === "attack") return { combat_pulses: action.max_attack_pulses };
  if (action.action_kind === "combat_guard") return { combat_pulses: action.max_attack_pulses };
  return {};
};
var assertEffects = (plan, nodeId, action) => {
  const node = plan.nodes.find((candidate) => candidate.node_id === nodeId);
  if (!node || node.kind !== "action") return;
  for (const [effect, count] of Object.entries(inferredEffects(action))) {
    if ((node.effect_budget[effect] ?? -1) < count) {
      throw new MinecraftEnvironmentTimeCompileError(
        "effect_mismatch",
        `Action ${nodeId} under-declares ${effect}: requires ${count}.`
      );
    }
  }
};
var terminalOutcome = (outcome) => outcome === "succeeded" ? "succeeded" : "failed";
var compileEnvironmentTimePlanToMinecraftFluidSequence = (input) => {
  const plan = validateBase(input.plan);
  const nodes = [];
  for (const node of plan.nodes) {
    if (node.kind === "terminal") {
      if (node.outcome === "canceled") {
        throw new MinecraftEnvironmentTimeCompileError(
          "unsupported_semantics",
          "The serial Fabric sequence format cannot preserve a canceled terminal."
        );
      }
      nodes.push({
        node_id: node.node_id,
        node_kind: "terminal",
        terminal_outcome: terminalOutcome(node.outcome),
        reason_code: node.reason_code
      });
      continue;
    }
    if (node.kind === "branch") {
      nodes.push({
        node_id: node.node_id,
        node_kind: "branch",
        earliest_tick: 0,
        condition: condition(node.condition),
        on_true: node.true_node_id,
        on_false: node.false_node_id
      });
      continue;
    }
    if (node.kind === "checkpoint") {
      nodes.push({
        node_id: node.node_id,
        node_kind: "checkpoint",
        earliest_tick: 0,
        checkpoint_id: node.checkpoint_id,
        condition: condition(node.condition),
        wait_up_to_ticks: node.wait_up_to_units,
        on_satisfied: node.on_satisfied_node_id,
        on_timeout: node.on_timeout_node_id
      });
      continue;
    }
    if (node.on_failure_node_id !== node.on_timeout_node_id) {
      throw new MinecraftEnvironmentTimeCompileError(
        "unsupported_semantics",
        `Serial action ${node.node_id} requires one shared failure/timeout target.`
      );
    }
    const action = minecraftAction(plan, node.node_id);
    assertResources(node.required_resources, action, input.resource_bindings ?? {});
    assertEffects(plan, node.node_id, action);
    const actionId = `${node.node_id}.execute`;
    let entryId = actionId;
    for (let index = node.preconditions.length - 1; index >= 0; index -= 1) {
      const gateId = index === 0 ? node.node_id : `${node.node_id}.pre.${index}`;
      nodes.push({
        node_id: gateId,
        node_kind: "branch",
        earliest_tick: node.timing.earliest_start_unit,
        condition: condition(node.preconditions[index]),
        on_true: entryId,
        on_false: node.on_failure_node_id
      });
      entryId = gateId;
    }
    const completionIds = node.completion_conditions.map(
      (_, index) => `${node.node_id}.post.${index}`
    );
    nodes.push({
      node_id: node.preconditions.length === 0 ? node.node_id : actionId,
      node_kind: "workflow_action",
      earliest_tick: node.timing.earliest_start_unit,
      latest_start_tick: node.timing.latest_start_unit,
      timeout_ticks: node.timing.maximum_duration_units,
      action,
      on_success: completionIds[0],
      on_failure: node.on_failure_node_id
    });
    node.completion_conditions.forEach((postcondition, index) => {
      nodes.push({
        node_id: completionIds[index],
        node_kind: "checkpoint",
        earliest_tick: node.timing.earliest_start_unit,
        checkpoint_id: `${node.node_id}.post.${index}`,
        condition: condition(postcondition),
        wait_up_to_ticks: 0,
        on_satisfied: completionIds[index + 1] ?? node.on_success_node_id,
        on_timeout: node.on_failure_node_id
      });
    });
  }
  const compiled = {
    action_kind: "execute_sequence",
    sequence_schema: HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA,
    sequence_id: plan.plan_id,
    ruleset: "survival_tas",
    execution_plane: "player_embodiment",
    scheduler_engine: "native_fabric",
    optimization: {
      primary: "minimize_world_ticks",
      record_wall_clock: true,
      stop_on_first_verified_success: true
    },
    start_node_id: plan.start_node_id,
    max_total_ticks: plan.maximum_total_units,
    required_checkpoint_ids: plan.nodes.filter((node) => node.kind === "checkpoint").map((node) => node.kind === "checkpoint" ? node.checkpoint_id : ""),
    mutation_scope: input.mutation_scope,
    nodes
  };
  const parsed = helixMinecraftFluidSequenceArgumentsSchema.safeParse(compiled);
  if (!parsed.success) {
    throw new MinecraftEnvironmentTimeCompileError(
      "invalid_compiled_program",
      parsed.error.issues.map((issue) => issue.message).join("; ")
    );
  }
  return parsed.data;
};
var compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact = (input) => {
  const plan = helixEnvironmentTemporalPlanSchema.parse(input.plan);
  return wrapCompilation(
    plan,
    HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA,
    compileEnvironmentTimePlanToMinecraftFluidSequence(input)
  );
};

// .tmp/cs3-root-plan-builder-20260914.ts
function buildRoot(frontier, planning, actor) {
  const resident = planning.resident_clock_observation;
  if (!resident || resident.clock.clock_kind !== "minecraft_game_tick" || !resident.clock.monotonic || resident.producer_epoch_ref !== frontier.identity.producer_epoch) throw new Error("Observed resident clock required");
  const radians = actor.yaw * Math.PI / 180;
  const destination = { x: actor.position.x - Math.sin(radians) * 4.4, y: actor.position.y, z: actor.position.z + Math.cos(radians) * 4.4 };
  const condition2 = (name, args) => ({ kind: "adapter_condition", condition_id: `minecraft.${name}`, arguments: args });
  const plan = buildHelixEnvironmentTemporalPlan({
    schema: "environment.temporal_action_plan.v1",
    plan_id: "plan:cs3-root-motion-baseline-20260914-01",
    previous_plan_id: null,
    previous_plan_hash: null,
    identity: frontier.identity,
    clocks: { environment: { kind: "tick", sequence: resident.clock.tick_index, resolution_unit: "minecraft_tick", nominal_units_per_second: 20 }, monotonic: resident.clock.monotonic, audit_at: (/* @__PURE__ */ new Date()).toISOString() },
    adapter_id: "minecraft.fabric_client",
    adapter_version: "1",
    compiler_version: "environment_time_minecraft:1",
    resident_executor_version: "native_fabric:1",
    start_node_id: "initial",
    maximum_total_units: 150,
    monotonic_deadline_elapsed_ms: resident.clock.monotonic.elapsed_ms + 7500,
    watermarks: { decision_unit: 0, stop_unit: 120, committed_through_unit: 121, stabilization_node_id: "initial" },
    lanes: [{ lane_id: "locomotion", priority: 100, resource_keys: ["resource:locomotion"] }],
    effect_ceiling: {},
    nodes: [
      { kind: "checkpoint", node_id: "initial", checkpoint_id: "checkpoint:cs3-root-initial-20260914-01", required_evidence_kinds: ["player_pose"], condition: condition2("position_within", { position: actor.position, radius: 0.75 }), wait_up_to_units: 1, on_satisfied_node_id: "walk", on_timeout_node_id: "failed" },
      { kind: "action", node_id: "walk", lane_id: "locomotion", capability_id: "com.casimirbot.minecraft.player.walk", capability_version: "1", arguments: { action_kind: "walk", direction: "forward", duration_ms: 1050, sprint: false }, required_resources: ["resource:locomotion"], timing: { earliest_start_unit: 0, latest_start_unit: 80, maximum_duration_units: 22 }, preconditions: [condition2("player_grounded", { expected: true }), condition2("health_at_least", { health: 18 })], completion_conditions: [condition2("player_grounded", { expected: true })], abort_guards: [], effect_budget: {}, on_success_node_id: "arrival", on_failure_node_id: "failed", on_timeout_node_id: "failed" },
      { kind: "checkpoint", node_id: "arrival", checkpoint_id: "checkpoint:cs3-root-arrival-20260914-01", required_evidence_kinds: ["player_pose"], condition: condition2("position_within", { position: destination, radius: 1.5 }), wait_up_to_units: 1, on_satisfied_node_id: "success", on_timeout_node_id: "failed" },
      { kind: "terminal", node_id: "success", outcome: "succeeded", reason_code: "bounded_advance_verified" },
      { kind: "terminal", node_id: "failed", outcome: "failed", reason_code: "bounded_advance_stopped" }
    ],
    automatic_replay: false,
    adapter_strategy_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false
  });
  const mutation_scope = { world_mutation_allowed: false, max_block_mutations: 0, max_inventory_transfers: 0, allowed_block_ids: [], allowed_regions: [], combat_allowed: false };
  const resource_bindings = { "resource:locomotion": "locomotion" };
  const compilation = compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact({ plan, mutation_scope, resource_bindings });
  return { plan, compilation, mutation_scope, resource_bindings, destination };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildRoot
});
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
