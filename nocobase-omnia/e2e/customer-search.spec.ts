import { expect, test, type Page } from '@playwright/test';

const username = process.env.INIT_ROOT_USERNAME;
const password = process.env.INIT_ROOT_PASSWORD;

async function openCustomerSearch(page: Page) {
  if (!username || !password) {
    throw new Error('INIT_ROOT_USERNAME and INIT_ROOT_PASSWORD are required');
  }

  await page.goto('/');
  await page.getByPlaceholder('Username/Email').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  const signIn = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/auth:signIn');
  await page.getByRole('button', { name: 'action-Action-Sign in' }).click();
  expect((await signIn).status()).toBe(200);
  await page.waitForFunction(() => Boolean(localStorage.getItem('NOCOBASE_TOKEN')));

  const authCheck = page.waitForResponse((response) => {
    return new URL(response.url()).pathname === '/api/auth:check' && response.status() === 200;
  });
  await page.goto('/omnia/customers');
  await authCheck;
  await expect(page.getByRole('heading', { name: 'Kunden' })).toBeVisible();
}

test('searches for a customer and opens the read-only summary', async ({ page }) => {
  const actionResponses: Array<{ method: string; path: string; status: number }> = [];
  const browserOrigins = new Set<string>();
  const consoleErrors: string[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') browserOrigins.add(url.origin);
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/omniaCustomers:')) {
      actionResponses.push({
        method: response.request().method(),
        path: url.pathname,
        status: response.status(),
      });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openCustomerSearch(page);
  consoleErrors.length = 0;

  await page.getByPlaceholder('Name oder Kundennummer').fill('Mara');
  await page.getByRole('button', { name: /Suchen/ }).click();
  const result = page.getByRole('option');
  await expect(result).toHaveCount(1);
  await expect(result).toContainText('Mara Beispiel');
  await expect(result).toContainText('10001');
  await result.click();

  const detail = page.locator('.ant-descriptions');
  await expect(detail).toBeVisible();
  await expect(detail.locator('.ant-descriptions-item-label')).toHaveText([
    'Kundennummer',
    'Geburtsdatum',
    'Telefon',
    'E-Mail',
    'Adresse',
    'Offene Vorgänge',
  ]);
  await expect(detail.locator('.ant-descriptions-item-content')).toHaveText([
    '10001',
    '1984-04-12',
    '+49 000 10001',
    'mara.beispiel@example.invalid',
    'Beispielweg, 10, 00001, Demostadt',
    '1',
  ]);
  await expect.poll(() => actionResponses).toEqual([
    { method: 'POST', path: '/api/omniaCustomers:search', status: 200 },
    { method: 'POST', path: '/api/omniaCustomers:summary', status: 200 },
  ]);

  const appOrigin = new URL(page.url()).origin;
  expect([...browserOrigins]).toEqual([appOrigin]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect(consoleErrors).toEqual([]);
});

test('invalidates delayed detail and search responses', async ({ page }) => {
  await openCustomerSearch(page);

  await page.getByPlaceholder('Name oder Kundennummer').fill('Mara');
  await page.getByRole('button', { name: /Suchen/ }).click();
  await expect(page.getByRole('option')).toContainText('Mara Beispiel');

  let releaseSummary!: () => void;
  let finishSummary!: () => void;
  const summaryGate = new Promise<void>((resolve) => { releaseSummary = resolve; });
  const summaryDone = new Promise<void>((resolve) => { finishSummary = resolve; });
  await page.route('**/api/omniaCustomers:summary', async (route) => {
    const response = await route.fetch();
    await summaryGate;
    await route.fulfill({ response });
    finishSummary();
  });

  const summaryRequest = page.waitForRequest('**/api/omniaCustomers:summary');
  await page.getByRole('option').click();
  await summaryRequest;
  await expect(page.locator('.omnia-customer-detail-loading')).toBeVisible();

  await page.getByPlaceholder('Name oder Kundennummer').fill('Jonas');
  await page.getByRole('button', { name: /Suchen/ }).click();
  await expect(page.getByRole('option')).toContainText('Jonas Testmann');
  await expect(page.locator('.omnia-customer-detail-loading')).toHaveCount(0);

  releaseSummary();
  await summaryDone;
  await expect(page.locator('.ant-descriptions')).toHaveCount(0);

  let releaseSearch!: () => void;
  let finishSearch!: () => void;
  const searchGate = new Promise<void>((resolve) => { releaseSearch = resolve; });
  const searchDone = new Promise<void>((resolve) => { finishSearch = resolve; });
  await page.route('**/api/omniaCustomers:search', async (route) => {
    const response = await route.fetch();
    await searchGate;
    await route.fulfill({ response });
    finishSearch();
  });

  const searchRequest = page.waitForRequest('**/api/omniaCustomers:search');
  await page.getByPlaceholder('Name oder Kundennummer').fill('Mara');
  await page.getByRole('button', { name: /Suchen/ }).click();
  await searchRequest;
  await page.getByPlaceholder('Name oder Kundennummer').fill('J');
  await page.getByRole('button', { name: /Suchen/ }).click();
  await expect(page.getByText('Mindestens zwei Zeichen eingeben.')).toBeVisible();
  await expect(page.getByRole('option')).toHaveCount(0);

  releaseSearch();
  await searchDone;
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(page.locator('.ant-spin')).toHaveCount(0);
});
