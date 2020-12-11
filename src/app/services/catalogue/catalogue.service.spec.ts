import { TestBed } from '@angular/core/testing';

import { CatalogueService } from './catalogue.service';

describe('CatalogueService', () => {
  let service: CatalogueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
