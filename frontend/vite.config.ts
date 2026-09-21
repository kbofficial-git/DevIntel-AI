import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || (isGitHubPages ? '/DevIntel-AI/' : '/'),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
