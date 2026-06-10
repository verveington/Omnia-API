import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveTestCustomerDetailPath,
  resolveTestCustomerFromPayload,
} from "./test-customer-resolver.ts";

const maxId = "08901aa6-8c23-4e1b-8c61-109a8573feeb";

test("resolveTestCustomerFromPayload resolves exactly one Max Mustermann customer", () => {
  const result = resolveTestCustomerFromPayload({
    content: [
      { id: "130ce109-5c73-4362-94ee-1caa2a12e30e", firstName: "Erika", lastName: "Mustermann" },
      { id: maxId, firstName: "Max", lastName: "Mustermann" },
    ],
  }, "Max Mustermann");

  assert.equal(result.status, "resolved");
  assert.equal(result.matchCount, 1);
  assert.equal(result.candidateCount, 2);
  if (result.status === "resolved") {
    assert.equal(result.detailPath, `/master-data/customers/${maxId}`);
  }
});

test("resolveTestCustomerFromPayload blocks missing or ambiguous customer matches", () => {
  const missing = resolveTestCustomerFromPayload({ content: [] }, "Max Mustermann");
  assert.equal(missing.status, "blocked");
  if (missing.status === "blocked") {
    assert.equal(missing.reason, "customer-not-unique");
    assert.equal(missing.matchCount, 0);
  }

  const ambiguous = resolveTestCustomerFromPayload({
    content: [
      { id: "08901aa6-8c23-4e1b-8c61-109a8573feeb", fullName: "Max Mustermann" },
      { id: "130ce109-5c73-4362-94ee-1caa2a12e30e", displayName: "Max Mustermann" },
    ],
  }, "Max Mustermann");
  assert.equal(ambiguous.status, "blocked");
  if (ambiguous.status === "blocked") {
    assert.equal(ambiguous.reason, "customer-not-unique");
    assert.equal(ambiguous.matchCount, 2);
  }
});

test("resolveTestCustomerFromPayload accepts multiple sales rows for one exact customer", () => {
  const result = resolveTestCustomerFromPayload({
    content: [
      { id: "289eff6f-1aa9-4baa-a556-3d9bdb4b44f0", customerId: maxId, customerFirstName: "Max", customerLastName: "Mustermann" },
      { id: "b8371490-8e1d-418f-abd5-63d82721300c", customerId: maxId, customerFirstName: "Max", customerLastName: "Mustermann" },
    ],
  }, "Max Mustermann", "Mustermann");

  assert.equal(result.status, "resolved");
  if (result.status === "resolved") {
    assert.equal(result.matchCount, 2);
    assert.equal(result.detailPath, `/master-data/customers/${maxId}`);
  }
});

test("resolveTestCustomerFromPayload blocks exact matches across multiple customer IDs", () => {
  const result = resolveTestCustomerFromPayload({
    content: [
      { id: "289eff6f-1aa9-4baa-a556-3d9bdb4b44f0", customerId: maxId, customerFirstName: "Max", customerLastName: "Mustermann" },
      { id: "b8371490-8e1d-418f-abd5-63d82721300c", customerId: "130ce109-5c73-4362-94ee-1caa2a12e30e", customerFirstName: "Max", customerLastName: "Mustermann" },
    ],
  }, "Max Mustermann", "Mustermann");

  assert.equal(result.status, "blocked");
  if (result.status === "blocked") {
    assert.equal(result.reason, "customer-not-unique");
    assert.equal(result.matchCount, 2);
  }
});

test("resolveTestCustomerDetailPath uses the authenticated browser API client", async () => {
  const requestedUrls: string[] = [];
  const page = {
    evaluate: async (_fn: Function, input: { url: string; method: string }) => {
      requestedUrls.push(input.url);
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        body: {
          content: [{ id: maxId, customerFirstName: "Max", customerLastName: "Mustermann" }],
        },
      };
    },
  };

  const result = await resolveTestCustomerDetailPath(page, {
    baseUrl: "https://api2.optica-omnia.de",
    testCustomer: "Max Mustermann",
  });

  assert.equal(result.status, "resolved");
  assert.equal(requestedUrls.length, 1);
  assert.match(requestedUrls[0], /\/apigateway\/kunden\/customers\/search\?/);
  assert.match(requestedUrls[0], /keywords=Max\+Mustermann/);
});

test("resolveTestCustomerDetailPath falls back to broader search terms but keeps exact Max selection", async () => {
  const requestedUrls: string[] = [];
  const page = {
    evaluate: async (_fn: Function, input: { url: string; method: string }) => {
      requestedUrls.push(input.url);
      const url = new URL(input.url);
      const keyword = url.searchParams.get("keywords");
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        body: keyword === "Max Mustermann"
          ? { content: [] }
          : {
            content: [
              { id: "130ce109-5c73-4362-94ee-1caa2a12e30e", firstName: "Erika", lastName: "Mustermann" },
              { id: maxId, firstName: "Max", lastName: "Mustermann" },
            ],
          },
      };
    },
  };

  const result = await resolveTestCustomerDetailPath(page, {
    baseUrl: "https://api2.optica-omnia.de",
    testCustomer: "Max Mustermann",
    searchTerms: ["Mustermann"],
  });

  assert.equal(result.status, "resolved");
  assert.equal(requestedUrls.length, 2);
  assert.match(requestedUrls[0], /keywords=Max\+Mustermann/);
  assert.match(requestedUrls[1], /keywords=Mustermann/);
});

test("resolveTestCustomerDetailPath falls back to sales-process search", async () => {
  const calls: Array<{ method: string; url: string; body: string | null }> = [];
  const page = {
    evaluate: async (_fn: Function, input: { url: string; method: string; body: string | null }) => {
      calls.push(input);
      const url = new URL(input.url);
      const isSalesSearch = url.pathname.endsWith("/sales/salesprocesses/search");
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        body: isSalesSearch
          ? {
            content: [
              { id: "289eff6f-1aa9-4baa-a556-3d9bdb4b44f0", customerId: maxId, customerFirstName: "Max", customerLastName: "Mustermann" },
              { id: "b8371490-8e1d-418f-abd5-63d82721300c", customerId: maxId, customerFirstName: "Max", customerLastName: "Mustermann" },
            ],
          }
          : { content: [] },
      };
    },
  };

  const result = await resolveTestCustomerDetailPath(page, {
    baseUrl: "https://api2.optica-omnia.de",
    testCustomer: "Max Mustermann",
    searchTerms: ["Mustermann"],
  });

  assert.equal(result.status, "resolved");
  assert.equal(calls.filter((call) => call.method === "GET").length, 2);
  assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  assert.match(calls.at(-1)?.url || "", /\/apigateway\/sales\/salesprocesses\/search\?/);
});
