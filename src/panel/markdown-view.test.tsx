import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { MarkdownView } from "@/src/panel/markdown-view";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("description preview", () => {
  it("shows headings, bold, and lists without inserting the markdown as HTML", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        <MarkdownView
          markdown={"## Tasks\n\n- Sort **paper** files\n\nApply in the reading room."}
        />,
      );
    });

    expect(host.querySelector("h3")?.textContent).toBe("Tasks");
    expect(host.querySelector("strong")?.textContent).toBe("paper");
    expect(host.querySelector("li")?.textContent).toBe("Sort paper files");
    expect(host.textContent).toContain("Apply in the reading room.");
    expect(host.innerHTML).not.toContain("<script");
    expect(host.innerHTML).not.toContain("**");
    expect(host.innerHTML).not.toContain("##");

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
