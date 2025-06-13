import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
// Commented out to reduce console noise - uncomment if needed for debugging
// import vitePluginInjectDataLocator from "./plugins/vite-plugin-inject-data-locator";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    // vitePluginInjectDataLocator() // Uncomment for debugging
  ],
});