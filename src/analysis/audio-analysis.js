/**
 * Detect low-volume windows that can be considered pauses.
 * @param {number[]} normalizedFrames values in range 0..1
 * @param {{frameMs?: number, silenceThreshold?: number, minPauseMs?: number}} [options]
 * @returns {{startMs:number,endMs:number,durationMs:number}[]}
 */
export function detectPauseSegments(normalizedFrames, options = {}) {
  const frameMs = options.frameMs ?? 100;
  const silenceThreshold = options.silenceThreshold ?? 0.08;
  const minPauseMs = options.minPauseMs ?? 400;

  const pauses = [];
  let startIndex = -1;

  normalizedFrames.forEach((frame, index) => {
    const isSilent = frame <= silenceThreshold;
    if (isSilent && startIndex === -1) {
      startIndex = index;
      return;
    }

    if (!isSilent && startIndex !== -1) {
      const durationMs = (index - startIndex) * frameMs;
      if (durationMs >= minPauseMs) {
        pauses.push({
          startMs: startIndex * frameMs,
          endMs: index * frameMs,
          durationMs,
        });
      }
      startIndex = -1;
    }
  });

  if (startIndex !== -1) {
    const durationMs = (normalizedFrames.length - startIndex) * frameMs;
    if (durationMs >= minPauseMs) {
      pauses.push({
        startMs: startIndex * frameMs,
        endMs: normalizedFrames.length * frameMs,
        durationMs,
      });
    }
  }

  return pauses;
}

/**
 * Very lightweight beat detector based on local maxima.
 * @param {number[]} normalizedFrames values in range 0..1
 * @param {{peakThreshold?:number}} [options]
 * @returns {number[]} timestamps in ms
 */
export function detectBeatTimestamps(normalizedFrames, options = {}) {
  const peakThreshold = options.peakThreshold ?? 0.72;
  const frameMs = 100;
  const beats = [];

  for (let i = 1; i < normalizedFrames.length - 1; i += 1) {
    const prev = normalizedFrames[i - 1];
    const current = normalizedFrames[i];
    const next = normalizedFrames[i + 1];

    if (current >= peakThreshold && current > prev && current >= next) {
      beats.push(i * frameMs);
    }
  }

  return beats;
}
