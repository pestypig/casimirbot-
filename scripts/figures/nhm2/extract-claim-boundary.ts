export function extractClaimBoundary(_ledger: any): Array<{ label: string; value: string; status: string }> {
  return [
    { label: "validationClaimAllowed", value: "false", status: "locked" },
    { label: "physicalMechanismClaimAllowed", value: "false", status: "locked" },
    { label: "promotionAllowed", value: "false", status: "locked" },
    { label: "doesValidateNHM2", value: "false", status: "locked" },
  ];
}
