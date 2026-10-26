import { browser } from "wxt/browser";
import { normalizeSettings, type Settings } from "@/src/settings";

const SETTINGS_KEY = "settings";

export async function loadSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY]);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ [SETTINGS_KEY]: normalizeSettings(settings) });
}
