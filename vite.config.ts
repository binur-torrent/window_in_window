import react from "@vitejs/plugin-react";
import { defineConfig, type ProxyOptions } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * The pentest stage frames the real VulnSight frontend, but drives it against a
 * mock backend so the replay needs no database, no scanner, and no API.
 *
 * `public/pentest-mock.js` installs that backend inside the framed document. It
 * has to run before Next.js boots, so it cannot be appended from the parent
 * page after load — by then the app has already made its first request. The
 * proxy therefore rewrites the HTML on its way through and injects the script
 * as the very first thing in `<head>`.
 */

const PENTESTER_ORIGIN = "http://localhost:3000";
const INJECTED_TAG = `<script src="/pentest-mock.js"></script>`;

/** Routes served by the framed Next.js app rather than by this dev server. */
const PENTESTER_ROUTES = [
  "/_next",
  "/scans",
  "/findings",
  "/settings",
  "/pull-requests",
  "/repos",
  "/domains",
  "/dashboard",
  "/ai-providers",
];

function injectMockBackend(): ProxyOptions {
  return {
    target: PENTESTER_ORIGIN,
    changeOrigin: true,
    ws: true,
    selfHandleResponse: true,
    configure(proxy) {
      /* Compressed bodies cannot be pattern-matched, and the upstream is a
         local dev server, so identity encoding costs nothing here. */
      proxy.on("proxyReq", (proxyReq) => {
        proxyReq.setHeader("accept-encoding", "identity");
      });

      proxy.on("proxyRes", (proxyRes, _req: IncomingMessage, res: ServerResponse) => {
        const type = String(proxyRes.headers["content-type"] ?? "");
        const headers = { ...proxyRes.headers };

        /* Framing this origin is the entire point of the stage. */
        delete headers["x-frame-options"];
        delete headers["content-security-policy"];

        if (!type.includes("text/html")) {
          res.writeHead(proxyRes.statusCode ?? 200, headers);
          proxyRes.pipe(res);
          return;
        }

        const chunks: Buffer[] = [];
        proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
        proxyRes.on("end", () => {
          const html = Buffer.concat(chunks).toString("utf8");
          const body = html.includes(INJECTED_TAG)
            ? html
            : html.replace(/<head([^>]*)>/i, `<head$1>${INJECTED_TAG}`);

          delete headers["content-length"];
          res.writeHead(proxyRes.statusCode ?? 200, headers);
          res.end(body);
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      /* The framed app's home. Its own links point at absolute paths such as
         "/scans/new", which the entries below forward to the same upstream. */
      "/pentester-live": {
        ...injectMockBackend(),
        rewrite: (path) => path.replace(/^\/pentester-live/, "") || "/",
      },
      ...Object.fromEntries(
        PENTESTER_ROUTES.map((route) => [route, injectMockBackend()]),
      ),
    },
  },
});
