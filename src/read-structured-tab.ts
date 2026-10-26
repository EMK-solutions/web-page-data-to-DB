import { browser } from "wxt/browser";
import { isRecord } from "@/src/capture/records";
import { documentFromJsonLd } from "@/src/capture/structured-extract";
import { activeWebTab, scriptingErrorMessage, throwTabReadError } from "@/src/read-tab";

export type StructuredTabRead = {
  doc: Document;
  pageUrl: string;
};

/** Read schema.org script text already in the page. Does not click, scroll, or inject a reader. */
export async function readActiveStructuredJob(): Promise<StructuredTabRead> {
  const tab = await activeWebTab();
  let injected: unknown;
  try {
    const [read] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectJsonLdScripts,
    });
    injected = read?.result ?? null;
  } catch (error) {
    throwTabReadError(scriptingErrorMessage(error));
  }

  if (!isJsonLdBundle(injected)) {
    throwTabReadError("The page did not return structured data. Reload the tab and try again.");
  }
  return {
    doc: documentFromJsonLd(injected.scripts, injected.lang),
    pageUrl: tab.url,
  };
}

function isJsonLdBundle(value: unknown): value is { scripts: string[]; lang: string | null } {
  if (!isRecord(value) || !Array.isArray(value.scripts)) return false;
  if (!value.scripts.every((item) => typeof item === "string")) return false;
  return value.lang === null || typeof value.lang === "string";
}

function collectJsonLdScripts(): { scripts: string[]; lang: string | null } {
  const scripts: string[] = [];
  const nodes = document.querySelectorAll('script[type="application/ld+json"]');
  for (const node of nodes) {
    const text = node.textContent;
    if (text != null && text.trim().length > 0) scripts.push(text);
  }
  const lang = document.documentElement.lang.trim();
  return { scripts, lang: lang.length > 0 ? lang : null };
}
