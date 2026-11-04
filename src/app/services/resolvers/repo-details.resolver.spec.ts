import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Repository } from 'src/@types';
import { CatalogueService } from '../catalogue/catalogue.service';
import { RepoDetailsData, repoDetailsResolver } from './repo-details.resolver';

describe('repoDetailsResolver', () => {
  it('should load the repository of the route and its README', () => {
    const repo = { id: 42, full_name: 'org/repo' } as Repository;
    const getLocalRepo = jasmine.createSpy().and.returnValue(of(repo));
    const getReadme = jasmine.createSpy().and.returnValue(of('# hello'));
    TestBed.configureTestingModule({
      providers: [{ provide: CatalogueService, useValue: { getLocalRepo, getReadme } }],
    });

    let data: RepoDetailsData | undefined;
    const route = { params: { id: '42' } } as unknown as ActivatedRouteSnapshot;
    const result$ = TestBed.runInInjectionContext(() => repoDetailsResolver(route, {} as RouterStateSnapshot));
    (result$ as Observable<RepoDetailsData>).subscribe((value) => (data = value));

    expect(getLocalRepo).toHaveBeenCalledWith(42);
    expect(getReadme).toHaveBeenCalledWith(repo);
    expect(data).toEqual({ repo, readme: '# hello' });
  });
});
