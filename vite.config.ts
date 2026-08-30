import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import tsChecker from 'vite-plugin-checker'
import { loadEnv } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const outDir = env.VITE_OUTPUT_PATH || 'dist'

  const workbenchInjectTmpl = {
    name: 'workbench-inject-tmpl',
    apply: 'build' as const,
    transformIndexHtml(html: string) {
      if (env.VITE_BASE_URL && env.VITE_BASE_URL !== '/') {
        return html.replace(
          /<head>/i,
          `<head>\n  <base href="${env.VITE_BASE_URL}">`
        )
      }
      return html
    },
    closeBundle() {
      const indexPath = path.resolve(outDir, 'index.html')
      const injectPath = path.resolve(outDir, 'inject.tmpl')
      if (fs.existsSync(indexPath)) {
        fs.renameSync(indexPath, injectPath)
      }
    },
  }

  return {
    base: env.VITE_BASE_URL,
    logLevel: 'info',
    plugins: [
      react(),
      tailwindcss(),
      tsChecker({ typescript: true }),
      workbenchInjectTmpl,
      visualizer({
        filename: `${outDir}/stats-treemap.html`,
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
      }),
      visualizer({
        filename: `${outDir}/stats-sunburst.html`,
        template: 'sunburst',
        gzipSize: true,
        brotliSize: true,
      }),
      visualizer({
        filename: `${outDir}/stats-network.html`,
        template: 'network',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    build: {
      outDir,
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@mantine')) return 'mantine'
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'redux'
            if (id.includes('react-router')) return 'react-router'
          },
          assetFileNames: (assetInfo) => {
            let extType = assetInfo.name.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'img';
            }
            return `assets/${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@tests': path.resolve(__dirname, './tests'),
      },
    },
    server: {
      port: 4210,
      // Left off so `npm run test:e2e`, which boots this server, does not open
      // a browser window on every run.
      open: false
    },
    preview: {
      port: 4210
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: 'tests/setup.ts',
      include: ['tests/**/*.test.{ts,tsx}'],
      mockReset: true,
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})