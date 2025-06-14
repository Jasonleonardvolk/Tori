import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: ['..']
    },
    proxy: {
      '/upload': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/upload/, '/api/upload')
      },
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['svelte']
        }
      }
    }
  },
  optimizeDeps: {
    include: []
  },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __TORI_THEME__: JSON.stringify('light')
  }
});