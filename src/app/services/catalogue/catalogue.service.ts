import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Config } from './catalogue.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogueService {

  CONF: Config;
  items$: { [key: string]: Observable<any> } = {};

  constructor(
    private http: HttpClient,
  ) {
    try {
      this.CONF = require('src/assets/config.json');
    } catch {
      this.CONF = require('src/assets/default.json');
    }

    for (const k of Object.keys(this.CONF.tabs)) {
      this.items$[k] = this.getItems(this.CONF.tabs[k]);
    };
  }

  getItems(githubTopic: string): Observable<any> {
    return this.http.get(`https://api.github.com/search/repositories?page=${this.CONF.page}&per_page=${this.CONF.perPage}&q=${this.CONF.ORGANIZATION}fork:true+topic:${githubTopic}+sort:stars`);
  }
}
