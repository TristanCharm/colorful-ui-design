import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// The original Figma Make export lives in ../src.
// This folder holds only the files added to make the app build and run,
// so the Vite root is this folder (index.html lives here) and it is
// allowed to read the source from the parent directory.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const configDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: configDir,
  plugins: [react(), tailwindcss()],
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: fileURLToPath(new URL("../dist", import.meta.url)),
    emptyOutDir: true,
  },
});
