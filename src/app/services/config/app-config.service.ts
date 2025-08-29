import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Config } from '../catalogue/catalogue.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: Config | null = null;
  private readonly configURLs = ['assets/config.json', 'assets/config.default.json'];

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    // Try config files in order; stop on first success
    for (const url of this.configURLs) {
      try {
        const cfg = await this.http.get<Config>(url).pipe(take(1)).toPromise();
        this.config = this.applyEnvironmentOverrides(cfg);
        return;
      } catch (err: any) {
        if (err?.status === 404) {
          continue;
        }
        // For non-404 errors, rethrow to fail fast
        throw err;
      }
    }
    // If none found, throw to surface configuration issue
    throw new Error('No configuration file found (assets/config.json or assets/config.default.json)');
  }

  getConfig(): Config {
    if (!this.config) {
      throw new Error('AppConfigService.getConfig() called before configuration was loaded');
    }
    return this.config;
  }

  private applyEnvironmentOverrides(cfg: Config): Config {
    const merged = { ...cfg };
    if (environment.usePreGeneratedFile !== undefined) {
      merged.usePreGeneratedFile = environment.usePreGeneratedFile;
    }
    return merged;
  }
}
