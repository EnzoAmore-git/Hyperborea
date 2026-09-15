import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const basePath = process.env.VITE_BASE_PATH;

  return {
    plugins: [react()],
    // Локально — корень '/'. На GitHub Pages — абсолютный путь подпапки репозитория
    // (задаётся в workflow переменной VITE_BASE_PATH, например '/webtoon-reader').
    base: basePath ? `/${basePath.replace(/^\/+|\/+$/g, '')}/` : '/',
    build: {
      outDir: 'dist'
    }
  };
});