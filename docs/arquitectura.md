# Arquitectura Tecnica

Panacea esta organizada para separar responsabilidades y mantener una SPA rapida, testeable y facil
de ampliar.

## Capas

```text
src/app
├── core
│   ├── cima-api.service.ts
│   └── http-cache.interceptor.ts
├── features/search
│   ├── data/clinical-source.json
│   ├── clinical-index.generated.ts
│   ├── clinical-knowledge.ts
│   ├── search-engine.service.ts
│   ├── search.ts
│   ├── search.html
│   └── search.css
├── models
│   ├── cima.models.ts
│   └── search.models.ts
└── shared
```

## Flujo Reactivo

El buscador usa `FormControl.valueChanges` y RxJS para responder en tiempo real sin saturar la red:

- `debounceTime` evita peticiones por cada pulsacion.
- `distinctUntilChanged` ignora consultas repetidas.
- `switchMap` cancela busquedas anteriores cuando llega una nueva.
- Los estados `loading`, `error`, `empty` y resultados se derivan del flujo reactivo.

Este patron mantiene la interfaz fluida incluso con usuarios escribiendo rapido.

## Motor NLP Clasico

`SearchEngineService` es un servicio puro orientado a transformar texto humano en una consulta
normalizada.

Responsabilidades principales:

- Limpieza de texto: minusculas, tildes, signos y espacios.
- Eliminacion de stop-words y verbos comunes.
- Deteccion de sinonimos, enfermedades y sintomas.
- Traduccion con `Map<string, ClinicalKnowledgeEntry>` para acceso O(1).
- Correccion de typos con `Fuse.js` sobre el diccionario local.
- Deteccion de patrones de alerta sin bloquear la busqueda oficial.

El motor no intenta decidir tratamientos. Solo mejora la recuperacion de resultados oficiales.

## Indice Clinico

La fuente editable esta en:

```text
src/app/features/search/data/clinical-source.json
```

Desde ese JSON se genera:

```text
src/app/features/search/clinical-index.generated.ts
```

El generador vive en:

```text
tools/build-clinical-index.mjs
```

El indice generado se ejecuta antes de `test` y `build`, asi se evita desincronizacion entre datos,
tests y aplicacion.

## Integracion CIMA

`CimaApiService` tipa el acceso a la API publica de CIMA:

- `GET /medicamentos?nombre=...`
- `GET /medicamentos?practiv1=...`
- `GET /medicamento?nregistro=...`
- `POST /buscarEnFichaTecnica`, tipado pero no usado por la SPA publica.

El endpoint `buscarEnFichaTecnica` funciona con herramientas como `curl`, pero su preflight CORS
bloquea el uso directo desde una SPA estatica. Por eso la version publica usa una ruta compatible con
GitHub Pages: termino coloquial -> termino clinico/principio activo -> endpoints GET de CIMA.

## Cache HTTP

El interceptor de cache:

- Cachea respuestas por metodo, URL y body.
- Usa TTL configurable.
- Deduplica llamadas simultaneas con `shareReplay(1)`.
- No guarda errores.

Esto reduce latencia, evita peticiones repetidas y mantiene el codigo de componentes limpio.

## Modelado

Los modelos de CIMA estan separados de los modelos internos:

- `CimaPagedResponse<T>`
- `CimaMedicineSummary`
- `CimaMedicineDetail`
- `CimaDocument`
- `CimaActiveIngredient`
- `SearchQuery`
- `NormalizedSearchQuery`
- `SearchResult`
- `SearchMode`

Esta separacion permite adaptar la UI sin acoplarla directamente a la forma exacta de la API externa.

## Testing

La suite cubre:

- Normalizacion NLP.
- Diccionario clinico y sinonimos.
- Tolerancia a errores tipograficos.
- Cache hit, miss, TTL y deduplicacion.
- Servicio CIMA con `HttpTestingController`.
- Casos frecuentes y clinicamente sensibles.

El objetivo de los tests no es simular medicina, sino garantizar que el buscador transforma consultas
y llama a CIMA de forma estable.
