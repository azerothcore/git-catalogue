import { Repository } from 'src/@types';
import { collectFacets, matchesFilters, parseQuery, RepoFilters, resultsLabel, sortRepositories } from './catalogue-filter';

describe('catalogue filter', () => {
  const REPOS = [
    { name: 'popular', stargazers_count: 100, created_at: '2019-01-01T00:00:00Z', pushed_at: '2019-06-01T00:00:00Z' },
    { name: 'recently-pushed', stargazers_count: 10, created_at: '2020-01-01T00:00:00Z', pushed_at: '2024-06-01T00:00:00Z' },
    { name: 'newest', stargazers_count: 1, created_at: '2023-01-01T00:00:00Z', pushed_at: '2023-06-01T00:00:00Z' },
  ] as Repository[];

  const SEARCH_REPOS = [
    {
      name: 'mod-eluna',
      description: 'Lua engine for AzerothCore',
      topics: ['azerothcore-lua'],
      language: 'C++',
      owner: { login: 'azerothcore' },
      stargazers_count: 5,
    },
    {
      name: 'mod-transmog',
      description: 'Transmogrification module',
      topics: ['azerothcore-module'],
      language: 'C++',
      owner: { login: 'azerothcore' },
      stargazers_count: 50,
    },
    {
      name: 'Rápido',
      description: 'Accents test',
      topics: [],
      language: 'Lua',
      owner: { login: 'someone' },
      stargazers_count: 1,
    },
  ] as unknown as Repository[];

  const search = (raw: string, filters: Partial<RepoFilters> = {}): string[] => {
    const allFilters: RepoFilters = { query: parseQuery(raw), topics: [], language: '', minStars: 0, ...filters };
    return SEARCH_REPOS.filter((item) => matchesFilters(item, allFilters)).map((item) => item.name);
  };

  describe('sortRepositories', () => {
    const sorted = (sort: 'stars' | 'updated' | 'created') => sortRepositories(REPOS, sort).map((item) => item.name);

    it('should sort by stars', () => {
      expect(sorted('stars')).toEqual(['popular', 'recently-pushed', 'newest']);
    });

    it('should sort by last push when picking the updated sort', () => {
      expect(sorted('updated')).toEqual(['recently-pushed', 'newest', 'popular']);
    });

    it('should sort by creation date when picking the created sort', () => {
      expect(sorted('created')).toEqual(['newest', 'recently-pushed', 'popular']);
    });

    it('should push repositories without a date to the end', () => {
      const items = [{ name: 'undated' }, ...REPOS] as Repository[];

      expect(sortRepositories(items, 'updated').at(-1)?.name).toBe('undated');
    });

    it('should not change the original list', () => {
      const original = [...REPOS];

      sortRepositories(REPOS, 'created');

      expect(REPOS).toEqual(original);
    });
  });

  describe('text search', () => {
    it('should match repositories by name, description, topic, language or author', () => {
      expect(search('transmogrification')).toEqual(['mod-transmog']);
      expect(search('azerothcore-lua')).toEqual(['mod-eluna']);
      expect(search('C++')).toEqual(['mod-eluna', 'mod-transmog']);
      expect(search('someone')).toEqual(['Rápido']);
    });

    it('should require every search term to match', () => {
      expect(search('module azerothcore')).toEqual(['mod-transmog']);
      expect(search('eluna module')).toEqual([]);
    });

    it('should ignore case and accents', () => {
      expect(search('ELUNA')).toEqual(['mod-eluna']);
      expect(search('rapido')).toEqual(['Rápido']);
    });

    it('should match everything when the search is blank', () => {
      expect(search('   ').length).toBe(3);
    });
  });

  describe('query operators', () => {
    it('should filter by topic, language and owner', () => {
      expect(search('topic:azerothcore-module')).toEqual(['mod-transmog']);
      expect(search('lang:lua')).toEqual(['Rápido']);
      expect(search('language:c++')).toEqual(['mod-eluna', 'mod-transmog']);
      expect(search('owner:someone')).toEqual(['Rápido']);
    });

    it('should accept a minimum star count with or without a comparison sign', () => {
      expect(search('stars:50')).toEqual(['mod-transmog']);
      expect(search('stars:>=5')).toEqual(['mod-eluna', 'mod-transmog']);
      expect(search('stars:nonsense').length).toBe(3);
    });

    it('should combine operators with text', () => {
      expect(search('lang:c++ transmog')).toEqual(['mod-transmog']);
      expect(search('owner:someone transmog')).toEqual([]);
    });
  });

  describe('panel filters', () => {
    it('should require every selected topic', () => {
      expect(search('', { topics: ['azerothcore-lua'] })).toEqual(['mod-eluna']);
      expect(search('', { topics: ['azerothcore-lua', 'azerothcore-module'] })).toEqual([]);
    });

    it('should filter by language and minimum stars', () => {
      expect(search('', { language: 'Lua' })).toEqual(['Rápido']);
      expect(search('', { minStars: 10 })).toEqual(['mod-transmog']);
    });

    it('should combine with the search text', () => {
      expect(search('mod', { language: 'C++', minStars: 10 })).toEqual(['mod-transmog']);
    });
  });

  describe('collectFacets', () => {
    it('should rank topics by usage and then by name, and sort languages', () => {
      const items = [
        { topics: ['b', 'c'], language: 'Lua' },
        { topics: ['c', 'a'], language: 'C++' },
        { topics: undefined, language: undefined },
      ] as unknown as Repository[];

      expect(collectFacets(items)).toEqual({ topics: ['c', 'a', 'b'], languages: ['C++', 'Lua'] });
    });
  });

  describe('resultsLabel', () => {
    it('should count repositories when there is no search', () => {
      expect(resultsLabel(1, '')).toBe('1 repository');
      expect(resultsLabel(2, '')).toBe('2 repositories');
    });

    it('should report how many results match the search', () => {
      expect(resultsLabel(1, 'eluna')).toBe('1 result for “eluna”');
      expect(resultsLabel(3, ' eluna ')).toBe('3 results for “eluna”');
      expect(resultsLabel(0, 'nothing')).toBe('No results for “nothing”');
    });
  });
});
