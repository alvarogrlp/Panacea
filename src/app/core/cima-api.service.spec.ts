import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CimaApiService } from './cima-api.service';

describe('CimaApiService', () => {
  let service: CimaApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CimaApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CimaApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('searches medicines by name with pagination', () => {
    service.searchByName('paracetamol').subscribe((response) => {
      expect(response.totalFilas).toBe(1);
      expect(response.resultados[0].nombre).toContain('PARACETAMOL');
    });

    const request = httpMock.expectOne(
      'https://cima.aemps.es/cima/rest/medicamentos?nombre=paracetamol&pagina=1',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      pagina: 1,
      tamanioPagina: 1,
      totalFilas: 1,
      resultados: [{ nregistro: '77758', nombre: 'PARACETAMOL TEST' }],
    });
  });

  it('searches medicines by active ingredient', () => {
    service.searchByActiveIngredient('ibuprofeno').subscribe();

    const request = httpMock.expectOne(
      'https://cima.aemps.es/cima/rest/medicamentos?practiv1=ibuprofeno&pagina=1',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ pagina: 1, tamanioPagina: 0, totalFilas: 0, resultados: [] });
  });

  it('searches symptoms in section 4.1 of the technical sheet', () => {
    service.searchBySymptom('cefalea').subscribe();

    const request = httpMock.expectOne(
      'https://cima.aemps.es/cima/rest/buscarEnFichaTecnica?pagina=1',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual([{ seccion: '4.1', texto: 'cefalea', contiene: 1 }]);
    request.flush({ pagina: 1, tamanioPagina: 0, totalFilas: 0, resultados: [] });
  });

  it('gets medicine detail by registration number', () => {
    service.getMedicine('77758').subscribe((medicine) => {
      expect(medicine.nregistro).toBe('77758');
    });

    const request = httpMock.expectOne(
      'https://cima.aemps.es/cima/rest/medicamento?nregistro=77758',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ nregistro: '77758', nombre: 'PARACETAMOL TEST' });
  });
});
