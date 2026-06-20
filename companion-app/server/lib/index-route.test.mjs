import assert from "node:assert/strict";
import http from "node:http";
import { test } from "node:test";
import { createCompanionServer } from "../index.mjs";

test("adds CORS headers to normal JSON responses", async (t) => {
  const server = createCompanionServer({ allowedOrigin: "http://app.example" });
  await listen(server);
  t.after(() => server.close());

  const response = await request(server, { method: "GET", path: "/api/health" });

  assert.equal(response.status, 200);
  assert.equal(response.headers["access-control-allow-origin"], "http://app.example");
  assert.equal(response.headers["access-control-allow-credentials"], "true");
  assert.equal(response.body.ok, true);
});

test("adds CORS headers to error JSON responses", async (t) => {
  const server = createCompanionServer({ allowedOrigin: "http://app.example" });
  await listen(server);
  t.after(() => server.close());

  const response = await request(server, { method: "GET", path: "/api/cases" });

  assert.equal(response.status, 401);
  assert.equal(response.headers["access-control-allow-origin"], "http://app.example");
  assert.equal(response.body.error.code, "AUTH_REQUIRED");
  assert.equal(response.body.error.retryable, false);
});

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}

function request(server, { method, path }) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, method, path }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: text ? JSON.parse(text) : null,
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}
