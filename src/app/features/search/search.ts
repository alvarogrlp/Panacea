import { AsyncPipe, NgClass } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { CimaApiService } from '../../core/cima-api.service';
import {
  CimaMedicineDetail,
  CimaMedicineSummary,
  CimaPagedResponse,
} from '../../models/cima.models';
import { NormalizedSearchQuery, SearchMode, SearchResult } from '../../models/search.models';
import { SearchEngineService } from './search-engine.service';

type SearchState = {
  query: NormalizedSearchQuery | null;
  groups: SearchResultGroup[];
  total: number;
  error: string | null;
};

type SearchResultGroup = {
  id: string;
  title: string;
  subtitle: string;
  medicines: CimaMedicineSummary[];
  representative: CimaMedicineSummary;
  mode: SearchMode;
  matchedTerm: string;
};

type ResultFilters = {
  marketedOnly: boolean;
  prescriptionFreeOnly: boolean;
  noDrivingWarning: boolean;
  noSupplyIssue: boolean;
};

type ResultFilterKey = keyof ResultFilters;

const INITIAL_VISIBLE_GROUPS = 12;
const VISIBLE_GROUP_STEP = 12;

@Component({
  selector: 'app-search',
  imports: [AsyncPipe, NgClass, ReactiveFormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  @ViewChild('detailPanel') private detailPanel?: ElementRef<HTMLElement>;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly selectedMedicine = signal<CimaMedicineDetail | null>(null);
  readonly detailAnimation = signal<'idle' | 'enter' | 'update'>('idle');
  readonly expandedGroups = signal<Set<string>>(new Set());
  readonly resultFilters = signal<ResultFilters>({
    marketedOnly: false,
    prescriptionFreeOnly: false,
    noDrivingWarning: false,
    noSupplyIssue: false,
  });
  readonly visibleGroupCount = signal(INITIAL_VISIBLE_GROUPS);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  private detailAnimationTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly searchState$: Observable<SearchState> = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    debounceTime(280),
    map((value) => value.trim()),
    distinctUntilChanged(),
    tap(() => {
      this.selectedMedicine.set(null);
      this.resetDetailAnimation();
      this.expandedGroups.set(new Set());
      this.visibleGroupCount.set(INITIAL_VISIBLE_GROUPS);
      this.detailError.next(null);
    }),
    switchMap((value) => this.search(value)),
  );

  readonly detailError = new BehaviorSubject<string | null>(null);
  readonly selectedDocuments = computed(() => this.selectedMedicine()?.docs ?? []);
  readonly selectedActiveIngredients = computed(
    () => this.selectedMedicine()?.principiosActivos ?? [],
  );

  constructor(
    private readonly cimaApi: CimaApiService,
    private readonly searchEngine: SearchEngineService,
  ) {}

  selectMedicine(medicine: CimaMedicineSummary): void {
    const animation = this.selectedMedicine() ? 'update' : 'enter';
    this.detailLoading.set(true);
    this.detailError.next(null);

    this.cimaApi
      .getMedicine(medicine.nregistro)
      .pipe(
        catchError(() => {
          this.detailError.next('No se pudo cargar el detalle de CIMA.');
          return of(null);
        }),
        finalize(() => this.detailLoading.set(false)),
      )
      .subscribe((detail) => {
        this.selectedMedicine.set(detail);
        if (detail) {
          this.playDetailAnimation(animation);
          this.scrollToDetailOnMobile();
        }
      });
  }

  trackByGroup(_: number, group: SearchResultGroup): string {
    return group.id;
  }

  trackByMedicine(_: number, medicine: CimaMedicineSummary): string {
    return medicine.nregistro;
  }

  isGroupExpanded(group: SearchResultGroup): boolean {
    return this.expandedGroups().has(group.id);
  }

  toggleGroup(group: SearchResultGroup): void {
    const expanded = new Set(this.expandedGroups());

    if (expanded.has(group.id)) {
      expanded.delete(group.id);
    } else {
      expanded.add(group.id);
    }

    this.expandedGroups.set(expanded);
  }

  toggleFilter(filter: ResultFilterKey): void {
    this.resultFilters.update((filters) => ({
      ...filters,
      [filter]: !filters[filter],
    }));
    this.visibleGroupCount.set(INITIAL_VISIBLE_GROUPS);
    this.selectedMedicine.set(null);
    this.resetDetailAnimation();
  }

  clearFilters(): void {
    this.resultFilters.set({
      marketedOnly: false,
      prescriptionFreeOnly: false,
      noDrivingWarning: false,
      noSupplyIssue: false,
    });
    this.visibleGroupCount.set(INITIAL_VISIBLE_GROUPS);
  }

  hasActiveFilters(): boolean {
    return Object.values(this.resultFilters()).some(Boolean);
  }

  showMoreGroups(): void {
    this.visibleGroupCount.update((count) => count + VISIBLE_GROUP_STEP);
  }

  filteredGroups(state: SearchState): SearchResultGroup[] {
    const filters = this.resultFilters();

    return state.groups.filter((group) =>
      group.medicines.some(
        (medicine) =>
          (!filters.marketedOnly || Boolean(medicine.comerc)) &&
          (!filters.prescriptionFreeOnly || !medicine.receta) &&
          (!filters.noDrivingWarning || !medicine.conduc) &&
          (!filters.noSupplyIssue || !medicine.psum),
      ),
    );
  }

  visibleGroups(groups: SearchResultGroup[]): SearchResultGroup[] {
    return groups.slice(0, this.visibleGroupCount());
  }

  documentLabel(type: number): string {
    if (type === 1) {
      return 'Ficha tecnica';
    }

    if (type === 2) {
      return 'Prospecto';
    }

    return 'Documento CIMA';
  }

  modeLabel(mode: SearchMode): string {
    const labels: Record<SearchMode, string> = {
      activeIngredient: 'Principio activo',
      medicine: 'Nombre',
      symptom: 'Sintoma',
    };

    return labels[mode];
  }

  private search(value: string): Observable<SearchState> {
    if (value.length < 2) {
      this.loading.set(false);
      return of({ query: null, groups: [], total: 0, error: null });
    }

    const query = this.searchEngine.normalize(value);
    this.loading.set(true);

    const request$ =
      query.mode === 'symptom'
        ? this.searchBySymptomIngredients(query)
        : forkJoin([
            this.cimaApi.searchByName(query.searchTerm),
            this.cimaApi.searchByActiveIngredient(query.searchTerm),
          ]).pipe(
            map(([byName, byIngredient]) => ({
              pagina: byName.pagina,
              tamanioPagina: byName.tamanioPagina + byIngredient.tamanioPagina,
              totalFilas: byName.totalFilas + byIngredient.totalFilas,
              resultados: this.mergeResults(byName.resultados, byIngredient.resultados),
            })),
          );

    return request$.pipe(
      map((response) => ({
        query,
        total: response.totalFilas,
        groups: this.groupSearchResults(
          response.resultados.map((medicine) => ({
            medicine,
            mode: query.mode,
            matchedTerm: query.searchTerm,
          })),
        ),
        error: null,
      })),
      catchError(() =>
        of({
          query,
          groups: [],
          total: 0,
          error: 'CIMA no ha respondido correctamente. Prueba de nuevo en unos segundos.',
        }),
      ),
      finalize(() => this.loading.set(false)),
    );
  }

  private playDetailAnimation(animation: 'enter' | 'update'): void {
    if (this.detailAnimationTimeout) {
      clearTimeout(this.detailAnimationTimeout);
    }

    this.detailAnimation.set('idle');

    requestAnimationFrame(() => {
      this.detailAnimation.set(animation);
      this.detailAnimationTimeout = setTimeout(() => {
        this.detailAnimation.set('idle');
        this.detailAnimationTimeout = null;
      }, 720);
    });
  }

  private resetDetailAnimation(): void {
    if (this.detailAnimationTimeout) {
      clearTimeout(this.detailAnimationTimeout);
      this.detailAnimationTimeout = null;
    }

    this.detailAnimation.set('idle');
  }

  private scrollToDetailOnMobile(): void {
    if (!globalThis.matchMedia('(max-width: 860px)').matches) {
      return;
    }

    requestAnimationFrame(() => {
      this.detailPanel?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  private mergeResults(
    byName: CimaMedicineSummary[],
    byIngredient: CimaMedicineSummary[],
  ): CimaMedicineSummary[] {
    const medicines = new Map<string, CimaMedicineSummary>();

    for (const medicine of [...byName, ...byIngredient]) {
      medicines.set(medicine.nregistro, medicine);
    }

    return [...medicines.values()];
  }

  private groupSearchResults(results: SearchResult[]): SearchResultGroup[] {
    const groups = new Map<string, SearchResultGroup>();

    for (const result of results) {
      const key = this.medicineFamilyKey(result.medicine);
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, {
          id: `${result.mode}-${key}`,
          title: this.medicineFamilyTitle(result.medicine),
          subtitle: result.medicine.labtitular || result.medicine.labcomercializador || '',
          medicines: [result.medicine],
          representative: result.medicine,
          mode: result.mode,
          matchedTerm: result.matchedTerm,
        });
        continue;
      }

      if (!this.hasEquivalentVariant(existing.medicines, result.medicine)) {
        existing.medicines.push(result.medicine);
      }

      existing.medicines.sort((first, second) => first.nombre.localeCompare(second.nombre, 'es'));
      existing.representative = this.chooseRepresentative(existing.medicines);
    }

    const sortedGroups = [...groups.values()].sort((first, second) => {
      const comercializedDiff =
        Number(Boolean(second.representative.comerc)) -
        Number(Boolean(first.representative.comerc));

      if (comercializedDiff !== 0) {
        return comercializedDiff;
      }

      return first.title.localeCompare(second.title, 'es');
    });

    return sortedGroups;
  }

  private hasEquivalentVariant(
    medicines: CimaMedicineSummary[],
    candidate: CimaMedicineSummary,
  ): boolean {
    const candidateName = this.normalizeForRanking(candidate.nombre);

    return medicines.some(
      (medicine) => this.normalizeForRanking(medicine.nombre) === candidateName,
    );
  }

  private chooseRepresentative(medicines: CimaMedicineSummary[]): CimaMedicineSummary {
    return [...medicines].sort((first, second) => {
      const scoreDiff = this.presentationScore(second) - this.presentationScore(first);

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return first.nombre.localeCompare(second.nombre, 'es');
    })[0];
  }

  private presentationScore(medicine: CimaMedicineSummary): number {
    let score = 0;

    if (medicine.comerc) {
      score += 10;
    }

    if (!medicine.receta) {
      score += 4;
    }

    if (medicine.generico) {
      score += 2;
    }

    if (medicine.psum) {
      score -= 8;
    }

    return score;
  }

  private medicineFamilyKey(medicine: CimaMedicineSummary): string {
    return this.normalizeForRanking(this.medicineFamilyTitle(medicine));
  }

  private medicineFamilyTitle(medicine: CimaMedicineSummary): string {
    const cleaned = medicine.nombre
      .replace(/\b\d+(?:[,.]\d+)?\s*\/\s*\d+(?:[,.]\d+)?\s*(?:mg|g|mcg|ml)\b/gi, ' ')
      .replace(/\b\d+(?:[,.]\d+)?\s*(?:mg|g|mcg|microgramos|ml|ui|%)\b/gi, ' ')
      .replace(/\b(?:mg|g|mcg|ml)\s*\/\s*(?:mg|g|mcg|ml)\b/gi, ' ')
      .replace(
        /\b(?:comprimidos?|capsulas?|cápsulas?|granulado|polvo|solucion|solución|suspension|suspensión|jarabe|gotas|gel|crema|pomada|spray|sobres?|pastillas?|liofilizado|colirio|supositorios?)\b.*$/i,
        ' ',
      )
      .replace(
        /\b(?:efg|recubiertos?|pelicula|película|efervescentes?|oral|bucal|cutanea|cutánea|nasal|para chupar)\b/gi,
        ' ',
      )
      .replace(/\bsabor\b.*$/i, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned || medicine.nombre;
  }

  private searchBySymptomIngredients(
    query: NormalizedSearchQuery,
  ): Observable<CimaPagedResponse<CimaMedicineSummary>> {
    const ingredients = query.relatedActiveIngredients ?? [];

    if (ingredients.length === 0) {
      return this.cimaApi.searchByActiveIngredient(query.searchTerm);
    }

    return forkJoin(
      ingredients.map((ingredient) => this.cimaApi.searchByActiveIngredient(ingredient)),
    ).pipe(
      map((responses) => ({
        pagina: 1,
        tamanioPagina: responses.reduce((total, response) => total + response.tamanioPagina, 0),
        totalFilas: responses.reduce((total, response) => total + response.totalFilas, 0),
        resultados: this.rankSymptomResults(
          this.mergeResults(
            responses.flatMap((response) => response.resultados),
            [],
          ),
          ingredients,
        ),
      })),
    );
  }

  private rankSymptomResults(
    medicines: CimaMedicineSummary[],
    ingredients: string[],
  ): CimaMedicineSummary[] {
    return [...medicines].sort((first, second) => {
      const scoreDiff =
        this.symptomResultScore(second, ingredients) - this.symptomResultScore(first, ingredients);

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return first.nombre.localeCompare(second.nombre, 'es');
    });
  }

  private symptomResultScore(medicine: CimaMedicineSummary, ingredients: string[]): number {
    const normalizedName = this.normalizeForRanking(medicine.nombre);
    const normalizedVtm = this.normalizeForRanking(medicine.vtm?.nombre ?? '');
    const ingredientIndex = ingredients.findIndex((ingredient) => {
      const normalizedIngredient = this.normalizeForRanking(ingredient);

      return (
        normalizedVtm.includes(normalizedIngredient) ||
        normalizedName.includes(normalizedIngredient)
      );
    });

    let score = ingredientIndex === -1 ? 0 : (ingredients.length - ingredientIndex) * 20;

    if (medicine.comerc) {
      score += 8;
    }

    if (!medicine.receta) {
      score += 4;
    }

    if (medicine.generico) {
      score += 2;
    }

    if (medicine.psum) {
      score -= 8;
    }

    if (medicine.conduc) {
      score -= 2;
    }

    return score;
  }

  private normalizeForRanking(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
