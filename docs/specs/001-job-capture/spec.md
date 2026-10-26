# Job capture

## What this is

A Chrome side panel for one open tab. The person picks the job-post capture, reviews the fields, and copies or downloads JSON. Nothing is saved to a backend.

## Fields

`jobTitle`, `company`, `jobDescription`, `location`, `salaryRange`, `companyJobReferenceId`. Each is a string or null.

Also `sourceUrl`, `extractedAt`, `schemaVersion: 1`, `useCase: "job-post"`, and optional `sourceJobId`.

## Reading the tab

1. On a LinkedIn job URL, including the search split view, click the visible See more or Show more control, then read the description from the known description nodes. Selectors stay in one module. If those nodes are empty, use the largest text block in the job-details region. If the text is tiny and a join or sign-in wall is visible, warn that the description looks incomplete. The URL job id is `sourceJobId`, never `companyJobReferenceId`.
2. On other pages, read `application/ld+json` `JobPosting`, including `@graph` and an `@type` array. On Indeed, also read the embedded view-job model from the page main world, because a content script cannot see it. Prefer `sanitizedJobDescription`, otherwise the JSON-LD description. If the visible text is longer, keep that.
3. Pages that publish JobPosting structured data, including Jobup-style postings, are covered by the JSON-LD reader. Salary and the company reference stay null when the posting does not state them.
4. Clip the page text. Keep its language. The model prompt treats that text as untrusted data and fills gaps only.
5. The form is editable. Copy JSON and download JSON. Keep a few recent captures in `chrome.storage.local`.

## When the model is down

Show the structured fields and an error for the model step. Do not clear the form.

## States

- Empty: no capture yet. Open a job page and extract.
- Loading: while the tab is read, and again while the model runs.
- Error: the tab cannot be read, or Ollama fails.

The layout works in the narrow side panel and on a wider options page.

## Out of scope

The website upsert, a prompt editor, bulk import, and a database inside the extension.
