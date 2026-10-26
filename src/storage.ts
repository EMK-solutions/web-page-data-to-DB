import { browser } from "wxt/browser";
import { jobCaptureSchema, type JobCapture } from "@/src/capture/schema";

const RECENT_KEY = "recentCaptures";
export const MAX_RECENT_CAPTURES = 8;

export async function listRecentCaptures(): Promise<JobCapture[]> {
  const stored = await browser.storage.local.get(RECENT_KEY);
  const value = stored[RECENT_KEY];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = jobCaptureSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function rememberCapture(capture: JobCapture): Promise<JobCapture[]> {
  const current = await listRecentCaptures();
  const next = [
    capture,
    ...current.filter((item) => item.extractedAt !== capture.extractedAt),
  ].slice(0, MAX_RECENT_CAPTURES);
  await browser.storage.local.set({ [RECENT_KEY]: next });
  return next;
}
