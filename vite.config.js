import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base:'/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'pages/ux/index.html'),
        admin: resolve(__dirname, 'pages/admin/index.html'),
      }
    }
  }
})