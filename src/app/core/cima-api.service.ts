import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CimaMedicineDetail, CimaMedicineSummary, CimaPagedResponse } from '../models/cima.models';

const CIMA_BASE_URL = 'https://cima.aemps.es/cima/rest';

@Injectable({ providedIn: 'root' })
export class CimaApiService {
  constructor(private readonly http: HttpClient) {}

  searchByName(name: string, page = 1): Observable<CimaPagedResponse<CimaMedicineSummary>> {
    return this.getMedicineList({ nombre: name, pagina: page });
  }

  searchByActiveIngredient(
    activeIngredient: string,
    page = 1,
  ): Observable<CimaPagedResponse<CimaMedicineSummary>> {
    return this.getMedicineList({ practiv1: activeIngredient, pagina: page });
  }

  searchBySymptom(term: string, page = 1): Observable<CimaPagedResponse<CimaMedicineSummary>> {
    const body = [{ seccion: '4.1', texto: term, contiene: 1 }];

    return this.http
      .post<CimaPagedResponse<CimaMedicineSummary>>(`${CIMA_BASE_URL}/buscarEnFichaTecnica`, body, {
        params: new HttpParams().set('pagina', page),
      })
      .pipe(map((response) => this.ensurePagedResponse(response)));
  }

  getMedicine(nregistro: string): Observable<CimaMedicineDetail> {
    return this.http.get<CimaMedicineDetail>(`${CIMA_BASE_URL}/medicamento`, {
      params: new HttpParams().set('nregistro', nregistro),
    });
  }

  private getMedicineList(
    params: Record<string, string | number | boolean>,
  ): Observable<CimaPagedResponse<CimaMedicineSummary>> {
    const httpParams = Object.entries(params).reduce(
      (acc, [key, value]) => acc.set(key, String(value)),
      new HttpParams(),
    );

    return this.http
      .get<CimaPagedResponse<CimaMedicineSummary>>(`${CIMA_BASE_URL}/medicamentos`, {
        params: httpParams,
      })
      .pipe(map((response) => this.ensurePagedResponse(response)));
  }

  private ensurePagedResponse<T>(response: CimaPagedResponse<T>): CimaPagedResponse<T> {
    return {
      pagina: response.pagina ?? 1,
      tamanioPagina: response.tamanioPagina ?? response.resultados?.length ?? 0,
      totalFilas: response.totalFilas ?? response.resultados?.length ?? 0,
      resultados: response.resultados ?? [],
    };
  }
}
