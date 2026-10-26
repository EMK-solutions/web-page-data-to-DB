import { captureUrlKey, newestCaptureForUrl } from "@/src/capture/capture-url";
import { type JobCapture } from "@/src/capture/schema";

export type TabUrlSyncHandlers = {
  onMatch: (capture: JobCapture) => void;
  onEmpty: () => void;
  currentRequestId: () => number;
  bumpRequestId: () => void;
  captures: () => readonly JobCapture[];
};

/**
 * Show the capture for the open tab once recent captures are loaded.
 * Same address again does nothing, so a finished extract keeps its prompt.
 */
export function createTabUrlSync(handlers: TabUrlSyncHandlers): {
  recentLoaded: () => void;
  urlChanged: (url: string) => void;
} {
  let recentReady = false;
  let pendingUrl: string | null = null;
  let appliedKey: string | null = null;
  let sawUrl = false;

  function urlChanged(url: string): void {
    pendingUrl = url;
    if (!recentReady) return;
    const key = captureUrlKey(url);
    if (sawUrl && key === appliedKey) return;
    const first = !sawUrl;
    sawUrl = true;
    appliedKey = key;
    if (first && handlers.currentRequestId() !== 0) return;
    handlers.bumpRequestId();
    const match = newestCaptureForUrl(handlers.captures(), url);
    if (match) handlers.onMatch(match);
    else handlers.onEmpty();
  }

  function recentLoaded(): void {
    recentReady = true;
    if (pendingUrl != null) urlChanged(pendingUrl);
  }

  return { recentLoaded, urlChanged };
}
