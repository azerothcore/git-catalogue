import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatPaginator } from '@angular/material/paginator';
import { MatTabGroup } from '@angular/material/tabs';
import { By } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Repository } from 'src/@types';
import { Config } from '../services/catalogue/catalogue.model';
import { CatalogueService } from '../services/catalogue/catalogue.service';
import { HomeComponent } from './home.component';

const PAGE_KEY = 'azerothcore.catalogue.page';
const SORT_KEY = 'azerothcore.catalogue.sort';
const SEARCH_KEY = 'azerothcore.catalogue.search';
const RETURN_URL_KEY = 'azerothcore.catalogue.returnUrl';

describe('HomeComponent', () => {
  const repo = (id: number, stars: number, extra: Partial<Repository> = {}) =>
    ({
      id,
      name: `mod-${id}`,
      full_name: `org/mod-${id}`,
      stargazers_count: stars,
      created_at: '2020-01-01T00:00:00Z',
      topics: [],
      ...extra,
    }) as Repository;

  const MODULES = [
    repo(1, 100, { topics: ['lua', 'module'], language: 'Lua' }),
    repo(2, 50, { topics: ['module'], language: 'C++', created_at: '2024-01-01T00:00:00Z' }),
    repo(3, 10, { topics: ['module'], language: 'C++' }),
  ];
  const TOOLS = [repo(10, 1)];

  const CONFIG = {
    pageSize: 2,
    tabs: {
      Modules: { topic: 'module', org: 'org', path: '/module' },
      Tools: { topic: 'tools', org: 'org', path: '/tools' },
    },
  } as unknown as Config;

  let fixture: ComponentFixture<HomeComponent>;
  let element: HTMLElement;
  let modules: ReturnType<typeof signal<Repository[] | undefined>>;

  const configure = (routes: Parameters<typeof provideRouter>[0] = []) => {
    modules = signal<Repository[] | undefined>(MODULES);
    const items: Record<string, unknown> = { Modules: modules, Tools: signal(TOOLS) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideLocationMocks(),
        { provide: CatalogueService, useValue: { config: CONFIG, tabItems: (label: string) => items[label] } },
      ],
    });
  };

  const create = async () => {
    fixture = TestBed.createComponent(HomeComponent);
    element = fixture.nativeElement;
    await settle();
  };

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const rows = () => Array.from(element.querySelectorAll('.repo-row-name')).map((row) => row.textContent);
  const paginator = () => fixture.debugElement.query(By.directive(MatPaginator));
  const searchInput = () => element.querySelector('#search-input') as HTMLInputElement;
  const sortSelect = () => element.querySelector('#sort') as HTMLSelectElement;

  const type = async (value: string) => {
    searchInput().value = value;
    searchInput().dispatchEvent(new Event('input'));
    await settle();
  };
  const pick = async (select: HTMLSelectElement, value: string) => {
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await settle();
  };
  const goToPage = async (pageIndex: number) => {
    paginator().triggerEventHandler('page', { pageIndex });
    await settle();
  };
  const click = async (selector: string, text?: string) => {
    const target = Array.from(element.querySelectorAll<HTMLElement>(selector)).find(
      (candidate) => !text || candidate.textContent?.includes(text),
    );
    target?.click();
    await settle();
  };

  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  describe('results', () => {
    beforeEach(async () => {
      configure();
      await create();
    });

    it('should list the first page sorted by stars', () => {
      expect(rows()).toEqual(['mod-1', 'mod-2']);
      expect(element.querySelector('.results-count')?.textContent).toBe('3 repositories');
    });

    it('should show the next page', async () => {
      await goToPage(1);

      expect(rows()).toEqual(['mod-3']);
      expect(sessionStorage.getItem(PAGE_KEY)).toBe('1');
      expect(sessionStorage.getItem(RETURN_URL_KEY)).toBe('/home');
    });

    it('should show a loading state until the tab is loaded', async () => {
      modules.set(undefined);
      await settle();
      expect(element.querySelector('.skeleton-list')).not.toBeNull();

      modules.set(MODULES);
      await settle();
      expect(element.querySelector('.skeleton-list')).toBeNull();
      expect(rows()).toEqual(['mod-1', 'mod-2']);
    });
  });

  describe('sort', () => {
    beforeEach(async () => {
      configure();
      await create();
    });

    it('should apply and save the sort, and reset the page', async () => {
      await goToPage(1);

      await pick(sortSelect(), 'created');

      expect(rows()).toEqual(['mod-2', 'mod-1']);
      expect(paginator().componentInstance.pageIndex).toBe(0);
      expect(sessionStorage.getItem(SORT_KEY)).toBe('created');
      expect(sessionStorage.getItem(PAGE_KEY)).toBe('0');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      configure();
      await create();
    });

    it('should filter the results, save the search and reset the page', async () => {
      await goToPage(1);

      await type('mod-3');

      expect(rows()).toEqual(['mod-3']);
      expect(element.querySelector('.results-count')?.textContent).toBe('1 result for “mod-3”');
      expect(sessionStorage.getItem(SEARCH_KEY)).toBe('mod-3');
      expect(sessionStorage.getItem(PAGE_KEY)).toBe('0');
    });

    it('should clear the search with Escape and forget it', async () => {
      await type('mod-3');
      spyOn(searchInput(), 'focus');

      searchInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await settle();

      expect(searchInput().value).toBe('');
      expect(searchInput().focus).toHaveBeenCalled();
      expect(rows()).toEqual(['mod-1', 'mod-2']);
      expect(sessionStorage.getItem(SEARCH_KEY)).toBeNull();
    });

    it('should explain when nothing matches and offer a reset', async () => {
      await type('nothing');

      expect(element.querySelector('.empty-state p')?.textContent).toContain('Nothing matches “nothing”');
      expect(paginator()).toBeNull();

      await click('.empty-state button');

      expect(searchInput().value).toBe('');
      expect(rows()).toEqual(['mod-1', 'mod-2']);
    });

    it('should focus the search input when pressing /', () => {
      spyOn(searchInput(), 'focus');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));

      expect(searchInput().focus).toHaveBeenCalled();
    });

    it('should not steal / while typing in a field', () => {
      spyOn(searchInput(), 'focus');

      searchInput().dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));

      expect(searchInput().focus).not.toHaveBeenCalled();
    });
  });

  describe('filters', () => {
    beforeEach(async () => {
      configure();
      await create();
      await click('.filter-toggle');
    });

    it('should offer the topics and languages of the tab', () => {
      const chips = Array.from(element.querySelectorAll('.filter-panel .filter-chip')).map((chip) => chip.textContent?.trim());
      const languages = Array.from(element.querySelectorAll('#lang-filter option')).map((option) => option.textContent);

      expect(chips).toEqual(['module', 'lua']);
      expect(languages).toEqual(['All languages', 'C++', 'Lua']);
    });

    it('should filter by topic and count the active filter', async () => {
      await click('.filter-panel .filter-chip', 'lua');

      expect(rows()).toEqual(['mod-1']);
      expect(element.querySelector('.filter-badge')?.textContent).toBe('1');
    });

    it('should filter by language and minimum stars, and clear them all', async () => {
      await pick(element.querySelector('#lang-filter') as HTMLSelectElement, 'C++');
      expect(rows()).toEqual(['mod-2', 'mod-3']);

      await pick(element.querySelector('#stars-filter') as HTMLSelectElement, '50');
      expect(rows()).toEqual(['mod-2']);
      expect(element.querySelector('.filter-badge')?.textContent).toBe('2');

      await click('.clear-all');
      expect(rows()).toEqual(['mod-1', 'mod-2']);
      expect(element.querySelector('.filter-badge')).toBeNull();
    });
  });

  describe('session restore', () => {
    beforeEach(() => configure());

    it('should restore the page, the sort and the search', async () => {
      sessionStorage.setItem(PAGE_KEY, '1');
      sessionStorage.setItem(SORT_KEY, 'created');
      sessionStorage.setItem(SEARCH_KEY, 'mod');

      await create();

      expect(paginator().componentInstance.pageIndex).toBe(1);
      expect(sortSelect().value).toBe('created');
      expect(searchInput().value).toBe('mod');
    });

    it('should ignore an unknown sort and an invalid page', async () => {
      sessionStorage.setItem(PAGE_KEY, '-3');
      sessionStorage.setItem(SORT_KEY, 'whatever');

      await create();

      expect(paginator().componentInstance.pageIndex).toBe(0);
      expect(sortSelect().value).toBe('stars');
    });
  });

  describe('tabs', () => {
    const selectedTab = (root: HTMLElement) => root.querySelector('[role=tab][aria-selected=true]')?.textContent?.trim();

    it('should reset the page and update the URL when changing tabs', async () => {
      configure();
      await create();
      await goToPage(1);

      fixture.debugElement.query(By.directive(MatTabGroup)).triggerEventHandler('selectedTabChange', { index: 1 });
      await settle();

      expect(paginator().componentInstance.pageIndex).toBe(0);
      expect(sessionStorage.getItem(PAGE_KEY)).toBe('0');
      expect(sessionStorage.getItem(RETURN_URL_KEY)).toBe('/tab/tools');
      expect(TestBed.inject(Location).path()).toBe('/tab/tools');
    });

    it('should open the tab named in the URL', async () => {
      configure([{ path: 'tab/:tab', component: HomeComponent }]);

      const harness = await RouterTestingHarness.create('/tab/tools');

      expect(selectedTab(harness.routeNativeElement as HTMLElement)).toBe('Tools');
    });

    it('should open the first tab when the URL names an unknown one', async () => {
      configure([{ path: 'tab/:tab', component: HomeComponent }]);

      const harness = await RouterTestingHarness.create('/tab/unknown');

      expect(selectedTab(harness.routeNativeElement as HTMLElement)).toBe('Modules');
    });

    it('should follow the URL when the route param changes', async () => {
      configure([{ path: 'tab/:tab', component: HomeComponent }]);
      const harness = await RouterTestingHarness.create('/tab/tools');
      expect(selectedTab(harness.routeNativeElement as HTMLElement)).toBe('Tools');

      await harness.navigateByUrl('/tab/module');
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(selectedTab(harness.routeNativeElement as HTMLElement)).toBe('Modules');
    });
  });
});
