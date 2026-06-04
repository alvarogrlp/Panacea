import { TestBed } from '@angular/core/testing';
import { CLINICAL_KNOWLEDGE } from './clinical-knowledge';
import { SearchEngineService } from './search-engine.service';

describe('SearchEngineService', () => {
  let service: SearchEngineService;

  beforeEach(() => {
    service = TestBed.inject(SearchEngineService);
  });

  it('normalizes accents, punctuation and casing', () => {
    expect(service.normalizeText('  Náuseas!!! y Vómitos  ')).toBe('nauseas y vomitos');
  });

  it('removes stop words and common verbs from terms', () => {
    expect(service.extractTerms('tengo dolor de cabeza')).toEqual(['dolor', 'cabeza']);
  });

  it('translates colloquial symptoms with an O(1) dictionary lookup', () => {
    const query = service.normalize('dolor de cabeza');

    expect(query.mode).toBe('symptom');
    expect(query.searchTerm).toBe('cefalea');
    expect(query.clinicalCategory).toBe('Neurologia');
    expect(query.relatedActiveIngredients).toContain('paracetamol');
    expect(query.translatedFrom).toBe('dolor de cabeza');
  });

  it('uses fuzzy matching only to correct dictionary typos', () => {
    const query = service.normalize('dolorr cabeza');

    expect(query.mode).toBe('symptom');
    expect(query.searchTerm).toBe('cefalea');
    expect(query.relatedActiveIngredients).toContain('ibuprofeno');
    expect(query.correctedFrom).toBe('dolorr cabeza');
  });

  it('maps knee pain to joint pain instead of falling back to a medicine name search', () => {
    const query = service.normalize('dolor de rodillas');

    expect(query.mode).toBe('symptom');
    expect(query.searchTerm).toBe('dolor articular');
    expect(query.clinicalCategory).toBe('Musculoesqueletico');
    expect(query.relatedActiveIngredients).toEqual([
      'ibuprofeno',
      'naproxeno',
      'diclofenaco',
      'paracetamol',
    ]);
  });

  it('keeps stomach pain separate from heartburn', () => {
    const stomachPain = service.normalize('dolor de estomago');
    const heartburn = service.normalize('ardor de estomago');

    expect(stomachPain.mode).toBe('symptom');
    expect(stomachPain.searchTerm).toBe('dolor abdominal');
    expect(stomachPain.relatedActiveIngredients).toContain('butilescopolamina');
    expect(heartburn.searchTerm).toBe('acidez');
    expect(heartburn.relatedActiveIngredients).toContain('magaldrato');
  });

  it('maps digestive infection symptoms to digestive treatments', () => {
    const query = service.normalize('gastroenteritis');

    expect(query.mode).toBe('symptom');
    expect(query.searchTerm).toBe('gastroenteritis');
    expect(query.relatedActiveIngredients).toContain('racecadotrilo');
  });

  it('uses a generic pain fallback for unlisted pain locations', () => {
    const query = service.normalize('dolor de oreja');

    expect(query.mode).toBe('symptom');
    expect(query.searchTerm).toBe('dolor');
    expect(query.relatedActiveIngredients).toContain('paracetamol');
  });

  it('maps respiratory symptoms by clinical intent', () => {
    const productive = service.normalize('tos con flemas');
    const congestion = service.normalize('congestion nasal');

    expect(productive.searchTerm).toBe('tos productiva');
    expect(productive.relatedActiveIngredients).toContain('acetilcisteina');
    expect(congestion.searchTerm).toBe('congestion nasal');
    expect(congestion.relatedActiveIngredients).toContain('xilometazolina');
  });

  it('maps urinary and dermatology symptoms for technical searches', () => {
    const urinary = service.normalize('escozor al orinar');
    const dermatitis = service.normalize('dermatitis');

    expect(urinary.searchTerm).toBe('disuria / cistitis');
    expect(urinary.relatedActiveIngredients).toEqual(['fosfomicina']);
    expect(dermatitis.searchTerm).toBe('dermatitis');
    expect(dermatitis.relatedActiveIngredients).toContain('hidrocortisona');
  });

  it('covers common clinical synonyms from the structured knowledge base', () => {
    const nasal = service.normalize('nariz tapada');
    const dental = service.normalize('dolor de muelas');

    expect(nasal.searchTerm).toBe('congestion nasal');
    expect(nasal.confidence).toBe('high');
    expect(nasal.relatedActiveIngredients).toContain('xilometazolina');
    expect(dental.searchTerm).toBe('odontalgia');
    expect(dental.clinicalCategory).toBe('Odontologia');
  });

  it('covers technical and colloquial examples across systems', () => {
    const erythema = service.normalize('eritema');
    const malaise = service.normalize('malestar general');
    const itching = service.normalize('picazon');
    const tachycardia = service.normalize('taquicardia');

    expect(erythema.searchTerm).toBe('dermatitis');
    expect(erythema.relatedActiveIngredients).toContain('hidrocortisona');
    expect(malaise.searchTerm).toBe('malestar general');
    expect(malaise.confidence).toBe('low');
    expect(itching.searchTerm).toBe('prurito o alergia');
    expect(itching.relatedActiveIngredients).toContain('cetirizina');
    expect(tachycardia.searchTerm).toBe('taquicardia / palpitaciones');
    expect(tachycardia.redFlags).toEqual(['taquicardia o palpitaciones']);
  });

  it('uses the generated static clinical index for broad disease coverage', () => {
    const diabetes = service.normalize('glucosa alta');
    const pneumonia = service.normalize('pulmonia');
    const cervicalPain = service.normalize('molestia en cervicales');

    expect(CLINICAL_KNOWLEDGE.length).toBeGreaterThan(90);
    expect(diabetes.searchTerm).toBe('diabetes mellitus');
    expect(diabetes.relatedActiveIngredients).toContain('metformina');
    expect(pneumonia.searchTerm).toBe('neumonia');
    expect(pneumonia.relatedActiveIngredients).toContain('amoxicilina');
    expect(cervicalPain.searchTerm).toBe('cervicalgia');
    expect(cervicalPain.relatedActiveIngredients).toContain('diclofenaco');
  });

  it('covers frequent lifestyle and sexual health searches', () => {
    const hangover = service.normalize('resaca');
    const erectileDysfunction = service.normalize('disfunción eréctil');

    expect(hangover.mode).toBe('symptom');
    expect(hangover.searchTerm).toBe('resaca');
    expect(hangover.confidence).toBe('low');
    expect(hangover.relatedActiveIngredients).toContain('dimenhidrinato');
    expect(hangover.relatedActiveIngredients).not.toContain('paracetamol');
    expect(erectileDysfunction.mode).toBe('symptom');
    expect(erectileDysfunction.searchTerm).toBe('disfuncion erectil');
    expect(erectileDysfunction.clinicalCategory).toBe('Urologia / andrologia');
    expect(erectileDysfunction.relatedActiveIngredients).toContain('sildenafilo');
  });

  it('flags red-flag clinical patterns without blocking the official search', () => {
    const query = service.normalize('dolor de pecho con falta de aire');

    expect(query.redFlags).toEqual(['dolor toracico', 'disnea']);
    expect(query.mode).toBe('symptom');
    expect(query.searchTerm).toBe('dolor');
    expect(query.relatedActiveIngredients).toContain('paracetamol');
  });

  it('keeps medicine searches as medicine mode when no symptom is detected', () => {
    const query = service.normalize('paracetamol');

    expect(query.mode).toBe('activeIngredient');
    expect(query.searchTerm).toBe('paracetamol');
  });
});
