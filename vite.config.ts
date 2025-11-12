import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    // Generate sourcemaps only in development
    sourcemap: mode === 'development',
    // Minify and optimize for production
    minify: mode === 'production',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    // Target modern browsers
    target: 'es2020',
    cssMinify: true
  },
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  } : {}
}))
