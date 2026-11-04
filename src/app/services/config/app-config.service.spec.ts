import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Config } from '../catalogue/catalogue.model';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  const CONFIG = { pageSize: 8, tabs: {} } as Config;
  const NOT_FOUND = { status: 404, statusText: 'Not Found' };

  let service: AppConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AppConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should prefer the local config', () => {
    service.load().subscribe();

    http.expectOne('assets/config.json').flush(CONFIG);

    expect(service.getConfig()).toEqual(CONFIG);
  });

  it('should fall back to the default config when the local one is missing', () => {
    service.load().subscribe();

    http.expectOne('assets/config.json').flush('', NOT_FOUND);
    http.expectOne('assets/config.default.json').flush(CONFIG);

    expect(service.getConfig()).toEqual(CONFIG);
  });

  it('should fail when no config file exists', () => {
    let error: Error | undefined;
    service.load().subscribe({ error: (err) => (error = err) });

    http.expectOne('assets/config.json').flush('', NOT_FOUND);
    http.expectOne('assets/config.default.json').flush('', NOT_FOUND);

    expect(error?.message).toContain('No configuration file found');
  });

  it('should not hide a server error behind the fallback', () => {
    let status: number | undefined;
    service.load().subscribe({ error: (err) => (status = err.status) });

    http.expectOne('assets/config.json').flush('', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('should refuse to hand out the config before it is loaded', () => {
    expect(() => service.getConfig()).toThrowError(/before configuration was loaded/);
  });
});
