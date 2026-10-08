package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func newTestRouter(t *testing.T, origins []string) (http.Handler, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { client.Close() })
	return CORS(NewRouter(client), origins), mr
}

func get(h http.Handler, path, sdkKey string, headers map[string]string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, path, nil)
	if sdkKey != "" {
		req.Header.Set("Authorization", sdkKey)
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestEvaluate(t *testing.T) {
	h, mr := newTestRouter(t, nil)
	mr.Set("flag:key1:bool", "true")
	mr.Set("flag:key1:str", `"Buy Now"`)
	mr.Set("flag:key1:obj", `{"fontSize":16,"theme":"dark"}`)
	mr.Set("flag:key1:num", "100")
	mr.Set("flag:key1:broken", "{not json")

	cases := []struct {
		name, path, key string
		status          int
		body            string
	}{
		{"boolean", "/api/v1/evaluate/flags/bool", "key1", 200, `{"value":true}`},
		{"string", "/api/v1/evaluate/flags/str", "key1", 200, `{"value":"Buy Now"}`},
		{"number", "/api/v1/evaluate/flags/num", "key1", 200, `{"value":100}`},
		{"object", "/api/v1/evaluate/flags/obj", "key1", 200, `{"value":{"fontSize":16,"theme":"dark"}}`},
		{"unknown flag is null", "/api/v1/evaluate/flags/nope", "key1", 200, `{"value":null}`},
		{"unknown key is null", "/api/v1/evaluate/flags/bool", "other", 200, `{"value":null}`},
		{"missing auth", "/api/v1/evaluate/flags/bool", "", 401, ""},
		{"corrupt cache value", "/api/v1/evaluate/flags/broken", "key1", 500, ""},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec := get(h, c.path, c.key, nil)
			if rec.Code != c.status {
				t.Fatalf("status = %d, want %d (body %q)", rec.Code, c.status, rec.Body.String())
			}
			if c.body != "" && strings.TrimSpace(rec.Body.String()) != c.body {
				t.Fatalf("body = %q, want %q", rec.Body.String(), c.body)
			}
		})
	}
}

func TestRedisDown(t *testing.T) {
	h, mr := newTestRouter(t, nil)
	mr.Close()
	if rec := get(h, "/api/v1/evaluate/flags/x", "key1", nil); rec.Code != http.StatusInternalServerError {
		t.Fatalf("evaluate status = %d, want 500", rec.Code)
	}
	if rec := get(h, "/api/v1/health", "", nil); rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("health status = %d, want 503", rec.Code)
	}
}

func TestHealth(t *testing.T) {
	h, _ := newTestRouter(t, nil)
	if rec := get(h, "/api/v1/health", "", nil); rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
}

func TestCORS(t *testing.T) {
	t.Run("disabled by default", func(t *testing.T) {
		h, _ := newTestRouter(t, nil)
		rec := get(h, "/api/v1/health", "", map[string]string{"Origin": "https://app.example.com"})
		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
			t.Fatalf("unexpected CORS header %q", got)
		}
	})

	t.Run("allowed origin gets headers and preflight succeeds", func(t *testing.T) {
		h, _ := newTestRouter(t, []string{"https://app.example.com"})
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/evaluate/flags/x", nil)
		req.Header.Set("Origin", "https://app.example.com")
		req.Header.Set("Access-Control-Request-Method", "GET")
		req.Header.Set("Access-Control-Request-Headers", "authorization")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Fatalf("preflight status = %d, want 204", rec.Code)
		}
		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "https://app.example.com" {
			t.Fatalf("allow-origin = %q", got)
		}
		if rec.Header().Get("Access-Control-Allow-Headers") == "" {
			t.Fatal("missing allow-headers")
		}
	})

	t.Run("other origin is not allowed", func(t *testing.T) {
		h, _ := newTestRouter(t, []string{"https://app.example.com"})
		rec := get(h, "/api/v1/health", "", map[string]string{"Origin": "https://evil.example.com"})
		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
			t.Fatalf("unexpected allow-origin %q", got)
		}
	})

	t.Run("wildcard", func(t *testing.T) {
		h, _ := newTestRouter(t, []string{"*"})
		rec := get(h, "/api/v1/health", "", map[string]string{"Origin": "https://anything.example"})
		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
			t.Fatalf("allow-origin = %q, want *", got)
		}
	})
}
