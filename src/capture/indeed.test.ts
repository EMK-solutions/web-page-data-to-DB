import { describe, expect, it } from "vitest";
import { indeedJobIdFromUrl, mergeIndeedSlice, readIndeedFromWindow } from "@/src/capture/indeed";
import { blankFields } from "@/src/capture/schema";
import { type PageRead } from "@/src/capture/types";

describe("Indeed embedded model", () => {
  it("reads sanitizedJobDescription from the main-world model", () => {
    const slice = readIndeedFromWindow({
      preloadedVJData: {
        jobKey: "abc123def456",
        jobTitle: "Ferry clerk",
        companyName: "Lake Office",
        formattedLocation: "Geneva",
        salaryInfo: { salaryText: "CHF 80,000 a year" },
        sanitizedJobDescription: "<p>Count the boats.</p>",
      },
    });
    expect(slice).toEqual({
      jobTitle: "Ferry clerk",
      company: "Lake Office",
      location: "Geneva",
      salaryRange: "CHF 80,000 a year",
      jobDescription: "Count the boats.",
      sourceJobId: "abc123def456",
    });
  });

  it("prefers the sanitized description unless the visible text is longer", () => {
    const page: PageRead = {
      fields: {
        ...blankFields(),
        jobTitle: "Ferry clerk",
        jobDescription: "Short role.",
      },
      sourceUrl: "https://ch.indeed.com/viewjob?jk=abc123def456",
      sourceJobId: "abc123def456",
      pageLanguage: "en",
      visibleText: "Count the boats and log each crossing for the afternoon board.",
      structuredDescription: "Short role.",
      warnings: [],
      adapter: "structured",
    };
    const merged = mergeIndeedSlice(page, {
      jobTitle: "Ferry clerk",
      company: "Lake Office",
      jobDescription: "Count the boats.",
      location: "Geneva",
      salaryRange: null,
      sourceJobId: "abc123def456",
    });
    expect(merged.fields.jobDescription).toContain("afternoon board");
    expect(merged.fields.company).toBe("Lake Office");
    expect(merged.fields.companyJobReferenceId).toBeNull();
    expect(merged.sourceJobId).toBe("abc123def456");
  });

  it("reads the jk parameter only on Indeed hosts", () => {
    expect(indeedJobIdFromUrl("https://ch.indeed.com/viewjob?jk=abc123def456")).toBe(
      "abc123def456",
    );
    expect(indeedJobIdFromUrl("https://jobs.example/viewjob?jk=abc123def456")).toBeNull();
  });
});
