import { browser, defineBackground } from "#imports";

export default defineBackground(() => {
  void browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => {
      console.error("The toolbar icon could not open the side panel.", error);
    });
});
