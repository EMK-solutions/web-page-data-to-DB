# Tasks

Phase 1, job-post capture.

- [x] Scaffold WXT, React, Tailwind, and strict TypeScript with auto-imports off.
- [x] Add the side panel, options page, and action that opens the panel.
- [x] Read the active http(s) tab from the side panel. `tabs` plus `http://*/*` and `https://*/*` cover a click that does not grant `activeTab`. Local Ollama hosts stay listed. No `<all_urls>`.
- [x] Parse JobPosting JSON-LD, including `@graph`.
- [x] Read LinkedIn from the open tab: show more, description nodes, region fallback, join-wall warning, URL id kept as `sourceJobId`.
- [x] Read the Indeed model from the main world and prefer the sanitized description unless visible text is longer.
- [x] Clip page text, keep its language, and call Ollama with the flat schema to fill gaps only.
- [x] Edit, copy, and download JSON. Store a few recent captures locally.
- [x] Cover JSON-LD, the LinkedIn adapter, and bad model output with Vitest fixtures.
- [x] Document the save contract without calling the website.
