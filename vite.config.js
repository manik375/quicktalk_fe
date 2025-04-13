import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    'global': {},
  },
  resolve: {
    alias: {
      stream: 'readable-stream', // Use readable-stream polyfill
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", // Your backend URL
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000", // Socket.IO server
        ws: true,
      },
    },
  },
});
