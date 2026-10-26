import { describe, expect, it } from "vitest";
import { loadFixture } from "@/src/capture/fixture";
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
    expect(fields?.jobDescription).toBe("Sort paper files.\n\nReference: NORTH-14");
    expect(fields?.jobDescription).not.toContain("<p>");
    expect(fields?.company).not.toBe("Not The Employer");
  });

  it("reads a Jobup-style posting that has no salary or identifier", async () => {
    const page = await readOpenPage(
      loadFixture("jobposting-jobup.html"),
      "https://jobs.example/en/jobs/detail/example",
    );
    expect(page.adapter).toBe("structured");
    expect(page.pageLanguage).toBe("de");
    expect(page.fields.jobTitle).toBe("Archivkraft");
    expect(page.fields.company).toBe("Stadtarchiv Beispiel");
    expect(page.fields.location).toBe("Lausanne, 1003, CH");
    expect(page.fields.salaryRange).toBeNull();
    expect(page.fields.companyJobReferenceId).toBeNull();
    expect(page.fields.jobDescription).toBe(
      "Sie ordnen Unterlagen und empfangen Besucher im Lesesaal.",
    );
    expect(page.fields.jobDescription).not.toContain("<p>");
    expect(page.sourceJobId).toBeUndefined();
    expect(Object.keys(page.fields)).not.toContain("employmentType");
  });

  it("leaves salary null when the posting states only a currency", () => {
    const html = `<script type="application/ld+json">
      {
        "@type": "JobPosting",
        "title": "Clerk",
        "hiringOrganization": { "name": "Archive" },
        "baseSalary": {
          "@type": "MonetaryAmount",
          "currency": "CHF",
          "value": { "@type": "QuantitativeValue" }
        }
      }
    </script>`;
    const fields = readJsonLdJob(new DOMParser().parseFromString(html, "text/html"));
    expect(fields?.salaryRange).toBeNull();
    expect(fields?.jobTitle).toBe("Clerk");
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

  it("keeps the JSON-LD description when the surrounding page is longer", async () => {
    const page = await readOpenPage(
      loadFixture("visible-longer.html"),
      "https://jobs.example/binder",
    );
    expect(page.fields.jobDescription).toBe("Short role.");
    expect(page.fields.jobDescription).not.toContain("Sew signatures");
    expect(page.fields.jobDescription).not.toContain("Skip to jobs");
    expect(page.visibleText).toContain("Sew signatures");
    expect(page.visibleText).not.toContain("Skip to jobs");
    expect(page.fields.jobTitle).toBe("Binder");
  });

  it("reads JobPosting fields and leaves the surrounding chrome out", async () => {
    const boardId = "11111111-2222-4333-8444-555555555555";
    const page = await readOpenPage(
      loadFixture("jobposting-with-chrome.html"),
      `https://jobs.example/en/jobs/detail/${boardId}/`,
    );
    expect(page.fields).toEqual({
      jobTitle: "Reading room clerk",
      company: "City Reading Room",
      jobDescription: "Welcome visitors and reshelve the morning returns.",
      location: "Fribourg, 1700, CH",
      salaryRange: "CHF 62000–68000 YEAR",
      companyJobReferenceId: null,
    });
    expect(page.sourceJobId).toBe(boardId);
    expect(page.fields.jobDescription).not.toContain("Browse occupations");
    expect(page.fields.jobDescription).not.toContain("My account");
    expect(page.fields.jobDescription).not.toContain("Other jobs");
    expect(page.fields.jobDescription).not.toContain("Night porter");
    expect(page.fields.jobDescription).not.toContain("Privacy notice");
    expect(page.visibleText).toContain("# Reading room clerk");
    expect(page.visibleText).toContain("Welcome visitors");
    expect(page.visibleText).not.toContain("Browse occupations");
    expect(page.visibleText).not.toContain("My account");
    expect(page.visibleText).not.toContain("Saved searches");
    expect(page.visibleText).not.toContain("Other jobs");
    expect(page.visibleText).not.toContain("Night porter");
    expect(page.visibleText).not.toContain("Bindery assistant");
    expect(page.visibleText).not.toContain("Privacy notice");
  });
});
