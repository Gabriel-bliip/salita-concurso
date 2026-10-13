# Ubicaciones de los coworks

## Dónde se editan

Cada lugar se configura una sola vez en `coworkEntries`, dentro de
[`src/data/coworks.ts`](../src/data/coworks.ts). El listado, las fichas y la pestaña
**Mapa** usan los mismos registros normalizados (`LOCATIONS`), filtrados por categoría.

| Campo | Qué completar | Dónde se usa |
| --- | --- | --- |
| `id` | Identificador único y estable | Identidad del registro |
| `slug` | Identificador único para URL, sin espacios | `/coworks/:slug` y `/mapa?cowork=:slug` |
| `address` | Calle, número, comuna y ciudad; piso si corresponde | Texto de dirección en ficha, listado del mapa y ventana del marcador |
| `comuna` | Una comuna del tipo `Comuna` | Filtros del listado y del mapa |
| `location.latitude` | Latitud numérica en grados decimales WGS84 | Posición norte/sur del marcador |
| `location.longitude` | Longitud numérica en grados decimales WGS84 | Posición este/oeste del marcador |
| `images` | Rutas públicas o URL de imágenes | La primera imagen es la portada circular del mapa |

**La dirección escrita no se geocodifica automáticamente.** Al cambiar una dirección,
actualiza también sus coordenadas y comuna. Obtén las coordenadas de un mapa o de
un geocodificador y comprueba que correspondan a la entrada del lugar.
En Santiago, ambas coordenadas suelen ser negativas. No intercambies latitud y longitud.

## Cómo agregar un lugar

Agrega un objeto a `coworkEntries`, antes del cierre del arreglo. Este ejemplo usa
la dirección predeterminada; reemplaza sus datos por los del cowork real:

```ts
{
  id: 'cw-10', // Debe ser único.
  categoryId: 'cowork', // ID del registro central src/data/categories.ts.
  slug: 'nuevo-cowork', // Debe ser único y mantenerse estable.
  name: 'Nuevo cowork',
  // UBICACIÓN: editar estos tres campos juntos.
  comuna: 'Providencia',
  address: 'Suecia 810, Providencia, Santiago de Chile',
  location: { latitude: -33.421795865179, longitude: -70.607290416391 },
  description: 'Descripción del nuevo espacio.',
  amenityIds: ['wifi', 'coffee'],
  openingHours: schedule(9, 18), // Lun–Vie 9:00–18:00; sábado opcional: schedule(9, 18, [10, 14]).
  rules: [...BASE_RULES],
  images: ['/images/nuevo-cowork.jpg'], // Archivo en public/images/nuevo-cowork.jpg.
  photoCaptions: ['Zona de escritorios'], // Una descripción por foto (texto alternativo).
  spaces: [
    {
      id: 'cw-10-desk',
      type: 'coworking', // También 'meeting_room' u 'office_box'; ver src/types/space.ts.
      name: 'Escritorio compartido',
      description: 'Escritorio en zona abierta.',
      pricePerHour: 4000, // CLP por hora.
      minHours: 1,
      capacity: 1,
      deskCount: 20,
    },
  ],
},
```

El nuevo lugar aparecerá automáticamente en el listado y el mapa sin crear un marcador
a mano. Los filtros activos pueden ocultarlo. Las comunas disponibles se calculan a
partir de los registros. Para incorporar una comuna que todavía no admite el código,
agrégala al tipo `Comuna` en `src/types/index.ts`.

Si todavía no hay una foto, usa `images: []`. El mapa mostrará
`public/cowork-placeholder.svg`; también lo usa si la imagen de portada falla al cargar.
Las imágenes reales se recortan en forma circular sin modificar el archivo original.

## Qué pasa si falta ubicación

[`src/lib/location.ts`](../src/lib/location.ts) contiene `DEFAULT_LOCATION` y
`withLocation`. Esta función aplica **Suecia 810, Providencia, Santiago de Chile**
cuando falta la dirección, está vacía o las coordenadas faltan o son inválidas.
Comprueba números finitos y rangos de latitud entre −90 y 90 y longitud entre −180 y 180.

La sustitución incluye **dirección, comuna y coordenadas juntas**. Por lo tanto,
escribir una dirección sin coordenadas válidas también activa la sustitución.
No verifica que una dirección escrita coincida geográficamente con las coordenadas:
esa comprobación debe hacerse al cargar los datos.

Los lugares cercanos se agrupan automáticamente en una burbuja con contador al alejar
el mapa. Al acercar, se separan. Pulsar un grupo acerca el mapa a sus integrantes.
Los filtros recalculan los grupos y sus contadores usando solo los resultados visibles.
Si varios lugares tienen exactamente las mismas coordenadas (por ejemplo, el respaldo
Suecia 810), al abrir su grupo se despliegan en abanico con líneas hacia su ubicación.
Esto permite seleccionar cada portada sin cambiar las coordenadas guardadas.
Seleccionar un lugar desde la lista o desde `?cowork=slug` también revela su marcador,
aunque estuviera oculto en un grupo. Cada registro conserva su propia ficha.

## Dónde cambiar colores, detalle y agrupación

| Qué cambiar | Archivo y sección |
| --- | --- |
| Fondo crema | `src/lib/mapConfig.ts` → `MAP_COLORS.background` |
| Mancha urbana, parques y agua | `MAP_COLORS.urban`, `park`, `water` |
| Calles y avenidas | `MAP_COLORS.street`, `avenue`, `avenueBorder` |
| Edificios y textos del fondo | `MAP_COLORS.building`, `text` |
| Color de burbujas y controles | `src/index.css` → sección `MAPA` y variables `--map-accent`, `--map-cluster-bg` |
| Radio de agrupamiento | `MAP_CONFIG.clusterRadius`, en píxeles de pantalla |
| Separación de portadas coincidentes | `MAP_CONFIG.spiderfyDistanceMultiplier` |
| Zoom mínimo/máximo y al seleccionar | `MAP_CONFIG.minZoom`, `maxZoom`, `selectionZoom` |
| Cuándo aparecen detalles | `MAP_CONFIG.detailZoom` |
| Portada de respaldo del mapa y su lista | `MAP_CONFIG.fallbackCover` |

Por ejemplo, `background: '#faf4e6'` cambia el fondo a un crema más cálido.
Aumentar `clusterRadius` de `64` a `80` agrupa más lugares; reducirlo los separa antes.
El radio se mide en píxeles, por lo que la distancia geográfica agrupada disminuye
naturalmente al acercar. No hay que mantener una lista manual de grupos.

`src/lib/mapStyle.ts` define qué capas se dibujan. De lejos se ven avenidas principales,
áreas urbanas, parques y agua. Las vías secundarias aparecen gradualmente desde zoom 13,
las calles locales y sus nombres desde 14, y los edificios desde 16. Estos umbrales
son de **MapLibre**, cuyo zoom es uno menor que el de Leaflet en esta integración.
Cada detalle aparece progresivamente durante el siguiente nivel de zoom.
No se agregan iconos de comercios ni puntos de interés ajenos a los coworks.

Para incorporar una nueva capa cartográfica, agrega una entrada a `mapStyle.layers`,
indica su `source-layer`, `filter`, `minzoom` y colores en `paint`.
Para incorporar un nuevo cowork, basta con agregar su registro a `coworkEntries`:
el marcador, su portada, el agrupamiento, los filtros y los enlaces se generan solos.

## Cómo funciona el mapa

1. `coworkEntries.map(withLocation)` produce `LOCATIONS`; `COWORKS` conserva solo Cowork.
2. `useCategoryExploration` filtra por categoría y sus filtros configurados desde la URL.
3. `CoworkMap.tsx` crea los marcadores de Leaflet usando `location` y `images[0]`.
4. Seleccionar un lugar actualiza `?cowork=slug`, centra el mapa y abre su información.
5. La sección **Ubicación** de la ficha enlaza a esa misma URL.

Leaflet se carga al entrar a `/espacios/:categoryId/mapa` (`/mapa` redirige a Cowork).
`leaflet.markercluster` agrupa los marcadores. Consulta [espacios](espacios.md) para
agregar categorías, filtros específicos o portadas de categorías.
`src/lib/mapBasemap.ts` carga MapLibre por separado para renderizar el fondo vectorial
con datos OpenMapTiles/OpenStreetMap servidos por OpenFreeMap. El fondo requiere
conexión y WebGL; si falla se muestra un aviso y la lista de lugares sigue disponible.
La atribución de los proveedores permanece visible en el mapa.
Las coordenadas están guardadas en los datos del proyecto;
no se consulta un geocodificador al abrir el mapa.

## Integración futura con API, base de datos o administrador

Actualmente los lugares son datos estáticos: no existe un formulario de administración
ni una API que persista cambios. Para incorporar una fuente dinámica:

1. Guarda los campos de `SpaceLocation` en la fuente de datos, incluidos `categoryId`, dirección, comuna,
   latitud, longitud y portada. Mantén `id` y `slug` únicos y estables.
2. En el alta o edición, obtén y valida las coordenadas. Si se incorpora geocodificación,
   ejecútala al guardar la dirección y persiste el resultado, en lugar de repetirla
   en cada visita al mapa.
3. Sustituye el arreglo estático por un proveedor o cargador compartido y adapta los
   registros a `SpaceLocation` mediante `withLocation`. Maneja carga y errores en ese proveedor.
4. Conecta todos los consumidores de `LOCATIONS`, `COWORKS` y `COMUNAS` a esa misma fuente, incluidos
   inicio, listado, filtros, fichas y mapa. Puedes encontrarlos con
   `rg 'LOCATIONS|COWORKS|COMUNAS' src`. Así los cambios se reflejan de forma consistente.
5. Conserva los enlaces por `slug` y recalcula las comunas con los datos normalizados.
   `CoworkMap` ya recibe una lista de registros como propiedad y no necesita conocer
   el origen de esos registros.

## Comprobación después de editar

- Ejecuta `npm run build` y `npm run lint`.
- Abre `/mapa`, busca el lugar y comprueba su dirección, posición y portada.
- Abre `/coworks/tu-slug` y prueba **Ver ubicación en el mapa**, también al recargar.
- Prueba sus filtros, la vista móvil y, si corresponde, la burbuja de dirección compartida.
- Aleja para comprobar contadores; acerca o pulsa un grupo para ver sus integrantes.
- Selecciona desde la lista un lugar agrupado y prueba varios lugares con coordenadas idénticas.
- Comprueba que las calles pequeñas y los edificios aparecen solo al acercar.
