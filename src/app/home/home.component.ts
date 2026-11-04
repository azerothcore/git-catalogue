import { Location, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  Signal,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTab, MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFilter, faSearch, faSortAmountDown } from '@fortawesome/free-solid-svg-icons';
import { Repository } from 'src/@types';
import { RepoComponent } from '../repo/repo.component';
import { CatalogueService } from '../services/catalogue/catalogue.service';
import { readSessionItem, RETURN_URL_STORAGE_KEY, writeSessionItem } from '../services/storage/session-storage';
import {
  collectFacets,
  matchesFilters,
  parseQuery,
  RepoFilters,
  resultsLabel,
  SORT_OPTIONS,
  sortRepositories,
  SortKey,
} from './catalogue-filter';

const PAGE_STORAGE_KEY = 'azerothcore.catalogue.page';
const SORT_STORAGE_KEY = 'azerothcore.catalogue.sort';
const SEARCH_STORAGE_KEY = 'azerothcore.catalogue.search';
const TOP_TOPICS_COUNT = 14;

type CatalogueTab = {
  label: string;
  items: Signal<Repository[] | undefined>;
  topics: Signal<string[]>;
  languages: Signal<string[]>;
  matching: Signal<Repository[]>;
  pageItems: Signal<Repository[]>;
  resultsLabel: Signal<string>;
};

function readPage(): number {
  const page = parseInt(readSessionItem(PAGE_STORAGE_KEY) ?? '0', 10);
  return isNaN(page) || page < 0 ? 0 : page;
}

function readSort(): SortKey {
  const stored = readSessionItem(SORT_STORAGE_KEY);
  return SORT_OPTIONS.find((option) => option.key === stored)?.key ?? 'stars';
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [FaIconComponent, FormsModule, MatPaginator, MatTab, MatTabGroup, NgTemplateOutlet, RepoComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onDocumentKeydown($event)' },
})
export class HomeComponent {
  private readonly catalogueService = inject(CatalogueService);
  private readonly location = inject(Location);
  private readonly config = this.catalogueService.config;

  /** `:tab` route parameter */
  readonly tab = input<string>();

  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly faSearch = faSearch;
  protected readonly faFilter = faFilter;
  protected readonly faSortAmountDown = faSortAmountDown;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly starOptions = [0, 10, 50, 100, 500];
  protected readonly skeletonRows = [0, 1, 2, 3, 4, 5];
  protected readonly pageSize = this.config.pageSize;

  protected readonly page = signal(readPage());
  protected readonly sort = signal(readSort());
  protected readonly search = signal(readSessionItem(SEARCH_STORAGE_KEY) ?? '');
  protected readonly filtersOpen = signal(false);
  protected readonly selectedTopics = signal<string[]>([]);
  protected readonly selectedLanguage = signal('');
  protected readonly minStars = signal(0);

  // an unknown or missing tab falls back to the first one
  protected readonly selectedTabIndex = linkedSignal(() =>
    Math.max(
      Object.values(this.config.tabs).findIndex((tab) => tab.path === `/${this.tab()}`),
      0,
    ),
  );

  protected readonly activeFilterCount = computed(
    () => this.selectedTopics().length + (this.selectedLanguage() ? 1 : 0) + (this.minStars() > 0 ? 1 : 0),
  );
  protected readonly hasCriteria = computed(() => !!this.search() || this.activeFilterCount() > 0);

  private readonly repoFilters = computed<RepoFilters>(() => ({
    query: parseQuery(this.search()),
    topics: this.selectedTopics(),
    language: this.selectedLanguage(),
    minStars: this.minStars(),
  }));

  protected readonly tabs = Object.keys(this.config.tabs).map((label) => this.createTab(label));

  constructor() {
    window.parent.document.title = 'GitCatalogue';
    this.saveRoute();

    effect(() => writeSessionItem(PAGE_STORAGE_KEY, String(this.page())));
    effect(() => writeSessionItem(SORT_STORAGE_KEY, this.sort()));
    effect(() => writeSessionItem(SEARCH_STORAGE_KEY, this.search() || null));
  }

  protected resetPage(): void {
    this.page.set(0);
    this.saveRoute();
  }

  protected clearSearch(): void {
    if (!this.search()) {
      return;
    }
    this.search.set('');
    this.resetPage();
    this.focusSearch();
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
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
    this.focusSearch();
  }

  protected onPageChange(page: PageEvent): void {
    this.page.set(page.pageIndex);
    this.saveRoute();
  }

  protected onTabChange({ index }: MatTabChangeEvent): void {
    const path = `/tab${Object.values(this.config.tabs)[index].path}`;

    this.page.set(0);
    this.saveRoute(path);

    if (this.location.path() !== path) {
      this.location.go(path);
    }
  }

  protected isTopicSelected(topic: string): boolean {
    return this.selectedTopics().includes(topic);
  }

  protected toggleTopic(topic: string): void {
    this.selectedTopics.update((topics) => (topics.includes(topic) ? topics.filter((selected) => selected !== topic) : [...topics, topic]));
    this.resetPage();
  }

  protected onLanguageChange(language: string): void {
    this.selectedLanguage.set(language);
    this.resetPage();
  }

  protected onMinStarsChange(stars: string): void {
    this.minStars.set(Number(stars) || 0);
    this.resetPage();
  }

  protected clearFilters(): void {
    this.selectedTopics.set([]);
    this.selectedLanguage.set('');
    this.minStars.set(0);
    this.resetPage();
  }

  protected clearAll(): void {
    this.search.set('');
    this.clearFilters();
    this.focusSearch();
  }

  protected enterDelay(index: number): number {
    // Rows fade in pairs, so the list feels like it arrives in small batches.
    return Math.floor(index / 2) * 90;
  }

  private createTab(label: string): CatalogueTab {
    const items = this.catalogueService.tabItems(label);
    const facets = computed(() => collectFacets(items() ?? []));
    const matching = computed(() => (items() ?? []).filter((item) => matchesFilters(item, this.repoFilters())));
    const sorted = computed(() => sortRepositories(matching(), this.sort()));

    return {
      label,
      items,
      topics: computed(() => facets().topics.slice(0, TOP_TOPICS_COUNT)),
      languages: computed(() => facets().languages),
      matching,
      pageItems: computed(() => sorted().slice(this.pageSize * this.page(), this.pageSize * (this.page() + 1))),
      resultsLabel: computed(() => resultsLabel(matching().length, this.search())),
    };
  }

  private focusSearch(): void {
    this.searchInput().nativeElement.focus();
  }

  private saveRoute(path?: string): void {
    writeSessionItem(RETURN_URL_STORAGE_KEY, path || this.location.path() || '/home');
  }
}
