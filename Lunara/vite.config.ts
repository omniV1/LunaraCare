import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from 'path'; // No longer needed for alias
// import { fileURLToPath } from 'url'; // No longer needed for alias

// Get current directory path in ES module scope - No longer needed for alias
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  // Expose VITE_API_BASE_URL as a global constant so we can avoid directly referencing `import.meta` in shared code.
  define: {
    __VITE_API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL ?? ''),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-quill': ['react-quill-new', 'quill'],
        },
      },
    },
  },
  // resolve: { // Removed alias section
  //   alias: {
  //     // Force resolving react-icons to the installed package
  //     'react-icons': path.resolve(__dirname, 'node_modules/react-icons'),
  //   },
  // },
})
