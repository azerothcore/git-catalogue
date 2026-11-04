import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { Repository } from 'src/@types';
import { CatalogueService } from '../catalogue/catalogue.service';

export type RepoDetailsData = {
  repo: Repository;
  readme: string;
};

export const repoDetailsResolver: ResolveFn<RepoDetailsData> = (route) => {
  const catalogueService = inject(CatalogueService);

  return catalogueService
    .getLocalRepo(parseInt(route.params['id'], 10))
    .pipe(switchMap((repo) => catalogueService.getReadme(repo).pipe(map((readme) => ({ repo, readme })))));
};
