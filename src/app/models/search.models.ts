import { CimaMedicineSummary } from './cima.models';

export type SearchMode = 'medicine' | 'activeIngredient' | 'symptom';

export interface SearchQuery {
  raw: string;
}

export interface NormalizedSearchQuery extends SearchQuery {
  normalized: string;
  terms: string[];
  mode: SearchMode;
  searchTerm: string;
  clinicalCategory?: string;
  confidence?: 'high' | 'medium' | 'low';
  redFlags?: string[];
  relatedActiveIngredients?: string[];
  translatedFrom?: string;
  correctedFrom?: string;
}

export interface SearchResult {
  medicine: CimaMedicineSummary;
  mode: SearchMode;
  matchedTerm: string;
}
