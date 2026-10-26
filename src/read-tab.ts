import { browser } from "wxt/browser";
import { isIndeedPage, isIndeedSlice, isPageRead } from "@/src/capture/guards";
import { mergeIndeedSlice } from "@/src/capture/indeed";
import { type PageRead } from "@/src/capture/types";

export class TabReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TabReadError";
  }
}

type ReaderGlobal = typeof globalThis & {
  __jobCaptureRead?: Promise<unknown>;
};

type IndeedGlobal = typeof globalThis & {
  __jobCaptureIndeed?: unknown;
};

export async function readActiveTab(): Promise<PageRead> {
  const tab = await activeWebTab();
  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/page-reader.js"],
    });
  } catch {
    throw new TabReadError("This tab could not be read. Reload it, then extract again.");
  }

  let injected: unknown;
  try {
    const [read] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: readPageResult,
    });
    injected = read?.result ?? null;
  } catch {
    throw new TabReadError("This tab could not be read. Reload it, then extract again.");
  }

  if (!isPageRead(injected)) {
    throw new TabReadError("The page did not return a capture. Reload the tab and try again.");
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
  } catch {
    return {
      ...injected,
      warnings: [
        ...injected.warnings,
        "The Indeed page model could not be read. Showing the fields found in the page markup.",
      ],
    };
  }
}

async function activeWebTab(): Promise<{ id: number; url: string }> {
  const focused = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  const current = focused[0] ?? (await browser.tabs.query({ active: true, currentWindow: true }))[0];
  if (!current?.id || !current.url) {
    throw new TabReadError("This tab cannot be read. Open a job page, then extract.");
  }
  let protocol = "";
  try {
    protocol = new URL(current.url).protocol;
  } catch {
    throw new TabReadError("This tab cannot be read. Open a normal web page, then extract.");
  }
  if (protocol !== "http:" && protocol !== "https:") {
    throw new TabReadError("This tab cannot be read. Open a normal web page, then extract.");
  }
  return { id: current.id, url: current.url };
}

async function readPageResult(): Promise<unknown> {
  const pending = (globalThis as ReaderGlobal).__jobCaptureRead;
  if (!pending) return null;
  return pending;
}

function readIndeedResult(): unknown {
  return (globalThis as IndeedGlobal).__jobCaptureIndeed ?? null;
}
