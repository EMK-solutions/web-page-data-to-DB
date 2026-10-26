import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/capture/ollama", () => ({
  completeJobFields: vi.fn(),
}));

import { blankFields } from "@/src/capture/fields";
import { completeJobFields } from "@/src/capture/ollama";
import { buildCapture, type JobCapture } from "@/src/capture/schema";
import { createTabUrlSync } from "@/src/panel/tab-url-sync";

const page = "https://www.jobup.ch/en/jobs/detail/edc0a378-e89a-4307-bb66-e8d532598272";

function capture(sourceUrl: string, extractedAt: string, title: string): JobCapture {
  return buildCapture({
    fields: { ...blankFields(), jobTitle: title },
    sourceUrl,
    extractedAt,
  });
}

describe("createTabUrlSync", () => {
  it("shows the newest match after recent captures load and does not drop them", () => {
    const older = capture(page, "2026-10-26T08:00:00.000Z", "Older");
    const newer = capture(`${page}/`, "2026-10-26T18:00:00.000Z", "Newer");
    const other = capture("https://jobs.example/other", "2026-10-26T19:00:00.000Z", "Other");
    const captures = [older, other, newer];
    const shown: string[] = [];
    let bumps = 0;
    const sync = createTabUrlSync({
      onMatch: (item) => shown.push(item.jobTitle ?? ""),
      onEmpty: () => shown.push("empty"),
      currentRequestId: () => 0,
      bumpRequestId: () => {
        bumps += 1;
      },
      captures: () => captures,
    });

    sync.urlChanged(`${page}/`);
    expect(shown).toEqual([]);
    sync.recentLoaded();
    expect(shown).toEqual(["Newer"]);
    expect(bumps).toBe(1);
    expect(completeJobFields).not.toHaveBeenCalled();
    sync.urlChanged(page);
    expect(shown).toEqual(["Newer"]);
    expect(bumps).toBe(1);
    sync.urlChanged("https://jobs.example/missing");
    expect(shown).toEqual(["Newer", "empty"]);
    expect(captures.map((item) => item.jobTitle)).toEqual(["Older", "Other", "Newer"]);
  });

  it("does not replace a capture the panel already started", () => {
    const shown: string[] = [];
    const sync = createTabUrlSync({
      onMatch: () => shown.push("match"),
      onEmpty: () => shown.push("empty"),
      currentRequestId: () => 2,
      bumpRequestId: () => shown.push("bump"),
      captures: () => [],
    });
    sync.recentLoaded();
    sync.urlChanged(page);
    expect(shown).toEqual([]);
    sync.urlChanged("https://jobs.example/next");
    expect(shown).toEqual(["bump", "empty"]);
    expect(completeJobFields).not.toHaveBeenCalled();
  });
});
