import { describe, expect, it } from "vitest";
import { captureUrlKey, newestCaptureForUrl } from "@/src/capture/capture-url";
import { blankFields } from "@/src/capture/fields";
import { buildCapture, type JobCapture } from "@/src/capture/schema";

const page = "https://www.jobup.ch/en/jobs/detail/edc0a378-e89a-4307-bb66-e8d532598272";

function capture(sourceUrl: string, extractedAt: string, title: string): JobCapture {
  return buildCapture({
    fields: { ...blankFields(), jobTitle: title },
    sourceUrl,
    extractedAt,
  });
}

describe("captureUrlKey", () => {
  it("treats a trailing slash as the same page", () => {
    expect(captureUrlKey(`${page}/`)).toBe(captureUrlKey(page));
    expect(captureUrlKey("https://jobs.example/")).toBe(captureUrlKey("https://jobs.example"));
  });

  it("keeps a query and a hash", () => {
    expect(captureUrlKey(`${page}?lang=en`)).not.toBe(captureUrlKey(page));
    expect(captureUrlKey(`${page}#apply`)).not.toBe(captureUrlKey(page));
    expect(captureUrlKey(`${page}/?lang=en`)).toBe(captureUrlKey(`${page}?lang=en`));
  });
});

describe("newestCaptureForUrl", () => {
  const older = capture(page, "2026-10-26T08:00:00.000Z", "Older");
  const newer = capture(`${page}/`, "2026-10-26T18:00:00.000Z", "Newer");
  const other = capture("https://jobs.example/other", "2026-10-26T19:00:00.000Z", "Other");

  it("returns the newest match and leaves the list in place", () => {
    const captures = [older, other, newer];
    expect(newestCaptureForUrl(captures, `${page}/`)?.jobTitle).toBe("Newer");
    expect(newestCaptureForUrl([newer, older], page)?.jobTitle).toBe("Newer");
    expect(captures).toHaveLength(3);
    expect(captures.map((item) => item.jobTitle)).toEqual(["Older", "Other", "Newer"]);
  });

  it("returns nothing when the page has no capture", () => {
    const captures = [older, newer];
    expect(newestCaptureForUrl(captures, "https://jobs.example/missing")).toBeNull();
    expect(newestCaptureForUrl(captures, "chrome://newtab/")).toBeNull();
    expect(newestCaptureForUrl(captures, `${page}#section`)).toBeNull();
    expect(captures).toHaveLength(2);
  });
});
