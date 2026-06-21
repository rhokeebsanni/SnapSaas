export type FrameId = 'browser' | 'macbook' | 'iphone';
export type CaptureMode = 'full' | 'viewport';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type OutputScale = 1 | 2 | 3;

/** Drop-shadow depth presets. */
export type ShadowPreset = 'none' | 'soft' | 'medium' | 'dramatic';
/** 3D perspective tilt presets (Shots-style). */
export type TiltPreset = 'none' | 'left' | 'right';
/** Browser-frame chrome styling. */
export type WindowStyle = 'light' | 'dark' | 'glass' | 'glass-dark' | 'inset' | 'inset-dark';

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
  /** Drop-shadow depth (default 'medium'). */
  shadow?: ShadowPreset;
  /** Soft colored glow behind the device, tinted to match the bg (default off). */
  glow?: boolean;
  /** 3D perspective tilt (default 'none'). */
  tilt?: TiltPreset;
  /** Browser chrome styling (default 'light'). Only affects the browser frame. */
  windowStyle?: WindowStyle;
  /** Border drawn around the framed device (default 'none'). */
  border?: 'none' | 'light' | 'dark';
  /** Border thickness in logical px (default 4). */
  borderWidth?: number;
  /** User-built gradient, used when `background` is "custom". */
  customGradient?: { colors: string[]; angle: number };
  /** Pixels to scroll down before capturing (viewport mode only; default 0). */
  scrollY?: number;
  /** Exact output canvas size (logical px). When set, the composition is fit
      into these dimensions without distortion; otherwise size is derived. */
  outputWidth?: number;
  outputHeight?: number;
  /** Logical viewport width in CSS px (default 1280). */
  viewportWidth?: number;
  /** Logical viewport height in CSS px (default 800). */
  viewportHeight?: number;
}

/** Shadow tuning per preset: [offsetPx, blurSigmaPx, opacity]. Scaled at render. */
export const SHADOW_PRESETS: Record<ShadowPreset, [number, number, number]> = {
  none: [0, 0, 0],
  soft: [14, 18, 0.28],
  medium: [22, 26, 0.38],
  dramatic: [38, 44, 0.5],
};

/** Tilt rotation in degrees about the Y axis (perspective applied at render). */
export const TILT_DEGREES: Record<TiltPreset, number> = {
  none: 0,
  left: -18,
  right: 18,
};

export interface RenderOutput {
  format: OutputFormat;
  width: number;
  height: number;
  buffer: Buffer;
}

export const DEFAULT_VIEWPORT_WIDTH = 1280;
export const DEFAULT_VIEWPORT_HEIGHT = 800;

/** Must match the web app's CAPTURE_QUEUE_NAME. (No ':' — BullMQ forbids it.) */
export const CAPTURE_QUEUE_NAME = 'snapsaas-capture';

export interface CaptureJobData {
  jobId: string;
}

export const OUTPUT_FORMATS: OutputFormat[] = ['png', 'jpeg', 'webp'];

export function fileExtension(format: OutputFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}
