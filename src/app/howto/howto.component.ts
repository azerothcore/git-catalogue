import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import { CatalogueService } from '../services/catalogue/catalogue.service';

@Component({
  selector: 'app-howto',
  templateUrl: './howto.component.html',
  imports: [FaIconComponent, KeyValuePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowtoComponent {
  protected readonly tabs = inject(CatalogueService).config.tabs;
  protected readonly faCaretLeft = faCaretLeft;
}
