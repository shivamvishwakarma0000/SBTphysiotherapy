import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

const currentBuildTime = Date.now();

function versionPlugin() {
  return {
    name: "version-generator-plugin",
    buildStart() {
      const data = {
        buildTime: currentBuildTime,
        date: new Date().toISOString()
      };
      try {
        fs.writeFileSync(
          path.resolve(__dirname, "public/version.json"),
          JSON.stringify(data, null, 2)
        );
      } catch (e) {
        console.warn("Could not write public/version.json:", e);
      }
    }
  };
}

export default defineConfig({
  define: {
    __APP_BUILD_TIME__: JSON.stringify(currentBuildTime)
  },
  plugins: [react(), versionPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5010,
    proxy: {
      "/api": "http://127.0.0.1:5174"
    }
  },
  preview: {
    host: "127.0.0.1",
    proxy: {
      "/api": "http://127.0.0.1:5174"
    }
  }
});
