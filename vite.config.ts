import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,          // no source maps in production (security)
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split large vendor bundles for better browser caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@microsoft/signalr')) return 'signalr-vendor';
            if (id.includes('@tanstack/react-query')) return 'query-vendor';
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
            if (id.includes('lucide-react') || id.includes('sonner') || id.includes('date-fns')) return 'ui-vendor';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
  },
})
