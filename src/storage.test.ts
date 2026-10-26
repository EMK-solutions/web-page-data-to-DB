import { describe, expect, it } from "vitest";
import { acceptStoredCapture } from "@/src/storage";

const stored = {
  useCase: "job-post",
  schemaVersion: 1,
  sourceUrl: "https://jobs.example/1",
  extractedAt: "2026-10-26T10:00:00.000Z",
  jobTitle: "Archivist",
  company: null,
  jobDescription: null,
  location: null,
  salaryRange: null,
  companyJobReferenceId: null,
};

describe("stored captures", () => {
  it("defaults a missing posted date so an older save still loads", () => {
    expect(acceptStoredCapture(stored)?.jobPostedDate).toBeNull();
    expect(acceptStoredCapture(stored)?.schemaVersion).toBe(1);
  });

  it("keeps a real posted date and drops a capture whose date is not a calendar date only after nulling it", () => {
    expect(acceptStoredCapture({ ...stored, jobPostedDate: "2026-10-26" })?.jobPostedDate).toBe(
      "2026-10-26",
    );
    expect(acceptStoredCapture({ ...stored, jobPostedDate: "3 days ago" })?.jobPostedDate).toBeNull();
  });
});
