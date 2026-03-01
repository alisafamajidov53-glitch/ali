import { buildAutoCutPlan } from '../editing-core/auto-cut.js';
import { detectBeatTimestamps } from '../analysis/audio-analysis.js';
import { buildViralScore } from '../ai/viral-score.js';
import { buildExportPreset } from '../export/presets.js';

/**
 * End-to-end MVP planning utility that combines auto-cut, viral scoring,
 * beat detection, and export preset selection.
 */
export function buildMvpPlan(input) {
  const autoCut = buildAutoCutPlan({
    audioFrames: input.audioFrames,
    transcriptTokens: input.transcriptTokens,
    transcriptPhrases: input.transcriptPhrases,
    keywords: input.keywords,
  });

  const beats = detectBeatTimestamps(input.audioFrames);
  const viral = buildViralScore(input.factors, input.topic);
  const exportPreset = buildExportPreset(input.platform, input.exportOverride);

  return {
    autoCut,
    beats,
    viral,
    exportPreset,
  };
}
