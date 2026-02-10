export interface ParsedWord {
  word: string;
  meaning: string;
}

export interface ParseResult {
  words: ParsedWord[];
  skippedLines: number;
}

export function parseWordFile(content: string): ParseResult {
  const lines = content.split("\n").filter((line) => line.trim() !== "");
  const words: ParsedWord[] = [];
  let skippedLines = 0;

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 2) {
      const word = parts[0].trim();
      const meaning = parts[1].trim();
      if (word && meaning) {
        words.push({ word, meaning });
      } else {
        skippedLines++;
      }
    } else {
      skippedLines++;
    }
  }

  return { words, skippedLines };
}
