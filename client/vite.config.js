import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // Retry on connection reset — prevents ECONNRESET on first request
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Server starting up, please retry' }));
            }
          });
        },
      },
    },
    allowedHosts: [
      'chastise-green-hesitancy.ngrok-free.dev',
      'mossy-roast-moonlight.ngrok-free.dev',
    ],
  },
})
