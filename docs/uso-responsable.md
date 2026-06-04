# Uso Responsable Y Limites

Panacea reutiliza datos oficiales de CIMA AEMPS, pero no es una aplicacion oficial ni esta afiliada a
AEMPS.

## Que Es

- Una SPA informativa y educativa.
- Un buscador rapido sobre datos oficiales.
- Una demostracion de arquitectura frontend aplicada a un caso sanitario.
- Una herramienta de apoyo para explorar medicamentos, principios activos y documentos oficiales.

## Que No Es

- No es un producto sanitario.
- No diagnostica.
- No prescribe.
- No sustituye la valoracion de profesionales sanitarios.
- No decide tratamientos.

## Busquedas Por Sintoma

Las busquedas por sintoma son orientativas. El motor transforma lenguaje humano en terminos clinicos
o principios activos para recuperar resultados en CIMA, pero no afirma que un medicamento sea
adecuado para una persona concreta.

Ejemplo:

```text
dolor de cabeza -> cefalea -> busqueda oficial en CIMA
```

El resultado debe leerse como informacion oficial recuperada, no como recomendacion terapeutica.

## Datos Oficiales

Cuando CIMA devuelve informacion disponible, la UI muestra:

- Si requiere receta.
- Advertencias sobre conduccion.
- Estado de comercializacion.
- Problemas de suministro.
- Laboratorio.
- Enlaces a ficha tecnica y prospecto.

## Criterio De Seguridad

El proyecto prioriza prudencia:

- Las consultas ambiguas pueden tener confianza baja.
- Algunas entradas muestran varios principios activos para mejorar recuperacion, no para indicar
  tratamiento.
- Los posibles signos de alarma se etiquetan sin bloquear la consulta.
- El indice clinico es revisable y testeable para evitar comportamiento opaco.
