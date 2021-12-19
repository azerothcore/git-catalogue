import { Component, Input } from '@angular/core';
import { faStar, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-repo',
  templateUrl: './repo.component.html',
  styleUrls: ['./repo.component.scss'],
})
export class RepoComponent {
  @Input() id: number;
  @Input() name: string;
  @Input() stars: number;
  @Input() created: Date;
  @Input() description: string;
  @Input() fullName: string;

  readonly faStar: IconDefinition = faStar;
}
