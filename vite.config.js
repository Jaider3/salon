import { defineConfig } from 'vite'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: './', // Cambiamos a relativo para que se adapte a subcarpetas
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'public/imgs', // Toma tus imágenes originales
          dest: 'pages/ux'    // LAS COPIA DIRECTAMENTE DONDE TU HTML LAS BUSCA
        },
        {
          src: 'public/imgs',
          dest: 'pages/admin'  // También las copia en admin por si las necesitas ahí
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        ux: resolve(__dirname, 'pages/ux/index.html'),
        admin: resolve(__dirname, 'pages/admin/index.html'),
      }
    }
  }
})
