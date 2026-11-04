import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Repository } from 'src/@types';
import { APP_CONFIG } from '../config/config.token';
import { Config } from './catalogue.model';
import { CatalogueService } from './catalogue.service';

describe('CatalogueService', () => {
  const FILE_URL = 'https://example.com/catalogue.json';
  const repo = (id: number, extra: Partial<Repository> = {}) =>
    ({ id, name: `repo-${id}`, full_name: `org/repo-${id}`, ...extra }) as Repository;

  const apiConfig = (extra: Partial<Config> = {}): Config => ({
    page: 0,
    perPage: 2,
    pageSize: 8,
    tabs: { Modules: { topic: 'module', org: 'org', path: '/module' } },
    usePreGeneratedFile: false,
    ...extra,
  });
  const fileConfig = (): Config => apiConfig({ usePreGeneratedFile: true, preGeneratedFileUrl: FILE_URL });

  const setup = (config: Config) => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_CONFIG, useValue: config }, provideHttpClient(), provideHttpClientTesting()],
    });
    return { service: TestBed.inject(CatalogueService), http: TestBed.inject(HttpTestingController) };
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  describe('tab items', () => {
    it('should read a tab from the pre-generated file and cache it', () => {
      const { service, http } = setup(fileConfig());
      const items = service.tabItems('Modules');

      http.expectOne(FILE_URL).flush({ organizations: { org: { module: [repo(1)] } } });

      expect(items()?.map((item) => item.id)).toEqual([1]);
      expect(JSON.parse(localStorage.getItem('org-module') as string).value[0].id).toBe(1);
    });

    it('should return an empty list when the pre-generated file lacks the tab', () => {
      const { service, http } = setup(fileConfig());
      const items = service.tabItems('Modules');

      http.expectOne(FILE_URL).flush({ organizations: {} });

      expect(items()).toEqual([]);
    });

    it('should fall back to the GitHub API when the pre-generated file fails', () => {
      spyOn(console, 'warn');
      const { service, http } = setup(fileConfig());
      const items = service.tabItems('Modules');

      http.expectOne(FILE_URL).flush('nope', { status: 500, statusText: 'Server Error' });
      http
        .expectOne((request) => request.url.startsWith('https://api.github.com/search/repositories'))
        .flush({ total_count: 1, items: [repo(9)] });

      expect(items()?.map((item) => item.id)).toEqual([9]);
    });

    it('should walk every page of the GitHub search and cache the result', () => {
      const { service, http } = setup(apiConfig());
      const items = service.tabItems('Modules');
      const pageUrl = (page: number) =>
        `https://api.github.com/search/repositories?page=${page}&per_page=2&q=org:org+fork:true+topic:module+sort:stars`;

      http.expectOne(pageUrl(1)).flush({ total_count: 3, items: [repo(1), repo(2)] });
      expect(items()).toBeUndefined();
      http.expectOne(pageUrl(2)).flush({ total_count: 3, items: [repo(3)] });

      expect(items()?.map((item) => item.id)).toEqual([1, 2, 3]);
      expect(JSON.parse(localStorage.getItem('org-module') as string).value.length).toBe(3);
    });

    it('should leave out the org filter when the search is global', () => {
      const { service, http } = setup(apiConfig({ globalSearch: true }));
      const items = service.tabItems('Modules');

      http
        .expectOne('https://api.github.com/search/repositories?page=1&per_page=2&q=fork:true+topic:module+sort:stars')
        .flush({ total_count: 0, items: [] });

      expect(items()).toEqual([]);
    });

    it('should download the pre-generated file once for all tabs', () => {
      const config = fileConfig();
      config.tabs = { ...config.tabs, Tools: { topic: 'tools', org: 'org', path: '/tools' } };
      const { service, http } = setup(config);
      const modules = service.tabItems('Modules');
      const tools = service.tabItems('Tools');

      http.expectOne(FILE_URL).flush({ organizations: { org: { module: [repo(1)], tools: [repo(2)] } } });

      expect(modules()?.map((item) => item.id)).toEqual([1]);
      expect(tools()?.map((item) => item.id)).toEqual([2]);
    });

    it('should reuse the signal of a tab instead of fetching again', () => {
      const { service, http } = setup(fileConfig());
      const first = service.tabItems('Modules');

      expect(service.tabItems('Modules')).toBe(first);

      http.expectOne(FILE_URL).flush({ organizations: {} });
    });

    it('should keep loading instead of throwing when every source fails', () => {
      spyOn(console, 'warn');
      spyOn(console, 'error');
      const { service, http } = setup(fileConfig());
      const items = service.tabItems('Modules');

      http.expectOne(FILE_URL).flush('nope', { status: 500, statusText: 'Server Error' });
      http
        .expectOne((request) => request.url.startsWith('https://api.github.com/search/repositories'))
        .flush('rate limited', { status: 403, statusText: 'Forbidden' });

      expect(items()).toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });

    it('should serve a fresh cache entry without any request', () => {
      localStorage.setItem('org-module', JSON.stringify({ timeDate: Date.now(), value: [repo(5)] }));
      const { service } = setup(fileConfig());

      expect(
        service
          .tabItems('Modules')()
          ?.map((item) => item.id),
      ).toEqual([5]);
    });

    it('should fetch again once the cache entry is older than 30 minutes', () => {
      localStorage.setItem('org-module', JSON.stringify({ timeDate: Date.now() - 31 * 60 * 1000, value: [repo(5)] }));
      const { service, http } = setup(fileConfig());
      const items = service.tabItems('Modules');

      http.expectOne(FILE_URL).flush({ organizations: { org: { module: [repo(6)] } } });

      expect(items()?.map((item) => item.id)).toEqual([6]);
    });
  });

  describe('getLocalRepo', () => {
    const readRepo = (service: CatalogueService, id: number) => {
      let result: Repository | undefined;
      service.getLocalRepo(id).subscribe((value) => (result = value));
      return () => result;
    };

    it('should serve a fresh cached repository without any request', () => {
      localStorage.setItem('repo-7', JSON.stringify({ timeDate: Date.now(), value: repo(7) }));
      const { service } = setup(apiConfig());

      expect(readRepo(service, 7)()?.id).toBe(7);
    });

    it('should fetch from the GitHub API by default and cache it', () => {
      const { service, http } = setup(apiConfig());
      const result = readRepo(service, 7);

      http.expectOne('https://api.github.com/repositories/7').flush(repo(7));

      expect(result()?.id).toBe(7);
      expect(JSON.parse(localStorage.getItem('repo-7') as string).value.id).toBe(7);
    });

    it('should find the repository in a cached tab list without any request', () => {
      localStorage.setItem('org-module', JSON.stringify({ timeDate: Date.now(), value: [repo(7)] }));
      const { service } = setup(fileConfig());

      expect(readRepo(service, 7)()?.id).toBe(7);
    });

    it('should search the pre-generated file and fill in missing fields', () => {
      const { service, http } = setup(fileConfig());
      const result = readRepo(service, 7);

      http.expectOne(FILE_URL).flush({ organizations: { org: { module: [repo(7, { updated_at: '2024-01-01T00:00:00Z' })] } } });

      expect(result()?.owner.login).toBe('org');
      expect(result()?.default_branch).toBe('master');
      expect(result()?.subscribers_count).toBe(0);
      expect(result()?.stargazers_count).toBe(0);
      expect(result()?.forks_count).toBe(0);
      expect(result()?.pushed_at).toBe('2024-01-01T00:00:00Z');
    });

    it('should fall back to the GitHub API when the pre-generated file lacks the repository', () => {
      const { service, http } = setup(fileConfig());
      const result = readRepo(service, 7);

      http.expectOne(FILE_URL).flush({ organizations: {} });
      http.expectOne('https://api.github.com/repositories/7').flush(repo(7));

      expect(result()?.id).toBe(7);
    });
  });

  describe('getReadme', () => {
    const readReadme = (service: CatalogueService) => {
      let readme: string | undefined;
      service.getReadme(repo(1, { default_branch: 'main' })).subscribe((value) => (readme = value));
      return () => readme;
    };
    const isReadme = (path: string) => (request: { url: string }) =>
      request.url.startsWith(`https://raw.githubusercontent.com/org/repo-1/main/${path}`);

    it('should read the README of the default branch', () => {
      const { service, http } = setup(apiConfig());
      const readme = readReadme(service);

      http.expectOne(isReadme('README.md')).flush('# hello');

      expect(readme()).toBe('# hello');
    });

    it('should try .github/README.md when the root README is missing', () => {
      const { service, http } = setup(apiConfig());
      const readme = readReadme(service);

      http.expectOne(isReadme('README.md')).flush('', { status: 404, statusText: 'Not Found' });
      http.expectOne(isReadme('.github/README.md')).flush('# nested');

      expect(readme()).toBe('# nested');
    });

    it('should report a missing README when neither file exists', () => {
      const { service, http } = setup(apiConfig());
      const readme = readReadme(service);

      http.expectOne(isReadme('README.md')).flush('', { status: 404, statusText: 'Not Found' });
      http.expectOne(isReadme('.github/README.md')).flush('', { status: 404, statusText: 'Not Found' });

      expect(readme()).toBe('No README found');
    });
  });
});
