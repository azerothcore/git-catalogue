import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepoComponent } from './repo.component';
import { MomentModule } from 'angular2-moment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('RepoComponent', () => {
  let component: RepoComponent;
  let fixture: ComponentFixture<RepoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepoComponent ],
      imports: [
       MomentModule,
       FontAwesomeModule,
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
