export type FrameId = 'browser' | 'macbook' | 'iphone';
export type CaptureMode = 'full' | 'viewport';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type OutputScale = 1 | 2 | 3;

export interface CaptureSettings {
  /** Public http(s) URL to capture. Validated before reaching the worker. */
  url: string;
  frame: FrameId;
  /** Background preset id (see config/templates). */
  background: string;
  mode: CaptureMode;
  scale: OutputScale;
  /** Padding (logical px) between the framed device and the background edge. */
  padding: number;
  format: OutputFormat;
  /** Stamp the "Made with SnapSaas" watermark (free plan). */
  watermark: boolean;
  /** Logical viewport width in CSS px (default 1280). */
  viewportWidth?: number;
  /** Logical viewport height in CSS px (default 800). */
  viewportHeight?: number;
}

export interface RenderOutput {
  format: OutputFormat;
  width: number;
  height: number;
  buffer: Buffer;
}

export const DEFAULT_VIEWPORT_WIDTH = 1280;
export const DEFAULT_VIEWPORT_HEIGHT = 800;
