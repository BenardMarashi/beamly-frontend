export function filterMessageText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  const censorText = (txt: string): string => '*'.repeat(txt.length);

  const findMatches = (txt: string, pattern: RegExp): Array<{start: number, end: number}> => {
    const matches: Array<{start: number, end: number}> = [];
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(txt)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
    return matches;
  };

  const mergeMatches = (matches: Array<{start: number, end: number}>): Array<{start: number, end: number}> => {
    if (matches.length === 0) return [];
    matches.sort((a, b) => a.start - b.start);
    const merged = [matches[0]];
    for (let i = 1; i < matches.length; i++) {
      const current = matches[i];
      const last = merged[merged.length - 1];
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }
    return merged;
  };

  const urlPatterns = [
    /(?:https?|ftp|ftps):\/\/[^\s]+/gi,
    /(?:^|\s)www\.[^\s]+/gi,
    /(?:^|\s)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/gi,
  ];

  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

  const phonePatterns = [
    /\+?\d{1,4}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  ];

  let allMatches: Array<{start: number, end: number}> = [];

  for (const pattern of urlPatterns) {
    allMatches = allMatches.concat(findMatches(text, pattern));
  }

  allMatches = allMatches.concat(findMatches(text, emailPattern));

  for (const pattern of phonePatterns) {
    allMatches = allMatches.concat(findMatches(text, pattern));
  }

  if (allMatches.length === 0) {
    return text;
  }

  const mergedMatches = mergeMatches(allMatches);

  let filtered = '';
  let lastEnd = 0;

  for (const match of mergedMatches) {
    filtered += text.substring(lastEnd, match.start);
    const matchText = text.substring(match.start, match.end);
    filtered += censorText(matchText);
    lastEnd = match.end;
  }

  filtered += text.substring(lastEnd);

  return filtered;
}