/**
 * Simple fuzzy-match scoring function for the command palette.
 * Returns a score >= 0 if the query matches the text, or -1 if no match.
 *
 * Scoring:
 * - Exact match: 100
 * - Prefix match: 50 bonus
 * - Consecutive character match: 10 bonus per consecutive pair
 * - Each matched character: 1 point
 */
export function fuzzyMatch(text: string, query: string): number {
  if (!query) return 0;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match
  if (textLower === queryLower) return 100;

  // Substring match gets a strong bonus
  if (textLower.includes(queryLower)) {
    const bonus = textLower.startsWith(queryLower) ? 50 : 20;
    return bonus + queryLower.length;
  }

  // Character-by-character fuzzy match
  let score = 0;
  let textIdx = 0;
  let lastMatchIdx = -2;

  for (const ch of queryLower) {
    let found = false;

    while (textIdx < textLower.length) {
      if (textLower[textIdx] === ch) {
        score += 1;
        // Consecutive character bonus
        if (textIdx === lastMatchIdx + 1) {
          score += 10;
        }
        // Word boundary bonus (match at start of a word)
        if (textIdx === 0 || textLower[textIdx - 1] === ' ') {
          score += 5;
        }
        lastMatchIdx = textIdx;
        textIdx++;
        found = true;
        break;
      }
      textIdx++;
    }

    if (!found) return -1;
  }

  return score;
}

/**
 * Score a command against a query, considering label and keywords.
 */
export function scoreCommand(label: string, keywords: string[] | undefined, query: string): number {
  const labelScore = fuzzyMatch(label, query);

  // Check keywords for additional matches
  let keywordScore = -1;
  if (keywords) {
    for (const keyword of keywords) {
      const s = fuzzyMatch(keyword, query);
      if (s > keywordScore) keywordScore = s;
    }
  }

  // Return the best score, with a slight preference for label matches
  if (labelScore >= 0 && keywordScore >= 0) {
    return Math.max(labelScore, keywordScore);
  }
  if (labelScore >= 0) return labelScore;
  if (keywordScore >= 0) return keywordScore;
  return -1;
}
