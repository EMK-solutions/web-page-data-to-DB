import { type JobCapture } from "@/src/capture/schema";

/** Compare captures by address. A trailing slash on the path does not make a new page. */
export function captureUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }
    return parsed.href;
  } catch {
    return url;
  }
}

/** Newest capture for this page. The list itself is left unchanged. */
export function newestCaptureForUrl(
  captures: readonly JobCapture[],
  url: string,
): JobCapture | null {
  const key = captureUrlKey(url);
  let newest: JobCapture | null = null;
  for (const capture of captures) {
    if (captureUrlKey(capture.sourceUrl) !== key) continue;
    if (newest == null || capture.extractedAt > newest.extractedAt) newest = capture;
  }
  return newest;
}
