import { test, expect } from '@playwright/test';

test.describe('Git Catalogue App', () => {
  
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Web-first assertions auto-wait; avoid networkidle, which hangs on the
    // external Google Fonts CDN and makes this flaky on CI.
    await expect(page).toHaveTitle('GitCatalogue');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out network-related errors that are expected in CI environments
        const isNetworkError = text.includes('net::ERR_NAME_NOT_RESOLVED') ||
                              text.includes('Failed to load resource') ||
                              text.includes('fonts.googleapis.com') ||
                              text.includes('fonts.gstatic.com') ||
                              text.includes('HttpErrorResponse');
        
        if (!isNetworkError) {
          errors.push(text);
        }
      }
    });
    
    await page.goto('/');

    // Wait for Angular to bootstrap rather than networkidle, which never
    // settles when the external Google Fonts CDN stalls on CI.
    await expect(page.locator('app-root')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('should not scroll the tab content sideways', async ({ page }) => {
    const repository = {
      id: 1,
      name: 'mod-example',
      full_name: 'azerothcore/mod-example',
      description: 'Example module',
      stargazers_count: 5,
      created_at: '2024-01-01T00:00:00Z',
      default_branch: 'master',
      owner: { login: 'azerothcore' },
      html_url: 'https://github.com/azerothcore/mod-example',
      forks_count: 0,
      watchers_count: 0,
      topics: ['azerothcore-module'],
    };
    const config = await (await page.request.get('/assets/config.json')).json();
    const organizations: Record<string, Record<string, unknown[]>> = {};
    for (const { org, topic } of Object.values<{ org: string; topic: string }>(config.tabs)) {
      organizations[org] = { ...organizations[org], [topic]: [repository] };
    }
    // the paginators only render with results, and the CI fixture has none
    await page.route('**/catalogue.json', (route) => route.fulfill({ json: { organizations } }));

    await page.goto('/');
    await expect(page.locator('a.repo-row').first()).toBeVisible();

    const tabBody = page.locator('.mat-mdc-tab-body-active .mat-mdc-tab-body-content');
    expect(await tabBody.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
  });
});