import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
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
