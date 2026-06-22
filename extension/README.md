# SnapSaas — Capture Tab (Chrome extension, Tier 2)

Tier 2 of SnapSaas's two-tier capture architecture. **Tier 1** (server-side
Playwright) handles public URLs. **Tier 2** (this extension) handles pages the
user is already signed into — Notion, X, LinkedIn, GitHub, internal dashboards —
by capturing the rendered pixels of their own authenticated tab.

## Why this exists

Server-side Playwright launches a fresh browser with an empty cookie jar, so for
private pages it captures a login screen. Transferring the user's session tokens
into Playwright would be a serious security liability. Instead, this extension
calls `chrome.tabs.captureVisibleTab()` — which returns **only the rendered
pixels** of the visible tab — and uploads that PNG to SnapSaas. We never read
the target site's cookies, storage, or tokens.

## Security model / permissions

- `permissions: ["activeTab", "tabs"]` — nothing else. No `host_permissions`,
  no `<all_urls>`, no `storage`, no `cookies`.
- `captureVisibleTab` is authorized by **`activeTab`**, which the browser grants
  for the current tab only when the user clicks the extension — a deliberate
  gesture, scoped to that one capture.
- The upload uses `credentials: 'include'` so the user's **SnapSaas** session
  cookie authenticates them to SnapSaas. That is our own auth; it is unrelated
  to (and never exposes) the captured site's credentials.

## Load it (unpacked, for development)

1. Open `chrome://extensions`.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Pin the extension, open any signed-in page, click the icon → **Capture Tab**.

The popup shows a live preview of the capture immediately, then uploads it. The
upload endpoint is configurable in the popup (defaults to
`http://localhost:3000/api/capture/upload`) and persists locally.

> Status: the capture + POST is built. The **backend upload endpoint** and the
> **web-UI postMessage bridge** are intentionally not built yet (next steps), so
> the upload will report a connection error until the endpoint exists — the
> capture preview still confirms `captureVisibleTab` works end to end.

## Upload contract (for the backend endpoint, built next)

`POST {endpoint}` — default `/api/capture/upload`

| Part               | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| `Content-Type`     | `image/png`                                            |
| Body               | raw PNG bytes (the captured tab)                       |
| `credentials`      | `include` (SnapSaas session cookie)                    |
| `X-Capture-Source` | `extension`                                            |
| `X-Capture-Url`    | the captured tab's URL                                 |
| `X-Capture-Title`  | the captured tab's title, `encodeURIComponent`-encoded |

Expected success response (`200`): JSON `{ jobId, editorUrl }`. When
`editorUrl` is present the popup offers an "Open in SnapSaas" link.

The endpoint should authenticate the SnapSaas user (same session check as
`/api/capture`), store the PNG to R2, create a `job` row whose settings mark it
as a pre-captured upload, and enqueue it onto the existing BullMQ pipeline — the
worker frames/backgrounds/exports it identically to a Playwright shot.

## Files

- `manifest.json` — MV3 manifest (`activeTab` + `tabs`).
- `popup.html` / `popup.js` — the popup UI and the capture + upload logic.
- `icons/` — generated brand icons (16/48/128).
