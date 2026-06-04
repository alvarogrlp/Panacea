# Como Funciona Panacea

Panacea convierte una busqueda escrita en lenguaje natural en consultas rapidas contra CIMA AEMPS.
La idea es que el usuario no tenga que saber exactamente si debe buscar por medicamento, principio
activo, enfermedad o sintoma.

## Flujo General

```text
Usuario escribe
    ↓
Angular FormControl + RxJS
    ↓
Normalizacion NLP en cliente
    ↓
Diccionario clinico + busqueda difusa
    ↓
Consulta GET a CIMA
    ↓
Agrupacion de medicamentos equivalentes
    ↓
Resultados + detalle oficial
```

## 1. Entrada Del Usuario

El usuario puede escribir consultas muy diferentes:

- Nombre comercial: `enantyum`
- Principio activo: `paracetamol`
- Sintoma: `dolor de cabeza`
- Enfermedad: `gastritis`
- Termino tecnico: `eritema`
- Termino coloquial: `resaca`
- Consulta con typo: `dolorr rodilla`

La UI no obliga a elegir un modo antes de buscar. El motor intenta inferirlo.

## 2. Busqueda Reactiva

La caja de busqueda esta conectada con RxJS:

- Espera unos milisegundos antes de lanzar la busqueda.
- Ignora consultas repetidas.
- Cancela la peticion anterior si el usuario sigue escribiendo.
- Mantiene estados claros de carga, error, vacio y resultados.

Esto evita saturar la API y mantiene la experiencia fluida.

## 3. Normalizacion NLP

Antes de consultar CIMA, Panacea limpia la consulta:

- Convierte a minusculas.
- Elimina tildes.
- Quita signos y caracteres especiales.
- Compacta espacios.
- Elimina palabras poco utiles.
- Reduce frases coloquiales a conceptos clinicos cuando hay una equivalencia conocida.

Ejemplos:

```text
dolor de cabeza       -> cefalea
picazon               -> prurito o alergia
disfunción eréctil    -> disfuncion erectil
malestar por alcohol  -> resaca
```

## 4. Diccionario Clinico Transparente

El indice clinico vive en el repositorio y se puede revisar. No es una caja negra.

Cada entrada puede incluir:

- Termino medico.
- Sinonimos tecnicos y coloquiales.
- Sistema clinico.
- Principios activos relacionados para recuperar resultados en CIMA.
- Nivel de confianza.
- Posibles patrones de alerta.

Para equivalencias directas se usa un `Map`, por lo que la resolucion es O(1). Esto es importante:
no se necesita un modelo generativo para traducir consultas frecuentes si el dominio esta bien
modelado.

## 5. Tolerancia A Typos

Cuando no hay coincidencia exacta, Panacea usa `Fuse.js` sobre el diccionario local.

Esto permite recuperar busquedas como:

```text
pulmonia       -> neumonia
dolorr rodilla -> dolor de rodilla
```

La busqueda difusa solo ayuda a corregir la entrada; no hace ranking medico opaco ni inventa
respuestas.

## 6. Consulta A CIMA

Una vez normalizada la busqueda, la app consulta endpoints publicos GET de CIMA:

- Por nombre de medicamento.
- Por principio activo.
- Por identificador de medicamento cuando se abre el detalle.

Los resultados siguen siendo oficiales. Panacea mejora la forma de llegar a ellos, no reemplaza la
fuente.

## 7. Cache Y Deduplicacion

Las respuestas HTTP se cachean en memoria durante un TTL corto.

El interceptor evita:

- Repetir peticiones identicas.
- Lanzar varias llamadas iguales al mismo tiempo.
- Guardar errores como si fueran respuestas validas.

Esto reduce latencia y hace que el buscador se sienta instantaneo en consultas repetidas.

## 8. Agrupacion De Resultados

CIMA puede devolver muchas variantes del mismo medicamento: sabores, formatos, dosis o formas de
administracion.

Panacea agrupa esas variantes para que la lista sea mas legible:

- Un grupo representa el medicamento base.
- Las variantes se muestran en desplegables.
- Los duplicados exactos se reducen.
- El usuario puede cargar mas grupos con "ver mas".

## 9. Panel De Detalle

Al seleccionar un medicamento, Panacea muestra informacion orientada a contexto sanitario:

- Nombre.
- Principios activos.
- Laboratorio.
- Receta.
- Conduccion.
- Comercializacion.
- Suministro.
- Ficha tecnica y prospecto cuando CIMA los proporciona.

En escritorio el panel permanece visible mientras se navega. En movil, al seleccionar un medicamento,
la interfaz lleva al usuario directamente al detalle.

## 10. Resultado Final

El resultado es un buscador que:

- Responde rapido.
- No necesita backend.
- No expone consultas a proveedores de IA.
- Usa datos oficiales.
- Es auditable y ampliable.
- Mantiene una experiencia limpia para estudiantes y perfiles sanitarios.

Panacea no intenta sustituir el criterio clinico. Su valor esta en recuperar informacion oficial de
forma mas natural, rapida y explicable.
