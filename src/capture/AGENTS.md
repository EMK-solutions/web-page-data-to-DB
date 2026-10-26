# Capture modules

Selectors for a site stay in one file. LinkedIn selectors live in `selectors.ts`. Do not add another selector list beside the adapter.

Fixtures in `fixtures/` are synthetic. Do not commit a scraped live posting.

The id in a LinkedIn job URL is `sourceJobId`. It is LinkedIn’s id. Never write it to `companyJobReferenceId`. The company reference is only the hiring company’s own reference, when the posting states one.
