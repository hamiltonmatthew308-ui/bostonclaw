import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@lobster/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
})
