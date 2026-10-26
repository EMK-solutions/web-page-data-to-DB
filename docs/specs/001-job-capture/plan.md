# Plan

## Stack

WXT with the React TypeScript template. Auto-imports are off. React and Tailwind v4 style the side panel and the options page. The page reader is plain TypeScript and is injected with `chrome.scripting.executeScript` when Extract runs. It is not listed for every site.

shadcn/ui components are copied for Button, Input, Textarea, Label, and Card. Zod checks model output and the stored capture. Ollama is called with `fetch`. The chat `format` is the flat JSON schema. The model receives the clipped posting body. Navigation, header, footer, account menus, and other listings are left out. Defuddle was tried for main-text cleanup and left out because it dominated the injected page-reader bundle.

## Permissions

`activeTab`, `declarativeNetRequestWithHostAccess`, `scripting`, `storage`, `sidePanel`, `tabs`.

Host permissions: `http://127.0.0.1/*`, `http://localhost/*`, `http://*/*`, and `https://*/*`. Chrome treats an omitted port as every port, so the local Ollama port is included. A click inside the side panel does not grant `activeTab`. Without `tabs`, `tabs.query` omits `tab.url`, and Extract stopped before injection. The http and https host patterns let the page script run on the active job page after that click. No `<all_urls>` token. The reader is injected on Extract. It is not registered as a content script for every site.

The backend URL is an options field. It is not requested as a host permission in this phase because nothing is sent there.

## Flow

1. The background worker opens the side panel when the toolbar icon is clicked.
2. Extract asks for the active tab in the current window, then injects `page-reader.js` into that http(s) tab. A blank address, a missing tab id, a browser page, or a scripting error is shown in the panel and logged with `console.error`. Page content is not logged.
3. On an Indeed host, the panel also injects `indeed-main.js` with `world: "MAIN"`.
4. The panel shows the fields, then calls `/api/chat` on the configured Ollama base. Extract data from web page and a selection use that same call. Chrome attaches `Origin: chrome-extension://…` to the POST. Default Ollama rejects that origin with HTTP 403, so the extension removes the Origin header only for requests it makes to the configured localhost address. A non-OK status shows a short response body in the panel and logs that status and body. Page content and the selection are not logged. Non-null structured values win. The model fills nulls. A board id returned as the company reference is dropped.
5. Copy, download, and the recent list use the edited fields.

## Checks

Vitest uses synthetic HTML fixtures. `npm test` and `npm run build` must pass. A GUI browser is not required.
