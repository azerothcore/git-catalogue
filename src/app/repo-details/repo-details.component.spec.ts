import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MarkdownComponent, MarkdownModule } from 'ngx-markdown';
import { MomentModule } from 'ngx-moment';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { Repository } from 'src/@types';
import { EmojiFixupPipe } from '../pipes/emoji-fixup.pipe';
import { RepoDetailsComponent } from './repo-details.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('RepoDetailsComponent README images', () => {
  const renderReadme = async (readme: string, defaultBranch = 'master'): Promise<HTMLElement> => {
    const repo = {
      id: 215361574,
      name: 'mod-bg-twinpeaks',
      full_name: 'Helias/mod-bg-twinpeaks',
      description: 'Twin Peaks battleground',
      html_url: 'https://github.com/Helias/mod-bg-twinpeaks',
      default_branch: defaultBranch,
      owner: { login: 'Helias' },
      stargazers_count: 31,
      forks_count: 4,
      subscribers_count: 2,
      open_issues_count: 1,
      created_at: '2019-10-15T00:00:00Z',
      pushed_at: '2026-01-01T00:00:00Z',
      topics: ['azerothcore-module'],
    } as unknown as Repository;

    await TestBed.configureTestingModule({
      declarations: [RepoDetailsComponent, EmojiFixupPipe],
      imports: [RouterTestingModule, FontAwesomeModule, MomentModule, MarkdownModule.forRoot()],
      providers: [{ provide: ActivatedRoute, useValue: { data: of({ data: { repo, readme, logo: 'https://example.com/logo.png' } }) } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(RepoDetailsComponent);
    fixture.detectChanges();
    const markdown: MarkdownComponent = fixture.debugElement.query(By.directive(MarkdownComponent)).componentInstance;
    await markdown.ready.pipe(take(1)).toPromise();
    return fixture.nativeElement.querySelector('#readme-markdown');
  };

  const sources = (readme: HTMLElement): string[] => Array.from(readme.querySelectorAll('img')).map((img) => img.getAttribute('src'));

  const cases: { name: string; readme: string; want: string[] }[] = [
    {
      name: 'a relative markdown image',
      readme: '![icon](icon.png)',
      want: ['https://github.com/Helias/mod-bg-twinpeaks/raw/master/icon.png'],
    },
    {
      name: 'a relative html image',
      readme: '<img src="images/TP-WorldMap.png" alt="Twin Peaks World Map">',
      want: ['https://github.com/Helias/mod-bg-twinpeaks/raw/master/images/TP-WorldMap.png'],
    },
    {
      name: 'a path starting with ./',
      readme: '![map](./images/map.png)',
      want: ['https://github.com/Helias/mod-bg-twinpeaks/raw/master/images/map.png'],
    },
    {
      name: 'a path starting with / as the repository root',
      readme: '![map](/images/map.png)',
      want: ['https://github.com/Helias/mod-bg-twinpeaks/raw/master/images/map.png'],
    },
    {
      name: 'every image in the README',
      readme: '![one](one.png)\n\n![two](two.png)',
      want: ['https://github.com/Helias/mod-bg-twinpeaks/raw/master/one.png', 'https://github.com/Helias/mod-bg-twinpeaks/raw/master/two.png'],
    },
    {
      name: 'nothing for an https url',
      readme: '![shot](https://example.com/shot.png)',
      want: ['https://example.com/shot.png'],
    },
    {
      name: 'nothing for a protocol-relative url',
      readme: '<img src="//cdn.example.com/shot.png" alt="shot">',
      want: ['//cdn.example.com/shot.png'],
    },
    {
      name: 'nothing for a data url',
      readme: '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="dot">',
      want: ['data:image/gif;base64,R0lGODlhAQABAAAAACw='],
    },
  ];

  cases.forEach(({ name, readme, want }) => {
    it(`should resolve ${name}`, async () => {
      expect(sources(await renderReadme(readme))).toEqual(want);
    });
  });

  it('should resolve against the default branch of the repository', async () => {
    expect(sources(await renderReadme('![icon](icon.png)', 'main'))).toEqual(['https://github.com/Helias/mod-bg-twinpeaks/raw/main/icon.png']);
  });

  it('should leave image examples inside code blocks untouched', async () => {
    const readme = await renderReadme('```html\n<img src="images/map.png">\n```');

    expect(readme.querySelector('code').textContent).toContain('<img src="images/map.png">');
  });
});

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
    sessionStorage.clear();
    fixture = TestBed.createComponent(RepoDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use the stored catalogue route for the back link', () => {
    sessionStorage.setItem('azerothcore.catalogue.returnHash', '#/tab/modules');

    const restoredFixture = TestBed.createComponent(RepoDetailsComponent);

    expect(restoredFixture.componentInstance.returnHash).toBe('#/tab/modules');
    restoredFixture.destroy();
  });

  it('should fall back to the catalogue home for invalid return routes', () => {
    sessionStorage.setItem('azerothcore.catalogue.returnHash', 'https://example.com');

    const restoredFixture = TestBed.createComponent(RepoDetailsComponent);

    expect(restoredFixture.componentInstance.returnHash).toBe('#/home');
    restoredFixture.destroy();
  });
});
