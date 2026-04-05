import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/hookslens/", // Uncomment this for production deployment
  root: "demo",
  plugins: [react()],
  build: {
    outDir: "../dist/demo",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
