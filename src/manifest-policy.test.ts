import { describe, expect, it } from "vitest";
import { extensionHostPermissions, extensionPermissions } from "@/src/manifest-policy";

describe("extension permissions", () => {
  it("stays on the phase 1 permission list", () => {
    expect([...extensionPermissions]).toEqual([
      "activeTab",
      "scripting",
      "storage",
      "sidePanel",
    ]);
    expect([...extensionHostPermissions]).toEqual([
      "http://127.0.0.1/*",
      "http://localhost/*",
    ]);
    const joined = [...extensionPermissions, ...extensionHostPermissions].join(" ");
    expect(joined).not.toContain("<all_urls>");
    expect(joined).not.toContain("*://*/*");
  });
});
