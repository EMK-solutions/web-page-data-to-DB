import { describe, expect, it } from "vitest";
import { loadFixture } from "@/src/capture/fixture";
import { INCOMPLETE_DESCRIPTION_WARNING, linkedInJobIdFromUrl } from "@/src/capture/linkedin";
import { readOpenPage } from "@/src/capture/read-page";

const searchUrl = "https://www.linkedin.com/jobs/search/?currentJobId=1234567890&keywords=guide";
const viewUrl = "https://www.linkedin.com/jobs/view/archivist-9876543210/";

describe("LinkedIn job adapter", () => {
  it("reads clamped description text without clicking See more", async () => {
    const doc = loadFixture("linkedin-show-more.html");
    const button = doc.querySelector("button");
    expect(button).toBeTruthy();
    let clicked = false;
    button?.addEventListener("click", () => {
      clicked = true;
    });

    const page = await readOpenPage(doc, searchUrl);

    expect(clicked).toBe(false);
    expect(page.adapter).toBe("linkedin");
    expect(page.sourceJobId).toBe("1234567890");
    expect(page.fields.companyJobReferenceId).toBeNull();
    expect(page.fields.jobTitle).toBe("Reading-room guide");
    expect(page.fields.company).toBe("Paper Mill");
    expect(page.fields.location).toBe("Bern");
    expect(page.fields.jobDescription).toContain("Job ID: MILL-9");
    expect(page.fields.jobDescription).not.toBe("1234567890");
    expect(page.warnings).toEqual([]);
  });

  it("reads a view URL id and does not treat it as the company reference", () => {
    expect(linkedInJobIdFromUrl(viewUrl)).toBe("9876543210");
    expect(linkedInJobIdFromUrl("https://www.linkedin.com/in/someone")).toBeNull();
  });

  it("warns when the description is a short teaser beside a join wall", async () => {
    const page = await readOpenPage(loadFixture("linkedin-login-wall.html"), viewUrl);
    expect(page.sourceJobId).toBe("9876543210");
    expect(page.fields.companyJobReferenceId).toBeNull();
    expect(page.fields.jobDescription).toContain("short public teaser");
    expect(page.warnings).toContain(INCOMPLETE_DESCRIPTION_WARNING);
  });

  it("falls back to the job-details region when the description node is missing", async () => {
    const page = await readOpenPage(
      loadFixture("linkedin-fallback.html"),
      "https://www.linkedin.com/jobs/view/5555555555",
    );
    expect(page.sourceJobId).toBe("5555555555");
    expect(page.fields.companyJobReferenceId).toBeNull();
    expect(page.fields.jobDescription).toContain("riverside reading room");
    expect(page.fields.jobDescription).not.toContain("promo should stay out");
  });

  it("reads a clamped Show more description without clicking", async () => {
    const doc = new DOMParser().parseFromString(
      `<div class="jobs-details"><h1>Clerk</h1><div class="jobs-description-content__text" style="overflow: hidden; max-height: 1em">The full shift notes for the evening desk.</div><button type="button">Show more</button></div>`,
      "text/html",
    );
    const button = doc.querySelector("button");
    let clicked = false;
    button?.addEventListener("click", () => {
      clicked = true;
    });
    const page = await readOpenPage(doc, viewUrl);
    expect(clicked).toBe(false);
    expect(page.fields.jobDescription).toContain("evening desk");
    expect(page.fields.companyJobReferenceId).toBeNull();
    expect(page.sourceJobId).toBe("9876543210");
  });

  it("keeps headings, bold, and lists from the description HTML", async () => {
    const doc = new DOMParser().parseFromString(
      `<div class="jobs-description-content__text"><h2>Tasks</h2><ul><li>Sort <strong>paper</strong> files</li></ul></div>`,
      "text/html",
    );
    const page = await readOpenPage(doc, viewUrl);
    expect(page.fields.jobDescription).toBe("## Tasks\n\n- Sort **paper** files");
    expect(page.fields.jobDescription).not.toContain("<");
    expect(page.fields.companyJobReferenceId).toBeNull();
    expect(page.sourceJobId).toBe("9876543210");
  });
});
