const FILLER_WORDS = new Set(['эм', 'ээ', 'мм', 'ну', 'типа', 'как бы']);

/**
 * @typedef {{text:string,startMs:number,endMs:number,confidence?:number}} Token
 */

/**
 * Find filler words and adjacent repeats in tokenized transcript.
 * @param {Token[]} tokens
 * @returns {{fillers: Token[], repeats: Token[]}}
 */
export function detectSpeechIssues(tokens) {
  const fillers = [];
  const repeats = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const normalized = token.text.trim().toLowerCase();

    if (FILLER_WORDS.has(normalized)) {
      fillers.push(token);
    }

    if (i > 0) {
      const prev = tokens[i - 1].text.trim().toLowerCase();
      if (normalized && normalized === prev) {
        repeats.push(token);
      }
    }
  }

  return { fillers, repeats };
}

/**
 * Build rough highlight score from transcript phrases.
 * @param {{text:string,startMs:number,endMs:number}[]} phrases
 * @param {string[]} keywords
 * @returns {{startMs:number,endMs:number,keyword:string,score:number}[]}
 */
export function extractKeywordMoments(phrases, keywords) {
  if (!keywords.length) {
    return [];
  }

  const normalizedKeywords = keywords.map((k) => k.toLowerCase());

  return phrases
    .map((phrase) => {
      const text = phrase.text.toLowerCase();
      const matched = normalizedKeywords.filter((k) => text.includes(k));
      if (!matched.length) {
        return null;
      }
      return {
        startMs: phrase.startMs,
        endMs: phrase.endMs,
        keyword: matched[0],
        score: Math.min(1, 0.3 + matched.length * 0.25),
      };
    })
    .filter(Boolean);
}
