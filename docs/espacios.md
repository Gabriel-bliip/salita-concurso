# Categorías y exploración de espacios

El catálogo está en `/espacios`. Todas las categorías usan `CoworksPage`, `MapPage`,
`useCategoryExploration`, `CoworkFilters`, las tarjetas y el mismo mapa Leaflet.
Las rutas `/espacios/:categoryId` y `/espacios/:categoryId/mapa` mantienen los filtros
en la URL. `/coworks` y `/mapa` redirigen a Cowork conservando sus parámetros;
las fichas antiguas `/coworks/:slug` siguen funcionando, además de `/ubicaciones/:slug`.

## 1. Agregar una categoría

Agrega una entrada a `definitions` en `src/data/categories.ts`, con `id` único y
estable (apto para URL), `name` y `filters`. Por ejemplo, inicialmente `filters: {}`
o `{ comuna: true }`. `CategoryId` se deriva de este registro: no hay que ampliar
manualmente un tipo, crear rutas ni componentes. El orden define la posición de las tarjetas.
Una categoría sin ubicaciones muestra un estado vacío en lista y mapa.

## 2. Agregar una ubicación

Ejecuta `npm run spaces:add` desde la raíz. El asistente solicita categoría,
datos, contacto, horarios, fotos y espacios reservables; valida y guarda en
`src/data/locations.json` únicamente después de confirmar. Consulta
[la guía práctica](../AGREGAR-ESPACIOS.md) para el recorrido completo.

`LOCATIONS` es la fuente común para exploración, fichas y reservas. `COWORKS` mantiene
solo la selección Cowork del inicio. `withLocation` admite registros antiguos sin
`categoryId` y los normaliza como `cowork`; las altas nuevas deben declararlo.
No se reclasifican las salas reservables de un cowork como ubicaciones independientes.

Usa `images: []`, `photoCaptions: []`, `amenityIds: []` o `spaces: []` cuando no haya
datos correspondientes. Una ubicación sin espacios reservables sigue apareciendo
en lista y mapa, sin mostrar precio ni botón de reserva en su ficha. Los tipos
reservables actuales son los de `src/types/space.ts`; nuevos tipos con reglas de
capacidad o precio distintas requieren ampliar ese modelo y su lógica de reserva.

## 3. Configurar filtros

En `filters` de cada categoría se pueden habilitar:

- `spaceTypes`: tipos de espacio reservable permitidos (`SpaceType[]`).
- `people`: opciones numéricas del selector de capacidad. Las URLs antiguas siguen
  aceptando cualquier entero positivo si este filtro está habilitado.
- `comuna: true`: opciones derivadas exclusivamente de las ubicaciones de esa categoría.
  Sin ubicaciones, el selector está deshabilitado.
- `amenityIds`: servicios disponibles del registro `src/data/amenities.ts`.
- `attributes`: filtros adicionales con `id`, `label` y `options: [{ value, label }]`.

Define los atributos nuevos en `attributes` de la categoría, con `id`, `label`
y `type`. Los tipos son `text`, `number`, `boolean`, `select` y `multiselect`.
Los de selección incluyen `options: [{ value, label }]`; con `filter: true` generan
también los filtros web. `required: true` exige una respuesta en las altas nuevas.
Consulta [los ejemplos](../AGREGAR-ESPACIOS.md#agregar-atributos-específicos).

El asistente guarda las respuestas en `location.attributes[id]`. Las definiciones
anteriores en `filters.attributes` conservan sus filtros y generan preguntas
opcionales de selección múltiple. No repitas una definición en ambos lugares.

Las selecciones múltiples requieren todos los valores elegidos. Los atributos ausentes
no coinciden con un filtro activo. La URL usa parámetros repetidos
`attribute.equipment=piano`; opciones desconocidas y filtros no habilitados se ignoran.
Limpiar filtros conserva la categoría. No habilites filtros ni opciones de características
no verificadas: las nuevas categorías únicamente configuran comuna por ahora.

## 4. Portadas e íconos

En una categoría, agrega `cover: { src: '/images/categoria.jpg', alt: 'Descripción' }`
y coloca el archivo en `public/images`. También puedes importar un ícono de
`lucide-react` y asignarlo a `icon`. La imagen tiene prioridad; si falta o falla,
aparece el ícono configurado o el placeholder común, con la paleta existente.
Sin descripción adicional, omite `alt` para que la portada sea decorativa y el
nombre de la tarjeta sea el texto accesible. Las imágenes se cargan de forma diferida.

Las portadas de **ubicaciones** se configuran por separado en `images` y
`photoCaptions`; la primera imagen alimenta también su marcador en el mapa.

## Comprobaciones

Ejecuta `npm run lint`, `npm run build` y `npm test` (Node 22.18+ o 24+, sin dependencias
de pruebas). Los tests verifican migración, filtros Cowork, aislamiento por categoría,
atributos, parámetros URL y ubicaciones sin espacios reservables.
En navegador, prueba el catálogo a 320 px y en escritorio, el cambio lista/mapa con
filtros, una categoría vacía, una URL desconocida, los enlaces antiguos, la ficha y
la reserva. Para clustering, spiderfy y marcadores, sigue [la guía del mapa](ubicaciones.md).
