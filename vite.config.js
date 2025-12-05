import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'process.env.POSTHOG_API_KEY': JSON.stringify(process.env.POSTHOG_API_KEY || 'phc_demo_key')
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  publicDir: 'assets'
});

