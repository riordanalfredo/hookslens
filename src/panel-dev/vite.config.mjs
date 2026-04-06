import path from "node:path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/panel-dev",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".."),
    },
  },
  server: {
    port: 5173,
  },
});
