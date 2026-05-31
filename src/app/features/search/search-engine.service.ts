import { Injectable } from '@angular/core';
import Fuse from 'fuse.js';
import { NormalizedSearchQuery } from '../../models/search.models';
import { CLINICAL_KNOWLEDGE, ClinicalConfidence, RED_FLAG_RULES } from './clinical-knowledge';

type DictionaryEntry = {
  colloquial: string;
  medical: string;
  activeIngredients: string[];
  category: string;
  confidence?: ClinicalConfidence;
};

type SymptomMatch = {
  medical: string;
  activeIngredients: string[];
  category: string;
  confidence: ClinicalConfidence;
  source: string;
};

const STOP_WORDS = new Set([
  'a',
  'al',
  'algo',
  'con',
  'contra',
  'de',
  'del',
  'el',
  'en',
  'es',
  'la',
  'las',
  'le',
  'lo',
  'los',
  'me',
  'mi',
  'mis',
  'para',
  'por',
  'que',
  'se',
  'sin',
  'su',
  'sus',
  'un',
  'una',
  'unas',
  'unos',
  'y',
]);

const VERBS = new Set([
  'busco',
  'cura',
  'curar',
  'duele',
  'duelen',
  'estoy',
  'necesito',
  'padezco',
  'quiero',
  'siento',
  'sufro',
  'tengo',
  'tomar',
  'tratar',
]);

const PAIN_TERMS = new Set(['dolor', 'dolores', 'molestia', 'molestias']);
const HEAD_TERMS = new Set(['cabeza', 'cefalea']);
const STOMACH_TERMS = new Set(['abdomen', 'abdominal', 'barriga', 'estomago', 'tripas', 'vientre']);
const HEARTBURN_TERMS = new Set(['acidez', 'ardor', 'quemazon', 'reflujo']);
const JOINT_TERMS = new Set([
  'articulacion',
  'articulaciones',
  'cadera',
  'codo',
  'codos',
  'hombro',
  'hombros',
  'muneca',
  'munecas',
  'rodilla',
  'rodillas',
  'tobillo',
  'tobillos',
]);
const MUSCLE_TERMS = new Set([
  'contractura',
  'espalda',
  'lumbalgia',
  'lumbar',
  'muscular',
  'musculo',
  'musculos',
]);
const FEVER_TERMS = new Set(['calentura', 'febricula', 'fiebre']);
const RESPIRATORY_TERMS = new Set([
  'catarro',
  'congestion',
  'constipado',
  'gripe',
  'mocos',
  'resfriado',
]);
const DRY_COUGH_TERMS = new Set(['irritativa', 'seca']);
const PRODUCTIVE_COUGH_TERMS = new Set([
  'expectoracion',
  'flema',
  'flemas',
  'mucosidad',
  'productiva',
]);
const THROAT_TERMS = new Set(['amigdalas', 'faringe', 'garganta']);
const DENTAL_TERMS = new Set(['dental', 'diente', 'dientes', 'muela', 'muelas']);
const MENSTRUAL_TERMS = new Set(['dismenorrea', 'menstrual', 'regla']);
const DIGESTIVE_INFECTION_TERMS = new Set(['diarrea', 'diarreico', 'enteritis', 'gastroenteritis']);
const CONSTIPATION_TERMS = new Set(['estrenimiento', 'estreñimiento']);
const SKIN_ALLERGY_TERMS = new Set([
  'alergia',
  'alergico',
  'picor',
  'prurito',
  'ronchas',
  'urticaria',
]);
const DERMATOLOGY_TERMS = new Set(['dermatitis', 'eczema', 'eccema', 'piel', 'sarpullido']);
const FUNGAL_TERMS = new Set(['candidiasis', 'hongos', 'micosis', 'pie']);
const NAUSEA_TERMS = new Set(['nausea', 'nauseas', 'vomito', 'vomitos', 'mareo']);
const URINARY_TERMS = new Set(['cistitis', 'disuria', 'orina', 'orinar', 'urinaria']);
const WOUND_TERMS = new Set(['corte', 'herida', 'quemadura']);

const SYMPTOM_DICTIONARY: DictionaryEntry[] = [
  {
    colloquial: 'dolor cabeza',
    medical: 'cefalea',
    activeIngredients: ['paracetamol', 'ibuprofeno', 'acido acetilsalicilico'],
    category: 'Dolor / neurologia',
  },
  {
    colloquial: 'dolor de cabeza',
    medical: 'cefalea',
    activeIngredients: ['paracetamol', 'ibuprofeno', 'acido acetilsalicilico'],
    category: 'Dolor / neurologia',
  },
  {
    colloquial: 'migrana',
    medical: 'migrana',
    activeIngredients: ['sumatriptan', 'almotriptan', 'zolmitriptan'],
    category: 'Neurologia',
  },
  {
    colloquial: 'jaqueca',
    medical: 'migrana',
    activeIngredients: ['sumatriptan', 'almotriptan', 'zolmitriptan'],
    category: 'Neurologia',
  },
  {
    colloquial: 'ardor estomago',
    medical: 'acidez',
    activeIngredients: ['magaldrato', 'algeldrato', 'famotidina', 'omeprazol'],
    category: 'Digestivo',
  },
  {
    colloquial: 'ardor de estomago',
    medical: 'acidez',
    activeIngredients: ['magaldrato', 'algeldrato', 'famotidina', 'omeprazol'],
    category: 'Digestivo',
  },
  {
    colloquial: 'acidez estomago',
    medical: 'acidez',
    activeIngredients: ['magaldrato', 'algeldrato', 'famotidina', 'omeprazol'],
    category: 'Digestivo',
  },
  {
    colloquial: 'dolor estomago',
    medical: 'dolor abdominal',
    activeIngredients: ['butilescopolamina', 'simeticona', 'paracetamol'],
    category: 'Digestivo',
  },
  {
    colloquial: 'dolor de estomago',
    medical: 'dolor abdominal',
    activeIngredients: ['butilescopolamina', 'simeticona', 'paracetamol'],
    category: 'Digestivo',
  },
  {
    colloquial: 'gastroenteritis',
    medical: 'gastroenteritis',
    activeIngredients: ['racecadotrilo', 'loperamida', 'dimenhidrinato'],
    category: 'Digestivo',
  },
  {
    colloquial: 'dolor rodilla',
    medical: 'dolor articular',
    activeIngredients: ['ibuprofeno', 'naproxeno', 'diclofenaco', 'paracetamol'],
    category: 'Musculoesqueletico',
  },
  {
    colloquial: 'dolor de rodilla',
    medical: 'dolor articular',
    activeIngredients: ['ibuprofeno', 'naproxeno', 'diclofenaco', 'paracetamol'],
    category: 'Musculoesqueletico',
  },
  {
    colloquial: 'dolor rodillas',
    medical: 'dolor articular',
    activeIngredients: ['ibuprofeno', 'naproxeno', 'diclofenaco', 'paracetamol'],
    category: 'Musculoesqueletico',
  },
  {
    colloquial: 'dolor de rodillas',
    medical: 'dolor articular',
    activeIngredients: ['ibuprofeno', 'naproxeno', 'diclofenaco', 'paracetamol'],
    category: 'Musculoesqueletico',
  },
  {
    colloquial: 'fiebre',
    medical: 'fiebre',
    activeIngredients: ['paracetamol', 'ibuprofeno'],
    category: 'Sistemico',
  },
  {
    colloquial: 'resfriado',
    medical: 'resfriado comun',
    activeIngredients: ['paracetamol', 'pseudoefedrina', 'dextrometorfano', 'acetilcisteina'],
    category: 'Respiratorio',
  },
  {
    colloquial: 'congestion nasal',
    medical: 'congestion nasal',
    activeIngredients: ['xilometazolina', 'oximetazolina', 'pseudoefedrina'],
    category: 'Respiratorio',
  },
  {
    colloquial: 'tos seca',
    medical: 'tos seca',
    activeIngredients: ['dextrometorfano', 'levodropropizina'],
    category: 'Respiratorio',
  },
  {
    colloquial: 'tos con flemas',
    medical: 'tos productiva',
    activeIngredients: ['acetilcisteina', 'ambroxol'],
    category: 'Respiratorio',
  },
  {
    colloquial: 'tos',
    medical: 'tos',
    activeIngredients: ['dextrometorfano', 'ambroxol', 'acetilcisteina'],
    category: 'Respiratorio',
  },
  {
    colloquial: 'alergia',
    medical: 'rinitis alergica',
    activeIngredients: ['cetirizina', 'loratadina', 'desloratadina'],
    category: 'Alergia / ORL',
  },
  {
    colloquial: 'mocos alergia',
    medical: 'rinitis alergica',
    activeIngredients: ['cetirizina', 'loratadina', 'desloratadina'],
    category: 'Alergia / ORL',
  },
  {
    colloquial: 'dolor garganta',
    medical: 'dolor de garganta',
    activeIngredients: ['flurbiprofeno', 'bencidamina'],
    category: 'ORL',
  },
  {
    colloquial: 'dolor de garganta',
    medical: 'dolor de garganta',
    activeIngredients: ['flurbiprofeno', 'bencidamina'],
    category: 'ORL',
  },
  {
    colloquial: 'dolor muelas',
    medical: 'odontalgia',
    activeIngredients: ['ibuprofeno', 'paracetamol', 'metamizol'],
    category: 'Dolor / odontologia',
  },
  {
    colloquial: 'dolor menstrual',
    medical: 'dismenorrea',
    activeIngredients: ['ibuprofeno', 'naproxeno', 'metamizol'],
    category: 'Ginecologia',
  },
  {
    colloquial: 'dolor muscular',
    medical: 'mialgia',
    activeIngredients: ['ibuprofeno', 'diclofenaco', 'naproxeno'],
    category: 'Musculoesqueletico',
  },
  {
    colloquial: 'dolor espalda',
    medical: 'lumbalgia',
    activeIngredients: ['ibuprofeno', 'diclofenaco', 'naproxeno'],
    category: 'Musculoesqueletico',
  },
  {
    colloquial: 'picor piel',
    medical: 'prurito',
    activeIngredients: ['cetirizina', 'loratadina', 'desloratadina'],
    category: 'Dermatologia / alergia',
  },
  {
    colloquial: 'dermatitis',
    medical: 'dermatitis',
    activeIngredients: ['hidrocortisona', 'dexclorfeniramina', 'cetirizina'],
    category: 'Dermatologia',
  },
  {
    colloquial: 'hongos',
    medical: 'micosis cutanea',
    activeIngredients: ['clotrimazol', 'ketoconazol'],
    category: 'Dermatologia',
  },
  {
    colloquial: 'diarrea',
    medical: 'diarrea',
    activeIngredients: ['loperamida', 'racecadotrilo'],
    category: 'Digestivo',
  },
  {
    colloquial: 'estrenimiento',
    medical: 'estrenimiento',
    activeIngredients: ['macrogol', 'lactulosa', 'bisacodilo'],
    category: 'Digestivo',
  },
  {
    colloquial: 'nauseas',
    medical: 'nauseas',
    activeIngredients: ['dimenhidrinato', 'metoclopramida'],
    category: 'Digestivo / vestibular',
  },
  {
    colloquial: 'vomitos',
    medical: 'vomitos',
    activeIngredients: ['dimenhidrinato', 'metoclopramida'],
    category: 'Digestivo / vestibular',
  },
  {
    colloquial: 'mareo',
    medical: 'vertigo',
    activeIngredients: ['betahistina', 'dimenhidrinato'],
    category: 'Vestibular',
  },
  {
    colloquial: 'escozor al orinar',
    medical: 'disuria / cistitis',
    activeIngredients: ['fosfomicina'],
    category: 'Urologia',
  },
  {
    colloquial: 'herida',
    medical: 'herida cutanea',
    activeIngredients: ['clorhexidina'],
    category: 'Dermatologia / curas',
  },
];

const CLINICAL_DICTIONARY: DictionaryEntry[] = [
  ...SYMPTOM_DICTIONARY,
  ...CLINICAL_KNOWLEDGE.flatMap((entry) =>
    entry.synonyms.map((synonym) => ({
      colloquial: synonym,
      medical: entry.medical,
      activeIngredients: entry.activeIngredients,
      category: entry.system,
      confidence: entry.confidence,
    })),
  ),
];

@Injectable({ providedIn: 'root' })
export class SearchEngineService {
  private readonly symptomMap = new Map<string, string>(
    CLINICAL_DICTIONARY.map((entry) => [this.normalizeText(entry.colloquial), entry.medical]),
  );

  private readonly treatmentMap = new Map<string, string[]>(
    CLINICAL_DICTIONARY.map((entry) => [
      this.normalizeText(entry.colloquial),
      entry.activeIngredients,
    ]),
  );

  private readonly categoryMap = new Map<string, string>(
    CLINICAL_DICTIONARY.map((entry) => [this.normalizeText(entry.colloquial), entry.category]),
  );

  private readonly confidenceMap = new Map<string, ClinicalConfidence>(
    CLINICAL_DICTIONARY.map((entry) => [
      this.normalizeText(entry.colloquial),
      entry.confidence ?? 'medium',
    ]),
  );

  private readonly fuzzyDictionary = new Fuse(
    CLINICAL_DICTIONARY.map((entry) => ({
      key: this.normalizeText(entry.colloquial),
      medical: entry.medical,
      activeIngredients: entry.activeIngredients,
      category: entry.category,
      confidence: entry.confidence ?? 'medium',
    })),
    {
      includeScore: true,
      keys: ['key'],
      threshold: 0.34,
      ignoreLocation: true,
      minMatchCharLength: 4,
    },
  );

  normalize(raw: string): NormalizedSearchQuery {
    const normalized = this.normalizeText(raw);
    const terms = this.extractTerms(normalized);
    const compactQuery = terms.join(' ');
    const exactMedical = this.symptomMap.get(normalized) ?? this.symptomMap.get(compactQuery);
    const redFlags = this.matchRedFlags(normalized);

    if (exactMedical) {
      return {
        raw,
        normalized,
        terms,
        mode: 'symptom',
        searchTerm: exactMedical,
        clinicalCategory:
          this.categoryMap.get(normalized) ?? this.categoryMap.get(compactQuery) ?? 'Sintoma',
        confidence:
          this.confidenceMap.get(normalized) ?? this.confidenceMap.get(compactQuery) ?? 'medium',
        redFlags,
        relatedActiveIngredients:
          this.treatmentMap.get(normalized) ?? this.treatmentMap.get(compactQuery) ?? [],
        translatedFrom: normalized,
      };
    }

    const ruleMatch = this.matchSymptomByRules(terms);
    if (ruleMatch) {
      return {
        raw,
        normalized,
        terms,
        mode: 'symptom',
        searchTerm: ruleMatch.medical,
        clinicalCategory: ruleMatch.category,
        confidence: ruleMatch.confidence,
        redFlags,
        relatedActiveIngredients: ruleMatch.activeIngredients,
        translatedFrom: ruleMatch.source,
      };
    }

    const fuzzyMatch = this.fuzzyDictionary.search(compactQuery || normalized)[0];
    if (
      fuzzyMatch &&
      fuzzyMatch.score !== undefined &&
      fuzzyMatch.score <= 0.28 &&
      this.hasMeaningfulOverlap(terms, fuzzyMatch.item.key.split(' '))
    ) {
      return {
        raw,
        normalized,
        terms,
        mode: 'symptom',
        searchTerm: fuzzyMatch.item.medical,
        clinicalCategory: fuzzyMatch.item.category,
        confidence: fuzzyMatch.item.confidence,
        redFlags,
        relatedActiveIngredients: fuzzyMatch.item.activeIngredients,
        correctedFrom: normalized,
      };
    }

    return {
      raw,
      normalized,
      terms,
      mode: this.looksLikeActiveIngredient(terms) ? 'activeIngredient' : 'medicine',
      searchTerm: compactQuery || normalized,
      redFlags,
    };
  }

  normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractTerms(normalized: string): string[] {
    return normalized
      .split(' ')
      .filter(Boolean)
      .filter((term) => !STOP_WORDS.has(term))
      .filter((term) => !VERBS.has(term));
  }

  private looksLikeActiveIngredient(terms: string[]): boolean {
    return terms.length === 1 && /(?:ol|eno|ina|azol|pam|tan|cina|sona|mab)$/.test(terms[0]);
  }

  private matchSymptomByRules(terms: string[]): SymptomMatch | null {
    const hasPain = this.hasAny(terms, PAIN_TERMS);

    if (this.hasAny(terms, HEARTBURN_TERMS)) {
      return {
        medical: 'acidez',
        activeIngredients: ['magaldrato', 'algeldrato', 'famotidina', 'omeprazol'],
        category: 'Digestivo',
        confidence: 'high',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, RESPIRATORY_TERMS)) {
      return {
        medical: 'resfriado comun',
        activeIngredients: ['paracetamol', 'pseudoefedrina', 'dextrometorfano', 'acetilcisteina'],
        category: 'Respiratorio',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, FEVER_TERMS)) {
      return {
        medical: 'fiebre',
        activeIngredients: ['paracetamol', 'ibuprofeno'],
        category: 'Sistemico',
        confidence: 'high',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, DIGESTIVE_INFECTION_TERMS)) {
      return {
        medical: 'gastroenteritis',
        activeIngredients: ['racecadotrilo', 'loperamida', 'dimenhidrinato'],
        category: 'Digestivo',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, CONSTIPATION_TERMS)) {
      return {
        medical: 'estrenimiento',
        activeIngredients: ['macrogol', 'lactulosa', 'bisacodilo'],
        category: 'Digestivo',
        confidence: 'high',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, NAUSEA_TERMS)) {
      return {
        medical: 'nauseas y vomitos',
        activeIngredients: ['dimenhidrinato', 'metoclopramida', 'domperidona'],
        category: 'Digestivo / vestibular',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (terms.includes('tos') && this.hasAny(terms, DRY_COUGH_TERMS)) {
      return {
        medical: 'tos seca',
        activeIngredients: ['dextrometorfano', 'levodropropizina'],
        category: 'Respiratorio',
        confidence: 'high',
        source: terms.join(' '),
      };
    }

    if (terms.includes('tos') && this.hasAny(terms, PRODUCTIVE_COUGH_TERMS)) {
      return {
        medical: 'tos productiva',
        activeIngredients: ['acetilcisteina', 'ambroxol'],
        category: 'Respiratorio',
        confidence: 'high',
        source: terms.join(' '),
      };
    }

    if (terms.includes('tos')) {
      return {
        medical: 'tos',
        activeIngredients: ['dextrometorfano', 'ambroxol', 'acetilcisteina'],
        category: 'Respiratorio',
        confidence: 'low',
        source: terms.join(' '),
      };
    }

    if (hasPain && this.hasAny(terms, HEAD_TERMS)) {
      return {
        medical: 'cefalea',
        activeIngredients: ['paracetamol', 'ibuprofeno', 'acido acetilsalicilico'],
        category: 'Dolor / neurologia',
        confidence: 'high',
        source: terms.join(' '),
      };
    }

    if (hasPain && this.hasAny(terms, THROAT_TERMS)) {
      return {
        medical: 'dolor de garganta',
        activeIngredients: ['flurbiprofeno', 'bencidamina'],
        category: 'ORL',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (hasPain && this.hasAny(terms, DENTAL_TERMS)) {
      return {
        medical: 'odontalgia',
        activeIngredients: ['ibuprofeno', 'paracetamol', 'metamizol'],
        category: 'Dolor / odontologia',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (hasPain && this.hasAny(terms, MENSTRUAL_TERMS)) {
      return {
        medical: 'dismenorrea',
        activeIngredients: ['ibuprofeno', 'naproxeno', 'metamizol'],
        category: 'Ginecologia',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (hasPain && this.hasAny(terms, STOMACH_TERMS)) {
      return {
        medical: 'dolor abdominal',
        activeIngredients: ['butilescopolamina', 'simeticona', 'paracetamol'],
        category: 'Digestivo',
        confidence: 'low',
        source: terms.join(' '),
      };
    }

    if (hasPain && this.hasAny(terms, JOINT_TERMS)) {
      return {
        medical: 'dolor articular',
        activeIngredients: ['ibuprofeno', 'naproxeno', 'diclofenaco', 'paracetamol'],
        category: 'Musculoesqueletico',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (hasPain && this.hasAny(terms, MUSCLE_TERMS)) {
      return {
        medical: 'dolor muscular',
        activeIngredients: ['ibuprofeno', 'naproxeno', 'diclofenaco', 'paracetamol'],
        category: 'Musculoesqueletico',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, SKIN_ALLERGY_TERMS)) {
      return {
        medical: 'prurito o alergia',
        activeIngredients: ['cetirizina', 'loratadina', 'desloratadina'],
        category: 'Dermatologia / alergia',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, DERMATOLOGY_TERMS)) {
      return {
        medical: 'dermatitis',
        activeIngredients: ['hidrocortisona', 'dexclorfeniramina', 'cetirizina'],
        category: 'Dermatologia',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, FUNGAL_TERMS)) {
      return {
        medical: 'micosis cutanea',
        activeIngredients: ['clotrimazol', 'ketoconazol'],
        category: 'Dermatologia',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, URINARY_TERMS)) {
      return {
        medical: 'disuria / cistitis',
        activeIngredients: ['fosfomicina'],
        category: 'Urologia',
        confidence: 'low',
        source: terms.join(' '),
      };
    }

    if (this.hasAny(terms, WOUND_TERMS)) {
      return {
        medical: 'herida cutanea',
        activeIngredients: ['clorhexidina'],
        category: 'Dermatologia / curas',
        confidence: 'medium',
        source: terms.join(' '),
      };
    }

    if (hasPain) {
      return {
        medical: 'dolor',
        activeIngredients: ['paracetamol', 'ibuprofeno', 'naproxeno'],
        category: 'Dolor inespecifico',
        confidence: 'low',
        source: terms.join(' '),
      };
    }

    return null;
  }

  private hasAny(terms: string[], candidates: Set<string>): boolean {
    return terms.some((term) => candidates.has(term));
  }

  private hasMeaningfulOverlap(terms: string[], dictionaryTerms: string[]): boolean {
    return terms.some((term) => dictionaryTerms.includes(term));
  }

  private matchRedFlags(normalized: string): string[] {
    const compactQuery = this.extractTerms(normalized).join(' ');

    return RED_FLAG_RULES.filter((rule) =>
      rule.terms.some((term) => {
        const normalizedTerm = this.normalizeText(term);
        const compactTerm = this.extractTerms(normalizedTerm).join(' ');

        return normalized.includes(normalizedTerm) || compactQuery.includes(compactTerm);
      }),
    ).map((rule) => rule.label);
  }
}
