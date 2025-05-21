import { defineConfig, loadEnv } from 'vite';
import path from 'path';

// Standalone chat bundle configuration
export default defineConfig(({ command, mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Root directory is the client folder
    root: path.resolve(__dirname, './'),
    
    // Build configuration for standalone chat
    build: {
      outDir: path.resolve(__dirname, '../chat/dist'),
      emptyOutDir: true,
      sourcemap: true,
      // Entry point for the standalone bundle
      lib: {
        entry: path.resolve(__dirname, 'src/standalone.js'),
        name: 'StandaloneChat',
        fileName: 'standalone',
        formats: ['iife', 'es']
      },
      rollupOptions: {
        // Externalize dependencies that are loaded via CDN in standalone.html
        external: [],
        output: {
          // Global variable names for externalized dependencies
          globals: {},
          // Place assets in the appropriate directory
          assetFileNames: 'assets/[name].[ext]'
        }
      },
      // Minify the output for production
      minify: mode === 'production',
    },
    
    // Define any global replacements needed
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.STANDALONE_MODE': 'true'
    },
    
    // Configure the dev server for standalone mode
    server: {
      port: 5174,
      open: '/chat/standalone.html'
    }
  };
});
