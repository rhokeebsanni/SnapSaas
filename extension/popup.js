/**
 * SnapSaas — Capture Tab (Tier 2 capture).
 *
 * Flow: user clicks "Capture Tab" → chrome.tabs.captureVisibleTab() grabs a
 * pixel-perfect PNG of exactly what they see in their (already authenticated)
 * tab → that PNG is POSTed as a binary upload to the SnapSaas backend, which
 * drops it into the same mockup pipeline a Playwright capture uses.
 *
 * We never read cookies, storage, or session tokens — `captureVisibleTab` only
 * returns rendered pixels, and the manifest requests `activeTab` + `tabs` only.
 * Auth to SnapSaas itself rides on the user's own SnapSaas session cookie
 * (credentials: 'include'); we never touch the *target site's* credentials.
 */

// The backend upload endpoint. Overridable from the popup (persisted locally) so
// the same build works against local dev and production.
const DEFAULT_ENDPOINT = 'http://localhost:3000/api/capture/upload';
const ENDPOINT_KEY = 'snapsaas.uploadEndpoint';

const els = {
  button: document.getElementById('capture'),
  status: document.getElementById('status'),
  statusText: document.getElementById('status-text'),
  preview: document.getElementById('preview'),
  previewImg: document.getElementById('preview-img'),
  meta: document.getElementById('meta'),
  endpoint: document.getElementById('endpoint'),
};

// --- Endpoint persistence ---------------------------------------------------
els.endpoint.value = localStorage.getItem(ENDPOINT_KEY) || DEFAULT_ENDPOINT;
els.endpoint.addEventListener('change', () => {
  const v = els.endpoint.value.trim();
  if (v) localStorage.setItem(ENDPOINT_KEY, v);
  else localStorage.removeItem(ENDPOINT_KEY);
});

function setStatus(text, kind /* '' | 'ok' | 'err' */) {
  els.statusText.textContent = text;
  els.status.className = 'status' + (kind ? ' ' + kind : '');
}

// Pages the browser refuses to let extensions capture (chrome://, the Web
// Store, etc.). Detecting these up front gives a clearer message than the raw
// "Cannot access" error.
function isRestricted(url) {
  return (
    !url ||
    /^(chrome|edge|brave|about|devtools|view-source|chrome-extension):/i.test(url) ||
    /^https:\/\/chrome\.google\.com\/webstore/i.test(url) ||
    /^https:\/\/chromewebstore\.google\.com/i.test(url)
  );
}

function bytesToReadable(n) {
  return n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function dataUrlToBlob(dataUrl) {
  // fetch() resolves data: URLs in the extension page context — gives us the
  // exact PNG bytes without hand-rolling base64 decoding.
  const res = await fetch(dataUrl);
  return res.blob();
}

async function captureAndUpload() {
  els.button.disabled = true;
  setStatus('Capturing visible tab…', '');
  els.preview.style.display = 'none';
  els.meta.textContent = '';

  // 1) Find the active tab in the current window.
  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (err) {
    setStatus('Could not read the active tab.', 'err');
    els.button.disabled = false;
    return;
  }
  if (!tab) {
    setStatus('No active tab to capture.', 'err');
    els.button.disabled = false;
    return;
  }
  if (isRestricted(tab.url)) {
    setStatus('This page can’t be captured (browser-restricted URL).', 'err');
    els.button.disabled = false;
    return;
  }

  // 2) Capture exactly what the user sees — a pixel-perfect PNG. `activeTab`
  //    (granted by the popup click) authorizes this without host permissions.
  let dataUrl;
  try {
    dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  } catch (err) {
    setStatus(`Capture failed: ${err?.message ?? 'unknown error'}`, 'err');
    els.button.disabled = false;
    return;
  }
  if (!dataUrl) {
    setStatus('Capture returned no image. Try again.', 'err');
    els.button.disabled = false;
    return;
  }

  // Show the capture immediately so success is visible even before the upload
  // resolves (and even if the backend endpoint isn't reachable yet).
  els.previewImg.src = dataUrl;
  els.preview.style.display = 'block';

  const blob = await dataUrlToBlob(dataUrl);
  els.meta.innerHTML =
    `<strong>${escapeHtml(tab.title || 'Untitled')}</strong><br/>` +
    `${escapeHtml(tab.url)}<br/>` +
    `PNG · ${bytesToReadable(blob.size)}`;

  // 3) POST the PNG as a binary upload to SnapSaas. Source URL/title travel in
  //    headers so the backend can name the project without parsing the body.
  const endpoint = els.endpoint.value.trim() || DEFAULT_ENDPOINT;
  setStatus('Uploading to SnapSaas…', '');
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include', // carry the user's SnapSaas session cookie
      headers: {
        'Content-Type': 'image/png',
        'X-Capture-Source': 'extension',
        'X-Capture-Url': tab.url || '',
        'X-Capture-Title': encodeURIComponent(tab.title || ''),
      },
      body: blob,
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus('Sent to SnapSaas ✓', 'ok');
      if (data.editorUrl) {
        els.meta.innerHTML += `<br/><a class="link" id="open-editor" href="#">Open in SnapSaas →</a>`;
        const link = document.getElementById('open-editor');
        link?.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: data.editorUrl });
        });
      }
    } else if (res.status === 401) {
      setStatus('Sign in to SnapSaas first, then capture again.', 'err');
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus(`Upload failed (${res.status}): ${data.error ?? res.statusText}`, 'err');
    }
  } catch (err) {
    // Most likely the endpoint isn't running/built yet, or CORS isn't allowed.
    setStatus(`Couldn’t reach SnapSaas at that endpoint. ${err?.message ?? ''}`.trim(), 'err');
  } finally {
    els.button.disabled = false;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

els.button.addEventListener('click', captureAndUpload);
