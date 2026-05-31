import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  httpCacheInterceptor,
  resetHttpCacheForTests,
  setHttpCacheTtlForTests,
} from './http-cache.interceptor';

describe('httpCacheInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    resetHttpCacheForTests();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpCacheInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    resetHttpCacheForTests();
  });

  it('serves a cached response for repeated CIMA requests', () => {
    const url = 'https://cima.aemps.es/cima/rest/medicamentos?nombre=test';
    const responses: unknown[] = [];

    http.get(url).subscribe((response) => responses.push(response));
    httpMock.expectOne(url).flush({ value: 1 });

    http.get(url).subscribe((response) => responses.push(response));
    httpMock.expectNone(url);

    expect(responses).toEqual([{ value: 1 }, { value: 1 }]);
  });

  it('deduplicates simultaneous CIMA requests', () => {
    const url = 'https://cima.aemps.es/cima/rest/medicamentos?nombre=test';
    const responses: unknown[] = [];

    http.get(url).subscribe((response) => responses.push(response));
    http.get(url).subscribe((response) => responses.push(response));

    const request = httpMock.expectOne(url);
    request.flush({ value: 2 });

    expect(responses).toEqual([{ value: 2 }, { value: 2 }]);
  });

  it('expires entries after the configured TTL', async () => {
    const url = 'https://cima.aemps.es/cima/rest/medicamentos?nombre=test';
    setHttpCacheTtlForTests(1);

    http.get(url).subscribe();
    httpMock.expectOne(url).flush({ value: 3 });

    await new Promise((resolve) => setTimeout(resolve, 5));

    http.get(url).subscribe();
    httpMock.expectOne(url).flush({ value: 4 });
  });

  it('does not cache errors', () => {
    const url = 'https://cima.aemps.es/cima/rest/medicamentos?nombre=test';

    http.get(url).subscribe({ error: () => undefined });
    httpMock.expectOne(url).flush('down', { status: 503, statusText: 'Service Unavailable' });

    http.get(url).subscribe();
    httpMock.expectOne(url).flush({ value: 5 });
  });

  it('does not cache non-CIMA requests', () => {
    const url = 'https://example.com/api';

    http.get(url).subscribe();
    httpMock.expectOne(url).flush({ value: 1 });

    http.get(url).subscribe();
    httpMock.expectOne(url).flush({ value: 1 });
  });
});
