import crypto from "node:crypto";

const GUEST_NAME_ADJECTIVES = [
  "Able",
  "Amber",
  "Arctic",
  "Brave",
  "Bright",
  "Calm",
  "Clever",
  "Cosmic",
  "Daring",
  "Eager",
  "Electric",
  "Flying",
  "Gentle",
  "Golden",
  "Happy",
  "Hidden",
  "Jolly",
  "Kind",
  "Lucky",
  "Lunar",
  "Mighty",
  "Nimble",
  "Noble",
  "Quiet",
  "Rapid",
  "Silver",
  "Solar",
  "Steady",
  "Swift",
  "Tiny",
  "Vivid",
  "Wild",
] as const;

const GUEST_NAME_NOUNS = [
  "Badger",
  "Beacon",
  "Bear",
  "Comet",
  "Coyote",
  "Eagle",
  "Falcon",
  "Finch",
  "Fox",
  "Gecko",
  "Harbor",
  "Hawk",
  "Heron",
  "Lynx",
  "Maple",
  "Meteor",
  "Otter",
  "Owl",
  "Panda",
  "Penguin",
  "Pilot",
  "Puma",
  "Raven",
  "Rocket",
  "Sparrow",
  "Tiger",
  "Turtle",
  "Voyager",
  "Whale",
  "Wolf",
  "Wombat",
  "Zephyr",
] as const;

const pick = <T>(values: readonly T[]): T => values[crypto.randomInt(values.length)];

/**
 * Produces a short, non-personal guest label in the classic generated
 * gamertag style. Authorization always uses the guest profile/session IDs.
 */
export function generateGuestDisplayName(): string {
  const suffix = crypto.randomInt(10, 100);
  return `${pick(GUEST_NAME_ADJECTIVES)}${pick(GUEST_NAME_NOUNS)}${suffix}`;
}
