'use strict';

const DEFAULT_TIMEOUT_MS = 8000;

class AdapterGatewayError extends Error {
  constructor(status, code) {
    super(code);
    this.name = 'AdapterGatewayError';
    this.status = status;
    this.code = code;
  }
}

function createAdapterGateway({ baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch }) {
  const adapterUrl = parseAdapterUrl(baseUrl);

  async function request(pathname, searchParams) {
    const url = new URL(pathname, adapterUrl);
    for (const [key, value] of Object.entries(searchParams || {})) {
      url.searchParams.set(key, String(value));
    }

    let response;
    try {
      response = await fetchImpl(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new AdapterGatewayError(502, 'adapter_unavailable');
    }

    if (!response.ok) {
      throw new AdapterGatewayError(response.status >= 500 ? 502 : response.status, 'adapter_request_failed');
    }

    try {
      return await response.json();
    } catch {
      throw new AdapterGatewayError(502, 'adapter_invalid_response');
    }
  }

  return {
    searchCustomers(query) {
      return request('/customers/search', { q: normalizeQuery(query) });
    },
    getCustomerSummary(customerId) {
      const id = normalizeIdentifier(customerId);
      return request(`/customers/${encodeURIComponent(id)}/summary`);
    },
  };
}

function parseAdapterUrl(value) {
  const url = new URL(value || 'http://host.docker.internal:8890');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('OMNIA_ADAPTER_URL must be an HTTP(S) URL without credentials');
  }
  return url;
}

function normalizeQuery(value) {
  const query = String(value || '').trim();
  if (query.length < 2 || query.length > 200) {
    throw new AdapterGatewayError(400, 'invalid_query');
  }
  return query;
}

function normalizeIdentifier(value) {
  const id = String(value || '').trim();
  if (!id || id.length > 200 || /[\\/?#]/.test(id)) {
    throw new AdapterGatewayError(400, 'invalid_customer_id');
  }
  return id;
}

module.exports = { AdapterGatewayError, createAdapterGateway };

