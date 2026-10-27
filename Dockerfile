# Stage 1: Build frontend
FROM node:26-alpine AS frontend-builder
WORKDIR /app
RUN apk add --no-cache vips-tools
COPY package*.json ./
RUN npm install
COPY tsconfig.json vite.config.js ./
COPY frontend/ ./frontend/
# Square thumbnails for the image picker
RUN mkdir -p frontend/public/img/thumbs \
  && for f in frontend/public/img/*.*; do \
    vipsthumbnail "$f" --size 320 --smartcrop centre \
      -o "$PWD/frontend/public/img/thumbs/$(basename "$f")[Q=75,strip]"; \
  done
RUN npm run build

# Stage 2: Build backend
FROM golang:1.27-alpine AS backend-builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY server/ ./server/
RUN go build -ldflags="-w -s" -o build/server ./server/

# Stage 3: Run
FROM alpine:latest
WORKDIR /app
COPY --from=backend-builder /app/build/server ./server
COPY --from=frontend-builder /app/build/frontend/ ./build/frontend/
EXPOSE 80
CMD ["./server", "-port", "80"]
