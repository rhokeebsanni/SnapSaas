import type { CaptureMode, FrameId, ShadowPreset, WindowStyle } from '@/lib/capture';

/**
 * One-click style presets. A template bundles a complete look (frame +
 * background + shadow + tilt + padding + window style) so users can jump to a
 * great result without fiddling with every control. The `tier` gates Pro-only
 * looks the same way Pro backgrounds are gated.
 */
export interface EditorTemplate {
  id: string;
  name: string;
  tier: 'free' | 'pro';
  settings: {
    frame: FrameId;
    background: string;
    mode: CaptureMode;
    padding: number;
    shadow: ShadowPreset;
    glow: boolean;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    windowStyle: WindowStyle;
  };
}

export const EDITOR_TEMPLATES: EditorTemplate[] = [
  {
    id: 'clean-light',
    name: 'Clean Light',
    tier: 'free',
    settings: {
      frame: 'browser',
      background: 'snow',
      mode: 'viewport',
      padding: 80,
      shadow: 'soft',
      glow: false,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      windowStyle: 'light',
    },
  },
  {
    id: 'midnight-pro',
    name: 'Midnight',
    tier: 'free',
    settings: {
      frame: 'browser',
      background: 'graphite',
      mode: 'viewport',
      padding: 96,
      shadow: 'dramatic',
      glow: false,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      windowStyle: 'dark',
    },
  },
  {
    id: 'violet-hero',
    name: 'Violet Hero',
    tier: 'free',
    settings: {
      frame: 'browser',
      background: 'violet-dream',
      mode: 'viewport',
      padding: 110,
      shadow: 'medium',
      glow: true,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      windowStyle: 'light',
    },
  },
  {
    id: 'tilt-left',
    name: '3D Showcase',
    tier: 'free',
    settings: {
      frame: 'browser',
      background: 'ocean',
      mode: 'viewport',
      padding: 120,
      shadow: 'dramatic',
      glow: false,
      rotateX: 4,
      rotateY: 18,
      rotateZ: 0,
      windowStyle: 'light',
    },
  },
  {
    id: 'macbook-studio',
    name: 'MacBook Studio',
    tier: 'free',
    settings: {
      frame: 'macbook',
      background: 'slate',
      mode: 'viewport',
      padding: 90,
      shadow: 'medium',
      glow: false,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      windowStyle: 'light',
    },
  },
  {
    id: 'iphone-pop',
    name: 'iPhone Pop',
    tier: 'free',
    settings: {
      frame: 'iphone',
      background: 'candy',
      mode: 'viewport',
      padding: 80,
      shadow: 'medium',
      glow: true,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      windowStyle: 'light',
    },
  },
  {
    id: 'cosmic-glow',
    name: 'Cosmic Glow',
    tier: 'pro',
    settings: {
      frame: 'browser',
      background: 'cosmos',
      mode: 'viewport',
      padding: 130,
      shadow: 'dramatic',
      glow: true,
      rotateX: 4,
      rotateY: -18,
      rotateZ: 0,
      windowStyle: 'dark',
    },
  },
  {
    id: 'aurora-tilt',
    name: 'Aurora Tilt',
    tier: 'pro',
    settings: {
      frame: 'browser',
      background: 'aurora',
      mode: 'viewport',
      padding: 120,
      shadow: 'dramatic',
      glow: true,
      rotateX: 4,
      rotateY: 18,
      rotateZ: 0,
      windowStyle: 'dark',
    },
  },
  {
    id: 'nebula-phone',
    name: 'Nebula Phone',
    tier: 'pro',
    settings: {
      frame: 'iphone',
      background: 'nebula',
      mode: 'viewport',
      padding: 100,
      shadow: 'dramatic',
      glow: true,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      windowStyle: 'light',
    },
  },
];
