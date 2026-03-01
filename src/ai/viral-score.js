/**
 * @param {{emotion:number, pace:number, loudness:number, semanticNovelty:number}} factors all expected 0..1
 * @returns {number}
 */
export function computeViralScoreNumber(factors) {
  const weighted =
    factors.emotion * 0.35 +
    factors.pace * 0.25 +
    factors.loudness * 0.15 +
    factors.semanticNovelty * 0.25;

  return Math.round(Math.max(0, Math.min(1, weighted)) * 100);
}

/**
 * @param {{emotion:number, pace:number, loudness:number, semanticNovelty:number}} factors
 * @param {string} topic
 * @returns {{score:number,hooks:string[],factors:{emotion:number,pace:number,loudness:number,semanticNovelty:number}}}
 */
export function buildViralScore(factors, topic) {
  const score = computeViralScoreNumber(factors);
  return {
    score,
    hooks: generateHooks(topic, score),
    factors,
  };
}

/**
 * @param {string} topic
 * @param {number} score
 * @returns {string[]}
 */
export function generateHooks(topic, score) {
  const intensity = score >= 75 ? '🔥' : score >= 50 ? '⚡' : '💡';

  return [
    `${intensity} ${topic}: 3 вещи, которые ты обязан попробовать сегодня`,
    `${intensity} Почему все обсуждают ${topic} прямо сейчас`,
    `${intensity} ${topic} за 30 секунд: суть без воды`,
  ];
}
