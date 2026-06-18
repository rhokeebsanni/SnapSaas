/** Fetch an asset and trigger a browser download (falls back to opening it). */
export async function downloadAsset(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Cross-origin without CORS — open in a new tab so the user can save it.
    window.open(url, '_blank', 'noopener');
  }
}
