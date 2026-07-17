import type { Cycle } from "./subscriptions";

export interface SubscriptionPreset {
  id: string;
  name: string;
  /** Default billing cycle shown in the form. */
  cycle: Cycle;
  /** Brand accent color (hex) used as the fallback letter-tile background. */
  color: string;
}

/** Common shared-subscription services, roughly by popularity for 合租. */
export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { id: "netflix", name: "Netflix", cycle: "monthly", color: "#E50914" },
  { id: "spotify", name: "Spotify", cycle: "monthly", color: "#1DB954" },
  { id: "youtube", name: "YouTube Premium", cycle: "monthly", color: "#FF0000" },
  { id: "icloud", name: "iCloud+", cycle: "monthly", color: "#3693F3" },
  { id: "disney", name: "Disney+", cycle: "yearly", color: "#113CCF" },
  { id: "appletv", name: "Apple TV+", cycle: "monthly", color: "#1d1d1f" },
  { id: "applemusic", name: "Apple Music", cycle: "monthly", color: "#FA243C" },
  { id: "chatgpt", name: "ChatGPT Plus", cycle: "monthly", color: "#10A37F" },
  { id: "claude", name: "Claude Pro", cycle: "monthly", color: "#D97757" },
  { id: "midjourney", name: "Midjourney", cycle: "monthly", color: "#000000" },
  { id: "notion", name: "Notion", cycle: "yearly", color: "#000000" },
  { id: "onedrive", name: "OneDrive", cycle: "yearly", color: "#0364B8" },
  { id: "googledrive", name: "Google One", cycle: "yearly", color: "#4285F4" },
  { id: "xbox", name: "Xbox Game Pass", cycle: "monthly", color: "#107C10" },
  { id: "psn", name: "PS Plus", cycle: "yearly", color: "#0070D1" },
  { id: "switch", name: "Switch Online", cycle: "yearly", color: "#E60012" },
  { id: "bilibili", name: "B站大会员", cycle: "yearly", color: "#FB7299" },
  { id: "iqiyi", name: "爱奇艺", cycle: "yearly", color: "#1CC749" },
  { id: "tencent", name: "腾讯视频", cycle: "yearly", color: "#FF6022" },
  { id: "youku", name: "优酷", cycle: "yearly", color: "#0A9BFF" },
  { id: "qqmusic", name: "QQ音乐", cycle: "yearly", color: "#31C27C" },
  { id: "netease", name: "网易云音乐", cycle: "yearly", color: "#EC4141" },
  { id: "keep", name: "Keep", cycle: "yearly", color: "#24C789" },
  { id: "duolingo", name: "Duolingo", cycle: "yearly", color: "#58CC02" },
];

export function findPresetByName(name: string): SubscriptionPreset | undefined {
  return SUBSCRIPTION_PRESETS.find((p) => p.name === name);
}
