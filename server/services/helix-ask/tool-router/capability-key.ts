export type HelixCapabilityKeyParts = {
  panelId: string;
  actionId: string;
};

export const splitHelixCapabilityKey = (capabilityKey: string): HelixCapabilityKeyParts => {
  const separator = capabilityKey.indexOf(".");
  if (separator < 0) return { panelId: capabilityKey, actionId: "" };
  return {
    panelId: capabilityKey.slice(0, separator),
    actionId: capabilityKey.slice(separator + 1),
  };
};
