import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);
const ensureTrailingSlash = (value: string) => (value.endsWith("/") ? value : `${value}/`);

const resolveBasePath = () => {
  const explicitBase = process.env.VITE_BASE_PATH ?? process.env.BASE_PATH;
  if (explicitBase && explicitBase !== ".") {
    if (explicitBase === "/") {
      return "/";
    }
    return ensureTrailingSlash(ensureLeadingSlash(explicitBase));
  }

  const repository = process.env.GITHUB_REPOSITORY;
  const isGithubPages = Boolean(process.env.GITHUB_PAGES ?? process.env.GITHUB_ACTIONS);

  if (repository && isGithubPages) {
    const [, repoName = ""] = repository.split("/");
    if (repoName) {
      return ensureTrailingSlash(ensureLeadingSlash(repoName));
    }
  }

  return "/";
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const base = resolveBasePath();
  const enablePwaFlag = process.env.VITE_ENABLE_PWA;
  // Enable the PWA by default in production so browsers can surface the install prompt.
  const enablePwa =
    enablePwaFlag === "true" ||
    (enablePwaFlag === undefined && mode === "production");

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      enablePwa &&
        VitePWA({
          registerType: "autoUpdate",
          workbox: {
            globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,avif}"],
            // Allow larger static assets like the full-resolution logo to be precached.
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          },
          includeAssets: ["favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png"],
          manifest: {
            name: "ProList_Mini Importation",
            short_name: "ProList Mini",
            description: "Trust-first preorder app with escrow, countdown and pickup QR.",
            theme_color: "#0087C5",
            background_color: "#ffffff",
            display: "standalone",
            start_url: base,
            scope: base,
            icons: [
              {
                src: "icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable",
              },
              {
                src: "icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
              },
            ],
          },
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
