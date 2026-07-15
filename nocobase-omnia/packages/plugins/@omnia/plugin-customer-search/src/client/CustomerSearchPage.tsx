import React, { useRef, useState } from 'react';
import { Alert, Descriptions, Empty, Input, List, Space, Spin, Typography } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useAPIClient } from '@nocobase/client';
import './CustomerSearchPage.css';

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
  const searchSequence = useRef(0);
  const summarySequence = useRef(0);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [selected, setSelected] = useState<Summary>();
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    const normalizedQuery = query.trim();
    const sequence = ++searchSequence.current;
    summarySequence.current += 1;
    setSearchLoading(false);
    setSummaryLoading(false);
    setError('');
    setSelectedId(undefined);
    setSelected(undefined);
    if (normalizedQuery.length < 2) {
      setItems([]);
      setHasSearched(false);
      return;
    }
    setSearchLoading(true);
    setHasSearched(true);
    try {
      const response = await api.request({
        url: 'omniaCustomers:search',
        method: 'post',
        data: { q: normalizedQuery },
      });
      if (sequence === searchSequence.current) {
        const customers = response.data?.data ?? response.data;
        setItems(Array.isArray(customers) ? customers : []);
      }
    } catch {
      if (sequence === searchSequence.current) {
        setItems([]);
        setError('Die Kundensuche ist derzeit nicht verfügbar.');
      }
    } finally {
      if (sequence === searchSequence.current) setSearchLoading(false);
    }
  }

  async function showSummary(customer: Customer) {
    if (!customer.id) return;
    const sequence = ++summarySequence.current;
    setSelectedId(customer.id);
    setSelected(undefined);
    setSummaryLoading(true);
    setError('');
    try {
      const response = await api.request({
        url: 'omniaCustomers:summary',
        method: 'post',
        data: { customerId: customer.id },
      });
      if (sequence === summarySequence.current) {
        setSelected(response.data?.data ?? response.data);
      }
    } catch {
      if (sequence === summarySequence.current) {
        setError('Die Kundenansicht ist derzeit nicht verfügbar.');
      }
    } finally {
      if (sequence === summarySequence.current) setSummaryLoading(false);
    }
  }

  function changeQuery(nextQuery: string) {
    searchSequence.current += 1;
    summarySequence.current += 1;
    setQuery(nextQuery);
    setItems([]);
    setSelectedId(undefined);
    setSelected(undefined);
    setHasSearched(false);
    setSearchLoading(false);
    setSummaryLoading(false);
    setError('');
  }

  function selectFromKeyboard(event: React.KeyboardEvent, customer: Customer) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void showSummary(customer);
    }
  }

  const listEmptyText = hasSearched ? 'Keine Treffer' : 'Suche starten';

  return (
    <main className="omnia-customer-page">
      <Space className="omnia-customer-content" direction="vertical" size={16}>
        <Typography.Title level={2} style={{ margin: 0 }}>Kunden</Typography.Title>
        <Input.Search
          aria-label="Kunden suchen"
          enterButton={<span><SearchOutlined /> Suchen</span>}
          placeholder="Name oder Kundennummer"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          onSearch={() => void search()}
          loading={searchLoading}
          maxLength={200}
        />
        {query.trim().length === 1 && (
          <Typography.Text type="secondary">Mindestens zwei Zeichen eingeben.</Typography.Text>
        )}
        {error && <Alert type="error" showIcon message={error} />}
        <section className="omnia-customer-workspace" aria-label="Kundensuche und Kurzansicht">
          <div className="omnia-customer-results" role="listbox" aria-label="Suchergebnisse">
            <List
              bordered
              loading={searchLoading}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={listEmptyText} /> }}
              dataSource={items}
              renderItem={(customer) => (
                <List.Item
                  aria-selected={customer.id === selectedId}
                  className={`omnia-customer-row${customer.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => void showSummary(customer)}
                  onKeyDown={(event) => selectFromKeyboard(event, customer)}
                  role="option"
                  tabIndex={customer.id ? 0 : -1}
                >
                  <List.Item.Meta
                    avatar={<UserOutlined />}
                    title={customer.name || 'Unbenannter Kunde'}
                    description={[customer.customerNumber, customer.addressPreview].filter(Boolean).join(' · ')}
                  />
                </List.Item>
              )}
            />
          </div>
          <div className="omnia-customer-detail" aria-live="polite">
            {summaryLoading ? (
              <div className="omnia-customer-detail-loading"><Spin /></div>
            ) : selected?.customer ? (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {selected.warnings?.length ? (
                  <Alert type="warning" showIcon message="Einige Kundendaten konnten nicht geladen werden." />
                ) : null}
                <Descriptions title={selected.customer.name || 'Kunden-Kurzansicht'} bordered column={1} size="small">
                  <Descriptions.Item label="Kundennummer">{selected.customer.customerNumber || '–'}</Descriptions.Item>
                  <Descriptions.Item label="Geburtsdatum">{selected.customer.birthDate || '–'}</Descriptions.Item>
                  <Descriptions.Item label="Telefon">{selected.phones?.join(', ') || selected.customer.phone || '–'}</Descriptions.Item>
                  <Descriptions.Item label="E-Mail">{selected.customer.email || '–'}</Descriptions.Item>
                  <Descriptions.Item label="Adresse">{selected.addresses?.[0]?.preview || selected.customer.addressPreview || '–'}</Descriptions.Item>
                  <Descriptions.Item label="Offene Vorgänge">{selected.openProcesses?.length ?? 0}</Descriptions.Item>
                </Descriptions>
              </Space>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Kunde aus der Trefferliste auswählen" />
            )}
          </div>
        </section>
      </Space>
    </main>
  );
}
