import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    files: {
      assets: 'static',
      hooks: {
        client: 'src/hooks.client.ts',
        server: 'src/hooks.server.ts'
      },
      lib: 'src/lib',
      params: 'src/params',
      routes: 'src/routes',
      serviceWorker: 'src/service-worker.ts',
      appTemplate: 'src/app.html',
      errorTemplate: 'src/error.html'
    },
    alias: {
      $components: 'src/lib/components',
      $stores: 'src/lib/stores',
      $services: 'src/lib/services',
      $elfin: 'src/lib/elfin'
    },
    csp: {
      directives: {
        'script-src': ['self']
      }
    },
    csrf: {
      checkOrigin: process.env.NODE_ENV === 'production'
    }
  },
  preprocess: vitePreprocess({
    postcss: true,
    scss: {
      prependData: '@use "src/variables.scss" as *;'
    }
  }),
  onwarn: (warning, handler) => {
    // Suppress specific warnings
    if (warning.code === 'css-unused-selector') return;
    handler(warning);
  }
};

export default config;