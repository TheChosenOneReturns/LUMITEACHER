export interface NarratedToken {
  text: string;
  start: number;
  end: number;
  word: boolean;
}

export function paginateStoryText(text: string, targetWords = 145): string[] {
  const paragraphs = text
    .split(/\n\n+/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => splitLongParagraph(paragraph, targetWords));

  const pages: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);
    if (current.length && currentWords + paragraphWords > targetWords && currentWords >= Math.floor(targetWords * 0.52)) {
      pages.push(current.join("\n\n"));
      current = [];
      currentWords = 0;
    }
    current.push(paragraph);
    currentWords += paragraphWords;
  }

  if (current.length) pages.push(current.join("\n\n"));
  return pages.length ? pages : [text];
}

export function tokenizeNarration(text: string): NarratedToken[] {
  const tokens: NarratedToken[] = [];
  const matcher = /\S+|\s+/gu;
  for (const match of text.matchAll(matcher)) {
    const start = match.index;
    const value = match[0];
    tokens.push({ text: value, start, end: start + value.length, word: /\S/u.test(value) });
  }
  return tokens;
}

export function narrationWordRanges(text: string): Array<{ start: number; end: number }> {
  return tokenizeNarration(text).filter((token) => token.word).map(({ start, end }) => ({ start, end }));
}

function splitLongParagraph(paragraph: string, targetWords: number): string[] {
  if (countWords(paragraph) <= targetWords) return [paragraph];
  const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/gu)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [paragraph];
  const chunks: string[] = [];
  let current: string[] = [];
  let words = 0;
  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);
    if (current.length && words + sentenceWords > targetWords) {
      chunks.push(current.join(" "));
      current = [];
      words = 0;
    }
    current.push(sentence);
    words += sentenceWords;
  }
  if (current.length) chunks.push(current.join(" "));
  return chunks;
}

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}
