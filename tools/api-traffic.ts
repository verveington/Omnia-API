const API_RESOURCE_TYPES = new Set(["fetch", "xhr"]);

const API_PATH_PREFIXES = [
  "/apigateway/",
  "/api/",
  "/auth/",
  "/identity/",
  "/oauth/",
  "/oauth2/",
  "/connect/",
  "/realms/",
];

export function isApiTrafficRecord(record: Record<string, unknown>): boolean {
  if (!isApiResourceType(String(record.resourceType || ""))) return false;
  return isApiUrl(String(record.url || ""));
}

export function isApiUrl(value: string): boolean {
  const url = parseUrl(value);
  return isApiPath(url.pathname);
}

export function isApiPath(pathname: string): boolean {
  return API_PATH_PREFIXES.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix));
}

function isApiResourceType(resourceType: string): boolean {
  return API_RESOURCE_TYPES.has(resourceType.toLowerCase());
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL("http://unknown.invalid/");
  }
}
