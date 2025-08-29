import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { RepoDetailsResolverService } from './repo-details-resolver.service';

describe('RepoDetailsResolverService', () => {
  let service: RepoDetailsResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null
              }
            }
          }
        }
      ]
    });
    service = TestBed.inject(RepoDetailsResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
