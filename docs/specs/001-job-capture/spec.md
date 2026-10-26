# Job capture

## What this is

A Chrome side panel for one open tab. The person picks the job-post capture, reviews the fields, and copies or downloads JSON. Nothing is saved to a backend.

## Fields

`jobTitle`, `company`, `jobDescription`, `jobPostedDate`, `location`, `salaryRange`, `companyJobReferenceId`. Each is a string or null. `jobPostedDate` is `YYYY-MM-DD` or null.

Also `sourceUrl`, `extractedAt`, `schemaVersion: 1`, `useCase: "job-post"`, and optional `sourceJobId`.

## Reading the tab

1. On a LinkedIn job URL, including the search split view, read the description from the nodes already in the page. Text that is only visually clamped is included. Headings, bold, lists, and paragraphs in that HTML are stored as markdown in `jobDescription`. Do not click, focus, or scroll. Selectors stay in one module. If those nodes are empty, use the largest text block in the job-details region. If the text is tiny and a join or sign-in wall is visible, warn that the description looks incomplete. The URL job id is `sourceJobId`, never `companyJobReferenceId`.
2. On other pages, read `application/ld+json` `JobPosting`, including `@graph` and an `@type` array. Use its title, company, description, location, salary, and `datePosted` when that value is a calendar date. The description is markdown produced from the posting HTML, not from the page's inner text. Do not store the surrounding page as the description. A board id, including a UUID in the page URL, is `sourceJobId` and is never `companyJobReferenceId`. On Indeed, also read the embedded view-job model from the page main world, because a content script cannot see it. Prefer `sanitizedJobDescription`, otherwise the JSON-LD description. A longer posting body can still outrank that shorter Indeed description. The rest of the page cannot.
3. Pages that publish JobPosting structured data, including Jobup-style postings, are covered by the JSON-LD reader. Salary and the company reference stay null when the posting does not state them.
4. Send the model the clipped posting body, with the same markdown, not the navigation, header, footer, account menu, or other listings. Keep the page language. The prompt treats that text as untrusted and fills null fields only. The model may return description markdown. The side panel shows headings, bold, lists, and paragraphs from that string without a rich-text editor.
5. Extract selected text reads the selection from the DOM as the same markdown and does not change the selection. The selection is not copied into `jobDescription`. It is sent to the model, and it may be a title, a location, or a later slice of the page. An empty selection is reported and the model is not called. Replace fields writes the model result over the current fields. Add missing fields fills only fields that are still empty. Extract data from web page stays read-only and still fills only missing fields. The user prompt starts with the local calendar date. The model may resolve a relative posted date from that day and must leave the date null when the page does not state one. The last system and user prompts are shown in the panel for that capture. They are not an options setting.
6. The form is editable. Copy JSON and download JSON. Keep a few recent captures in `chrome.storage.local`.

## When the model is down

Show the structured fields and an error for the model step. Do not clear the form.

## States

- Empty: no capture yet. Open a job page and extract.
- Loading: while the tab is read, and again while the model runs.
- Error: the tab cannot be read, or Ollama fails.

The layout works in the narrow side panel and on a wider options page.

## Out of scope

The website upsert, a prompt editor, bulk import, and a database inside the extension.
