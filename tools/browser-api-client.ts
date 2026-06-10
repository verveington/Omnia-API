const defaultBaseUrl = "https://api2.optica-omnia.de";

type QueryValue = string | number | boolean | null | undefined;

export type BrowserApiRequest = {
  method?: string;
  path: string;
  query?: Record<string, QueryValue | QueryValue[]>;
  body?: unknown;
};

export type BrowserApiClient = {
  request<T = unknown>(request: BrowserApiRequest): Promise<T>;
};

export function createBrowserApiClient(
  page: any,
  options: { baseUrl?: string; authInput?: string } = {},
): BrowserApiClient {
  const explicitHeaders = parseAuthInput(options.authInput || "");
  const baseUrl = normalizeBaseUrl(options.baseUrl || defaultBaseUrl);

  return {
    async request<T = unknown>(request: BrowserApiRequest): Promise<T> {
      const method = (request.method || "GET").toUpperCase();
      const url = buildUrl(baseUrl, request);
      const body = request.body === undefined || request.body === null ? null : JSON.stringify(request.body);
      const payload = await page.evaluate(
        async ({ url: requestUrl, method: requestMethod, body: requestBody, explicitHeaders: providedHeaders }) => {
          const storageHeaders = collectOmniaAuthHeaders();
          const headers: Record<string, string> = {
            accept: "application/json",
            ...storageHeaders,
            ...providedHeaders,
          };
          if (requestBody !== null) headers["content-type"] = "application/json";

          const response = await fetch(requestUrl, {
            method: requestMethod,
            headers,
            body: requestBody === null ? undefined : requestBody,
            credentials: "include",
          });
          const text = await response.text();
          let parsed: unknown = text;
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch {
            parsed = text;
          }
          return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            body: parsed,
          };

          function collectOmniaAuthHeaders(): Record<string, string> {
            const result: Record<string, string> = {};
            const storages = [globalThis.localStorage, globalThis.sessionStorage].filter(Boolean);
            for (const storage of storages) {
              for (let i = 0; i < storage.length; i += 1) {
                const key = storage.key(i) || "";
                const value = storage.getItem(key) || "";
                collectFromValue(key, value, result, 0);
              }
            }
            return result;
          }

          function collectFromValue(key: string, value: unknown, result: Record<string, string>, depth: number): void {
            if (depth > 4 || value === null || value === undefined) return;
            if (typeof value === "string") {
              const trimmed = value.trim();
              if (!result.authorization && /^Bearer\s+\S+/i.test(trimmed)) result.authorization = trimmed;
              if (!result.authorization && looksLikeJwt(trimmed)) result.authorization = `Bearer ${trimmed}`;
              if (!result["x-workspace"] && /workspace/i.test(key) && trimmed) result["x-workspace"] = trimmed;
              if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.length < 200_000) {
                try {
                  collectFromValue(key, JSON.parse(trimmed), result, depth + 1);
                } catch {
                  // Storage enthaelt haeufig freie Strings; nicht jeder Kandidat ist JSON.
                }
              }
              return;
            }
            if (Array.isArray(value)) {
              for (const item of value) collectFromValue(key, item, result, depth + 1);
              return;
            }
            if (typeof value === "object") {
              for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
                collectFromValue(childKey, childValue, result, depth + 1);
              }
            }
          }

          function looksLikeJwt(value: string): boolean {
            return /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/.test(value);
          }
        },
        { url, method, body, explicitHeaders },
      );

      if (!payload.ok) {
        throw new Error(`${method} ${request.path} failed: ${payload.status} ${payload.statusText}`);
      }
      return payload.body as T;
    },
  };
}

export function buildBrowserApiUrl(baseUrl: string, request: BrowserApiRequest): string {
  return buildUrl(normalizeBaseUrl(baseUrl), request);
}

function buildUrl(baseUrl: string, request: BrowserApiRequest): string {
  const url = new URL(request.path, `${normalizeBaseUrl(baseUrl)}/`);
  for (const [key, value] of Object.entries(request.query || {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) url.searchParams.append(key, String(item));
      }
    } else if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function parseAuthInput(value: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const rawLine of String(value || "").split(/\r?\n/)) {
    const line = rawLine
      .trim()
      .replace(/^curl\s+/i, "")
      .replace(/^-H\s+/i, "")
      .replace(/^--header\s+/i, "")
      .replace(/^['"]|['"]$/g, "");
    const match = line.match(/^([A-Za-z-]+)\s*:\s*(.+)$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    if (["authorization", "cookie", "x-workspace"].includes(key)) headers[key] = match[2].trim();
  }
  return headers;
}

function normalizeBaseUrl(value: string): string {
  return String(value || defaultBaseUrl).replace(/\/+$/, "");
}
