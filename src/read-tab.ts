import { browser } from "wxt/browser";
import { isIndeedPage, isIndeedSlice, isPageRead } from "@/src/capture/guards";
import { mergeIndeedSlice } from "@/src/capture/indeed";
import { isRecord } from "@/src/capture/records";
import { type SelectionCapture } from "@/src/capture/read-page";
import { type PageRead } from "@/src/capture/types";

export class TabReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TabReadError";
  }
}

export type TabSnapshot = {
  id?: number;
  url?: string;
};

export type TabDecision =
  | { ok: true; id: number; url: string }
  | { ok: false; reason: TabRefusal; message: string };

type TabRefusal = "missing-tab" | "missing-id" | "permission" | "browser-page" | "not-web";

const browserPageProtocols = new Set([
  "about:",
  "chrome:",
  "chrome-extension:",
  "chrome-search:",
  "chrome-untrusted:",
  "devtools:",
  "edge:",
  "moz-extension:",
  "opera:",
  "vivaldi:",
  "view-source:",
]);

type ReaderGlobal = typeof globalThis & {
  __jobCaptureRead?: unknown;
};

type SelectionGlobal = typeof globalThis & {
  __jobCaptureSelection?: unknown;
};

type IndeedGlobal = typeof globalThis & {
  __jobCaptureIndeed?: unknown;
};

export function throwTabReadError(message: string): never {
  console.error(message);
  throw new TabReadError(message);
}

export function scriptingErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  return "The page script failed without an error message.";
}

export function explainTab(tab: TabSnapshot | undefined): TabDecision {
  if (!tab) {
    return {
      ok: false,
      reason: "missing-tab",
      message: "No active tab was found. Open an http or https job page, then extract.",
    };
  }
  if (tab.id == null) {
    return {
      ok: false,
      reason: "missing-id",
      message: "This tab has no id. The extension cannot read a tab without a tab id.",
    };
  }
  if (!tab.url) {
    return {
      ok: false,
      reason: "permission",
      message:
        "Permission: this tab's address is blank. A click inside the side panel does not grant activeTab, and without the tabs permission the address is omitted.",
    };
  }
  let protocol = "";
  try {
    protocol = new URL(tab.url).protocol;
  } catch {
    return {
      ok: false,
      reason: "not-web",
      message: "This tab's address could not be parsed, so it is not an http or https page.",
    };
  }
  if (browserPageProtocols.has(protocol)) {
    return {
      ok: false,
      reason: "browser-page",
      message: `This tab is a browser page (${protocol}), not an http or https job page.`,
    };
  }
  if (protocol !== "http:" && protocol !== "https:") {
    return {
      ok: false,
      reason: "not-web",
      message: `This tab is not an http or https page (${protocol}). Open a normal web page, then extract.`,
    };
  }
  return { ok: true, id: tab.id, url: tab.url };
}

export function selectActiveTab(
  currentWindow: readonly TabSnapshot[],
  normalWindows: readonly TabSnapshot[],
): TabSnapshot | undefined {
  if (currentWindow.length > 0) return preferWebTab(currentWindow);
  return preferWebTab(normalWindows);
}

export async function readActiveTab(): Promise<PageRead> {
  const tab = await activeWebTab();
  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/page-reader.js"],
    });
  } catch (error) {
    throwTabReadError(scriptingErrorMessage(error));
  }

  let injected: unknown;
  try {
    const [read] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: readPageResult,
    });
    injected = read?.result ?? null;
  } catch (error) {
    throwTabReadError(scriptingErrorMessage(error));
  }

  if (!isPageRead(injected)) {
    throwTabReadError("The page did not return a capture. Reload the tab and try again.");
  }

  if (!isIndeedPage(tab.url)) return injected;

  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/indeed-main.js"],
      world: "MAIN",
    });
    const [mainWorld] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: readIndeedResult,
    });
    const slice = mainWorld?.result ?? null;
    if (slice == null) return injected;
    if (!isIndeedSlice(slice)) return injected;
    return mergeIndeedSlice(injected, slice);
  } catch (error) {
    const message = `The Indeed page model could not be read. Showing the fields found in the page markup. ${scriptingErrorMessage(error)}`;
    console.error(message);
    return {
      ...injected,
      warnings: [...injected.warnings, message],
    };
  }
}

export async function readActiveSelection(): Promise<SelectionCapture> {
  const tab = await activeWebTab();
  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/selection-reader.js"],
    });
  } catch (error) {
    throwTabReadError(scriptingErrorMessage(error));
  }

  let injected: unknown;
  try {
    const [read] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: readSelectionResult,
    });
    injected = read?.result ?? null;
  } catch (error) {
    throwTabReadError(scriptingErrorMessage(error));
  }

  if (!isSelectionCapture(injected)) {
    throwTabReadError("The selection could not be read. Reload the tab and try again.");
  }
  return injected;
}

function isSelectionCapture(value: unknown): value is SelectionCapture {
  if (!isRecord(value)) return false;
  if (value.empty === true) return true;
  if (value.empty !== false) return false;
  if (typeof value.markdown !== "string" || value.markdown.trim().length === 0) return false;
  if (typeof value.sourceUrl !== "string") return false;
  if (value.pageLanguage !== null && typeof value.pageLanguage !== "string") return false;
  if (value.sourceJobId !== undefined && typeof value.sourceJobId !== "string") return false;
  return true;
}

export async function activeWebTab(): Promise<{ id: number; url: string }> {
  const currentWindow = await browser.tabs.query({ active: true, currentWindow: true });
  const normalWindows =
    currentWindow.length > 0 ? [] : await browser.tabs.query({ active: true, windowType: "normal" });
  const decision = explainTab(selectActiveTab(currentWindow, normalWindows));
  if (!decision.ok) throwTabReadError(decision.message);
  return { id: decision.id, url: decision.url };
}

function preferWebTab(tabs: readonly TabSnapshot[]): TabSnapshot | undefined {
  return (
    tabs.find((tab) => isHttpUrl(tab.url)) ??
    tabs.find((tab) => Boolean(tab.url)) ??
    tabs.find((tab) => tab.id != null) ??
    tabs[0]
  );
}

function isHttpUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function readPageResult(): unknown {
  return (globalThis as ReaderGlobal).__jobCaptureRead ?? null;
}

function readSelectionResult(): unknown {
  return (globalThis as SelectionGlobal).__jobCaptureSelection ?? null;
}

function readIndeedResult(): unknown {
  return (globalThis as IndeedGlobal).__jobCaptureIndeed ?? null;
}
