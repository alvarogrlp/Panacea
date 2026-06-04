# Arranque Local Y Despliegue

## Requisitos

- Node.js compatible con Angular 21.
- npm.

El proyecto usa:

```bash
npm@11.9.0
```

## Instalacion

```bash
npm install
```

## Desarrollo Local

```bash
npm start
```

La app queda disponible normalmente en:

```text
http://127.0.0.1:4200/
```

## Generar Indice Clinico

```bash
npm run clinical:index
```

Este comando transforma:

```text
src/app/features/search/data/clinical-source.json
```

en:

```text
src/app/features/search/clinical-index.generated.ts
```

Tambien se ejecuta automaticamente antes de `test` y `build`.

## Tests

```bash
npm test -- --watch=false
```

## Build Local

```bash
npm run build
```

## Build Para GitHub Pages

```bash
npm run build -- --base-href=/Panacea/
```

El `base-href` es importante porque GitHub Pages sirve el proyecto desde una subruta del dominio:

```text
https://alvarogrlp.github.io/Panacea/
```

## Despliegue

El despliegue se realiza con GitHub Actions en:

```text
.github/workflows/deploy.yml
```

El workflow:

1. Instala dependencias.
2. Ejecuta tests.
3. Compila con el `base-href` del repositorio.
4. Publica el artefacto estatico en GitHub Pages.

Al hacer push a `main`, GitHub Actions publica la nueva version.
