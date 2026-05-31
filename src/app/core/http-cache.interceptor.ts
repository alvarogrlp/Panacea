import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';

type CacheEntry = {
  expiresAt: number;
  response: HttpResponse<unknown>;
};

const CIMA_URL_PREFIX = 'https://cima.aemps.es/cima/rest';
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Observable<HttpEvent<unknown>>>();
let ttlMs = 5 * 60 * 1000;

export const httpCacheInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (!isCacheable(request)) {
    return next(request);
  }

  const key = cacheKey(request);
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && cached.expiresAt > now) {
    return of(cached.response.clone());
  }

  if (cached) {
    cache.delete(key);
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending;
  }

  const sharedRequest = next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(key, {
          expiresAt: Date.now() + ttlMs,
          response: event.clone(),
        });
      }
    }),
    finalize(() => inFlight.delete(key)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  inFlight.set(key, sharedRequest);
  return sharedRequest;
};

export function resetHttpCacheForTests(): void {
  cache.clear();
  inFlight.clear();
  ttlMs = 5 * 60 * 1000;
}

export function setHttpCacheTtlForTests(nextTtlMs: number): void {
  ttlMs = nextTtlMs;
}

function isCacheable(request: HttpRequest<unknown>): boolean {
  return ['GET', 'POST'].includes(request.method) && request.url.startsWith(CIMA_URL_PREFIX);
}

function cacheKey(request: HttpRequest<unknown>): string {
  return `${request.method} ${request.urlWithParams} ${JSON.stringify(request.body ?? null)}`;
}
