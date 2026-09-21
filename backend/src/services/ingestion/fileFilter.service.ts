import path from 'path';
import { env } from '../../config/env';

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.turbo',
  'target',
  'vendor',
  'coverage',
  '.venv',
  'venv',
  '__pycache__',
  '.idea',
  '.vscode',
  '.github',
  'bin',
  'obj',
]);

const IGNORED_EXTENSIONS = new Set([
  // Images and media
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.mp4',
  '.mov',
  '.avi',
  '.mp3',
  '.wav',
  // Documents & archives
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.7z',
  '.rar',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.wasm',
  // Lockfiles & maps
  '.map',
  // Database / binary dumps
  '.sqlite',
  '.db',
  '.parquet',
  '.bin',
  // Key / certificate files
  '.pem',
  '.key',
  '.crt',
  '.der',
]);

const IGNORED_FILENAMES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'cargo.lock',
  'composer.lock',
  'gemfile.lock',
  'poetry.lock',
  '.ds_store',
  'thumbs.db',
]);

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.sql': 'sql',
  '.prisma': 'prisma',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.md': 'markdown',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sh': 'shell',
  '.bash': 'shell',
};

export const fileFilterService = {
  isIndexableFile(filePath: string, sizeInBytes?: number): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    const fileName = parts[parts.length - 1].toLowerCase();

    // 1. Check directory ignore list
    for (const part of parts.slice(0, -1)) {
      if (IGNORED_DIRECTORIES.has(part.toLowerCase())) {
        return false;
      }
    }

    // 2. Ignore hidden files and env files
    if (fileName.startsWith('.env') || fileName.startsWith('.')) {
      // allow certain config files like .prettierrc or .eslintrc if needed, but skip dot-files by default
      if (fileName.startsWith('.env')) return false;
    }

    // 3. Exact filename ignore list (e.g. lockfiles)
    if (IGNORED_FILENAMES.has(fileName)) {
      return false;
    }

    // 4. Check extension
    const ext = path.extname(fileName).toLowerCase();
    if (IGNORED_EXTENSIONS.has(ext)) {
      return false;
    }

    // 5. Must have a recognized code/text extension or known file
    if (!EXTENSION_LANGUAGE_MAP[ext] && ext !== '') {
      return false;
    }

    // 6. Check file size bound (max configured KB)
    if (sizeInBytes !== undefined) {
      const maxBytes = env.MAX_FILE_SIZE_KB * 1024;
      if (sizeInBytes > maxBytes || sizeInBytes === 0) {
        return false;
      }
    }

    return true;
  },

  detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return EXTENSION_LANGUAGE_MAP[ext] || 'text';
  },
};
