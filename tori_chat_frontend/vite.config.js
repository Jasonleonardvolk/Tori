import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@chat': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    base: './', // Ensures assets are loaded correctly when served from a subfolder
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.html') // Build the REAL TORI Chat interface
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true
  }
})