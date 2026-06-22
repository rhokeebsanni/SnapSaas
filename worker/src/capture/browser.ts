import { chromium, type Browser, type Page } from 'playwright';

import { type CaptureSettings, DEFAULT_VIEWPORT_HEIGHT, DEFAULT_VIEWPORT_WIDTH } from '../types';
import { assertSafeUrl } from '../util/url-safety';

let browserPromise: Promise<Browser> | null = null;

/** Launch a single shared Chromium instance and reuse it across captures. */
export async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const existing = await browserPromise;
    if (existing.isConnected()) return existing;
  }
  browserPromise = chromium
    .launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--hide-scrollbars'],
    })
    .catch((err: unknown) => {
      browserPromise = null;
      // Turn Playwright's wall-of-text "browser not installed" error into a
      // short, actionable message that's safe to show in the editor.
      const msg = err instanceof Error ? err.message : String(err);
      if (/Executable doesn't exist|playwright install/i.test(msg)) {
        throw new Error(
          'The capture browser is not installed on the worker. Run: npx playwright install chromium',
        );
      }
      throw err instanceof Error ? err : new Error(msg);
    });
  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  if (browser) await browser.close().catch(() => undefined);
}

/** Best-effort removal of cookie/consent banners so they don't pollute shots. */
async function dismissBanners(page: Page): Promise<void> {
  // Hide common consent containers via CSS.
  await page
    .addStyleTag({
      content: `
        [id*="cookie" i], [class*="cookie" i],
        [id*="consent" i], [class*="consent" i],
        [aria-label*="cookie" i], [class*="gdpr" i],
        #onetrust-banner-sdk, #usercentrics-root, .cc-window {
          display: none !important; visibility: hidden !important;
        }`,
    })
    .catch(() => undefined);

  // Try clicking obvious "accept" buttons that gate content.
  const labels = ['Accept all', 'Accept', 'I agree', 'Got it', 'Allow all'];
  for (const label of labels) {
    const button = page.getByRole('button', { name: label, exact: false }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 1000 }).catch(() => undefined);
      break;
    }
  }
}

/**
 * Capture a screenshot of the given URL. Returns a PNG buffer rendered at
 * `settings.scale` device pixel ratio (so output scale == retina density).
 */
export async function captureScreenshot(settings: CaptureSettings): Promise<Buffer> {
  assertSafeUrl(settings.url);

  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: {
      width: settings.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH,
      height: settings.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT,
    },
    deviceScaleFactor: settings.scale,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 SnapSaasBot/1.0',
  });

  const page = await context.newPage();
  try {
    await page.goto(settings.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // Wait for the network to settle, but never let a chatty site hang us.
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
    await dismissBanners(page);
    // Give late-loading fonts/images a brief moment.
    await page.waitForTimeout(500);

    // Viewport mode can start lower on the page so users can frame a section
    // further down (full-page mode already captures everything).
    if (settings.mode !== 'full' && settings.scrollY && settings.scrollY > 0) {
      // Runs in the page context; cast since the worker's TS lib has no DOM.
      await page.evaluate(
        (y) => (globalThis as unknown as { scrollTo(x: number, y: number): void }).scrollTo(0, y),
        settings.scrollY,
      );
      await page.waitForTimeout(300); // let lazy content/parallax settle
    }

    return await page.screenshot({
      fullPage: settings.mode === 'full',
      type: 'png',
      animations: 'disabled',
    });
  } finally {
    await context.close().catch(() => undefined);
  }
}
