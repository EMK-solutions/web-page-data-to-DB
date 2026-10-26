# Plan

## Stack

WXT with the React TypeScript template. Auto-imports are off. React and Tailwind v4 style the side panel and the options page. The content script is plain TypeScript and is injected with `chrome.scripting.executeScript` when the toolbar icon has been used. It is not listed for every site.

shadcn/ui components are copied for Button, Input, Textarea, Label, and Card. Zod checks model output and the stored capture. Ollama is called with `fetch`. The chat `format` is the flat JSON schema. Page text sent to the model is the clipped visible text, with script and style contents removed. Defuddle was tried for main-text cleanup and left out because it dominated the injected page-reader bundle.

## Permissions

`activeTab`, `scripting`, `storage`, `sidePanel`.

Host permissions: `http://127.0.0.1/*` and `http://localhost/*`. Chrome treats an omitted port as every port, so the local Ollama port is included. No `<all_urls>`.

The backend URL is an options field. It is not requested as a host permission in this phase because nothing is sent there.

## Flow

1. The background worker opens the side panel when the toolbar icon is clicked.
2. The panel injects `page-reader.js` into the active http(s) tab.
3. On an Indeed host, the panel also injects `indeed-main.js` with `world: "MAIN"`.
4. The panel shows the fields, then calls `/api/chat` on the configured Ollama base. Non-null structured values win. The model fills nulls. A board id returned as the company reference is dropped.
5. Copy, download, and the recent list use the edited fields.

## Checks

Vitest uses synthetic HTML fixtures. `npm test` and `npm run build` must pass. A GUI browser is not required.
