import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { faFilter, faSearch, faSortAmountDown, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Repository } from 'src/@types';
import { CatalogueService } from '../services/catalogue/catalogue.service';

const PAGE_STORAGE_KEY = 'azerothcore.catalogue.page';
const RETURN_HASH_STORAGE_KEY = 'azerothcore.catalogue.returnHash';
const SORT_STORAGE_KEY = 'azerothcore.catalogue.sort';
const SEARCH_STORAGE_KEY = 'azerothcore.catalogue.search';

type ParsedQuery = {
  text: string[];
  topic?: string;
  lang?: string;
  owner?: string;
  minStars?: number;
};

export type SortKey = 'stars' | 'updated' | 'created';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'stars', label: 'Most stars' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'created', label: 'Recently added' },
];

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  constructor(public catalogueService: CatalogueService, public cdRef: ChangeDetectorRef, private location: Location) {
    window.parent.document.title = 'GitCatalogue';
    this.saveRoute();
  }

  page = this.readPage();
  sort: SortKey = this.readSort();
  search = this.readSearch();
  readonly faSearch: IconDefinition = faSearch;
  readonly faFilter: IconDefinition = faFilter;
  readonly faSortAmountDown: IconDefinition = faSortAmountDown;
  readonly sortOptions = SORT_OPTIONS;
  readonly starOptions = [0, 10, 50, 100, 500];
  readonly skeletonRows = [0, 1, 2, 3, 4, 5];

  filtersOpen = false;
  selectedTopics: string[] = [];
  selectedLanguage = '';
  minStars = 0;

  private facetCache = new WeakMap<Repository[], { topics: string[]; languages: string[] }>();

  readPage(): number {
    try {
      const page = parseInt(sessionStorage.getItem(PAGE_STORAGE_KEY) || '0', 10);
      return isNaN(page) || page < 0 ? 0 : page;
    } catch (error) {
      return 0;
    }
  }

  savePage(): void {
    try {
      sessionStorage.setItem(PAGE_STORAGE_KEY, String(this.page));
    } catch (error) {}
  }

  readSort(): SortKey {
    try {
      const sort = sessionStorage.getItem(SORT_STORAGE_KEY) as SortKey;
      return SORT_OPTIONS.some((option) => option.key === sort) ? sort : 'stars';
    } catch (error) {
      return 'stars';
    }
  }

  saveSort(): void {
    try {
      sessionStorage.setItem(SORT_STORAGE_KEY, this.sort);
    } catch (error) {}
  }

  readSearch(): string {
    try {
      return sessionStorage.getItem(SEARCH_STORAGE_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  private writeSearch(value: string): void {
    try {
      if (value) {
        sessionStorage.setItem(SEARCH_STORAGE_KEY, value);
      } else {
        sessionStorage.removeItem(SEARCH_STORAGE_KEY);
      }
    } catch (error) {}
  }

  saveRoute(path?: string): void {
    try {
      const route = path || this.location.path() || '/home';
      sessionStorage.setItem(RETURN_HASH_STORAGE_KEY, `#${route}`);
    } catch (error) {}
  }

  resetPage(): void {
    this.page = 0;
    this.savePage();
    this.saveRoute();
    this.refresh();
  }

  refresh(): void {
    this.cdRef.detectChanges();
  }

  onSearchChange(value: string): void {
    this.writeSearch(value);
    this.resetPage();
  }

  clearSearch(): void {
    if (!this.search) {
      return;
    }
    this.search = '';
    this.writeSearch('');
    this.resetPage();
    this.searchInput?.nativeElement.focus();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const isTyping =
      !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
    if (isTyping) {
      return;
    }

    event.preventDefault();
    this.searchInput?.nativeElement.focus();
  }

  onSortChange(value: SortKey): void {
    this.saveSort();
    this.resetPage();
  }

  onPageChange(page: PageEvent): void {
    this.page = page.pageIndex;
    this.savePage();
    this.saveRoute();
  }

  onTabChange(tab: MatTabChangeEvent): void {
    const index = tab.index;
    const tabName = Object.keys(this.catalogueService.CONF.tabs)[index];
    const path = `/tab${this.catalogueService.CONF.tabs[tabName].path}`;

    this.page = 0;
    this.savePage();
    this.saveRoute(path);

    if (this.location.path() !== path) {
      this.location.go(path);
    }
  }

  currentPageItems(modules: Repository[]): Repository[] {
    const items = this.sortItems(this.matchingItems(modules));
    return items.slice(this.catalogueService.CONF.pageSize * this.page, this.catalogueService.CONF.pageSize * (this.page + 1));
  }

  filteredLength(modules: Repository[]): number {
    return this.matchingItems(modules).length;
  }

  searchStatus(count: number): string {
    const query = this.search.trim();
    if (count === 0) {
      return `No results for “${query}”`;
    }
    return `${count} ${count === 1 ? 'result' : 'results'} for “${query}”`;
  }

  repositoryCount(count: number): string {
    return `${count} ${count === 1 ? 'repository' : 'repositories'}`;
  }

  get activeFilterCount(): number {
    return this.selectedTopics.length + (this.selectedLanguage ? 1 : 0) + (this.minStars > 0 ? 1 : 0);
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  isTopicSelected(topic: string): boolean {
    return this.selectedTopics.includes(topic);
  }

  toggleTopic(topic: string): void {
    this.selectedTopics = this.isTopicSelected(topic)
      ? this.selectedTopics.filter((selected) => selected !== topic)
      : [...this.selectedTopics, topic];
    this.resetPage();
  }

  onLanguageChange(value: string): void {
    this.selectedLanguage = value;
    this.resetPage();
  }

  onMinStarsChange(value: string): void {
    this.minStars = Number(value) || 0;
    this.resetPage();
  }

  clearFilters(): void {
    this.selectedTopics = [];
    this.selectedLanguage = '';
    this.minStars = 0;
    this.resetPage();
  }

  clearAll(): void {
    this.search = '';
    this.writeSearch('');
    this.selectedTopics = [];
    this.selectedLanguage = '';
    this.minStars = 0;
    this.resetPage();
    this.searchInput?.nativeElement.focus();
  }

  enterDelay(index: number): number {
    // Rows fade in pairs, so the list feels like it arrives in small batches.
    return Math.floor(index / 2) * 90;
  }

  topTopics(items: Repository[]): string[] {
    return this.facets(items).topics.slice(0, 14);
  }

  languages(items: Repository[]): string[] {
    return this.facets(items).languages;
  }

  private facets(items: Repository[]): { topics: string[]; languages: string[] } {
    let facets = this.facetCache.get(items);
    if (!facets) {
      const counts = new Map<string, number>();
      const languages = new Set<string>();
      for (const item of items) {
        for (const topic of item.topics || []) {
          counts.set(topic, (counts.get(topic) ?? 0) + 1);
        }
        if (item.language) {
          languages.add(item.language);
        }
      }
      facets = {
        topics: [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([topic]) => topic),
        languages: [...languages].sort((a, b) => a.localeCompare(b)),
      };
      this.facetCache.set(items, facets);
    }
    return facets;
  }

  private matchingItems(modules: Repository[]): Repository[] {
    const query = this.parsedQuery;
    const hasQuery = query.text.length > 0 || !!query.topic || !!query.lang || !!query.owner || (query.minStars ?? 0) > 0;
    if (!hasQuery && this.activeFilterCount === 0) {
      return modules;
    }
    return modules.filter((item) => this.matches(item, query));
  }

  private matches(item: Repository, query: ParsedQuery): boolean {
    if (!query.text.every((term) => this.searchableText(item).includes(term))) {
      return false;
    }
    if (query.topic && !(item.topics || []).some((topic) => this.normalize(topic) === query.topic)) {
      return false;
    }
    if (query.lang && this.normalize(item.language || '') !== query.lang) {
      return false;
    }
    if (query.owner && this.normalize(item.owner?.login || '') !== query.owner) {
      return false;
    }
    if ((query.minStars ?? 0) > 0 && (item.stargazers_count || 0) < query.minStars) {
      return false;
    }
    if (this.selectedTopics.length > 0 && !this.selectedTopics.every((topic) => (item.topics || []).includes(topic))) {
      return false;
    }
    if (this.selectedLanguage && item.language !== this.selectedLanguage) {
      return false;
    }
    if (this.minStars > 0 && (item.stargazers_count || 0) < this.minStars) {
      return false;
    }
    return true;
  }

  private get parsedQuery(): ParsedQuery {
    const parsed: ParsedQuery = { text: [] };
    const raw = (this.search || '').trim();
    if (!raw) {
      return parsed;
    }

    for (const token of raw.split(/\s+/)) {
      const match = token.match(/^(topic|lang|language|owner|stars):(.+)$/i);
      if (!match) {
        parsed.text.push(this.normalize(token));
        continue;
      }

      const key = match[1].toLowerCase();
      const value = match[2];
      if (key === 'topic') {
        parsed.topic = this.normalize(value);
      } else if (key === 'lang' || key === 'language') {
        parsed.lang = this.normalize(value);
      } else if (key === 'owner') {
        parsed.owner = this.normalize(value);
      } else {
        parsed.minStars = parseInt(value.replace(/^[<>]=?/, ''), 10) || 0;
      }
    }

    return parsed;
  }

  private searchableText(item: Repository): string {
    return this.normalize(
      [item.name, item.full_name, item.description, item.language, item.owner?.login, ...(item.topics || [])]
        .filter(Boolean)
        .join(' '),
    );
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private sortItems(modules: Repository[]): Repository[] {
    if (this.sort === 'stars') {
      return [...modules].sort((a, b) => b.stargazers_count - a.stargazers_count);
    }

    // pushed_at tracks the last commit, unlike updated_at which also moves on metadata changes
    const dateOf = (item: Repository) => (this.sort === 'updated' ? item.pushed_at : item.created_at);
    return [...modules].sort((a, b) => this.time(dateOf(b)) - this.time(dateOf(a)));
  }

  private time(date: Date | string): number {
    const time = date ? new Date(date).getTime() : 0;
    return isNaN(time) ? 0 : time;
  }
}
