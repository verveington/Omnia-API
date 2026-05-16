export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Invalid JSON body");
    error.status = 400;
    throw error;
  }
}

export function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

export function sendNoContent(res, extraHeaders = {}) {
  res.writeHead(204, extraHeaders);
  res.end();
}

export function sendBuffer(res, status, buffer, extraHeaders = {}) {
  res.writeHead(status, {
    "content-length": buffer.length,
    ...extraHeaders,
  });
  res.end(buffer);
}

export function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

export function sessionCookie(sessionId) {
  return [
    `oc_session=${encodeURIComponent(sessionId)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=28800",
  ].join("; ");
}

export function clearSessionCookie() {
  return "oc_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0";
}

export function publicSession(session) {
  if (!session) return null;
  return {
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    source: session.source,
    workspace: session.workspace,
    user: session.user,
  };
}
