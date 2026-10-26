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

  it("keeps a calendar datePosted and ignores a relative or impossible one", () => {
    function posting(datePosted: string): Document {
      const html = `<script type="application/ld+json">
        {
          "@type": "JobPosting",
          "title": "Clerk",
          "datePosted": ${JSON.stringify(datePosted)}
        }
      </script>`;
      return new DOMParser().parseFromString(html, "text/html");
    }
    expect(readJsonLdJob(posting("2026-10-23"))?.jobPostedDate).toBe("2026-10-23");
    expect(readJsonLdJob(posting("2026-10-23T08:00:00Z"))?.jobPostedDate).toBe("2026-10-23");
    expect(readJsonLdJob(posting("2026-02-31"))?.jobPostedDate).toBeNull();
    expect(readJsonLdJob(posting("3 days ago"))?.jobPostedDate).toBeNull();
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

  it("uses the visible posting when JSON-LD description is only a short translation", async () => {
    const page = await readOpenPage(
      loadFixture("visible-longer.html"),
      "https://jobs.example/binder",
    );
    expect(page.fields.jobTitle).toBe("Binder");
    expect(page.fields.company).toBe("Bindery");
    expect(page.fields.location).toBe("Sion");
    expect(page.fields.jobDescription).toContain("Sew signatures");
    expect(page.fields.jobDescription).not.toBe("Short role.");
    expect(page.fields.jobDescription).not.toContain("Skip to jobs");
    expect(page.visibleText).toContain("Sew signatures");
    expect(page.visibleText).not.toContain("Skip to jobs");
  });

  it("keeps a French visible title and description over an English JSON-LD translation", () => {
    const html = `<html lang="en"><body>
      <script type="application/ld+json">
        {
          "@type": "JobPosting",
          "title": "Senior IT Project Manager (m/f/x) 80-100%",
          "description": "Join an organisation undergoing transformation.",
          "hiringOrganization": { "name": "Vaudoise Assurances" },
          "datePosted": "2026-10-23",
          "jobLocation": "Lausanne"
        }
      </script>
      <main>
        <h1>Chef-fe de projet IT Senior (f/m/x) 80-100%</h1>
        <div>
          <p>Rejoignez une organisation en pleine transformation et pilotez des projets complexes.</p>
          <p>Vous mobilisez les parties prenantes et accompagnez l'évolution des outils.</p>
        </div>
      </main>
    </body></html>`;
    const page = readOpenPage(new DOMParser().parseFromString(html, "text/html"), "https://www.jobup.ch/en/jobs/detail/example/");
    expect(page.fields.jobTitle).toBe("Chef-fe de projet IT Senior (f/m/x) 80-100%");
    expect(page.fields.jobDescription).toContain("Rejoignez une organisation");
    expect(page.fields.jobDescription).not.toContain("Join an organisation");
    expect(page.fields.company).toBe("Vaudoise Assurances");
    expect(page.fields.location).toBe("Lausanne");
    expect(page.fields.jobPostedDate).toBe("2026-10-23");
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
      jobPostedDate: null,
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
