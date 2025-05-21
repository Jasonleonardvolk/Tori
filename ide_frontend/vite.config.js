import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables from .env files
  // based on the mode (development, production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Ensure we're only processing files within the directory
    root: __dirname,
    base: '/',
    plugins: [
      react(),
      tsconfigPaths(), // Automatically resolve paths from tsconfig.json
    ],
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
        // Add any other aliases here
        '@ide': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    define: {
      // Handle any process.env references
      'process.env.REACT_APP_WS_URL': JSON.stringify(env.VITE_WS_URL || 'ws://localhost:8000/ws'),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    server: {
      port: 5173,
      open: true,
      // Ignore external files Vite is trying to process
      fs: {
        strict: true,
        allow: ['./'],
      },
    },
    build: {
      outDir: 'build',
      emptyOutDir: true,
      sourcemap: true,
      // Code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['preact', 'preact/compat']
          }
        }
      }
    },
    esbuild: {
      loader: 'jsx',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    }
  };
});
