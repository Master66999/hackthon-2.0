import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // Forward /api/vision/* to Python Flask ML server (port 5001)
      '/api/vision': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      // Forward /auth/* and other /api/* to Express backend (port 5000)
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
