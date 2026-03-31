import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [tailwindcss(), svelte(), viteSingleFile()],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib')
    }
  },
  build: {
    outDir: 'appscript',
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true, manualChunks: undefined }
    }
  }
});
