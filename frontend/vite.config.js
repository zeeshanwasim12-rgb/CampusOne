import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During dev, proxy API + socket traffic to the Express backend so the SPA can
// call same-origin `/api/...` without CORS headaches. In production the app is
// served as static files and talks to the API via VITE_API_URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
