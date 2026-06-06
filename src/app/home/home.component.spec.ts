import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { APP_CONFIG } from '../services/config/config.token';
import { Config } from '../services/catalogue/catalogue.model';

import { HomeComponent } from './home.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    const MOCK_CONFIG: Config = {
      page: 0,
      perPage: 10,
      pageSize: 8,
      globalSearch: true,
      tabs: {
        Test: { topic: '', org: '', path: '/test', globalSearch: true },
      },
      usePreGeneratedFile: false,
    };
    await TestBed.configureTestingModule({
    declarations: [HomeComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [RouterTestingModule,
        FontAwesomeModule,
        MatTabsModule,
        MatPaginatorModule,
        BrowserAnimationsModule,
        FormsModule],
    providers: [
        { provide: APP_CONFIG, useValue: MOCK_CONFIG },
        {
            provide: ActivatedRoute,
            useValue: {
                snapshot: {
                    paramMap: {
                        get: () => null
                    }
                }
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
}).compileComponents();
  });

  beforeEach(() => {
    sessionStorage.clear();
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should restore the current page from session storage', () => {
    sessionStorage.setItem('azerothcore.catalogue.page', '2');

    const restoredFixture = TestBed.createComponent(HomeComponent);

    expect(restoredFixture.componentInstance.page).toBe(2);
    restoredFixture.destroy();
  });

  it('should save the current page and route when pagination changes', () => {
    component.onPageChange({ pageIndex: 2 } as PageEvent);

    expect(sessionStorage.getItem('azerothcore.catalogue.page')).toBe('2');
    expect(sessionStorage.getItem('azerothcore.catalogue.returnHash')).toBe('#/home');
  });

  it('should reset the page when changing tabs', () => {
    component.page = 2;

    component.onTabChange({ index: 0 } as MatTabChangeEvent);

    expect(component.page).toBe(0);
    expect(sessionStorage.getItem('azerothcore.catalogue.page')).toBe('0');
    expect(sessionStorage.getItem('azerothcore.catalogue.returnHash')).toBe('#/tab/test');
  });
});
