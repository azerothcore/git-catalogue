import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { concat, EMPTY, Observable, throwError } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { Config } from '../catalogue/catalogue.model';

const CONFIG_URLS = ['assets/config.json', 'assets/config.default.json'];

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);

  private config: Config | null = null;

  load(): Observable<void> {
    const attempts = CONFIG_URLS.map((url) =>
      this.http.get<Config>(url).pipe(
        tap((config) => (this.config = config)),
        map(() => undefined),
        // a missing file moves on to the next URL
        catchError((error) => (error?.status === 404 ? EMPTY : throwError(error))),
      ),
    );

    return concat(...attempts, throwError(new Error(`No configuration file found (${CONFIG_URLS.join(' or ')})`))).pipe(take(1));
  }

  getConfig(): Config {
    if (!this.config) {
      throw new Error('AppConfigService.getConfig() called before configuration was loaded');
    }
    return this.config;
  }
}
