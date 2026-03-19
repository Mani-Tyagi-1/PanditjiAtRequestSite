import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const metaPixelId = env.VITE_META_PIXEL_ID || ''

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
  }
})
