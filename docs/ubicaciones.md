# Ubicaciones de los coworks

## Dónde se editan

Cada lugar se configura una sola vez en `coworkEntries`, dentro de
[`src/data/coworks.ts`](../src/data/coworks.ts). El listado, las fichas y la pestaña
**Mapa** usan los mismos registros normalizados (`COWORKS`).

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
  slug: 'nuevo-cowork', // Debe ser único y mantenerse estable.
  name: 'Nuevo cowork',
  // UBICACIÓN: editar estos tres campos juntos.
  comuna: 'Providencia',
  address: 'Suecia 810, Providencia, Santiago de Chile',
  location: { latitude: -33.421795865179, longitude: -70.607290416391 },
  description: 'Descripción del nuevo espacio.',
  amenityIds: ['wifi', 'coffee'],
  openingHours: 'Lun–Vie 9:00–18:00',
  capacity: 20,
  images: ['/images/nuevo-cowork.jpg'], // Archivo en public/images/nuevo-cowork.jpg.
},
```

El nuevo lugar aparecerá automáticamente en el listado y el mapa sin crear un marcador
a mano. Los filtros activos pueden ocultarlo. Las comunas disponibles se calculan a
partir de los registros. Para incorporar una comuna que todavía no admite el código,
agrégala al tipo `Comuna` en `src/types/index.ts` y a `comunaGradients` en
`src/components/CoworkImage.tsx`, que define el respaldo visual de las tarjetas.

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

Si varios lugares tienen exactamente las mismas coordenadas, comparten una burbuja
con un contador. Al abrirla aparecen todos sus nombres, portadas y enlaces; cada
lugar también conserva su entrada individual debajo del mapa.

## Cómo funciona el mapa

1. `coworkEntries.map(withLocation)` produce los registros de `COWORKS`.
2. `MapPage.tsx` filtra esos registros por comuna y servicios desde la URL.
3. `CoworkMap.tsx` crea los marcadores de Leaflet usando `location` y `images[0]`.
4. Seleccionar un lugar actualiza `?cowork=slug`, centra el mapa y abre su información.
5. La sección **Ubicación** de la ficha enlaza a esa misma URL.

Leaflet se carga al entrar a `/mapa`. El fondo cartográfico se solicita a OpenStreetMap
y requiere conexión. Las coordenadas están guardadas en los datos del proyecto;
no se consulta un geocodificador al abrir el mapa.

## Integración futura con API, base de datos o administrador

Actualmente los lugares son datos estáticos: no existe un formulario de administración
ni una API que persista cambios. Para incorporar una fuente dinámica:

1. Guarda los campos de `Cowork` en la fuente de datos, incluidos dirección, comuna,
   latitud, longitud y portada. Mantén `id` y `slug` únicos y estables.
2. En el alta o edición, obtén y valida las coordenadas. Si se incorpora geocodificación,
   ejecútala al guardar la dirección y persiste el resultado, en lugar de repetirla
   en cada visita al mapa.
3. Sustituye el arreglo estático por un proveedor o cargador compartido y adapta los
   registros a `Cowork` mediante `withLocation`. Maneja carga y errores en ese proveedor.
4. Conecta todos los consumidores de `COWORKS` y `COMUNAS` a esa misma fuente, incluidos
   inicio, listado, filtros, fichas y mapa. Puedes encontrarlos con
   `rg 'COWORKS|COMUNAS' src`. Así los cambios se reflejan de forma consistente.
5. Conserva los enlaces por `slug` y recalcula las comunas con los datos normalizados.
   `CoworkMap` ya recibe una lista de registros como propiedad y no necesita conocer
   el origen de esos registros.

## Comprobación después de editar

- Ejecuta `npm run build` y `npm run lint`.
- Abre `/mapa`, busca el lugar y comprueba su dirección, posición y portada.
- Abre `/coworks/tu-slug` y prueba **Ver ubicación en el mapa**, también al recargar.
- Prueba sus filtros, la vista móvil y, si corresponde, la burbuja de dirección compartida.
