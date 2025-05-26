
import root from '../root.svelte';
import { set_building } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"script-src":["self"],"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: false,
	track_server_fetches: false,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!DOCTYPE html>\n<html lang=\"en\" class=\"light\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <link rel=\"icon\" href=\"" + assets + "/favicon.png\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <meta name=\"description\" content=\"TORI - Advanced Memory System Interface with scalable architecture\" />\n    <meta name=\"theme-color\" content=\"#4f46e5\" />\n    <title>TORI - Temporal Ontological Reality Interface</title>\n    \n    <!-- Preload critical fonts -->\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n    \n    <!-- Progressive Web App manifest -->\n    <link rel=\"manifest\" href=\"" + assets + "/manifest.json\" />\n    \n    <!-- Critical CSS inline for performance -->\n    <style>\n      /* Critical above-the-fold styles */\n      body { \n        margin: 0; \n        background: #f9f9f9; \n        color: #111111; \n        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n        overflow-x: hidden;\n      }\n      .loading-spinner {\n        position: fixed;\n        top: 50%;\n        left: 50%;\n        transform: translate(-50%, -50%);\n        width: 40px;\n        height: 40px;\n        border: 3px solid #f3f3f3;\n        border-top: 3px solid #4f46e5;\n        border-radius: 50%;\n        animation: spin 1s linear infinite;\n        z-index: 9999;\n      }\n      @keyframes spin {\n        0% { transform: translate(-50%, -50%) rotate(0deg); }\n        100% { transform: translate(-50%, -50%) rotate(360deg); }\n      }\n      .app-shell {\n        background: var(--color-bg-primary, #f9f9f9);\n        color: var(--color-text-primary, #111111);\n      }\n    </style>\n    \n    " + head + "\n  </head>\n  <body data-sveltekit-preload-data=\"hover\" class=\"bg-tori-background text-tori-text antialiased\">\n    <!-- Loading indicator -->\n    <div id=\"loading\" class=\"loading-spinner\"></div>\n    \n    <!-- Main app content -->\n    <div style=\"display: contents\" class=\"min-h-screen app\">" + body + "</div>\n    \n    <!-- Remove loading spinner when app loads -->\n    <script>\n      document.addEventListener('DOMContentLoaded', function() {\n        const loading = document.getElementById('loading');\n        if (loading) {\n          setTimeout(() => {\n            loading.style.opacity = '0';\n            setTimeout(() => loading.remove(), 300);\n          }, 100);\n        }\n        \n        // Initialize TORI theme\n        console.log('🎨 TORI Light Theme Initialized');\n        console.log('🧠 Memory System Colors Loaded');\n        console.log('✨ Ghost Aura Effects Ready');\n      });\n      \n      // Performance monitoring\n      if ('performance' in window) {\n        window.addEventListener('load', function() {\n          const navigation = performance.getEntriesByType('navigation')[0];\n          console.log('⚡ TORI Load Time:', Math.round(navigation.loadEventEnd - navigation.loadEventStart), 'ms');\n        });\n      }\n    </script>\n  </body>\n</html>",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "18rja3d"
};

export function get_hooks() {
	return {};
}

export { set_assets, set_building, set_private_env, set_public_env };
