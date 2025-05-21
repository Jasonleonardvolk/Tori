import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: __dirname,
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
      input: {
        main: path.resolve(__dirname, 'src/index.html')  // Ensure we use the correct entry point
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true
  }
})
