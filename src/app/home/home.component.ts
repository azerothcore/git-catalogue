import { ChangeDetectorRef, Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { faSearch, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { CatalogueService } from '../services/catalogue/catalogue.service';
import { Repository } from 'src/@types';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(public catalogueService: CatalogueService, public cdRef: ChangeDetectorRef) {}

  page = 0;
  search: string;
  readonly faSearch: IconDefinition = faSearch;

  refresh(): void {
    this.cdRef.detectChanges();
  }

  onPageChange(page: PageEvent): void {
    this.page = page.pageIndex;
  }

  currentPageItems(modules: { items: Repository[] }): Repository[] {
    let filteredItems = modules.items;
    if (!!this.search) {
      filteredItems = filteredItems.filter((item) => item.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1);
    }
    return filteredItems.slice(this.catalogueService.CONF.pageSize * this.page, this.catalogueService.CONF.pageSize * (this.page + 1));
  }
}
