import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Repository } from 'src/@types';
import { RepoComponent } from './repo.component';

describe('RepoComponent', () => {
  let fixture: ComponentFixture<RepoComponent>;

  const REPO = {
    id: 7,
    name: 'mod-example',
    full_name: 'azerothcore/mod-example',
    description: 'Example module',
    stargazers_count: 5,
    pushed_at: '2024-01-01T00:00:00Z',
    topics: ['one', 'two', 'three', 'four', 'five'],
  } as Repository;

  const render = (repo: Partial<Repository> = {}, starDelay = 0): HTMLElement => {
    fixture.componentRef.setInput('repo', { ...REPO, ...repo });
    fixture.componentRef.setInput('starDelay', starDelay);
    fixture.detectChanges();
    return fixture.nativeElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(RepoComponent);
  });

  it('should link to the details page and show the repository', () => {
    const element = render();

    expect(element.querySelector('a.repo-row')?.getAttribute('href')).toBe('/details/7');
    expect(element.querySelector('.repo-row-name')?.textContent).toBe('mod-example');
    expect(element.querySelector('.repo-row-author')?.textContent).toBe('azerothcore/mod-example');
    expect(element.querySelector('.repo-row-description')?.textContent).toBe('Example module');
    expect(element.querySelector('.repo-row-updated')).not.toBeNull();
  });

  it('should show at most four topics', () => {
    const topics = Array.from(render().querySelectorAll('.repo-row-topics span')).map((topic) => topic.textContent);

    expect(topics).toEqual(['one', 'two', 'three', 'four']);
  });

  it('should leave out what the repository does not have', () => {
    const element = render({ description: undefined, topics: undefined, pushed_at: undefined });

    expect(element.querySelector('.repo-row-description')).toBeNull();
    expect(element.querySelector('.repo-row-topics')).toBeNull();
    expect(element.querySelector('.repo-row-updated')).toBeNull();
  });

  [
    { stars: 10, icons: 1, gold: false, animated: 0 },
    { stars: 11, icons: 1, gold: true, animated: 0 },
    { stars: 101, icons: 2, gold: true, animated: 0 },
    { stars: 301, icons: 3, gold: true, animated: 3 },
  ].forEach(({ stars, icons, gold, animated }) => {
    it(`should pick the star tier for ${stars} stars`, () => {
      const element = render({ stargazers_count: stars });

      expect(element.querySelectorAll('fa-icon').length).toBe(icons);
      expect(element.querySelector('.repo-row-stars')?.classList.contains('is-gold')).toBe(gold);
      expect(element.querySelectorAll('fa-icon.is-animated').length).toBe(animated);
    });
  });

  it('should stagger the animation of the stars from the given delay', () => {
    const icons = render({ stargazers_count: 301 }, 160).querySelectorAll<HTMLElement>('fa-icon');

    expect(Array.from(icons).map((icon) => icon.style.animationDelay)).toEqual(['160ms', '340ms', '520ms']);
  });

  it('should load the icon of the repository and fall back when it is missing', () => {
    const image = render().querySelector('img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://raw.githubusercontent.com/azerothcore/mod-example/master/icon.png');

    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(image.getAttribute('src')).toBe('https://avatars0.githubusercontent.com/u/20147732?v=4');
  });
});
