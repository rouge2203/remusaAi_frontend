import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Repo root + frontend: frontend overrides (same keys win in local)
  const env = {
    ...loadEnv(mode, path.resolve(__dirname, ".."), ""),
    ...loadEnv(mode, __dirname, ""),
  };
  const rapidKey = env.VITE_RAPIDAPI_KEY || env.RAPIDAPI_KEY || "";

  const siteUrl = env.VITE_SITE_URL?.replace(/\/$/, "") ?? "";
  const ogImage = siteUrl ? `${siteUrl}/icon-remusa.webp` : "/icon-remusa.webp";

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "inject-og-image",
        transformIndexHtml(html) {
          return html.replace(/__OG_IMAGE__/g, ogImage);
        },
      },
    ],
    server: {
      // Listen on 0.0.0.0 so other devices on the same Wi‑Fi can open http://<your-lan-ip>:5173
      host: true,
      proxy: {
        "/api": {
          // target: "http://localhost:8000",
          target: "http://45.55.51.15",
          changeOrigin: true,
        },
        "/proxy17vin": {
          target: "http://api.17vin.com:8080",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/proxy17vin/, ""),
        },
        "/proxyRegcheck": {
          target: "https://www.regcheck.org.uk",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/proxyRegcheck/, ""),
        },
        "/proxyRapidapi": {
          target: "https://tecdoc-catalog.p.rapidapi.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/proxyRapidapi/, ""),
        },
      },
    },
    // Root .env uses RAPIDAPI_KEY; expose same value as VITE_RAPIDAPI_KEY for the client bundle
    define: {
      "import.meta.env.VITE_RAPIDAPI_KEY": JSON.stringify(rapidKey),
    },
  };
});
