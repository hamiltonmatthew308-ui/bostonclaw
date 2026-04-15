import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';

function isMainProcessExternal(id: string): boolean {
  if (!id || id.startsWith('\0')) return false;
  if (id.startsWith('.') || id.startsWith('/') || /^[A-Za-z]:[\\/]/.test(id)) return false;
  if (id.startsWith('@/') || id.startsWith('@main/') || id.startsWith('@tray/') || id === '@lobster/shared') return false;
  return true;
}

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [
    react(),
    electron([
      {
        // Main process entry file
        entry: resolve(__dirname, 'src/main/index.ts'),
        onstart(options) {
          if (options.startup) {
            options.startup();
          }
        },
        vite: {
          resolve: {
            alias: {
              '@lobster/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
            },
          },
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: isMainProcessExternal,
            },
          },
        },
      },
      {
        // Preload scripts entry file
        entry: resolve(__dirname, 'src/main/preload.ts'),
        onstart(options) {
          if (options.reload) {
            options.reload();
          }
        },
        vite: {
          resolve: {
            alias: {
              '@lobster/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
            },
          },
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@main': resolve(__dirname, 'src/main'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@tray': resolve(__dirname, 'src/tray'),
      '@lobster/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
