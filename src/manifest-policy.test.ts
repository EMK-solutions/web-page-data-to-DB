import { describe, expect, it } from "vitest";
import { extensionHostPermissions, extensionPermissions } from "@/src/manifest-policy";

describe("extension permissions", () => {
  it("can read the active http(s) tab from a side-panel click", () => {
    expect([...extensionPermissions]).toEqual([
      "activeTab",
      "scripting",
      "storage",
      "sidePanel",
      "tabs",
    ]);
    expect([...extensionHostPermissions]).toEqual([
      "http://127.0.0.1/*",
      "http://localhost/*",
      "http://*/*",
      "https://*/*",
    ]);
    const joined = [...extensionPermissions, ...extensionHostPermissions].join(" ");
    expect(joined).not.toContain("<all_urls>");
    expect(joined).not.toContain("*://*/*");
  });
});
