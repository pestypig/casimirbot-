export type LumaMood = "mad" | "upset" | "shock" | "question" | "happy" | "friend" | "love";

// Ordered list for UI selectors or spectrum sliders
export const LUMA_MOOD_ORDER: LumaMood[] = [
  "mad",
  "upset",
  "shock",
  "question",
  "happy",
  "friend",
  "love",
];

export type LumaMoodAsset = { label: string; sources: string[] };

export const LUMA_MOOD_ASSETS: Record<LumaMood, LumaMoodAsset> = {
  mad: {
    label: "Mad",
    sources: ["/luma/emotes/emoji%20mad.png", "/luma/emotes/mad.png"],
  },
  upset: {
    label: "Upset",
    sources: ["/luma/emotes/emoji%20upset.png", "/luma/emotes/upset.png"],
  },
  shock: {
    label: "Shock",
    sources: ["/luma/emotes/emoji%20shock.png", "/luma/emotes/shock.png"],
  },
  question: {
    label: "Question",
    sources: ["/luma/emotes/emoji%20question.png", "/luma/emotes/question.png"],
  },
  happy: {
    label: "Happy",
    sources: ["/luma/emotes/emoji%20happy.png", "/luma/emotes/happy.png"],
  },
  friend: {
    label: "Friendly",
    sources: ["/luma/emotes/emoji%20friend.png", "/luma/emotes/friend.png"],
  },
  love: {
    label: "Love",
    sources: ["/luma/emotes/emoji%20love.png", "/luma/emotes/love.png"],
  },
};

export function resolveMoodAsset(mood: LumaMood | null | undefined) {
  if (!mood) return null;
  return LUMA_MOOD_ASSETS[mood] ?? null;
}

export function publishLumaMood(mood: LumaMood | null) {
  publish("luma:mood", { mood });
}
import { publish } from "./luma-bus";
