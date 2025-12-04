import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
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
