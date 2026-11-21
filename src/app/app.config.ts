import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { IMAGE_LOADER, PlatformLocation } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
  withIncrementalHydration,
} from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // Backend fetch: necessário para SSR e habilita o cache de transferência HTTP (servidor -> cliente).
    provideHttpClient(withFetch()),
    // Respeita o <base href> (ex.: /ssr-performance/ no GitHub Pages) nas imagens com caminho absoluto.
    {
      provide: IMAGE_LOADER,
      useFactory: () => {
        const base = inject(PlatformLocation).getBaseHrefFromDOM() || '/';
        return (config: { src: string }) => config.src.replace(/^\//, base);
      },
    },
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
  ],
};
