import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',                      // ← agrega esto (o './' si pruebas local con subdir)
  esbuild: {
    target: 'es2022'
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});