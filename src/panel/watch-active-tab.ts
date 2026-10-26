import { browser } from "wxt/browser";
import { selectActiveTab, type TabSnapshot } from "@/src/read-tab";

/** Report the active tab URL. Does not read the page or call a model. */
export function watchActiveTabUrl(onUrl: (url: string) => void): () => void {
  let stopped = false;

  const emitCurrent = (): void => {
    void currentTabUrl().then((url) => {
      if (stopped || !url) return;
      onUrl(url);
    });
  };

  const onActivated = (): void => {
    emitCurrent();
  };

  const onUpdated = (tabId: number, changeInfo: { url?: string }): void => {
    if (!changeInfo.url) return;
    const nextUrl = changeInfo.url;
    void currentTab().then((tab) => {
      if (stopped || tab?.id !== tabId) return;
      onUrl(nextUrl);
    });
  };

  browser.tabs.onActivated.addListener(onActivated);
  browser.tabs.onUpdated.addListener(onUpdated);
  emitCurrent();

  return () => {
    stopped = true;
    browser.tabs.onActivated.removeListener(onActivated);
    browser.tabs.onUpdated.removeListener(onUpdated);
  };
}

async function currentTab(): Promise<TabSnapshot | undefined> {
  const currentWindow = await browser.tabs.query({ active: true, currentWindow: true });
  const normalWindows =
    currentWindow.length > 0
      ? []
      : await browser.tabs.query({ active: true, windowType: "normal" });
  return selectActiveTab(currentWindow, normalWindows);
}

async function currentTabUrl(): Promise<string | undefined> {
  const tab = await currentTab();
  return tab?.url;
}
