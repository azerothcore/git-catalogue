import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Config } from '../services/catalogue/catalogue.model';
import { CatalogueService } from '../services/catalogue/catalogue.service';
import { HowtoComponent } from './howto.component';

describe('HowtoComponent', () => {
  it('should list the categories and link back to the catalogue', () => {
    const config = { tabs: { Modules: { topic: 'module', org: 'org', path: '/module' } } } as unknown as Config;
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CatalogueService, useValue: { config } }],
    });

    const fixture = TestBed.createComponent(HowtoComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.card-title')?.textContent).toBe('Modules');
    expect(element.querySelector('.card-text code')?.textContent).toBe('module');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/home');
  });
});
