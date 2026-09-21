import crypto from 'crypto';

export interface CodeChunkResult {
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
  content: string;
  contentHash: string;
}

// Simple regex heuristics for extracting top-level symbols
const SYMBOL_PATTERNS = [
  /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/,
  /^(?:export\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_$]+)/,
  /^(?:export\s+)?interface\s+([a-zA-Z0-9_$]+)/,
  /^(?:export\s+)?type\s+([a-zA-Z0-9_$]+)/,
  /^(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/,
  /^def\s+([a-zA-Z0-9_]+)\s*\(/,
  /^class\s+([a-zA-Z0-9_]+)/,
  /^func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(/,
  /^fn\s+([a-zA-Z0-9_]+)/,
];

function extractSymbolName(lines: string[]): string | null {
  for (const line of lines) {
    const trimmed = line.trim();
    for (const pattern of SYMBOL_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  return null;
}

export const codeChunkerService = {
  chunkCode(
    filePath: string,
    content: string,
    language: string,
    chunkSize = 60,
    overlap = 15
  ): CodeChunkResult[] {
    if (!content || content.trim().length === 0) {
      return [];
    }

    const lines = content.split(/\r?\n/);
    const totalLines = lines.length;
    const chunks: CodeChunkResult[] = [];

    // If file is short enough, return as a single chunk
    if (totalLines <= chunkSize) {
      const chunkText = content;
      const hash = crypto.createHash('sha256').update(chunkText).digest('hex');
      chunks.push({
        filePath,
        language,
        startLine: 1,
        endLine: totalLines,
        symbolName: extractSymbolName(lines),
        content: chunkText,
        contentHash: hash,
      });
      return chunks;
    }

    let start = 0;
    while (start < totalLines) {
      const end = Math.min(start + chunkSize, totalLines);
      const chunkLines = lines.slice(start, end);
      const chunkText = chunkLines.join('\n');
      const hash = crypto.createHash('sha256').update(chunkText).digest('hex');

      chunks.push({
        filePath,
        language,
        startLine: start + 1, // 1-indexed
        endLine: end,
        symbolName: extractSymbolName(chunkLines),
        content: chunkText,
        contentHash: hash,
      });

      if (end >= totalLines) {
        break;
      }

      // Slide window with overlap
      start += chunkSize - overlap;
    }

    return chunks;
  },
};
