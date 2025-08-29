import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RepoDetailsComponent } from './repo-details.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('RepoDetailsComponent', () => {
  let component: RepoDetailsComponent;
  let fixture: ComponentFixture<RepoDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [RepoDetailsComponent],
    imports: [RouterTestingModule, FontAwesomeModule],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RepoDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
