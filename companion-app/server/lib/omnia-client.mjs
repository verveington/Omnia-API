export function createOmniaClient({
  baseUrl = process.env.OMNIA_API_BASE_URL || "https://api2.optica-omnia.de",
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!fetchImpl) {
    throw new Error("fetch is not available in this Node runtime");
  }

  async function request(session, { method = "GET", path, query, body }) {
    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(query || {})) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    const headers = {
      accept: "application/json",
    };

    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    if (session?.omniaAccessToken) {
      headers.authorization = `Bearer ${session.omniaAccessToken}`;
    }

    const response = await fetchImpl(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    const payload = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      const error = new Error(`Omnia request failed: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  return { request };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
