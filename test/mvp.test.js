import test from 'node:test';
import assert from 'node:assert/strict';

import { detectPauseSegments } from '../src/analysis/audio-analysis.js';
import { buildAutoCutPlan } from '../src/editing-core/auto-cut.js';
import { buildMvpPlan } from '../src/pipeline/mvp-plan.js';
import { buildExportPreset } from '../src/export/presets.js';
import { computeViralScoreNumber } from '../src/ai/viral-score.js';

test('detectPauseSegments finds silent region', () => {
  const frames = [0.3, 0.02, 0.01, 0.02, 0.5];
  const pauses = detectPauseSegments(frames, { frameMs: 100, minPauseMs: 300 });
  assert.equal(pauses.length, 1);
  assert.deepEqual(pauses[0], { startMs: 100, endMs: 400, durationMs: 300 });
});

test('buildAutoCutPlan includes fillers and pauses', () => {
  const plan = buildAutoCutPlan({
    audioFrames: [0.02, 0.01, 0.02, 0.5, 0.7],
    transcriptTokens: [
      { text: 'ну', startMs: 450, endMs: 520 },
      { text: 'поехали', startMs: 600, endMs: 760 },
      { text: 'поехали', startMs: 770, endMs: 900 },
    ],
    transcriptPhrases: [{ text: 'лучший момент начинается', startMs: 600, endMs: 1500 }],
    keywords: ['лучший'],
  });

  assert.ok(plan.removeSegments.length >= 2);
  assert.equal(plan.keepCandidates.length, 1);
});

test('buildExportPreset returns 9:16 preset', () => {
  const preset = buildExportPreset('tiktok');
  assert.equal(preset.width, 1080);
  assert.equal(preset.height, 1920);
  assert.equal(preset.codec, 'h264');
});

test('computeViralScoreNumber computes bounded score', () => {
  const score = computeViralScoreNumber({ emotion: 1, pace: 1, loudness: 1, semanticNovelty: 1 });
  assert.equal(score, 100);
});

test('buildMvpPlan integrates modules', () => {
  const result = buildMvpPlan({
    audioFrames: [0.1, 0.8, 0.2, 0.9, 0.1],
    transcriptTokens: [{ text: 'старт', startMs: 0, endMs: 300 }],
    transcriptPhrases: [{ text: 'как набрать просмотры быстро', startMs: 0, endMs: 2200 }],
    keywords: ['просмотры'],
    factors: { emotion: 0.8, pace: 0.7, loudness: 0.6, semanticNovelty: 0.75 },
    topic: 'виральные видео',
    platform: 'shorts',
    exportOverride: { fps: 60 },
  });

  assert.equal(result.exportPreset.platform, 'shorts');
  assert.equal(result.exportPreset.fps, 60);
  assert.ok(Array.isArray(result.beats));
  assert.ok(result.viral.score > 0);
});
