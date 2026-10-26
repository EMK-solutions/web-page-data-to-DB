import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/capture/ollama", () => ({
  completeJobFields: vi.fn(),
}));

import { loadFixture } from "@/src/capture/fixture";
import { blankFields } from "@/src/capture/fields";
import { completeJobFields } from "@/src/capture/ollama";
import { readOpenPage } from "@/src/capture/read-page";
import {
  applyStructuredExtract,
  documentFromJsonLd,
  NO_JOB_POSTING_MESSAGE,
} from "@/src/capture/structured-extract";

const pageUrl = "https://www.jobup.ch/en/jobs/detail/edc0a378-e89a-4307-bb66-e8d532598272/";

const translatedPosting = `<!doctype html><html lang="en"><body>
  <script type="application/ld+json">
    {
      "@type": "JobPosting",
      "title": "Senior IT Project Manager (m/f/x) 80-100%",
      "description": "Join an organisation undergoing transformation.",
      "hiringOrganization": { "name": "Vaudoise Assurances" },
      "datePosted": "2026-10-23",
      "jobLocation": "Lausanne",
      "identifier": "VAUD-18"
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

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("applyStructuredExtract", () => {
  beforeEach(() => {
    vi.mocked(completeJobFields).mockClear();
  });

  it("keeps the published JSON-LD title and description and does not call the model", () => {
    const doc = parse(translatedPosting);
    const visible = readOpenPage(doc, pageUrl);
    const result = applyStructuredExtract({
      doc,
      pageUrl,
      current: { ...blankFields(), jobTitle: "Old title", company: "Old company" },
      overwrite: true,
    });

    expect(completeJobFields).not.toHaveBeenCalled();
    expect(visible.fields.jobTitle).toBe("Chef-fe de projet IT Senior (f/m/x) 80-100%");
    expect(result.applied).toBe(true);
    if (!result.applied) return;
    expect(result.fields.jobTitle).toBe("Senior IT Project Manager (m/f/x) 80-100%");
    expect(result.fields.jobDescription).toContain("Join an organisation");
    expect(result.fields.jobDescription).not.toContain("Rejoignez");
    expect(result.fields.company).toBe("Vaudoise Assurances");
    expect(result.fields.location).toBe("Lausanne");
    expect(result.fields.jobPostedDate).toBe("2026-10-23");
    expect(result.fields.companyJobReferenceId).toBe("VAUD-18");
    expect(result.pageLanguage).toBe("en");
  });

  it("keeps a short JSON-LD description instead of the longer visible posting", () => {
    const doc = loadFixture("visible-longer.html");
    const result = applyStructuredExtract({
      doc,
      pageUrl: "https://jobs.example/binder",
      current: blankFields(),
      overwrite: true,
    });
    expect(completeJobFields).not.toHaveBeenCalled();
    expect(result.applied).toBe(true);
    if (!result.applied) return;
    expect(result.fields.jobDescription).toBe("Short role.");
    expect(result.fields.jobDescription).not.toContain("Sew signatures");
  });

  it("leaves a message and does not invent fields when JobPosting is absent", () => {
    const doc = parse(`<!doctype html><html><body>
      <script type="application/ld+json">{ "@type": "Organization", "name": "Not a job" }</script>
      <article>
        <h1>Visible only title</h1>
        <p>This visible paragraph is long enough to be a posting description and must stay out of the form.</p>
      </article>
    </body></html>`);
    const result = applyStructuredExtract({
      doc,
      pageUrl,
      current: { ...blankFields(), jobTitle: "Already here" },
      overwrite: true,
    });
    expect(completeJobFields).not.toHaveBeenCalled();
    expect(result).toEqual({ applied: false, message: NO_JOB_POSTING_MESSAGE });
  });

  it("fills only empty fields when overwrite is off", () => {
    const doc = parse(translatedPosting);
    const result = applyStructuredExtract({
      doc,
      pageUrl,
      current: { ...blankFields(), jobTitle: "Kept title" },
      overwrite: false,
    });
    expect(completeJobFields).not.toHaveBeenCalled();
    expect(result.applied).toBe(true);
    if (!result.applied) return;
    expect(result.fields.jobTitle).toBe("Kept title");
    expect(result.fields.company).toBe("Vaudoise Assurances");
    expect(result.fields.jobDescription).toContain("Join an organisation");
  });

  it("reads JSON-LD from script text without building it through HTML", () => {
    const raw = JSON.stringify({
      "@type": "JobPosting",
      title: "Clerk",
      description: "Sort files.",
      hiringOrganization: { name: "Archive" },
    });
    const doc = documentFromJsonLd([raw, '{ "@type": "Organization" }'], "fr");
    const result = applyStructuredExtract({
      doc,
      pageUrl: "https://jobs.example/clerk",
      current: blankFields(),
      overwrite: true,
    });
    expect(completeJobFields).not.toHaveBeenCalled();
    expect(result.applied).toBe(true);
    if (!result.applied) return;
    expect(result.fields.jobTitle).toBe("Clerk");
    expect(result.fields.company).toBe("Archive");
    expect(result.pageLanguage).toBe("fr");
  });
});
