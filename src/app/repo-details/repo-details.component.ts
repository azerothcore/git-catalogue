import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faBalanceScale,
  faCaretLeft,
  faCode,
  faCodeBranch,
  faExclamationCircle,
  faEye,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { pluck, tap } from 'rxjs/operators';
import { RepoDetailsData } from '../services/resolvers/repo-details-resolver.service';

const RETURN_HASH_STORAGE_KEY = 'azerothcore.catalogue.returnHash';

@Component({
    selector: 'app-repo-details',
    templateUrl: './repo-details.component.html',
    styleUrls: ['./repo-details.component.scss'],
    standalone: false
})
export class RepoDetailsComponent {
  constructor(private readonly route: ActivatedRoute) {
    this.data$ = route.data.pipe(pluck('data')).pipe(
      tap((data) => {
        if (data && data.repo) {
          window.parent.document.title = data.repo.name;
        }
      }),
    );
  }

  readonly faCaretLeft = faCaretLeft;
  readonly faGithub = faGithub;
  readonly faEye = faEye;
  readonly faStar = faStar;
  readonly faCodeBranch = faCodeBranch;
  readonly faBalanceScale = faBalanceScale;
  readonly faCode = faCode;
  readonly faExclamationCircle = faExclamationCircle;
  readonly returnHash = this.readReturnHash();

  data$: Observable<RepoDetailsData>;

  private readReturnHash(): string {
    try {
      const returnHash = sessionStorage.getItem(RETURN_HASH_STORAGE_KEY);
      if (returnHash && returnHash.indexOf('#/') === 0 && returnHash.indexOf('#/details/') !== 0) {
        return returnHash;
      }
    } catch (error) {}

    return '#/home';
  }
}
