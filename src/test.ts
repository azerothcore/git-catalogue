// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import { APP_CONFIG } from './app/services/config/config.token';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Provide a default APP_CONFIG for tests that don't declare it explicitly
getTestBed().configureTestingModule({
  providers: [
    {
      provide: APP_CONFIG,
      useValue: {
        page: 0,
        perPage: 10,
        pageSize: 8,
        globalSearch: true,
        tabs: { Test: { topic: '', org: '', path: '/test', globalSearch: true } },
        usePreGeneratedFile: false,
      },
    },
  ],
});
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
