import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MomentModule } from 'angular2-moment';
import { MarkdownModule } from 'ngx-markdown';
import { HomeComponent } from './home/home.component';
import { HowtoComponent } from './howto/howto.component';
import { RepoDetailsComponent } from './repo-details/repo-details.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'details/:id', component: RepoDetailsComponent },
  { path: 'how-to', component: HowtoComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: true }),
    CommonModule,
    MomentModule,
    FontAwesomeModule,
    MarkdownModule.forRoot(),
  ],
  exports: [
    RouterModule
  ],
})
export class AppRoutingModule { }
