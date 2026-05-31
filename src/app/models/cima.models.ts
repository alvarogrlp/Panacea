export interface CimaPagedResponse<T> {
  pagina: number;
  tamanioPagina: number;
  totalFilas: number;
  resultados: T[];
}

export interface CimaStatus {
  aut?: number;
  rev?: number;
  sus?: number;
}

export interface CimaItem {
  id?: number;
  codigo?: string;
  nombre: string;
}

export interface CimaAtc {
  codigo: string;
  nombre: string;
  nivel: number;
}

export interface CimaActiveIngredient {
  id: number;
  codigo: string;
  nombre: string;
  cantidad?: string;
  unidad?: string;
  orden?: number;
}

export interface CimaDocument {
  tipo: number;
  url: string;
  urlHtml?: string;
  secc: boolean;
  fecha?: number;
}

export interface CimaPhoto {
  tipo: string;
  url: string;
  fecha?: number;
}

export interface CimaPresentation {
  nregistro?: string;
  cn: string;
  nombre: string;
  pactivos?: string;
  labtitular?: string;
  estado?: CimaStatus;
  cpresc?: string;
  comerc?: boolean;
  conduc?: boolean;
  triangulo?: boolean;
  huerfano?: boolean;
  ema?: boolean;
  psum?: boolean;
  docs?: CimaDocument[];
  notas?: boolean;
}

export interface CimaMedicineSummary {
  nregistro: string;
  nombre: string;
  labtitular?: string;
  labcomercializador?: string;
  cpresc?: string;
  estado?: CimaStatus;
  comerc?: boolean;
  receta?: boolean;
  generico?: boolean;
  conduc?: boolean;
  triangulo?: boolean;
  huerfano?: boolean;
  biosimilar?: boolean;
  nosustituible?: CimaItem;
  psum?: boolean;
  notas?: boolean;
  materialesInf?: boolean;
  ema?: boolean;
  docs?: CimaDocument[];
  fotos?: CimaPhoto[];
  viasAdministracion?: CimaItem[];
  formaFarmaceutica?: CimaItem;
  formaFarmaceuticaSimplificada?: CimaItem;
  vtm?: CimaItem;
  dosis?: string;
}

export interface CimaMedicineDetail extends CimaMedicineSummary {
  pactivos?: string;
  atcs?: CimaAtc[];
  principiosActivos?: CimaActiveIngredient[];
  excipientes?: CimaActiveIngredient[];
  presentaciones?: CimaPresentation[];
}
