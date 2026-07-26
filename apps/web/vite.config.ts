import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@baxparrow/shared": fileURLToPath(new URL("../../packages/shared/src", import.meta.url)),
    },
  },
  server: { port: 5173 },
});
