'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { AdapterGatewayError, createAdapterGateway } = require('../src/server/adapter-gateway');

test('search calls only the configured adapter with an encoded query', async () => {
  let captured;
  const gateway = createAdapterGateway({
    baseUrl: 'http://adapter.test:8890',
    fetchImpl: async (url, options) => {
      captured = { url: String(url), options };
      return { ok: true, json: async () => [{ id: 'customer-1' }] };
    },
  });

  const result = await gateway.searchCustomers('  Muster & Co  ');

  assert.deepEqual(result, [{ id: 'customer-1' }]);
  assert.equal(captured.url, 'http://adapter.test:8890/customers/search?q=Muster+%26+Co');
  assert.equal(captured.options.method, 'GET');
  assert.deepEqual(captured.options.headers, { accept: 'application/json' });
  assert.equal('authorization' in captured.options.headers, false);
});

test('summary encodes the customer identifier and does not add credentials', async () => {
  let capturedUrl;
  const gateway = createAdapterGateway({
    baseUrl: 'https://adapter.test/base',
    fetchImpl: async (url) => {
      capturedUrl = String(url);
      return { ok: true, json: async () => ({ customer: { id: 'customer 1' } }) };
    },
  });

  await gateway.getCustomerSummary('customer 1');
  assert.equal(capturedUrl, 'https://adapter.test/customers/customer%201/summary');
});

test('invalid input is rejected before an adapter request', () => {
  const gateway = createAdapterGateway({
    baseUrl: 'http://adapter.test:8890',
    fetchImpl: async () => assert.fail('fetch must not be called'),
  });

  assert.throws(() => gateway.searchCustomers('x'), (error) => {
    assert.ok(error instanceof AdapterGatewayError);
    assert.equal(error.code, 'invalid_query');
    return true;
  });
  assert.throws(() => gateway.getCustomerSummary('../secret'), (error) => {
    assert.equal(error.code, 'invalid_customer_id');
    return true;
  });
});

test('upstream details are replaced with a generic error', async () => {
  const gateway = createAdapterGateway({
    baseUrl: 'http://adapter.test:8890',
    fetchImpl: async () => ({ ok: false, status: 500, text: async () => 'customer data and token' }),
  });

  await assert.rejects(() => gateway.searchCustomers('Muster'), (error) => {
    assert.equal(error.code, 'adapter_request_failed');
    assert.equal(error.message.includes('customer data'), false);
    return true;
  });
});
