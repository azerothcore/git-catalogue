import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { APP_CONFIG } from '../services/config/config.token';
import { Config } from '../services/catalogue/catalogue.model';
import { Repository } from 'src/@types';

import { HomeComponent } from './home.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  const REPOS = [
    { name: 'popular', stargazers_count: 100, created_at: '2019-01-01T00:00:00Z', pushed_at: '2019-06-01T00:00:00Z' },
    { name: 'recently-pushed', stargazers_count: 10, created_at: '2020-01-01T00:00:00Z', pushed_at: '2024-06-01T00:00:00Z' },
    { name: 'newest', stargazers_count: 1, created_at: '2023-01-01T00:00:00Z', pushed_at: '2023-06-01T00:00:00Z' },
  ] as unknown as Repository[];

  const SEARCH_REPOS = [
    {
      name: 'mod-eluna',
      description: 'Lua engine for AzerothCore',
      topics: ['azerothcore-lua'],
      language: 'C++',
      owner: { login: 'azerothcore' },
      stargazers_count: 5,
      created_at: '2020-01-01T00:00:00Z',
      pushed_at: '2020-01-01T00:00:00Z',
    },
    {
      name: 'mod-transmog',
      description: 'Transmogrification module',
      topics: ['azerothcore-module'],
      language: 'C++',
      owner: { login: 'azerothcore' },
      stargazers_count: 50,
      created_at: '2020-01-01T00:00:00Z',
      pushed_at: '2020-01-01T00:00:00Z',
    },
    {
      name: 'Rápido',
      description: 'Accents test',
      topics: [],
      language: 'Lua',
      owner: { login: 'someone' },
      stargazers_count: 1,
      created_at: '2020-01-01T00:00:00Z',
      pushed_at: '2020-01-01T00:00:00Z',
    },
  ] as unknown as Repository[];

  beforeEach(async () => {
    const MOCK_CONFIG: Config = {
      page: 0,
      perPage: 10,
      pageSize: 8,
      globalSearch: true,
      tabs: {
        Test: { topic: '', org: '', path: '/test', globalSearch: true },
      },
      usePreGeneratedFile: false,
    };
    await TestBed.configureTestingModule({
    declarations: [HomeComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [RouterTestingModule,
        FontAwesomeModule,
        MatTabsModule,
        MatPaginatorModule,
        BrowserAnimationsModule,
        FormsModule],
    providers: [
        { provide: APP_CONFIG, useValue: MOCK_CONFIG },
        {
            provide: ActivatedRoute,
            useValue: {
                snapshot: {
                    paramMap: {
                        get: () => null
                    }
                }
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
}).compileComponents();
  });

  beforeEach(() => {
    sessionStorage.clear();
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should restore the current page from session storage', () => {
    sessionStorage.setItem('azerothcore.catalogue.page', '2');

    const restoredFixture = TestBed.createComponent(HomeComponent);

    expect(restoredFixture.componentInstance.page).toBe(2);
    restoredFixture.destroy();
  });

  it('should save the current page and route when pagination changes', () => {
    component.onPageChange({ pageIndex: 2 } as PageEvent);

    expect(sessionStorage.getItem('azerothcore.catalogue.page')).toBe('2');
    expect(sessionStorage.getItem('azerothcore.catalogue.returnHash')).toBe('#/home');
  });

  it('should sort by stars by default', () => {
    const items = component.currentPageItems(REPOS);

    expect(items.map((item) => item.name)).toEqual(['popular', 'recently-pushed', 'newest']);
  });

  it('should sort by last push when picking the updated sort', () => {
    component.sort = 'updated';

    const items = component.currentPageItems(REPOS);

    expect(items.map((item) => item.name)).toEqual(['recently-pushed', 'newest', 'popular']);
  });

  it('should sort by creation date when picking the created sort', () => {
    component.sort = 'created';

    const items = component.currentPageItems(REPOS);

    expect(items.map((item) => item.name)).toEqual(['newest', 'recently-pushed', 'popular']);
  });

  it('should save the sort and reset the page when the sort changes', () => {
    component.page = 2;
    component.sort = 'updated';

    component.onSortChange('updated');

    expect(component.page).toBe(0);
    expect(sessionStorage.getItem('azerothcore.catalogue.sort')).toBe('updated');
  });

  it('should restore the sort from session storage', () => {
    sessionStorage.setItem('azerothcore.catalogue.sort', 'created');

    const restoredFixture = TestBed.createComponent(HomeComponent);

    expect(restoredFixture.componentInstance.sort).toBe('created');
    restoredFixture.destroy();
  });

  it('should fall back to the star sort when session storage holds an unknown sort', () => {
    sessionStorage.setItem('azerothcore.catalogue.sort', 'whatever');

    const restoredFixture = TestBed.createComponent(HomeComponent);

    expect(restoredFixture.componentInstance.sort).toBe('stars');
    restoredFixture.destroy();
  });

  it('should reset the page when changing tabs', () => {
    component.page = 2;

    component.onTabChange({ index: 0 } as MatTabChangeEvent);

    expect(component.page).toBe(0);
    expect(sessionStorage.getItem('azerothcore.catalogue.page')).toBe('0');
    expect(sessionStorage.getItem('azerothcore.catalogue.returnHash')).toBe('#/tab/test');
  });

  it('should match repositories by name, description, topic, language or author', () => {
    component.search = 'transmogrification';
    expect(component.filteredLength(SEARCH_REPOS)).toBe(1);

    component.search = 'azerothcore-lua';
    expect(component.filteredLength(SEARCH_REPOS)).toBe(1);

    component.search = 'C++';
    expect(component.filteredLength(SEARCH_REPOS)).toBe(2);

    component.search = 'someone';
    expect(component.filteredLength(SEARCH_REPOS)).toBe(1);
  });

  it('should require every search term to match', () => {
    component.search = 'module azerothcore';
    expect(component.filteredLength(SEARCH_REPOS)).toBe(1);

    component.search = 'eluna module';
    expect(component.filteredLength(SEARCH_REPOS)).toBe(0);
  });

  it('should ignore case and accents when searching', () => {
    component.search = 'ELUNA';
    expect(component.filteredLength(SEARCH_REPOS)).toBe(1);

    component.search = 'rapido';
    expect(component.filteredLength(SEARCH_REPOS)).toBe(1);
  });

  it('should report how many results match', () => {
    component.search = 'eluna';
    expect(component.searchStatus(1)).toBe('1 result for “eluna”');

    component.search = 'nothing';
    expect(component.searchStatus(0)).toBe('No results for “nothing”');
  });

  it('should save the search and reset the page when the query changes', () => {
    component.page = 2;

    component.onSearchChange('eluna');

    expect(component.page).toBe(0);
    expect(sessionStorage.getItem('azerothcore.catalogue.search')).toBe('eluna');
  });

  it('should clear the search and forget it', () => {
    component.search = 'eluna';
    component.page = 2;
    sessionStorage.setItem('azerothcore.catalogue.search', 'eluna');

    component.clearSearch();

    expect(component.search).toBe('');
    expect(component.page).toBe(0);
    expect(sessionStorage.getItem('azerothcore.catalogue.search')).toBeNull();
  });

  it('should restore the search from session storage', () => {
    sessionStorage.setItem('azerothcore.catalogue.search', 'eluna');

    const restoredFixture = TestBed.createComponent(HomeComponent);

    expect(restoredFixture.componentInstance.search).toBe('eluna');
    restoredFixture.destroy();
  });

  it('should focus the search input when pressing /', () => {
    const input = fixture.nativeElement.querySelector('#search-input') as HTMLInputElement;
    spyOn(input, 'focus');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));

    expect(input.focus).toHaveBeenCalled();
  });
});
