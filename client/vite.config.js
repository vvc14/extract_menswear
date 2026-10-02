import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `npm run dev`         → normal local development (http://localhost:5173)
// `npm run dev:tunnel`  → same, but for viewing through an HTTPS tunnel such as ngrok:
//                         the live-reload websocket connects via port 443 instead of 5173,
//                         otherwise phones keep failing to connect and the page reloads repeatedly.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on all interfaces (IPv4 too) so tunnels like ngrok — including ngrok in Docker —
    // can reach the dev server. Dev-only: this does not affect the production build.
    host: true,
    // Allow ngrok tunnel hostnames (leading dot = any subdomain)
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.dev'],
    hmr: mode === 'tunnel' ? { clientPort: 443, protocol: 'wss' } : undefined,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Cannot reach the API server on port 5000. Is it running?' }));
            }
          });
        },
      },
    },
  },
  // `npm run build && npm run preview` serves the production build (best for phone testing);
  // preview reuses the same host/allowedHosts/proxy settings.
  preview: {
    host: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.dev'],
  },
}))
