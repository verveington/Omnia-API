import assert from "node:assert/strict";
import { test } from "node:test";
import { createOmniaClient } from "./omnia-client.mjs";

test("sends documented request headers, query parameters and JSON body", async () => {
  let captured;
  const client = createOmniaClient({
    baseUrl: "https://omnia.example",
    requestIdFactory: () => "req-1",
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return jsonResponse(200, { ok: true });
    },
  });

  const result = await client.request(
    { omniaAccessToken: "token" },
    {
      method: "POST",
      path: "/apigateway/wawi/orders/search",
      query: { page: 0, size: 25, empty: "" },
      body: { keywords: "5001", active: true },
    },
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(String(captured.url), "https://omnia.example/apigateway/wawi/orders/search?page=0&size=25");
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.headers.accept, "application/json");
  assert.equal(captured.options.headers["content-type"], "application/json");
  assert.equal(captured.options.headers.authorization, "Bearer token");
  assert.equal(captured.options.headers["x-request-id"], "req-1");
  assert.equal(captured.options.body, JSON.stringify({ keywords: "5001", active: true }));
});

test("normalizes gateway errors and does not retry failed POST requests", async () => {
  let callCount = 0;
  const client = createOmniaClient({
    baseUrl: "https://omnia.example",
    requestIdFactory: () => "req-2",
    fetchImpl: async () => {
      callCount += 1;
      return jsonResponse(401, { message: "Token abgelaufen", correlationId: "corr-1", details: [{ code: "expired" }] });
    },
  });

  await assert.rejects(
    () => client.request({ omniaAccessToken: "token" }, { method: "POST", path: "/apigateway/user-details" }),
    (error) => {
      assert.equal(error.status, 401);
      assert.equal(error.code, "AUTH_REQUIRED");
      assert.equal(error.message, "Token abgelaufen");
      assert.equal(error.correlationId, "corr-1");
      assert.equal(error.retryable, false);
      assert.equal(error.path, "/apigateway/user-details");
      assert.equal(error.method, "POST");
      assert.deepEqual(error.details, [{ code: "expired" }]);
      return true;
    },
  );
  assert.equal(callCount, 1);
});

test("normalizes request timeouts", async () => {
  let signal;
  const client = createOmniaClient({
    baseUrl: "https://omnia.example",
    timeoutMs: 1,
    requestIdFactory: () => "req-timeout",
    fetchImpl: (_url, options) => {
      signal = options.signal;
      return new Promise(() => {});
    },
  });

  await assert.rejects(
    () => client.request({ omniaAccessToken: "token" }, { method: "GET", path: "/apigateway/user-details" }),
    (error) => {
      assert.equal(error.status, 504);
      assert.equal(error.code, "GATEWAY_TIMEOUT");
      assert.equal(error.correlationId, "req-timeout");
      assert.equal(error.retryable, true);
      assert.equal(error.path, "/apigateway/user-details");
      assert.equal(error.method, "GET");
      return true;
    },
  );
  assert.equal(signal.aborted, true);
});

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { get: () => null },
    async text() {
      return JSON.stringify(payload);
    },
  };
}
