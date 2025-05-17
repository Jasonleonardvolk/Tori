import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5175
  },
  resolve: {
    alias: {
      '@itori/runtime-bridge': path.resolve(__dirname, '../../packages/runtime-bridge/src'),
      '@itori/ui-kit': path.resolve(__dirname, '../../packages/ui-kit/src'),
      '@itori/data-model': path.resolve(__dirname, '../../packages/data-model/src')
    }
  }
});
