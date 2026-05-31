# Panacea

SPA Angular para buscar medicamentos en CIMA AEMPS por nombre, principio activo o sintomas
coloquiales normalizados en cliente. El objetivo del proyecto es demostrar que una arquitectura
reactiva, cache local y NLP clasico pueden resolver este caso con baja latencia, bajo coste y sin
enviar consultas a un modelo generativo.

## Stack

- Angular 21 con componentes standalone.
- RxJS para debounce, cancelacion y composicion de peticiones.
- `HttpInterceptorFn` con cache en memoria, TTL y deduplicacion de llamadas simultaneas.
- `Fuse.js` para tolerancia ligera a errores tipograficos sobre el diccionario local.
- Indice clinico estatico generado desde dataset local versionado.
- Vitest + Angular testing utilities.

## Scripts

```bash
npm start
npm run clinical:index
npm test -- --watch=false
npm run build
npm run build -- --base-href=/Panacea/
```

## Arquitectura

- `src/app/core`: integracion CIMA e interceptor de cache.
- `src/app/features/search`: UI del buscador, motor NLP puro e indice clinico.
- `src/app/features/search/data/clinical-source.json`: dataset fuente para sintomas,
  enfermedades, sinonimos, principios activos de busqueda y red flags.
- `tools/build-clinical-index.mjs`: generador del indice TypeScript usado por Angular.
- `src/app/models`: interfaces TypeScript para CIMA y modelos internos de busqueda.
- `.github/workflows/deploy.yml`: build, tests y despliegue a GitHub Pages.

La API CIMA expone `buscarEnFichaTecnica` como POST, pero su preflight `OPTIONS` no devuelve
cabeceras CORS suficientes para una SPA estatica en GitHub Pages. Por eso el metodo POST queda
tipado en `CimaApiService`, mientras que la busqueda publica por sintoma usa un diccionario
transparente de sintomas a principios activos y endpoints GET compatibles con navegador.

El indice clinico se genera antes de `test` y `build`. La app no llama a APIs terminologicas en
runtime: mantiene privacidad, evita CORS y conserva latencia baja. Para ampliar cobertura se edita
el dataset fuente o se anade un importador revisado desde terminologias oficiales como SNOMED CT o
CIE-10-ES, y se regenera el indice.

## Seguridad

Panacea reutiliza datos oficiales de CIMA AEMPS, pero no es una aplicacion oficial ni esta
afiliada a AEMPS. Su uso es informativo y educativo: no ofrece diagnostico, prescripcion ni
sustituye la valoracion de profesionales sanitarios.

La interfaz etiqueta receta, conduccion, comercializacion y problemas de suministro cuando CIMA
devuelve esos datos. Las busquedas por sintoma son orientativas para recuperar resultados oficiales,
no recomendaciones terapeuticas.
