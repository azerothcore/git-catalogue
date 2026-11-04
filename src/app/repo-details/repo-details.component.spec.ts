import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';
import { take } from 'rxjs/operators';
import { Repository } from 'src/@types';
import { RepoDetailsComponent } from './repo-details.component';

const RETURN_URL_KEY = 'azerothcore.catalogue.returnUrl';

const repository = (extra: Partial<Repository> = {}) =>
  ({
    id: 215361574,
    name: 'mod-bg-twinpeaks',
    full_name: 'Helias/mod-bg-twinpeaks',
    description: 'Twin Peaks battleground',
    html_url: 'https://github.com/Helias/mod-bg-twinpeaks',
    default_branch: 'master',
    owner: { login: 'Helias' },
    stargazers_count: 31,
    forks_count: 4,
    subscribers_count: 2,
    open_issues_count: 1,
    created_at: '2019-10-15T00:00:00Z',
    pushed_at: '2026-01-01T00:00:00Z',
    topics: ['azerothcore-module'],
    ...extra,
  }) as Repository;

const configure = () => TestBed.configureTestingModule({ providers: [provideRouter([]), provideMarkdown()] });

const create = (repo: Repository, readme = ''): ComponentFixture<RepoDetailsComponent> => {
  const fixture = TestBed.createComponent(RepoDetailsComponent);
  fixture.componentRef.setInput('data', { repo, readme });
  fixture.detectChanges();
  return fixture;
};

describe('RepoDetailsComponent README images', () => {
  const renderReadme = async (readme: string, defaultBranch = 'master'): Promise<HTMLElement> => {
    configure();
    const fixture = create(repository({ default_branch: defaultBranch }), readme);
    const markdown: MarkdownComponent = fixture.debugElement.query(By.directive(MarkdownComponent)).componentInstance;
    await markdown.ready.pipe(take(1)).toPromise();
    return fixture.nativeElement.querySelector('#readme-markdown');
  };

  const sources = (readme: HTMLElement) => Array.from(readme.querySelectorAll('img')).map((img) => img.getAttribute('src'));

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
      want: [
        'https://github.com/Helias/mod-bg-twinpeaks/raw/master/one.png',
        'https://github.com/Helias/mod-bg-twinpeaks/raw/master/two.png',
      ],
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
    expect(sources(await renderReadme('![icon](icon.png)', 'main'))).toEqual([
      'https://github.com/Helias/mod-bg-twinpeaks/raw/main/icon.png',
    ]);
  });

  it('should leave image examples inside code blocks untouched', async () => {
    const readme = await renderReadme('```html\n<img src="images/map.png">\n```');

    expect(readme.querySelector('code')?.textContent).toContain('<img src="images/map.png">');
  });

  it('should replace emoji shortcodes', async () => {
    const readme = await renderReadme('Hello :smile:');

    expect(readme.textContent).toContain('Hello 😄');
  });
});

describe('RepoDetailsComponent', () => {
  const backLink = (fixture: ComponentFixture<RepoDetailsComponent>) =>
    fixture.nativeElement.querySelector('.breadcrumb a').getAttribute('href');

  beforeEach(() => {
    sessionStorage.clear();
    configure();
  });

  afterEach(() => sessionStorage.clear());

  it('should show the repository and set the page title', () => {
    const fixture = create(repository());
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('mod-bg-twinpeaks');
    expect(element.querySelector('.repo-hero-description')?.textContent).toBe('Twin Peaks battleground');
    expect(window.parent.document.title).toBe('mod-bg-twinpeaks');
  });

  it('should fall back to the default logo when the repository has no icon', () => {
    const fixture = create(repository());
    const logo: HTMLImageElement = fixture.nativeElement.querySelector('.repo-hero-logo');
    expect(logo.getAttribute('src')).toBe('https://raw.githubusercontent.com/Helias/mod-bg-twinpeaks/master/icon.png');

    logo.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(logo.getAttribute('src')).toBe('https://avatars0.githubusercontent.com/u/20147732?v=4');
  });

  it('should try the icon of the new repository when the route data changes', () => {
    const fixture = create(repository());
    const logo: HTMLImageElement = fixture.nativeElement.querySelector('.repo-hero-logo');
    logo.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    fixture.componentRef.setInput('data', { repo: repository({ full_name: 'Helias/other' }), readme: '' });
    fixture.detectChanges();

    expect(logo.getAttribute('src')).toBe('https://raw.githubusercontent.com/Helias/other/master/icon.png');
  });

  it('should use the stored catalogue route for the back link', () => {
    sessionStorage.setItem(RETURN_URL_KEY, '/tab/modules');

    expect(backLink(create(repository()))).toBe('/tab/modules');
  });

  it('should fall back to the catalogue home for invalid return routes', () => {
    sessionStorage.setItem(RETURN_URL_KEY, 'https://example.com');

    expect(backLink(create(repository()))).toBe('/home');
  });

  it('should not link back to another details page', () => {
    sessionStorage.setItem(RETURN_URL_KEY, '/details/1');

    expect(backLink(create(repository()))).toBe('/home');
  });
});
