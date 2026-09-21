import { describe, it, expect } from 'vitest';
import { codeChunkerService } from '../src/services/ingestion/codeChunker.service';

describe('Code Chunker Service', () => {
  it('returns an empty array for empty or whitespace content', () => {
    expect(codeChunkerService.chunkCode('src/empty.ts', '', 'typescript')).toEqual([]);
    expect(codeChunkerService.chunkCode('src/spaces.ts', '   \n\n  \t ', 'typescript')).toEqual([]);
  });

  it('keeps small files in a single chunk with accurate line range', () => {
    const smallCode = `import express from 'express';\n\nexport const app = express();\n\napp.get('/', (req, res) => res.send('OK'));`;
    const chunks = codeChunkerService.chunkCode('src/app.ts', smallCode, 'typescript', 60, 15);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].filePath).toBe('src/app.ts');
    expect(chunks[0].language).toBe('typescript');
    expect(chunks[0].startLine).toBe(1);
    expect(chunks[0].endLine).toBe(5);
    expect(chunks[0].symbolName).toBe('app');
    expect(chunks[0].content).toBe(smallCode);
    expect(chunks[0].contentHash).toBeDefined();
    expect(chunks[0].contentHash).toHaveLength(64); // SHA-256 hex
  });

  it('chunks large files into overlapping segments preserving line numbers', () => {
    const lines = [];
    for (let i = 1; i <= 100; i++) {
      lines.push(`const var_${i} = ${i};`);
    }
    const longCode = lines.join('\n');

    // chunkSize = 40, overlap = 10 -> window 1: 1-40, window 2: 31-70, window 3: 61-100
    const chunks = codeChunkerService.chunkCode('src/long.ts', longCode, 'typescript', 40, 10);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].startLine).toBe(1);
    expect(chunks[0].endLine).toBe(40);

    expect(chunks[1].startLine).toBe(31);
    expect(chunks[1].endLine).toBe(70);

    expect(chunks[2].startLine).toBe(61);
    expect(chunks[2].endLine).toBe(100);
  });

  it('detects symbols like functions, classes, and interfaces', () => {
    const tsCode = `export function authenticateUser(token: string) {\n  return true;\n}`;
    const chunks = codeChunkerService.chunkCode('src/auth.ts', tsCode, 'typescript');
    expect(chunks[0].symbolName).toBe('authenticateUser');

    const classCode = `export class RepositoryService {\n  constructor() {}\n}`;
    const classChunks = codeChunkerService.chunkCode('src/service.ts', classCode, 'typescript');
    expect(classChunks[0].symbolName).toBe('RepositoryService');

    const pyCode = `def process_data(records):\n    return [r for r in records]`;
    const pyChunks = codeChunkerService.chunkCode('src/process.py', pyCode, 'python');
    expect(pyChunks[0].symbolName).toBe('process_data');
  });
});
