import { defineUnlistedScript } from "#imports";
import { readOpenPage } from "@/src/capture/read-page";

type ReaderGlobal = typeof globalThis & {
  __jobCaptureRead?: ReturnType<typeof readOpenPage>;
};

/** Plain content script injected on click. No React. */
export default defineUnlistedScript(() => {
  const host = globalThis as ReaderGlobal;
  host.__jobCaptureRead = readOpenPage(document, location.href);
});
