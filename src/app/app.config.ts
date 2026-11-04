import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { routes } from './app.routes';
import { AppConfigService } from './services/config/app-config.service';
import { APP_CONFIG } from './services/config/config.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
    provideHttpClient(),
    provideMarkdown(),
    provideAppInitializer(() => inject(AppConfigService).load()),
    { provide: APP_CONFIG, useFactory: () => inject(AppConfigService).getConfig() },
  ],
};
