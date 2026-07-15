import { Plugin } from '@nocobase/client';
import CustomerSearchPage from './CustomerSearchPage';

export class OmniaCustomerSearchClient extends Plugin {
  async load() {
    this.app.router.add('omnia-customers', {
      path: '/omnia/customers',
      Component: CustomerSearchPage,
    });
  }
}

export default OmniaCustomerSearchClient;
