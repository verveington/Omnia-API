import React, { useState } from 'react';
import { Alert, Button, Descriptions, Empty, Input, Layout, List, Space, Spin, Typography } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useAPIClient } from '@nocobase/client';

type Customer = {
  id?: string;
  customerNumber?: string;
  name?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  addressPreview?: string;
};

type Summary = {
  customer?: Customer;
  addresses?: Array<{ id?: string; preview?: string }>;
  phones?: string[];
  openProcesses?: unknown[];
  warnings?: string[];
};

export default function CustomerSearchPage() {
  const api = useAPIClient();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Summary>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    if (query.trim().length < 2) return;
    setLoading(true);
    setError('');
    setSelected(undefined);
    try {
      const response = await api.request({ url: 'omniaCustomers:search', params: { q: query.trim() } });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch {
      setItems([]);
      setError('Die Kundensuche ist derzeit nicht verfügbar.');
    } finally {
      setLoading(false);
    }
  }

  async function showSummary(customer: Customer) {
    if (!customer.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.request({
        url: 'omniaCustomers:summary',
        params: { customerId: customer.id },
      });
      setSelected(response.data);
    } catch {
      setError('Die Kundenansicht ist derzeit nicht verfügbar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout style={{ minHeight: '100%', padding: 24, background: '#f5f5f5' }}>
      <Space direction="vertical" size={16} style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
        <Typography.Title level={2} style={{ margin: 0 }}>Kunden</Typography.Title>
        <Input.Search
          aria-label="Kunden suchen"
          enterButton={<Button type="primary" icon={<SearchOutlined />}>Suchen</Button>}
          placeholder="Name oder Kundennummer"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onSearch={search}
          loading={loading}
          maxLength={200}
        />
        {error && <Alert type="error" showIcon message={error} />}
        <Layout style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.2fr)', gap: 16, background: 'transparent' }}>
          <List
            bordered
            style={{ background: '#fff' }}
            loading={loading}
            locale={{ emptyText: <Empty description="Keine Treffer" /> }}
            dataSource={items}
            renderItem={(customer) => (
              <List.Item onClick={() => showSummary(customer)} style={{ cursor: customer.id ? 'pointer' : 'default' }}>
                <List.Item.Meta
                  avatar={<UserOutlined />}
                  title={customer.name || 'Unbenannter Kunde'}
                  description={[customer.customerNumber, customer.addressPreview].filter(Boolean).join(' · ')}
                />
              </List.Item>
            )}
          />
          <div style={{ background: '#fff', border: '1px solid #d9d9d9', padding: 16, minHeight: 280 }}>
            {loading && !selected ? <Spin /> : selected?.customer ? (
              <Descriptions title={selected.customer.name || 'Kunden-Kurzansicht'} bordered column={1} size="small">
                <Descriptions.Item label="Kundennummer">{selected.customer.customerNumber || '–'}</Descriptions.Item>
                <Descriptions.Item label="Geburtsdatum">{selected.customer.birthDate || '–'}</Descriptions.Item>
                <Descriptions.Item label="Telefon">{selected.phones?.join(', ') || selected.customer.phone || '–'}</Descriptions.Item>
                <Descriptions.Item label="E-Mail">{selected.customer.email || '–'}</Descriptions.Item>
                <Descriptions.Item label="Adresse">{selected.addresses?.[0]?.preview || selected.customer.addressPreview || '–'}</Descriptions.Item>
                <Descriptions.Item label="Offene Vorgänge">{selected.openProcesses?.length ?? 0}</Descriptions.Item>
              </Descriptions>
            ) : <Empty description="Kunde aus der Trefferliste auswählen" />}
          </div>
        </Layout>
      </Space>
    </Layout>
  );
}

