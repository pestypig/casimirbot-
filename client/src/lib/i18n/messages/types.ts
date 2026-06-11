export const INTERFACE_MESSAGE_IDS = [
  "account.language.title",
  "account.language.interfaceLabel",
] as const;

export type InterfaceMessageId = (typeof INTERFACE_MESSAGE_IDS)[number];

export type InterfaceMessageValue = string | number | boolean | null | undefined;

export type InterfaceMessageValues = Record<string, InterfaceMessageValue>;

export type InterfaceMessageCatalog = Record<InterfaceMessageId, string>;
