import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Production builds only. `yarn dev` runs with mode=development, and .env
  // carries the LIVE pixel id — without this gate a local test booking fires a
  // real Purchase into Events Manager and pollutes ad optimisation data.
  // Set VITE_META_PIXEL_FORCE=1 to opt back in when debugging the pixel itself.
  const pixelAllowed = mode === 'production' || env.VITE_META_PIXEL_FORCE === '1'
  const metaPixelId = pixelAllowed ? env.VITE_META_PIXEL_ID || '' : ''

  return {
    plugins: [
      tailwindcss(),
      react(),
      // Injects the Meta Pixel base code directly into index.html so the
      // Meta Pixel Helper browser extension can detect it reliably.
      // Dynamic JS injection (e.g. in main.tsx) runs too late for the extension.
      {
        name: 'inject-meta-pixel',
        transformIndexHtml(html) {
          if (!metaPixelId) return html

          const pixelScript = `
  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init','${metaPixelId}');
  fbq('track','PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1"/></noscript>
  <!-- End Meta Pixel Code -->`

          return html.replace('</head>', `${pixelScript}\n  </head>`)
        },
      },
    ],
    build: {
      // Target modern browsers — avoids legacy down-leveling / extra polyfills.
      target: "es2020",
      // Emits dist/.vite/manifest.json so scripts/generate-route-shells.mjs can
      // resolve a route's hashed chunk filename and modulepreload it, instead of
      // guessing at chunk names that Rollup is free to change.
      manifest: true,
      // Split stable vendor libs into their own chunks so they cache across
      // deploys and shrink the main entry chunk (build-only — no runtime change).
      rollupOptions: {
        output: {
          /**
           * Matched by PATH, not by package entry point.
           *
           * This was the object form — `{ react: ['react', 'react-dom', …],
           * motion: ['framer-motion'] }` — which claims only the modules those
           * specifiers resolve to. The JSX runtime does not resolve to any of
           * them: `react/jsx-runtime` is a thin wrapper whose real code lives
           * in `react/cjs/react-jsx-runtime.production.js`, a module id no
           * entry in that list matched. It therefore went unclaimed, and
           * Rollup folded it into the first group that imported it — `motion`,
           * because framer-motion imports the runtime too.
           *
           * The effect was severe and completely invisible in the source: every
           * compiled component imports the JSX runtime, so EVERY route chunk
           * opened with `import{j as e}from"./motion-*.js"`. That put the whole
           * 112 KB / 37 KB gz animation library on every page of the site,
           * including pages that never animate anything, and preloaded it from
           * index.html ahead of first paint. Adding 'react/jsx-runtime' to the
           * array does NOT fix it — the wrapper is not the module that carries
           * the code.
           *
           * Matching on the node_modules path catches the package and all of
           * its internals, wrapper and CJS build alike. Alternatives are
           * ordered longest-first so `react-router-dom` is not shadowed by the
           * `react` prefix. `scheduler` is React's own dependency and belongs
           * in the same chunk.
           */
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (/[\\/]node_modules[\\/](react-router-dom|react-router|react-helmet-async|react-dom|react|scheduler)[\\/]/.test(id)) {
              return 'react';
            }
            if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) {
              return 'motion';
            }
          },
        },
      },
    },
  }
})
