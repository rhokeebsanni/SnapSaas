import { captureScreenshot } from './capture/browser';
import { composeAsset } from './compositing/compose';
import type { CaptureSettings, RenderOutput } from './types';

/** Full pipeline for one capture: Playwright screenshot → Sharp composite. */
export async function renderCapture(settings: CaptureSettings): Promise<RenderOutput> {
  const shot = await captureScreenshot(settings);
  return composeAsset(shot, settings);
}
