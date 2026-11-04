import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { MomentModule } from 'ngx-moment';
import { Repository } from 'src/@types';
import { FALLBACK_REPO_ICON, repoIconUrl } from '../services/catalogue/repo-icon';

const MAX_VISIBLE_TOPICS = 4;

@Component({
  selector: 'app-repo',
  templateUrl: './repo.component.html',
  styleUrl: './repo.component.scss',
  imports: [FaIconComponent, MomentModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepoComponent {
  readonly repo = input.required<Repository>();
  readonly starDelay = input(0);

  protected readonly faStar = faStar;
  protected readonly fallbackIcon = FALLBACK_REPO_ICON;

  protected readonly icon = linkedSignal(() => repoIconUrl(this.repo().full_name));
  protected readonly visibleTopics = computed(() => (this.repo().topics ?? []).slice(0, MAX_VISIBLE_TOPICS));
  protected readonly isPopular = computed(() => this.repo().stargazers_count > 300);
  protected readonly starList = computed(() => {
    const count = this.isPopular() ? 3 : this.repo().stargazers_count > 100 ? 2 : 1;
    return Array.from({ length: count }, (_, index) => index);
  });
}
