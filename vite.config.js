import { defineConfig } from "vite";

// Thumbnails are only generated in the docker build, so locally serve the full image in their place.
const fullImagesForThumbnails = (server) => {
  server.middlewares.use((req, _res, next) => {
    req.url = req.url?.replace(/^\/img\/thumbs\//, "/img/");
    next();
  });
};

export default defineConfig({
  root: "frontend",
  base: "./",
  build: {
    outDir: "../build/frontend",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 9000,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    {
      name: "full-images-for-thumbnails",
      configureServer: fullImagesForThumbnails,
      configurePreviewServer: fullImagesForThumbnails,
    },
  ],
});
