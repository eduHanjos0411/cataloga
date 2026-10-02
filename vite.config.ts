import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // O marcjs depende de "stream" e "Buffer" do Node.js
    nodePolyfills({ include: ['stream', 'buffer'], globals: { Buffer: true } }),
  ],
})
