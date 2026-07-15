import { Plugin } from '@nocobase/server';

const { AdapterGatewayError, createAdapterGateway } = require('./adapter-gateway');

export class OmniaCustomerSearchServer extends Plugin {
  async load() {
    const gateway = createAdapterGateway({
      baseUrl: process.env.OMNIA_ADAPTER_URL,
      timeoutMs: Number(process.env.OMNIA_ADAPTER_TIMEOUT_MS || 8000),
    });

    this.app.resourceManager.define({
      name: 'omniaCustomers',
      actions: {
        search: async (ctx) => {
          try {
            ctx.body = await gateway.searchCustomers(ctx.action.params.q);
          } catch (error) {
            handleGatewayError(ctx, error);
          }
        },
        summary: async (ctx) => {
          try {
            ctx.body = await gateway.getCustomerSummary(ctx.action.params.customerId);
          } catch (error) {
            handleGatewayError(ctx, error);
          }
        },
      },
    });
    this.app.acl.allow('omniaCustomers', ['search', 'summary'], 'loggedIn');
  }
}

function handleGatewayError(ctx, error) {
  if (error instanceof AdapterGatewayError) {
    ctx.throw(error.status, error.code);
  }
  ctx.throw(502, 'adapter_request_failed');
}

export default OmniaCustomerSearchServer;
