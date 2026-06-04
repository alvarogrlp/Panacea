# Panacea

<p>
  <a href="https://alvarogrlp.github.io/Panacea/">
    <img alt="Abrir Panacea" src="https://img.shields.io/badge/Abrir%20la%20web-Panacea-126b5d?style=for-the-badge" />
  </a>
</p>

<p>
  <img alt="Angular" src="https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="RxJS" src="https://img.shields.io/badge/RxJS-7.8-B7178C?style=flat-square&logo=reactivex&logoColor=white" />
  <img alt="Fuse.js" src="https://img.shields.io/badge/Fuse.js-Fuzzy%20Search-126b5d?style=flat-square" />
  <img alt="Vitest" src="https://img.shields.io/badge/Vitest-4.0-6E9F18?style=flat-square&logo=vitest&logoColor=white" />
  <img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub%20Pages-Deployed-222222?style=flat-square&logo=githubpages&logoColor=white" />
</p>

Buscador ultrarrapido de medicamentos basado en datos oficiales de CIMA AEMPS.
Permite consultar por medicamento, principio activo, enfermedad, sintoma tecnico o termino
coloquial, manteniendo la busqueda en el navegador y sin depender de IA generativa.

## La Idea

Panacea nace de una pregunta sencilla: para un buscador especializado, hay casos en los que una
buena arquitectura es mejor que meter una IA por defecto.

En lugar de enviar cada consulta a un modelo generativo, Panacea usa RxJS, cache local, normalizacion
NLP clasica, busqueda difusa e indices clinicos transparentes para ofrecer resultados rapidos,
baratos, privados y explicables.

## Que Hace

- Busca medicamentos en CIMA por nombre, principio activo y sintomas normalizados.
- Traduce terminos coloquiales a lenguaje clinico: por ejemplo, `dolor de cabeza` a `cefalea`.
- Tolera errores tipograficos con `Fuse.js`.
- Agrupa variantes del mismo medicamento para mantener listas limpias.
- Muestra informacion relevante para contexto sanitario: receta, conduccion, comercializacion,
  suministro, laboratorio y enlaces oficiales.
- Funciona como SPA estatica desplegada en GitHub Pages, sin backend ni claves privadas.

## Por Que No Usa IA Generativa

Porque el problema no necesita inventar respuestas: necesita encontrar informacion oficial con baja
latencia y buen criterio de busqueda.

La app evita coste por token, reduce superficie de privacidad, mejora tiempos de respuesta y mantiene
un comportamiento auditable. Cada normalizacion vive en un indice versionado que puede revisarse,
testearse y ampliar sin cambiar la arquitectura.

## Stack

- Angular 21 con componentes standalone.
- RxJS para debounce, cancelacion y composicion reactiva.
- `HttpInterceptorFn` con cache en memoria, TTL y deduplicacion de llamadas simultaneas.
- `Fuse.js` para tolerancia ligera a typos.
- Dataset clinico local generado a TypeScript antes de test y build.
- Vitest + Angular testing utilities.
- GitHub Actions + GitHub Pages.

## Documentacion

- [Objetivo y enfoque del producto](docs/objetivo.md)
- [Arquitectura tecnica](docs/arquitectura.md)
- [Arranque local y despliegue](docs/arranque.md)
- [Uso responsable y limites](docs/uso-responsable.md)

## Aviso

Panacea reutiliza datos oficiales de CIMA AEMPS, pero no es una aplicacion oficial ni esta afiliada a
AEMPS. Es un proyecto informativo y educativo: no diagnostica, no prescribe y no sustituye la
valoracion de profesionales sanitarios.
