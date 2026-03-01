import { detectPauseSegments } from '../analysis/audio-analysis.js';
import { detectSpeechIssues, extractKeywordMoments } from '../analysis/speech-analysis.js';

/**
 * @param {{audioFrames:number[], transcriptTokens:Array<{text:string,startMs:number,endMs:number}>, transcriptPhrases:Array<{text:string,startMs:number,endMs:number}>, keywords:string[]}} input
 * @returns {{removeSegments:Array<{startMs:number,endMs:number,reason:string,confidence:number}>, keepCandidates:Array<{startMs:number,endMs:number,reason:string,confidence:number}>}}
 */
export function buildAutoCutPlan(input) {
  const pauses = detectPauseSegments(input.audioFrames);
  const issues = detectSpeechIssues(input.transcriptTokens);
  const keywords = extractKeywordMoments(input.transcriptPhrases, input.keywords);

  const removeSegments = [
    ...pauses.map((pause) => ({
      startMs: pause.startMs,
      endMs: pause.endMs,
      reason: 'pause',
      confidence: 0.85,
    })),
    ...issues.fillers.map((token) => ({
      startMs: token.startMs,
      endMs: token.endMs,
      reason: 'filler',
      confidence: 0.75,
    })),
    ...issues.repeats.map((token) => ({
      startMs: token.startMs,
      endMs: token.endMs,
      reason: 'repeat',
      confidence: 0.8,
    })),
  ];

  const keepCandidates = keywords.map((hit) => ({
    startMs: hit.startMs,
    endMs: hit.endMs,
    reason: 'keyword',
    confidence: hit.score,
  }));

  return {
    removeSegments: mergeOverlaps(removeSegments),
    keepCandidates,
  };
}

/**
 * @param {Array<{startMs:number,endMs:number,reason:string,confidence:number}>} segments
 */
function mergeOverlaps(segments) {
  if (!segments.length) {
    return [];
  }

  const sorted = [...segments].sort((a, b) => a.startMs - b.startMs);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, current.endMs);
      last.confidence = Math.max(last.confidence, current.confidence);
      if (last.reason !== current.reason) {
        last.reason = `${last.reason}+${current.reason}`;
      }
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}
