import { Location } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { faSearch, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Repository } from 'src/@types';
import { CatalogueService } from '../services/catalogue/catalogue.service';

const PAGE_STORAGE_KEY = 'azerothcore.catalogue.page';
const RETURN_HASH_STORAGE_KEY = 'azerothcore.catalogue.returnHash';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: false
})
export class HomeComponent {
  constructor(public catalogueService: CatalogueService, public cdRef: ChangeDetectorRef, private location: Location) {
    window.parent.document.title = 'GitCatalogue';
    this.saveRoute();
  }

  page = this.readPage();
  search: string;
  readonly faSearch: IconDefinition = faSearch;

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
    let filteredItems = modules;
    if (!!this.search) {
      filteredItems = filteredItems.filter((item) => item.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1);
    }
    return filteredItems.slice(this.catalogueService.CONF.pageSize * this.page, this.catalogueService.CONF.pageSize * (this.page + 1));
  }

  filteredLength(modules: Repository[]): number {
    if (!this.search) {
      return modules.length;
    }
    return modules.filter((item) => item.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1).length;
  }
}
