import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faBalanceScale,
  faCaretLeft,
  faClock,
  faCodeBranch,
  faExternalLinkAlt,
  faEye,
  faGlobe,
  faStar,
  faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { pluck, tap } from 'rxjs/operators';
import { RepoDetailsData } from '../services/resolvers/repo-details-resolver.service';

@Component({
  selector: 'app-repo-details',
  templateUrl: './repo-details.component.html',
  styleUrls: ['./repo-details.component.scss'],
})
export class RepoDetailsComponent {
  constructor(private readonly route: ActivatedRoute) {
    this.data$ = route.data.pipe(pluck('data')).pipe(
      tap((data) => {
        window.parent.document.title = data.repo.name;
      }),
    );
  }

  readonly faCaretLeft = faCaretLeft;
  readonly faGlobe = faGlobe;
  readonly faUserCircle = faUserCircle;
  readonly faGithub = faGithub;
  readonly faExternalLinkAlt = faExternalLinkAlt;
  readonly faEye = faEye;
  readonly faStar = faStar;
  readonly faCodeBranch = faCodeBranch;
  readonly faClock = faClock;
  readonly faBalanceScale = faBalanceScale;

  data$: Observable<RepoDetailsData>;
}
