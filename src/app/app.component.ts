import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { CatalogueComponent } from './catalogue/catalogue.component';

@Component({
  selector: 'app-root',
  template: '<app-catalogue />',
  imports: [CatalogueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() {
    const catalogueElement = createCustomElement(CatalogueComponent, { injector: inject(Injector) });
    customElements.define('catalogue-element', catalogueElement);
  }
}
