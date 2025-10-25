import { test, expect } from '@playwright/test';

test.describe('Git Catalogue App', () => {
  
  test('should load the application', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded successfully by looking for Angular content
    // The app should have loaded without critical errors
    await expect(page).toHaveTitle('GitCatalogue');
    
    // Check that the main app component is present
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
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Assert that there are no critical console errors
    expect(errors).toEqual([]);
  });
});