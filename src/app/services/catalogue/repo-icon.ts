export const FALLBACK_REPO_ICON = 'https://avatars0.githubusercontent.com/u/20147732?v=4';

export function repoIconUrl(fullName: string): string {
  return `https://raw.githubusercontent.com/${fullName}/master/icon.png`;
}
