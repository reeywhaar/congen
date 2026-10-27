# Texture Generator in WebGL

Makes seamless textures in the browser. It tiles a source image, crossfades the seams between the tiles, and runs the result through WebGL filters and brightness, contrast and saturation adjustments. The texture can be downloaded as a JPEG at any size up to 20000 × 20000.

Demo: [texgen.vyrtsev.com](https://texgen.vyrtsev.com/)

## Using it

- **Image**: pick a built-in texture or upload your own (dropping a file on the page works too). Uploads are stored in the browser's IndexedDB.
- **Filters**: click a filter to add it; filters apply in the order they were added. Click an applied filter to remove it.
- **Brightness, Contrast, Saturation**: 0 leaves the image unchanged.
- **Scale**: the size of the source image in the texture. − and + (or the arrow keys) take off 20% or add 25%.
- **Crossfade size**: how wide the blend between tiles is.
- **Generate**: picks a new random tile layout.
- **Download**: renders the texture at the size you enter; empty fields use the screen size.

Settings are remembered between visits.

## Development

The devcontainer has the toolchain (Node, plus Go for the server).

```sh
npm install
npm run serve     # dev server on http://localhost:9000
npm run build     # type-check, then build into build/frontend
npm run tscheck   # type-check only
npm run lint      # format frontend/src with Prettier
```

`frontend/` is the Vite root: TypeScript in `frontend/src`, static files in `frontend/public`. The server is in `server/`.

To serve a production build without Docker:

```sh
npm run build
go run ./server -dir build/frontend   # http://localhost:8080
```

### Adding a built-in image

Put the image in `frontend/public/img/` and add its path to `frontend/src/list.ts`.

The image picker shows 320px thumbnails from `img/thumbs/`. They're generated during the Docker build and aren't committed; the dev and preview servers serve the full image in their place.

## Docker

The image builds the frontend, including the thumbnails, and a small Go static file server, then serves on port 80:

```sh
docker build -t texgen .
docker run -p 8080:80 texgen
```

To build for another architecture, pass `--platform`, e.g. `--platform linux/amd64` on an Apple Silicon Mac. The build stages run natively and Go cross-compiles, so nothing is emulated.

The server takes `-port` (default 8080) and `-dir` (default `build/frontend`), and logs each request as a line of JSON. Vite's content-hashed files in `/assets/` are cached for a year; everything else is revalidated on each load, so a new deploy shows up immediately.

## License

MIT, see [LICENSE](LICENSE).
