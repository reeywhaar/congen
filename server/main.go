package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func main() {
	port := flag.Int("port", 8080, "port to listen on")
	root := flag.String("dir", "build/frontend", "directory to serve")
	flag.Parse()

	absRoot, err := filepath.Abs(*root)
	if err != nil {
		log.Fatalf("resolve path: %v", err)
	}

	info, err := os.Stat(absRoot)
	if err != nil {
		log.Fatalf("cannot access %q: %v", absRoot, err)
	}
	if !info.IsDir() {
		log.Fatalf("%q is not a directory", absRoot)
	}

	fs := http.FileServer(http.Dir(absRoot))
	mux := http.NewServeMux()
	mux.Handle("/", loggingMiddleware(cacheControlMiddleware(fs)))

	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Serving %s on http://localhost%s", absRoot, addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

type responseWriter struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (rw *responseWriter) WriteHeader(status int) {
	rw.status = status
	rw.ResponseWriter.WriteHeader(status)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.bytes += n
	return n, err
}

// cacheControlMiddleware lets browsers keep Vite's content-hashed /assets/ forever, and
// makes them revalidate everything else (index.html above all), so a deploy shows up at once.
func cacheControlMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/assets/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			w.Header().Set("Cache-Control", "no-cache")
		}
		next.ServeHTTP(w, r)
	})
}

func loggingMiddleware(next http.Handler) http.Handler {
	enc := json.NewEncoder(os.Stdout)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)

		remoteIP, remotePort, _ := net.SplitHostPort(r.RemoteAddr)

		entry := map[string]any{
			"time":            start.UTC().Format(time.RFC3339Nano),
			"duration_ms":     time.Since(start).Milliseconds(),
			"method":          r.Method,
			"path":            r.URL.Path,
			"query":           r.URL.RawQuery,
			"status":          rw.status,
			"bytes":           rw.bytes,
			"remote_ip":       remoteIP,
			"remote_port":     remotePort,
			"host":            r.Host,
			"user_agent":      r.UserAgent(),
			"referer":         r.Referer(),
			"proto":           r.Proto,
			"content_type":    r.Header.Get("Content-Type"),
			"accept":          r.Header.Get("Accept"),
			"accept_encoding": r.Header.Get("Accept-Encoding"),
			"x_forwarded_for": r.Header.Get("X-Forwarded-For"),
			"x_real_ip":       r.Header.Get("X-Real-IP"),
			"x_request_id":    r.Header.Get("X-Request-ID"),
		}

		if err := enc.Encode(entry); err != nil {
			log.Printf("log encode: %v", err)
		}
	})
}
