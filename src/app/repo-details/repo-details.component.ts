import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faBalanceScale, faCaretLeft, faClock, faCodeBranch, faExternalLinkAlt, faEye, faGlobe, faStar, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-repo-details',
  templateUrl: './repo-details.component.html',
  styleUrls: ['./repo-details.component.scss']
})
export class RepoDetailsComponent {

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

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

  id: number;
  item;

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.item = this.http.get('https://api.github.com/repositories/' + this.id);
  }

}
