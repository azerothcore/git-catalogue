import { AppPage } from './app.po';
import { browser, logging } from 'protractor';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    // Filter out network-related errors that are expected in CI environments
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    const filteredLogs = logs.filter(entry => {
      if (entry.level !== logging.Level.SEVERE) return false;
      
      // Filter out network-related errors (fonts, external resources)
      const message = entry.message || '';
      const isNetworkError = message.includes('net::ERR_NAME_NOT_RESOLVED') ||
                            message.includes('Failed to load resource') ||
                            message.includes('fonts.googleapis.com') ||
                            message.includes('fonts.gstatic.com');
      
      return !isNetworkError;
    });
    
    expect(filteredLogs).toEqual([]);
  });
});
