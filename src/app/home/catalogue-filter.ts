import { Repository } from 'src/@types';

export type SortKey = 'stars' | 'updated' | 'created';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'stars', label: 'Most stars' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'created', label: 'Recently added' },
];

export type ParsedQuery = {
  text: string[];
  topic?: string;
  lang?: string;
  owner?: string;
  minStars?: number;
};

export type RepoFilters = {
  query: ParsedQuery;
  topics: string[];
  language: string;
  minStars: number;
};

export type Facets = {
  topics: string[];
  languages: string[];
};

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function searchableText(item: Repository): string {
  return normalize(
    [item.name, item.full_name, item.description, item.language, item.owner?.login, ...(item.topics ?? [])].filter(Boolean).join(' '),
  );
}

function timeOf(date?: string): number {
  const time = date ? new Date(date).getTime() : 0;
  return isNaN(time) ? 0 : time;
}

export function parseQuery(raw: string): ParsedQuery {
  const parsed: ParsedQuery = { text: [] };

  for (const token of raw.trim().split(/\s+/).filter(Boolean)) {
    const match = token.match(/^(topic|lang|language|owner|stars):(.+)$/i);
    if (!match) {
      parsed.text.push(normalize(token));
      continue;
    }

    const key = match[1].toLowerCase();
    const value = match[2];
    if (key === 'topic') {
      parsed.topic = normalize(value);
    } else if (key === 'lang' || key === 'language') {
      parsed.lang = normalize(value);
    } else if (key === 'owner') {
      parsed.owner = normalize(value);
    } else {
      parsed.minStars = parseInt(value.replace(/^[<>]=?/, ''), 10) || 0;
    }
  }

  return parsed;
}

export function matchesFilters(item: Repository, { query, topics, language, minStars }: RepoFilters): boolean {
  const itemTopics = item.topics ?? [];
  const stars = item.stargazers_count || 0;

  if (query.text.length > 0) {
    const text = searchableText(item);
    if (!query.text.every((term) => text.includes(term))) {
      return false;
    }
  }

  return (
    (!query.topic || itemTopics.some((topic) => normalize(topic) === query.topic)) &&
    (!query.lang || normalize(item.language || '') === query.lang) &&
    (!query.owner || normalize(item.owner?.login || '') === query.owner) &&
    stars >= (query.minStars ?? 0) &&
    topics.every((topic) => itemTopics.includes(topic)) &&
    (!language || item.language === language) &&
    stars >= minStars
  );
}

export function sortRepositories(items: Repository[], sort: SortKey): Repository[] {
  if (sort === 'stars') {
    return [...items].sort((a, b) => b.stargazers_count - a.stargazers_count);
  }

  // pushed_at tracks the last commit, unlike updated_at which also moves on metadata changes
  const dateOf = (item: Repository) => (sort === 'updated' ? item.pushed_at : item.created_at);
  return [...items].sort((a, b) => timeOf(dateOf(b)) - timeOf(dateOf(a)));
}

export function collectFacets(items: Repository[]): Facets {
  const topicCounts = new Map<string, number>();
  const languages = new Set<string>();

  for (const item of items) {
    for (const topic of item.topics ?? []) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
    if (item.language) {
      languages.add(item.language);
    }
  }

  return {
    topics: [...topicCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([topic]) => topic),
    languages: [...languages].sort((a, b) => a.localeCompare(b)),
  };
}

export function resultsLabel(count: number, search: string): string {
  if (!search) {
    return `${count} ${count === 1 ? 'repository' : 'repositories'}`;
  }

  const query = search.trim();
  return count === 0 ? `No results for “${query}”` : `${count} ${count === 1 ? 'result' : 'results'} for “${query}”`;
}
