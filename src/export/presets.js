const BASE_PRESETS = {
  tiktok: { width: 1080, height: 1920, fps: 30, codec: 'h264', format: 'mp4' },
  shorts: { width: 1080, height: 1920, fps: 60, codec: 'h264', format: 'mp4' },
  reels: { width: 1080, height: 1920, fps: 30, codec: 'h264', format: 'mp4' },
};

/**
 * @param {'tiktok'|'shorts'|'reels'} platform
 * @param {{fps?:30|60|120, codec?:'h264'|'h265', format?:'mp4'|'webm'}} [override]
 */
export function buildExportPreset(platform, override = {}) {
  const preset = BASE_PRESETS[platform];
  if (!preset) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  return {
    platform,
    ...preset,
    ...override,
  };
}
