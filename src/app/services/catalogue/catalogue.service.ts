import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Config } from './catalogue.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogueService {
  CONF: Config;
  items$: { [key: string]: Observable<any> } = {};

  private configURL = 'assets/default.json';

  constructor(private http: HttpClient) {
    this.http.get<Config>(this.configURL).subscribe((config: Config) => {
      this.CONF = config;

      for (const k of Object.keys(this.CONF.tabs)) {
        this.items$[k] = this.getLocalItems(this.CONF.tabs[k]);
      }
    });
  }

  private getLocalItems(githubTopic: string): Observable<any> {
    const key = `${this.CONF.page}-${this.CONF.perPage}-${this.CONF.organization}-${githubTopic}`;
    const item = localStorage.getItem(key);
    const topicFilter = githubTopic !== '' ? `+topic:${githubTopic}` : '';
    const orgFilter = !!this.CONF.organization && this.CONF.organization !== '' ? `org:${this.CONF.organization}+` : '';

    if (item && !this.expireMinutes(30, JSON.parse(item).timeDate)) {
      return of(JSON.parse(item).value);
    }

    return this.getFromAPI(
      `https://api.github.com/search/repositories?page=${this.CONF.page}&per_page=${this.CONF.perPage}&q=${orgFilter}fork:true${topicFilter}+sort:stars`,
      key,
    );
  }

  getFromAPI(URL: string, key: string): Observable<any> {
    return this.http.get(URL).pipe(
      tap((data) => {
        localStorage.setItem(key, JSON.stringify({ timeDate: new Date().getTime(), value: data }));
      }),
    );
  }

  private expireMinutes(minutes: number, timeDate: number): boolean {
    const diff = Math.abs(new Date().getTime() - timeDate);
    const diffMinutes = Math.floor(diff / 1000) / 60;
    return minutes < diffMinutes;
  }

  getLocalRepo(id: number): Observable<any> {
    const key = 'repo-' + id;

    const item = localStorage.getItem(key);

    if (item && !this.expireMinutes(30, JSON.parse(item).timeDate)) {
      return of(JSON.parse(item).value);
    }

    return this.getFromAPI('https://api.github.com/repositories/' + id, key);
  }
}
