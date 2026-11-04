import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Injector, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { defer, EMPTY, Observable, of } from 'rxjs';
import { catchError, expand, map, reduce, shareReplay, tap } from 'rxjs/operators';
import { Organization, RepositoriesPage, Repository } from 'src/@types';
import { APP_CONFIG } from '../config/config.token';
import { Tab } from './catalogue.model';

const CACHE_TTL_MS = 30 * 60 * 1000;
const DEFAULT_PRE_GENERATED_FILE_URL = 'data/catalogue.json';

type PreGeneratedCatalogue = {
  organizations?: Record<string, Record<string, Repository[]>>;
};

function tabCacheKey({ org = 'default-org', topic = '' }: Tab): string {
  return `${org}-${topic}`;
}

// the pre-generated file doesn't always carry these fields, and the templates rely on them
function normalizeRepo(repo: Repository): Repository {
  const now = new Date().toISOString();
  const ownerLogin = repo.full_name?.includes('/') ? repo.full_name.split('/')[0] : '';

  return {
    ...repo,
    owner: repo.owner ?? ({ login: ownerLogin } as Organization),
    subscribers_count: repo.subscribers_count ?? 0,
    stargazers_count: repo.stargazers_count ?? 0,
    forks_count: repo.forks_count ?? 0,
    created_at: repo.created_at || now,
    pushed_at: repo.pushed_at || repo.updated_at || now,
    default_branch: repo.default_branch || 'master',
  };
}

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  readonly config = inject(APP_CONFIG);

  private readonly tabItemsByName = new Map<string, Signal<Repository[] | undefined>>();

  // every tab reads the same file, so one download is enough
  private readonly preGeneratedFile$ = defer(() =>
    this.http.get<PreGeneratedCatalogue>(this.config.preGeneratedFileUrl || DEFAULT_PRE_GENERATED_FILE_URL),
  ).pipe(shareReplay(1));

  /** Repositories of a tab, undefined until loaded. The first call starts the fetch. */
  tabItems(tabName: string): Signal<Repository[] | undefined> {
    let items = this.tabItemsByName.get(tabName);
    if (!items) {
      const items$ = this.loadTab(this.config.tabs[tabName]).pipe(
        // toSignal would rethrow the error on every read and break the whole template
        catchError((error) => {
          console.error(error);
          return EMPTY;
        }),
      );
      items = toSignal(items$, { injector: this.injector });
      this.tabItemsByName.set(tabName, items);
    }
    return items;
  }

  getLocalRepo(id: number): Observable<Repository> {
    const key = `repo-${id}`;
    const cached = this.readCache<Repository>(key);
    if (cached) {
      return of(cached);
    }

    const repo$ = this.config.usePreGeneratedFile
      ? this.findPreGeneratedRepo(id).pipe(
          map(normalizeRepo),
          catchError(() => this.fetchRepo(id)),
        )
      : this.fetchRepo(id);

    return repo$.pipe(tap((repo) => this.writeCache(key, repo)));
  }

  getReadme(repo: Repository): Observable<string> {
    const fetchFile = (path: string) =>
      this.http.get(`https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${path}?time=${Date.now()}`, {
        responseType: 'text',
      });

    return fetchFile('README.md').pipe(
      catchError(() => fetchFile('.github/README.md')),
      catchError(() => of('No README found')),
    );
  }

  private loadTab(tab: Tab): Observable<Repository[]> {
    const key = tabCacheKey(tab);
    const cached = this.readCache<Repository[]>(key);
    if (cached) {
      return of(cached);
    }

    const repos$ = this.config.usePreGeneratedFile ? this.loadTabFromFile(tab) : this.searchRepos(tab);
    return repos$.pipe(tap((repos) => this.writeCache(key, repos)));
  }

  private loadTabFromFile(tab: Tab): Observable<Repository[]> {
    const { org = 'default-org', topic = '' } = tab;

    return this.preGeneratedFile$.pipe(
      map((file) => file.organizations?.[org]?.[topic] ?? []),
      catchError((error) => {
        console.warn('Failed to fetch from pre-generated file, falling back to API', error);
        return this.searchRepos(tab);
      }),
    );
  }

  private searchRepos(tab: Tab): Observable<Repository[]> {
    const { org = 'default-org', topic } = tab;
    const { perPage, globalSearch } = this.config;
    const orgFilter = (tab.globalSearch ?? globalSearch ?? false) || !org ? '' : `org:${org}+`;
    const topicFilter = topic ? `+topic:${topic}` : '';

    const fetchPage = (page: number) =>
      this.http.get<RepositoriesPage>(
        `https://api.github.com/search/repositories?page=${page}&per_page=${perPage}&q=${orgFilter}fork:true${topicFilter}+sort:stars`,
      );

    return fetchPage(1).pipe(
      expand((result, index) => (perPage * (index + 1) < result.total_count ? fetchPage(index + 2) : EMPTY)),
      reduce((repos, result) => repos.concat(result.items), [] as Repository[]),
    );
  }

  private fetchRepo(id: number): Observable<Repository> {
    return this.http.get<Repository>(`https://api.github.com/repositories/${id}`);
  }

  private findPreGeneratedRepo(id: number): Observable<Repository> {
    const listed = this.findInCachedTabs(id);
    if (listed) {
      return of(listed);
    }

    return this.preGeneratedFile$.pipe(
      map((file) => {
        const repos = Object.values(file.organizations ?? {}).flatMap((topics) => Object.values(topics ?? {}).flat());
        const repo = repos.find((candidate) => candidate?.id === id);
        if (!repo) {
          throw new Error('Repo not found in pre-generated data');
        }
        return repo;
      }),
    );
  }

  private findInCachedTabs(id: number): Repository | undefined {
    for (const tab of Object.values(this.config.tabs)) {
      const match = this.readCache<Repository[]>(tabCacheKey(tab))?.find((repo) => repo?.id === id);
      if (match) {
        return match;
      }
    }
    return undefined;
  }

  private readCache<T>(key: string): T | null {
    const entry = localStorage.getItem(key);
    if (!entry) {
      return null;
    }

    const { timeDate, value } = JSON.parse(entry);
    return Math.abs(Date.now() - timeDate) > CACHE_TTL_MS ? null : value;
  }

  private writeCache(key: string, value: Repository | Repository[]): void {
    localStorage.setItem(key, JSON.stringify({ timeDate: Date.now(), value }));
  }
}
