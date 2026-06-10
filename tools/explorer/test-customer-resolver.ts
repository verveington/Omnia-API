import { createBrowserApiClient } from "../write-lab.ts";

const CUSTOMER_SEARCH_PATH = "/apigateway/kunden/customers/search";
const SALES_PROCESS_SEARCH_PATH = "/apigateway/sales/salesprocesses/search";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TestCustomerResolution =
  | {
    status: "resolved";
    query: string;
    candidateCount: number;
    matchCount: number;
    customerId: string;
    detailPath: string;
  }
  | {
    status: "blocked";
    reason: string;
    query: string;
    candidateCount: number;
    matchCount: number;
  };

export async function resolveTestCustomerDetailPath(
  page: any,
  options: {
    baseUrl?: string;
    testCustomer?: string;
    query?: string;
    searchTerms?: string[];
  },
): Promise<TestCustomerResolution> {
  const expected = String(options.testCustomer || options.query || "").trim();
  if (!expected) {
    return blockedResolution("missing-query", expected, [], 0);
  }

  const searchTerms = resolverSearchTerms(expected, options.query, options.searchTerms);
  let lastBlocked = blockedResolution("missing-query", "", [], 0);
  try {
    const client = createBrowserApiClient(page, { baseUrl: options.baseUrl });
    for (const query of searchTerms) {
      const payload = await client.request({
        method: "GET",
        path: CUSTOMER_SEARCH_PATH,
        query: {
          active: true,
          keywords: query,
          page: 0,
          size: 50,
        },
      });
      const result = resolveTestCustomerFromPayload(payload, expected, query);
      if (result.status === "resolved") return result;
      lastBlocked = result;
    }
    for (const query of searchTerms) {
      const payload = await client.request({
        method: "POST",
        path: SALES_PROCESS_SEARCH_PATH,
        query: {
          page: 0,
          size: 10,
          sort: "date,desc",
        },
        body: {
          keywords: query,
          active: true,
        },
      });
      const result = resolveTestCustomerFromPayload(payload, expected, query);
      if (result.status === "resolved") return result;
      lastBlocked = result;
    }
    return lastBlocked;
  } catch {
    return blockedResolution("resolver-request-failed", searchTerms.at(-1) || "", [], 0);
  }
}

export function resolveTestCustomerFromPayload(payload: unknown, expected: string, query = expected): TestCustomerResolution {
  const rows = contentItems(payload);
  const expectedNormalized = normalizeText(expected);
  const matches = rows.filter((row) =>
    customerMatchValues(row)
      .map(normalizeText)
      .some((value) => value === expectedNormalized),
  );

  if (matches.length !== 1) {
    return resolveUniqueCustomerIdFromMatches(rows, matches, query);
  }

  const customerId = idOf(matches[0]);
  if (!UUID_RE.test(customerId)) {
    return blockedResolution("customer-id-missing", query, rows, matches.length);
  }

  return {
    status: "resolved",
    query,
    candidateCount: rows.length,
    matchCount: matches.length,
    customerId,
    detailPath: `/master-data/customers/${encodeURIComponent(customerId)}`,
  };
}

function resolveUniqueCustomerIdFromMatches(
  rows: Record<string, unknown>[],
  matches: Record<string, unknown>[],
  query: string,
): TestCustomerResolution {
  const ids = uniqueStrings(matches.map(idOf).filter((id) => UUID_RE.test(id)));
  if (ids.length !== 1) {
    return blockedResolution("customer-not-unique", query, rows, matches.length);
  }
  return {
    status: "resolved",
    query,
    candidateCount: rows.length,
    matchCount: matches.length,
    customerId: ids[0],
    detailPath: `/master-data/customers/${encodeURIComponent(ids[0])}`,
  };
}

function blockedResolution(
  reason: string,
  query: string,
  rows: Record<string, unknown>[],
  matchCount: number,
): TestCustomerResolution {
  return {
    status: "blocked",
    reason,
    query,
    candidateCount: rows.length,
    matchCount,
  };
}

function resolverSearchTerms(expected: string, explicitQuery?: string, extraTerms?: string[]): string[] {
  const terms = [
    expected,
    explicitQuery,
    ...(extraTerms || []),
    lastNameOf(expected),
  ];
  return terms
    .map((term) => String(term || "").trim())
    .filter((term) => term.length >= 3)
    .filter((term, index, values) => values.indexOf(term) === index);
}

function lastNameOf(value: string): string {
  return value.split(/\s+/).filter(Boolean).at(-1) || "";
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function customerMatchValues(value: unknown): unknown[] {
  const record = asRecord(value);
  return [
    textField(record, "name"),
    textField(record, "fullName"),
    textField(record, "customerName"),
    textField(record, "displayName"),
    textField(record, "customerLastName"),
    textField(record, "customerFirstName"),
    textField(record, "lastName"),
    textField(record, "nachname"),
    [textField(record, "customerFirstName"), textField(record, "customerLastName")].filter(Boolean).join(" "),
    [textField(record, "firstName"), textField(record, "lastName")].filter(Boolean).join(" "),
    [textField(record, "vorname"), textField(record, "nachname")].filter(Boolean).join(" "),
  ].filter(Boolean);
}

function contentItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const record = asRecord(value);
  for (const key of ["content", "items", "results", "data"]) {
    const child = record[key];
    if (Array.isArray(child)) return child.map(asRecord);
  }
  const nestedData = asRecord(record.data);
  if (Array.isArray(nestedData.content)) return nestedData.content.map(asRecord);
  return [];
}

function idOf(value: unknown): string {
  const record = asRecord(value);
  for (const key of ["customerId", "kundeId", "id", "uuid"]) {
    const value = textField(record, key);
    if (UUID_RE.test(value)) return value;
  }
  for (const key of ["customerId", "kundeId", "id", "uuid"]) {
    const value = textField(record, key);
    if (value) return value;
  }
  return "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function textField(value: unknown, key: string): string {
  const child = asRecord(value)[key];
  return child === null || child === undefined ? "" : String(child).trim();
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
