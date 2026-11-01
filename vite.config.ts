import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    // Relative asset URLs, so the build works under any path (GitHub Pages serves it at /<repo>/)
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'maplibre': ['maplibre-gl', 'react-map-gl'],
                    'charts': ['recharts', 'd3'],
                    'vendor': ['react', 'react-dom'],
                },
            },
        },
    },
})
