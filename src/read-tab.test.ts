import { describe, expect, it, vi } from "vitest";
import {
  explainTab,
  scriptingErrorMessage,
  selectActiveTab,
  TabReadError,
  throwTabReadError,
} from "@/src/read-tab";

const jobUrl = "https://www.jobup.ch/en/jobs/detail/7ad06163-6c54-4e09-bdda-de908f9571ef/";

describe("explainTab", () => {
  it("names a missing tab", () => {
    const decision = explainTab(undefined);
    expect(decision.ok).toBe(false);
    if (decision.ok) return;
    expect(decision.reason).toBe("missing-tab");
    expect(decision.message).toMatch(/active tab/i);
  });

  it("names a missing tab id", () => {
    const decision = explainTab({ url: jobUrl });
    expect(decision.ok).toBe(false);
    if (decision.ok) return;
    expect(decision.reason).toBe("missing-id");
    expect(decision.message).toMatch(/tab id/i);
  });

  it("names a blank address as a permission problem", () => {
    const decision = explainTab({ id: 4 });
    expect(decision.ok).toBe(false);
    if (decision.ok) return;
    expect(decision.reason).toBe("permission");
    expect(decision.message).toMatch(/permission/i);
    expect(decision.message).toMatch(/activeTab/);
  });

  it("names a browser page by its protocol", () => {
    for (const url of ["chrome://newtab/", "about:blank", "edge://settings/", "chrome-extension://abc/panel.html"]) {
      const decision = explainTab({ id: 4, url });
      expect(decision.ok).toBe(false);
      if (decision.ok) continue;
      expect(decision.reason).toBe("browser-page");
      expect(decision.message).toMatch(/browser page/i);
    }
  });

  it("names a non-web protocol", () => {
    const decision = explainTab({ id: 4, url: "file:///tmp/job.html" });
    expect(decision.ok).toBe(false);
    if (decision.ok) return;
    expect(decision.reason).toBe("not-web");
    expect(decision.message).toContain("file:");
  });

  it("accepts the active https job page", () => {
    expect(explainTab({ id: 7, url: jobUrl })).toEqual({ ok: true, id: 7, url: jobUrl });
  });

  it("accepts an http page", () => {
    expect(explainTab({ id: 8, url: "http://127.0.0.1:11434/" })).toEqual({
      ok: true,
      id: 8,
      url: "http://127.0.0.1:11434/",
    });
  });
});

describe("selectActiveTab", () => {
  it("keeps the current window tab when that window has one", () => {
    const chosen = selectActiveTab([{ id: 1, url: "chrome://extensions/" }], [{ id: 2, url: jobUrl }]);
    expect(chosen?.id).toBe(1);
  });

  it("uses a normal-window http(s) tab when the current window has none", () => {
    const chosen = selectActiveTab([], [{ id: 3, url: "chrome://newtab/" }, { id: 4, url: jobUrl }]);
    expect(chosen?.id).toBe(4);
  });

  it("reports permission when the only active tab has no address", () => {
    const decision = explainTab(selectActiveTab([{ id: 9 }], []));
    expect(decision.ok).toBe(false);
    if (decision.ok) return;
    expect(decision.reason).toBe("permission");
  });
});

describe("scripting errors", () => {
  it("returns the scripting error message and ignores other fields", () => {
    const error = new Error('Cannot access contents of url "https://www.jobup.ch/en/jobs/". Extension manifest must request permission to access this host.');
    expect(scriptingErrorMessage(error)).toBe(error.message);
    expect(scriptingErrorMessage("  frame removed  ")).toBe("frame removed");
    expect(scriptingErrorMessage({ html: "<p>secret posting</p>" })).toBe(
      "The page script failed without an error message.",
    );
  });

  it("logs the same message the side panel receives", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const message = "Permission: this tab's address is blank.";
    expect(() => throwTabReadError(message)).toThrow(TabReadError);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(message);
    spy.mockRestore();
  });
});
