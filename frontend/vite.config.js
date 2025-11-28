import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    // Removed React plugin - now using vanilla HTML/CSS/JS
    build: {
        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    }
})
