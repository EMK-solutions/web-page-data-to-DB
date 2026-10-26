import { defineUnlistedScript } from "#imports";
import { readSelectionCapture, type SelectionCapture } from "@/src/capture/read-page";
import { readDocumentSelection } from "@/src/capture/selection";

type SelectionGlobal = typeof globalThis & {
  __jobCaptureSelection?: SelectionCapture;
};

/** Reads the page selection and JobPosting fields. Does not change the selection. */
export default defineUnlistedScript(() => {
  const host = globalThis as SelectionGlobal;
  host.__jobCaptureSelection = readSelectionCapture(
    document,
    location.href,
    readDocumentSelection(document),
  );
});
