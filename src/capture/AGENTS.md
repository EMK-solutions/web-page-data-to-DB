# Capture modules

Selectors for a site stay in one file. LinkedIn selectors live in `selectors.ts`. Do not add another selector list beside the adapter.

Fixtures in `fixtures/` are synthetic. Do not commit a scraped live posting.

The id in a LinkedIn job URL is `sourceJobId`. It is LinkedIn’s id. Never write it to `companyJobReferenceId`. A UUID in the page URL is also a board id, not the company reference. The company reference is only the hiring company’s own reference, when the posting states one.

Read the LinkedIn description from the nodes already in the page, including text that is only visually clamped. Do not click See more or Show more, and do not focus or scroll the page.
