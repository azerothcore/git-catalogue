import { ChangeDetectionStrategy, Component, computed, effect, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faBalanceScale, faCaretLeft, faCode, faCodeBranch, faExclamationCircle, faEye, faStar } from '@fortawesome/free-solid-svg-icons';
import { MarkdownComponent } from 'ngx-markdown';
import { MomentModule } from 'ngx-moment';
import { EmojiFixupPipe } from '../pipes/emoji-fixup.pipe';
import { FALLBACK_REPO_ICON, repoIconUrl } from '../services/catalogue/repo-icon';
import { RepoDetailsData } from '../services/resolvers/repo-details.resolver';
import { readSessionItem, RETURN_URL_STORAGE_KEY } from '../services/storage/session-storage';

const ABSOLUTE_URL = /^([a-z][a-z\d+.-]*:|\/\/)/i;

function readReturnUrl(): string {
  const url = readSessionItem(RETURN_URL_STORAGE_KEY);
  return url?.startsWith('/') && !url.startsWith('/details/') ? url : '/home';
}

@Component({
  selector: 'app-repo-details',
  templateUrl: './repo-details.component.html',
  styleUrl: './repo-details.component.scss',
  imports: [EmojiFixupPipe, FaIconComponent, MarkdownComponent, MomentModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepoDetailsComponent {
  /** Resolved by `repoDetailsResolver` */
  readonly data = input.required<RepoDetailsData>();

  protected readonly faCaretLeft = faCaretLeft;
  protected readonly faGithub = faGithub;
  protected readonly faEye = faEye;
  protected readonly faStar = faStar;
  protected readonly faCodeBranch = faCodeBranch;
  protected readonly faBalanceScale = faBalanceScale;
  protected readonly faCode = faCode;
  protected readonly faExclamationCircle = faExclamationCircle;
  protected readonly fallbackIcon = FALLBACK_REPO_ICON;
  protected readonly returnUrl = readReturnUrl();

  protected readonly repo = computed(() => this.data().repo);
  protected readonly ownerUrl = computed(() => `https://github.com/${this.repo().owner.login}`);
  protected readonly logo = linkedSignal(() => repoIconUrl(this.repo().full_name));

  constructor() {
    effect(() => {
      window.parent.document.title = this.repo().name;
    });
  }

  protected resolveReadmeImages(readme: HTMLElement): void {
    const { full_name, default_branch } = this.repo();
    const base = `https://github.com/${full_name}/raw/${default_branch}/`;

    readme.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !ABSOLUTE_URL.test(src)) {
        // on GitHub a leading slash means the repository root, not the root of github.com
        img.src = new URL(src.replace(/^\/+/, ''), base).href;
      }
    });
  }
}
