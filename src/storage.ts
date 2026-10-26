import { browser } from "wxt/browser";
import { calendarDateOrNull } from "@/src/capture/date";
import { isRecord } from "@/src/capture/records";
import { jobCaptureSchema, type JobCapture } from "@/src/capture/schema";

const RECENT_KEY = "recentCaptures";
export const MAX_RECENT_CAPTURES = 8;

export async function listRecentCaptures(): Promise<JobCapture[]> {
  const stored = await browser.storage.local.get(RECENT_KEY);
  const value = stored[RECENT_KEY];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = acceptStoredCapture(item);
    return parsed ? [parsed] : [];
  });
}

/** Older saves omit jobPostedDate. A missing or invalid date becomes null. */
export function acceptStoredCapture(item: unknown): JobCapture | null {
  const parsed = jobCaptureSchema.safeParse(withPostedDate(item));
  return parsed.success ? parsed.data : null;
}

function withPostedDate(item: unknown): unknown {
  if (!isRecord(item)) return item;
  const posted = item.jobPostedDate;
  const jobPostedDate =
    typeof posted === "string" ? calendarDateOrNull(posted) : posted == null ? null : null;
  return { ...item, jobPostedDate };
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
