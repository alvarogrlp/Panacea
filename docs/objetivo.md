# Objetivo Del Proyecto

Panacea es una SPA Angular que actua como buscador clinico-informativo sobre medicamentos de CIMA
AEMPS. El objetivo principal es demostrar que un buscador especializado puede ser rapido, privado y
util sin usar IA generativa cuando el problema se resuelve mejor con arquitectura, datos estructurados
y algoritmos clasicos.

## Problema

En salud, muchas busquedas no empiezan con el nombre exacto de un medicamento. Un estudiante o
profesional puede escribir un sintoma, una enfermedad, un sinonimo tecnico, una frase coloquial o una
palabra con errores:

- `dolor de cabeza`
- `nauseas`
- `acidez`
- `malestar general`
- `dolor rodilla`
- `picazon`

La dificultad esta en conectar esa entrada humana con terminos clinicos y principios activos utiles
para consultar fuentes oficiales.

## Enfoque

Panacea resuelve el problema con una cadena transparente:

1. Normaliza la consulta: minusculas, tildes, signos, espacios, stop-words y verbos comunes.
2. Detecta terminos clinicos, sintomas, enfermedades y sinonimos desde un indice local.
3. Usa un `Map<string, ...>` para resolver equivalencias frecuentes en O(1).
4. Aplica busqueda difusa ligera para corregir errores tipograficos.
5. Consulta endpoints GET de CIMA compatibles con navegador.
6. Agrupa medicamentos equivalentes y muestra variantes de forma ordenada.

## Por Que Es Mejor Que IA Para Este Caso

La IA generativa es potente cuando hay que sintetizar, razonar sobre texto libre o crear respuestas
nuevas. Pero Panacea no necesita inventar informacion: necesita recuperar datos oficiales de forma
precisa, rapida y explicable.

Este enfoque aporta:

- Menor latencia: la mayor parte del trabajo ocurre en cliente.
- Menor coste: no hay llamadas a modelos externos.
- Mas privacidad: la consulta no se envia a un proveedor de IA.
- Mas control: el indice clinico es versionado, revisable y testeable.
- Menos riesgo de alucinacion: los resultados vienen de CIMA.

## Valor Como Proyecto Portfolio

El proyecto muestra criterio de producto y de ingenieria:

- No usa tecnologia por moda, sino por adecuacion al problema.
- Separa UI, motor de busqueda, integracion HTTP, modelos y datos clinicos.
- Incluye tests sobre normalizacion, cache, servicios y comportamiento critico.
- Esta preparado para despliegue publico como SPA estatica.
- Mantiene avisos claros sobre uso educativo y no prescriptivo.

## Publico Objetivo

Panacea esta pensado como herramienta de consulta informativa para:

- Estudiantes de medicina.
- Estudiantes de enfermeria.
- Profesionales sanitarios que quieran navegar rapidamente datos oficiales.
- Reclutadores o equipos tecnicos que quieran evaluar arquitectura frontend aplicada a un caso real.
