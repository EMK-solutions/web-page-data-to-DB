# Tasks

Phase 1, job-post capture.

- [x] Scaffold WXT, React, Tailwind, and strict TypeScript with auto-imports off.
- [x] Add the side panel, options page, and action that opens the panel.
- [x] Read the active http(s) tab from the side panel. `tabs` plus `http://*/*` and `https://*/*` cover a click that does not grant `activeTab`. Local Ollama hosts stay listed. No `<all_urls>`.
- [x] Parse JobPosting JSON-LD, including `@graph`.
- [x] Read LinkedIn from the open tab without clicking or scrolling: description nodes, including visually clamped text, region fallback, join-wall warning, URL id kept as `sourceJobId`.
- [x] Read the Indeed model from the main world and prefer the sanitized description unless visible text is longer.
- [x] Clip the posting body, keep its language, and call Ollama with the flat schema to fill null fields only. Do not store the surrounding page as the description.
- [x] Store description headings, bold, lists, and paragraphs as markdown from the posting HTML, and show that structure in the side panel.
- [x] Send a selection to the model as markdown. Replace fields, or add only fields that are still empty. Do not call the model when nothing is selected.
- [x] Edit, copy, and download JSON. Store a few recent captures locally.
- [x] Cover JSON-LD, the LinkedIn adapter, and bad model output with Vitest fixtures.
- [x] Document the save contract without calling the website.
