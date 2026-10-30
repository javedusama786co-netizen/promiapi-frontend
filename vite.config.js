import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'unawake-oversized-moneybags.ngrok-free.dev',
      '.ngrok-free.dev',
      'all'
    ]
  }
});