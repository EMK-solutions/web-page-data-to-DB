# Page capture

Personal side project. A Chrome extension that reads the job posting in the tab you already have open, shows the fields for review, and lets you copy or download JSON.

A job post is the first use case: title, company, description, location, salary range, and the company’s own job reference. Empty values stay null. The board’s id, when the URL has one, is kept separately and is not treated as the company reference.

Nothing in this phase is sent to a website. If Ollama is running on this machine, it is asked only to fill gaps. If it is not, the fields read from the page are still shown.

## Run

You need Node.js 22, npm, and Chrome. Install Ollama locally if you want the model step.

```bash
npm install
npm test
npm run build
```

Load the unpacked extension:

1. Open Chrome’s Extensions page.
2. Turn on Developer mode.
3. Choose Load unpacked.
4. Select `dist/chrome-mv3`.

Click the toolbar icon. The side panel opens. Open an http or https job page, then choose Extract this job. Chrome asks for access to the sites you visit so that click can read the tab. A click inside the panel does not grant that access by itself.

For a development build, run `npm run dev` and load the same `dist/chrome-mv3` folder. Stop that command when you are done. This phase is checked with `npm test` and `npm run build`.

## Configuration

Open the options page from the side panel.

- Ollama address. The default is `http://127.0.0.1:11434`. Test connection calls `/api/tags`.
- Model name. Required for the model step. Use the name from the local model list.
- Backend URL. Stored in this browser only. This phase does not call it.

`.env.example` documents `WXT_BACKEND_BASE_URL` as an optional default for that field. Keep a placeholder host.

## License

Apache License 2.0. See `LICENSE`.

This is a personal side project.
