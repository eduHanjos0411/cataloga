import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // O marcjs depende dos módulos "stream", "buffer", "events" e "util" do Node.js.
    // A barra final força o pacote do npm em vez do módulo nativo.
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer/',
      events: 'events/',
      util: fileURLToPath(new URL('./src/shims/util.ts', import.meta.url)),
    },
  },
})
