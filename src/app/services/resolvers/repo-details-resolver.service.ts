import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Repository } from 'src/@types';
import { CatalogueService } from '../catalogue/catalogue.service';

export type RepoDetailsData = {
  repo: Repository;
  readme: string;
  logo: string;
};

@Injectable({
  providedIn: 'root',
})
export class RepoDetailsResolverService  {

  constructor(private readonly catalogueService: CatalogueService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): RepoDetailsData | Observable<RepoDetailsData>
    | Promise<RepoDetailsData> {
    const id = route.params.id;

    const repo$ = this.catalogueService.getLocalRepo(parseInt(id, 10));

    return repo$.pipe(
      switchMap((repo) => forkJoin({
        repo: of(repo),
        readme: this.catalogueService.getRawReadmeDefault(repo),
        logo: of(`https://raw.githubusercontent.com/${repo.full_name}/master/icon.png`),
      })),
    );
  }
}
