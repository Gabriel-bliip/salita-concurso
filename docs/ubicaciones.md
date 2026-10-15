# Ubicaciones y mapa

## Dónde se editan

Los lugares se guardan en **`src/data/locations.json`**, la única fuente estática.
`src/data/coworks.ts` carga y normaliza esos registros como `LOCATIONS` para
el listado, las fichas y el mapa. `COWORKS` conserva la selección Cowork del inicio.

## Cómo agregar un lugar

Desde la raíz ejecuta:

```sh
npm run dev
```

Abre `/admin`, completa el formulario y pulsa **Guardar** para confirmar los datos.
Consulta [la guía práctica](agregar-espacios.md) para completar
una ubicación, crear categorías y configurar atributos sin duplicar formularios.

La dirección no se geocodifica automáticamente: indica las coordenadas reales y
comprueba su posición en el mapa. En Santiago, ambas suelen ser negativas.
Las fotos usan rutas públicas como `/images/sala.jpg` o URLs; la primera es la
portada del marcador. Sin fotos, o si falla la portada, se usa
`public/cowork-placeholder.svg`.

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
Para incorporar un nuevo lugar, usa `/admin` con `npm run dev`:
el marcador, su portada, el agrupamiento, los filtros y los enlaces se generan solos.

## Cómo funciona el mapa

1. `src/data/coworks.ts` normaliza `locations.json` con `withLocation` y produce `LOCATIONS`; `COWORKS` conserva solo Cowork.
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
