# Agent notes

Personal side project. External pull requests are not accepted yet. See `CONTRIBUTING.md`.

## Commands

- `npm install`
- `npm test`
- `npm run build`
- `npm run dev` for a load-unpacked development build

Node 22. The production build is `dist/chrome-mv3`.

## Types

TypeScript is strict. Do not use `any`. Narrow `unknown` instead. Do not add `ts-ignore` unless a one-line comment explains a browser typing gap.

## Dependencies

Direct dependencies must be MIT or Apache-2.0.

## Privacy

Do not commit secrets. Do not commit real backend hosts. The backend URL is an options field stored on the machine. Phase 1 does not send captures to it.

Review before save. The side panel shows the fields for edit. Copy and download are the only ways out in this phase. The local model fills gaps only, and page text is untrusted data.
