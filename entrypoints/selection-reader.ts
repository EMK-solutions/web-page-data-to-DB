import { defineUnlistedScript } from "#imports";
import { readSelectionCapture, type SelectionCapture } from "@/src/capture/read-page";

type SelectionGlobal = typeof globalThis & {
  __jobCaptureSelection?: SelectionCapture;
};

/** Reads the page selection as markdown. Does not change the selection. */
export default defineUnlistedScript(() => {
  const host = globalThis as SelectionGlobal;
  host.__jobCaptureSelection = readSelectionCapture(document, location.href);
});
