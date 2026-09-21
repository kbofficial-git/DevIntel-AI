import { describe, it, expect } from 'vitest';
import { fileFilterService } from '../src/services/ingestion/fileFilter.service';

describe('File Filtering Service', () => {
  it('excludes files in blacklisted directories', () => {
    expect(fileFilterService.isIndexableFile('node_modules/express/index.js')).toBe(false);
    expect(fileFilterService.isIndexableFile('.git/config')).toBe(false);
    expect(fileFilterService.isIndexableFile('dist/bundle.js')).toBe(false);
    expect(fileFilterService.isIndexableFile('build/static/js/main.js')).toBe(false);
    expect(fileFilterService.isIndexableFile('coverage/lcov.info')).toBe(false);
    expect(fileFilterService.isIndexableFile('.venv/lib/python3.10/site.py')).toBe(false);
  });

  it('excludes binaries, media, and archive formats', () => {
    expect(fileFilterService.isIndexableFile('assets/logo.png')).toBe(false);
    expect(fileFilterService.isIndexableFile('assets/video.mp4')).toBe(false);
    expect(fileFilterService.isIndexableFile('docs/manual.pdf')).toBe(false);
    expect(fileFilterService.isIndexableFile('archive.zip')).toBe(false);
    expect(fileFilterService.isIndexableFile('bin/app.exe')).toBe(false);
    expect(fileFilterService.isIndexableFile('dist/app.wasm')).toBe(false);
  });

  it('excludes package manager lockfiles and environment secrets', () => {
    expect(fileFilterService.isIndexableFile('package-lock.json')).toBe(false);
    expect(fileFilterService.isIndexableFile('yarn.lock')).toBe(false);
    expect(fileFilterService.isIndexableFile('pnpm-lock.yaml')).toBe(false);
    expect(fileFilterService.isIndexableFile('.env')).toBe(false);
    expect(fileFilterService.isIndexableFile('.env.production')).toBe(false);
    expect(fileFilterService.isIndexableFile('certs/server.key')).toBe(false);
  });

  it('excludes files exceeding maximum size bounds or empty files', () => {
    const maxBytes = 500 * 1024;
    expect(fileFilterService.isIndexableFile('src/large.ts', maxBytes + 100)).toBe(false);
    expect(fileFilterService.isIndexableFile('src/empty.ts', 0)).toBe(false);
    expect(fileFilterService.isIndexableFile('src/valid.ts', 15 * 1024)).toBe(true);
  });

  it('accepts legitimate source code and configuration files', () => {
    expect(fileFilterService.isIndexableFile('src/app.ts')).toBe(true);
    expect(fileFilterService.isIndexableFile('components/Button.tsx')).toBe(true);
    expect(fileFilterService.isIndexableFile('server/main.py')).toBe(true);
    expect(fileFilterService.isIndexableFile('cmd/main.go')).toBe(true);
    expect(fileFilterService.isIndexableFile('schema.prisma')).toBe(true);
    expect(fileFilterService.isIndexableFile('README.md')).toBe(true);
    expect(fileFilterService.isIndexableFile('config.json')).toBe(true);
  });

  it('correctly maps file extensions to canonical languages', () => {
    expect(fileFilterService.detectLanguage('src/app.ts')).toBe('typescript');
    expect(fileFilterService.detectLanguage('src/App.tsx')).toBe('typescript');
    expect(fileFilterService.detectLanguage('scripts/deploy.py')).toBe('python');
    expect(fileFilterService.detectLanguage('main.go')).toBe('go');
    expect(fileFilterService.detectLanguage('lib.rs')).toBe('rust');
    expect(fileFilterService.detectLanguage('schema.prisma')).toBe('prisma');
    expect(fileFilterService.detectLanguage('query.sql')).toBe('sql');
  });
});
