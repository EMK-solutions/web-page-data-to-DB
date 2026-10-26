import { describe, expect, it } from "vitest";
import { loadFixture, noWait } from "@/src/capture/fixture";
import { readJsonLdJob } from "@/src/capture/jsonld";
import { readOpenPage } from "@/src/capture/read-page";

describe("JobPosting JSON-LD", () => {
  it("reads a posting inside @graph and skips a broken script", () => {
    const fields = readJsonLdJob(loadFixture("jobposting-graph.html"));
    expect(fields).toMatchObject({
      jobTitle: "Archive clerk",
      company: "North Archive",
      location: "Lausanne, 1003, CH",
      salaryRange: "CHF 72000–84000 YEAR",
      companyJobReferenceId: "NORTH-14",
    });
    expect(fields?.jobDescription).toContain("Sort paper files.");
    expect(fields?.jobDescription).not.toContain("<p>");
    expect(fields?.company).not.toBe("Not The Employer");
  });

  it("reads a Jobup-style posting that has no salary or identifier", async () => {
    const page = await readOpenPage(
      loadFixture("jobposting-jobup.html"),
      "https://jobs.example/en/jobs/detail/example",
      noWait,
    );
    expect(page.adapter).toBe("structured");
    expect(page.pageLanguage).toBe("de");
    expect(page.fields.jobTitle).toBe("Archivkraft");
    expect(page.fields.company).toBe("Stadtarchiv Beispiel");
    expect(page.fields.location).toBe("Lausanne, 1003, CH");
    expect(page.fields.salaryRange).toBeNull();
    expect(page.fields.companyJobReferenceId).toBeNull();
    expect(page.fields.jobDescription).toContain("Sie ordnen Unterlagen");
    expect(page.fields.jobDescription).not.toContain("<p>");
    expect(page.sourceJobId).toBeUndefined();
    expect(Object.keys(page.fields)).not.toContain("employmentType");
  });

  it("accepts @type as an array", () => {
    const fields = readJsonLdJob(loadFixture("jobposting-type-array.html"));
    expect(fields).toMatchObject({
      jobTitle: "Night clerk",
      company: "Harbor Library",
      location: "Geneva",
      jobDescription: "Lock the reading room.",
    });
  });

  it("keeps the longer visible article when it outruns the schema description", async () => {
    const page = await readOpenPage(
      loadFixture("visible-longer.html"),
      "https://jobs.example/binder",
      noWait,
    );
    expect(page.structuredDescription).toBe("Short role.");
    expect(page.fields.jobDescription).toContain("Sew signatures");
    expect(page.fields.jobDescription?.length ?? 0).toBeGreaterThan("Short role.".length);
    expect(page.fields.jobTitle).toBe("Binder");
  });
});
