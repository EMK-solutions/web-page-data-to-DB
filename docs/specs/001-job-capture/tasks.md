# Tasks

Phase 1, job-post capture.

- [x] Scaffold WXT, React, Tailwind, and strict TypeScript with auto-imports off.
- [x] Add the side panel, options page, and action that opens the panel.
- [x] Keep permissions to `activeTab`, `scripting`, `storage`, `sidePanel`, and the local Ollama hosts.
- [x] Parse JobPosting JSON-LD, including `@graph`.
- [x] Read LinkedIn from the open tab: show more, description nodes, region fallback, join-wall warning, URL id kept as `sourceJobId`.
- [x] Read the Indeed model from the main world and prefer the sanitized description unless visible text is longer.
- [x] Clip page text, keep its language, and call Ollama with the flat schema to fill gaps only.
- [x] Edit, copy, and download JSON. Store a few recent captures locally.
- [x] Cover JSON-LD, the LinkedIn adapter, and bad model output with Vitest fixtures.
- [x] Document the save contract without calling the website.
