import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * Version web de StaffAdmin: el mismo App.tsx, servido por el server de StaffAxis
 * en /admin/. Lo que en Electron hace el proceso main lo hace src/web/electronApiWeb.ts.
 *
 *   npm run build:web   -> dist-web/  (se copia a server/public-admin del repo de StaffAxis)
 */
const stubNode = path.resolve(__dirname, './src/web/stubs/node.ts')

export default defineConfig({
  base: '/admin/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'staffadmin-web-entry',
      // 'pre': si corre despues, Vite ya tomo main.tsx como entrada.
      transformIndexHtml: {
        order: 'pre',
        handler: (html: string) => html.replace('/src/main.tsx', '/src/web/entry.ts'),
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      electron: path.resolve(__dirname, './src/web/stubs/electron.ts'),
      'node:fs': stubNode,
      'node:path': stubNode,
      fs: stubNode,
      path: stubNode,
    },
  },
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
