import { Plugin } from '@nocobase/client';

export class OmniaCustomerSearchClient extends Plugin {
  async load() {
    this.app.router.add('omnia-customers', {
      path: '/omnia/customers',
      componentLoader: () => import('./CustomerSearchPage'),
    });
  }
}

export default OmniaCustomerSearchClient;
