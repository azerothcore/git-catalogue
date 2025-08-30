import { Location } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { faSearch, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Repository } from 'src/@types';
import { CatalogueService } from '../services/catalogue/catalogue.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(public catalogueService: CatalogueService, public cdRef: ChangeDetectorRef, private location: Location) {
    window.parent.document.title = 'GitCatalogue';
  }

  page = 0;
  search: string;
  readonly faSearch: IconDefinition = faSearch;

  refresh(): void {
    this.cdRef.detectChanges();
  }

  onSearchChange(value: string): void {
    // Ensure we reset to the first page when the search term changes
    this.page = 0;
    this.refresh();
  }

  onPageChange(page: PageEvent): void {
    this.page = page.pageIndex;
  }

  onTabChange(tab: MatTabChangeEvent): void {
    const index = tab.index;
    const tabName = Object.keys(this.catalogueService.CONF.tabs)[index];
    const path = `/tab${this.catalogueService.CONF.tabs[tabName].path}`;

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
