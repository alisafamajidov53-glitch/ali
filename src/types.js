/**
 * @typedef {'pause' | 'emotion_peak' | 'keyword' | 'beat'} ClipReason
 *
 * @typedef {Object} ClipCandidate
 * @property {number} startMs
 * @property {number} endMs
 * @property {number} confidence
 * @property {ClipReason} reason
 *
 * @typedef {Object} ViralScore
 * @property {number} score
 * @property {string[]} hooks
 * @property {{emotion: number, pace: number, loudness: number, semanticNovelty: number}} factors
 *
 * @typedef {'tiktok' | 'shorts' | 'reels'} Platform
 * @typedef {'h264' | 'h265'} Codec
 * @typedef {'mp4' | 'webm'} Format
 *
 * @typedef {Object} ExportPreset
 * @property {Platform} platform
 * @property {number} width
 * @property {number} height
 * @property {30 | 60 | 120} fps
 * @property {Codec} codec
 * @property {Format} format
 */

export {};
