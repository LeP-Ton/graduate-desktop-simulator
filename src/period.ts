import type { AppId } from "./game/types";

export const GAME_TITLE = "研究生桌面模拟器：2012";
export const GAME_YEAR = 2012;
declare global {
  interface Window {
    __PERIOD_ASSETS__?: Record<string, string>;
  }
}
export function assetUrl(file: string) {
  return (
    window.__PERIOD_ASSETS__?.[file] ??
    `${import.meta.env.BASE_URL}period-assets/${file}`
  );
}
const icons: Record<AppId, string> = {
  home: "computer",
  chat: "qq",
  search: "ie",
  library: "folder",
  ide: "diary",
  terminal: "computer",
  gpu: "control-panel",
  analysis: "study",
  writer: "documents",
  calendar: "schedule",
  mail: "documents",
  files: "folder",
  academic: "study",
  ai: "control-panel",
  life: "favorites",
  settings: "control-panel",
};
export function iconUrl(app: AppId, size: number) {
  const name = icons[app];
  return assetUrl(
    `icons/${name === "qq" ? "qq.png" : `${name}-${size <= 18 ? 16 : size <= 32 ? 32 : 48}.png`}`,
  );
}

const avatars: Record<string, string> = {
  "🌱": "player",
  "🧑‍💻": "zichen",
  "👩‍🚀": "xiaoyu",
  "🐈": "wei",
  "🦊": "yuchen",
  "🌻": "muwan",
  mentor: "zhou",
  senior: "siyuan",
  sister: "muwan",
  peer: "zichen",
  junior: "yuchen",
  "junior-sis": "xiaoyu",
  admin: "zhou",
};
export function avatarUrl(value: string) {
  return assetUrl(`avatars/${avatars[value] ?? "player"}.jpg`);
}
