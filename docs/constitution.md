# Constitution

These rules apply to every change in this repository.

1. Review before anything leaves the machine. The person using the extension sees the fields and edits them. Phase 1 ends at copy and download.
2. Keep the source language. Do not translate a posting.
3. TypeScript stays strict. No `any`. Narrow `unknown`. A `ts-ignore` needs a one-line comment that names the browser typing gap.
4. Direct dependencies are MIT or Apache-2.0, compatible with this repository’s Apache-2.0 license.
5. No secrets in the repo. No real backend host in the README, the docs, or a committed env file. The backend URL lives in extension options.
6. Site selectors live in one module, with synthetic fixtures. Do not commit scraped live postings.
7. A job board’s own id is `sourceJobId`. It is not `companyJobReferenceId`.
8. The website upsert is documented in `docs/save-contract.md` and is not implemented here.
