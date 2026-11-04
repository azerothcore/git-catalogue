import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { HowtoComponent } from './howto/howto.component';
import { RepoDetailsComponent } from './repo-details/repo-details.component';
import { repoDetailsResolver } from './services/resolvers/repo-details.resolver';

// keep routes eager: update-catalogue.yml in azerothcore.github.io only publishes main, runtime, polyfills and scripts, so a lazy chunk would 404
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'tab/:tab', component: HomeComponent },
  {
    path: 'details/:id',
    component: RepoDetailsComponent,
    resolve: { data: repoDetailsResolver },
    runGuardsAndResolvers: 'paramsChange',
  },
  { path: 'how-to', component: HowtoComponent },
];
