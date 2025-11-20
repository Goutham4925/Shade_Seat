import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from "fs";
import sitemap from "vite-plugin-sitemap";

// Function to get commit hash from build-info.json
const getCommitHash = () => {
  try {
    const buildInfoPath = path.resolve(__dirname, 'public/build-info.json');
    const buildInfo = JSON.parse(readFileSync(buildInfoPath, 'utf-8'));
    return buildInfo.commit;
  } catch (error) {
    console.warn('Could not read build-info.json, using fallback commit hash');
    return 'local-dev';
  }
};

const commitHash = getCommitHash();

export default defineConfig({
  base: "/", 
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Custom plugin to replace commit hash in sw.js
    {
      name: 'replace-commit-hash',
      transform(code, id) {
        if (id.endsWith('sw.js')) {
          return code.replace(/{{COMMIT_HASH}}/g, commitHash);
        }
        return code;
      }
    },
    // 👈 SITEMAP PLUGIN CONFIGURATION ADDED HERE
    sitemap({
        hostname: 'https://shadeseat.com',
        dynamicRoutes: [
            // '/' is intentionally excluded to avoid duplication
            '/route',    
            '/settings', 
        ],
        // FIX: Removed 'priorityMap' and replaced with 'priority'
        priority: 1.0 // This sets the priority for ALL routes, including '/' (the homepage)
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  appType: 'spa'
});