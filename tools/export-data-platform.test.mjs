import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_EXPORT_BODY,
  buildLoginRequest,
  buildExportPageRequest,
  fetchExportData,
  parseAuthInput,
  readCapturedAuthInput,
} from "./export-data-platform.mjs";

test("buildExportPageRequest creates the observed article export request", () => {
  const request = buildExportPageRequest({
    baseUrl: "https://api2.optica-omnia.de",
    endpointPath: "/apigateway/articletenantservice/articles/simple-search",
    page: 2,
    pageSize: 200,
    body: DEFAULT_EXPORT_BODY,
    cookie: "sid=test",
  });

  assert.equal(
    request.url,
    "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/simple-search?page=2&size=200",
  );
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.cookie, "sid=test");
  assert.equal(request.options.body, JSON.stringify(DEFAULT_EXPORT_BODY));
});

test("buildExportPageRequest creates the observed order proposals request", () => {
  const request = buildExportPageRequest({
    baseUrl: "https://api2.optica-omnia.de",
    endpointPath: "/apigateway/wawi/order-proposals/search",
    page: 0,
    pageSize: 200,
    sort: "articleDescription,desc",
    body: {
      keywords: "*",
      active: true,
    },
    cookie: "sid=test",
  });

  const url = new URL(request.url);
  assert.equal(url.origin, "https://api2.optica-omnia.de");
  assert.equal(url.pathname, "/apigateway/wawi/order-proposals/search");
  assert.equal(url.searchParams.get("page"), "0");
  assert.equal(url.searchParams.get("size"), "200");
  assert.equal(url.searchParams.get("sort"), "articleDescription,desc");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.cookie, "sid=test");
  assert.equal(request.options.body, JSON.stringify({ keywords: "*", active: true }));
});

test("fetchExportData follows pages until the API marks the result as last", async () => {
  const requestedUrls = [];
  const fetchImpl = async (url) => {
    requestedUrls.push(url);
    const page = Number(new URL(url).searchParams.get("page"));
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        content: [{ page }],
        number: page,
        last: page === 1,
      }),
    };
  };

  const result = await fetchExportData(
    {
      baseUrl: "https://api2.optica-omnia.de",
      endpointPath: "/apigateway/articletenantservice/articles/simple-search",
      pageSize: 200,
      maxPages: 10,
      body: DEFAULT_EXPORT_BODY,
      cookie: "sid=test",
    },
    fetchImpl,
  );

  assert.deepEqual(requestedUrls, [
    "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/simple-search?page=0&size=200",
    "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/simple-search?page=1&size=200",
  ]);
  assert.equal(result.pages.length, 2);
  assert.deepEqual(result.items, [{ page: 0 }, { page: 1 }]);
  assert.equal(result.stoppedReason, "last-page");
});

test("fetchExportData keeps order proposal sort query while paging", async () => {
  const requestedUrls = [];
  const fetchImpl = async (url) => {
    requestedUrls.push(url);
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        content: [{ id: "proposal-1" }],
        number: 0,
        last: true,
      }),
    };
  };

  const result = await fetchExportData(
    {
      baseUrl: "https://api2.optica-omnia.de",
      endpointPath: "/apigateway/wawi/order-proposals/search",
      sort: "articleDescription,desc",
      pageSize: 200,
      maxPages: 10,
      body: { keywords: "*", active: true },
      cookie: "sid=test",
    },
    fetchImpl,
  );

  const url = new URL(requestedUrls[0]);
  assert.equal(url.pathname, "/apigateway/wawi/order-proposals/search");
  assert.equal(url.searchParams.get("page"), "0");
  assert.equal(url.searchParams.get("size"), "200");
  assert.equal(url.searchParams.get("sort"), "articleDescription,desc");
  assert.deepEqual(result.items, [{ id: "proposal-1" }]);
});

test("parseAuthInput accepts plain cookie and copied header snippets", () => {
  assert.deepEqual(parseAuthInput("sid=test; other=value"), {
    cookie: "sid=test; other=value",
    authorization: "",
  });
  assert.deepEqual(parseAuthInput("Cookie: sid=test; other=value"), {
    cookie: "sid=test; other=value",
    authorization: "",
  });
  assert.deepEqual(parseAuthInput("-H 'cookie: sid=test; other=value'"), {
    cookie: "sid=test; other=value",
    authorization: "",
  });
  assert.deepEqual(parseAuthInput("Authorization: Bearer abc.def.ghi"), {
    cookie: "",
    authorization: "Bearer abc.def.ghi",
  });
});

test("buildLoginRequest creates the observed keycloak password grant request", () => {
  const request = buildLoginRequest({
    baseUrl: "https://api2.optica-omnia.de",
    realm: "502753",
    username: "user",
    password: "secret",
    workspace: "workspace-id",
    clientAuthorization: "Basic abc",
  });

  assert.equal(
    request.url,
    "https://api2.optica-omnia.de/keycloak/auth/realms/502753/protocol/openid-connect/token",
  );
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers["content-type"], "application/x-www-form-urlencoded");
  assert.equal(request.options.headers.authorization, "Basic abc");
  assert.equal(request.options.headers["x-workspace"], "workspace-id");
  assert.equal(request.options.body, "username=user&password=secret&grant_type=password");
});

test("fetchExportData can use direct login credentials when no cookie is supplied", async () => {
  const requestOptions = [];
  const fetchImpl = async (url, options) => {
    requestOptions.push({ url, options });
    if (url.includes("/protocol/openid-connect/token")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => ({ access_token: "token-123" }),
      };
    }
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        content: [],
        number: 0,
        last: true,
      }),
    };
  };

  await fetchExportData(
    {
      baseUrl: "https://api2.optica-omnia.de",
      endpointPath: "/apigateway/articletenantservice/articles/simple-search",
      realm: "502753",
      username: "user",
      password: "secret",
      pageSize: 200,
      maxPages: 1,
      body: DEFAULT_EXPORT_BODY,
    },
    fetchImpl,
  );

  assert.equal(requestOptions.length, 2);
  assert.equal(requestOptions[1].options.headers.authorization, "Bearer token-123");
});

test("readCapturedAuthInput reads local auth capture files without exposing other fields", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-export-auth-"));
  const file = path.join(dir, "auth.json");
  fs.writeFileSync(
    file,
    JSON.stringify({
      authInput: "Cookie: sid=test",
      cookieNames: ["sid"],
    }),
  );

  assert.equal(readCapturedAuthInput(file), "Cookie: sid=test");
  assert.equal(readCapturedAuthInput(path.join(dir, "missing.json")), "");
});

test("order proposal preset has its own endpoint, body, sort and save file", async () => {
  const platform = await import("./export-data-platform.mjs");
  assert.equal(typeof platform.getExportPreset, "function");
  assert.equal(typeof platform.exportDataFileForDataset, "function");

  const preset = platform.getExportPreset("orderProposals");
  assert.equal(preset.endpointPath, "/apigateway/wawi/order-proposals/search");
  assert.equal(preset.sort, "articleDescription,desc");
  assert.deepEqual(preset.body, { keywords: "*", active: true });
  assert.equal(path.basename(platform.exportDataFileForDataset("orderProposals")), "omnia-order-proposals-data.json");
});

test("writeExportDataFile persists export data without auth material", async () => {
  const platform = await import("./export-data-platform.mjs");
  assert.equal(typeof platform.writeExportDataFile, "function");

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-export-data-"));
  const file = path.join(dir, "data.json");
  platform.writeExportDataFile(
    {
      endpoint: "/apigateway/articletenantservice/articles/simple-search",
      pageSize: 200,
      pages: [{ page: 0, numberOfElements: 1, last: true }],
      items: [{ id: "article-1" }],
      itemCount: 1,
      stoppedReason: "last-page",
      authInput: "Cookie: secret",
      password: "secret",
    },
    file,
  );

  const text = fs.readFileSync(file, "utf8");
  const data = JSON.parse(text);
  assert.deepEqual(data.items, [{ id: "article-1" }]);
  assert.equal(data.source.endpoint, "/apigateway/articletenantservice/articles/simple-search");
  assert.equal(data.source.itemCount, 1);
  assert.doesNotMatch(text, /secret|Cookie/i);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
});
