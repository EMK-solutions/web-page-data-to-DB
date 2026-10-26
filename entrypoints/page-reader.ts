import { defineUnlistedScript } from "#imports";
import { readOpenPage } from "@/src/capture/read-page";

type ReaderGlobal = typeof globalThis & {
  __jobCaptureRead?: ReturnType<typeof readOpenPage>;
};

/** Plain script injected when Extract runs. It only reads the open page. */
export default defineUnlistedScript(() => {
  const host = globalThis as ReaderGlobal;
  host.__jobCaptureRead = readOpenPage(document, location.href);
});
