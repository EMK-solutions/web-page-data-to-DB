export const emptySelectionMessage =
  "No text is selected. Select the posting on the page, then extract the selection.";

/** Reads the current selection. Does not add, remove, or move ranges. */
export function readDocumentSelection(doc: Document): string {
  const selection = doc.getSelection();
  if (!selection) return "";
  return selection.toString();
}
