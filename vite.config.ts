import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  preview: {
    host: "0.0.0.0",
    port: 8080,
  },
  worker: {
    format: "es",
    rollupOptions: {
      output: {
        entryFileNames: "assets/worker-[name]-[hash].js",
        chunkFileNames: "assets/worker-[name]-[hash].js",
        assetFileNames: "assets/worker-[name]-[hash].[ext]",
      },
    },
  },
  assetsInclude: ["**/*pdf.worker*.min.mjs", "**/*pdf.worker*.mjs"],
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "pdfjs-dist/build/pdf.worker.min.mjs": path.resolve(__dirname, "./node_modules/pdfjs-dist/build/pdf.worker.min.mjs"),
    }
  },
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          three: ['three'],
          pdf: ['pdfjs-dist'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            'lucide-react',
          ],
        },
      },
    },
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  optimizeDeps: {
    include: ['react-dropzone', 'pdfjs-dist/build/pdf.worker.min.mjs'],
  }
}));
