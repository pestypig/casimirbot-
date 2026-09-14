// Fixed public diagnostics only. Never copy native broker or database messages.
export const PAIRING_STORAGE_ERRORS = {
  pairing_storage_unreadable: "Saved pairing data could not be opened. Keep this pairing while access to its encrypted storage is restored, then check it again.",
  pairing_storage_invalid: "Saved pairing data failed validation. Keep the existing record for recovery; creating another invitation will not repair it.",
  pairing_storage_identity_mismatch: "Saved pairing identity failed validation. Recovery is blocked until the stored record is repaired.",
  pairing_native_broker_required: "Native encrypted storage is unavailable. Restore the desktop storage service before checking this pairing again.",
  pairing_native_envelope_invalid: "Saved pairing encryption format is invalid. Recovery is blocked; no replacement permission was created.",
} as const;
export type PairingStorageErrorCode = keyof typeof PAIRING_STORAGE_ERRORS;
export function isPairingStorageErrorCode(value: unknown): value is PairingStorageErrorCode {
  return typeof value === "string" && Object.hasOwn(PAIRING_STORAGE_ERRORS, value);
}
