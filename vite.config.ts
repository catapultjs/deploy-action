import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: false,
    outDir: 'dist',
    sourcemap: false,
    ssr: 'src/index.ts',
    rollupOptions: {
      external: [/^node:/],
      output: {
        entryFileNames: 'index.js',
        format: 'cjs',
        inlineDynamicImports: true,
      },
    },
    target: 'node24',
  },
  ssr: {
    noExternal: true,
    target: 'node',
  },
})
