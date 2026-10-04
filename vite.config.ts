import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

/**
 * The pentest stage frames a self-contained VulnSight mock that lives in this
 * repo. It does not proxy to the real product — scans, findings, and settings
 * are all frontend data — so the replay works with this project alone.
 */

const MOCK_PREFIXES = [
  "/pentester-live",
  "/scans",
  "/findings",
  "/settings",
  "/pull-requests",
  "/repos",
  "/domains",
  "/dashboard",
  "/ai-providers",
];

function isMockRoute(url = "") {
  const path = url.split("?")[0];
  return MOCK_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function serveVulnsightMock(): Plugin {
  const rewrite = (req: { url?: string }) => {
    if (req.url && isMockRoute(req.url)) req.url = "/vulnsight.html";
  };

  return {
    name: "vulnsight-frontend-mock",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveVulnsightMock()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        vulnsight: resolve(__dirname, "vulnsight.html"),
      },
    },
  },
});
