# Save contract

Phase 1 keeps this payload on the machine: the side panel, a copied JSON file, a download, and a short list in `chrome.storage.local`. A later version of the website can upsert it. This repository does not call that website.

## Payload

`schemaVersion` is `1`. `useCase` is `"job-post"`.

| Field | Rule |
| --- | --- |
| `sourceUrl` | Page URL the capture was read from. |
| `extractedAt` | ISO-8601 time of the capture. |
| `sourceJobId` | Optional. The board’s own id, such as the id in the page URL. Omit when unknown. |
| `jobTitle` | String or `null`. |
| `company` | String or `null`. |
| `jobDescription` | String or `null`. Original language. Headings, bold, lists, and paragraphs may be markdown. |
| `location` | String or `null`. |
| `salaryRange` | String or `null`. |
| `companyJobReferenceId` | String or `null`. The hiring company’s reference only. Never the board id. |

```json
{
  "useCase": "job-post",
  "schemaVersion": 1,
  "sourceUrl": "https://jobs.example/postings/1",
  "extractedAt": "2026-10-26T10:00:00.000Z",
  "sourceJobId": "1234567890",
  "jobTitle": "Archive clerk",
  "company": "North Archive",
  "jobDescription": "Sort paper files.",
  "location": "Lausanne, 1003, CH",
  "salaryRange": null,
  "companyJobReferenceId": "NORTH-14"
}
```

## Upsert

The website decides create versus update from `sourceUrl` and `companyJobReferenceId`. When the company reference is null, the source URL is the only key.

A later phase can `PUT` this JSON to the backend base stored in options, with a bearer token from that site. No path is called in this phase, and no token is stored here.
