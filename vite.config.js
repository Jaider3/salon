import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'pages/UX/index.html'),
        admin: resolve(__dirname, 'pages/Admin/index.html'),
      }
    }
  }
})