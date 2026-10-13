# Tutorial: cómo agregar un espacio a Salita

Esta guía explica cómo agregar un lugar al catálogo, mostrarlo en el mapa y configurar
los espacios que se pueden reservar dentro de él. Los datos se editan en archivos del
proyecto; actualmente no existe un panel de administración para hacerlo desde la web.

## 1. Identificar qué vas a agregar

En el proyecto hay tres conceptos:

| Concepto | Ejemplo | Dónde se agrega |
| --- | --- | --- |
| Categoría | Sala de reuniones | `src/data/categories.ts` |
| Ubicación | Un local con nombre, dirección y marcador propio | `coworkEntries` en `src/data/coworks.ts` |
| Espacio reservable | Una sala dentro de ese local, con capacidad y precio por hora | El arreglo `spaces` de la ubicación |

Para agregar un lugar a una categoría existente, empieza en el paso 2.
Si solo quieres agregar una sala a un lugar que ya existe, busca su registro y ve
directamente al paso 4. Para una categoría nueva, consulta el paso 7.

Una sala de reuniones dentro de un cowork puede seguir siendo parte de ese cowork.
La categoría identifica al lugar completo; no crea automáticamente una ubicación
por cada sala interior.

## 2. Elegir la categoría y reunir los datos

Estos son los identificadores actuales. Copia el valor de la segunda columna en
`categoryId`, respetando exactamente su escritura:

| Categoría visible | `categoryId` |
| --- | --- |
| Cowork | `cowork` |
| Taller de música | `taller-musica` |
| Taller de arte | `taller-arte` |
| Sala de terapia | `sala-terapia` |
| Salón de eventos | `salon-eventos` |
| Sala de reuniones | `sala-reuniones` |
| Estudio fotográfico | `estudio-fotografico` |
| Sala de ensayo | `sala-ensayo` |
| Aula de formación | `aula-formacion` |

Prepara el nombre, la descripción, la dirección, la comuna, las coordenadas, los
horarios y las reglas del lugar. Si vas a habilitar reservas, reúne también la
capacidad, el precio por hora y la duración mínima de cada espacio reservable.

Las comunas admitidas están en el tipo `Comuna` de `src/types/index.ts`:
Santiago Centro, Providencia, Las Condes, Ñuñoa, Vitacura y Lo Barnechea.
Para usar una comuna distinta, agrégala primero a ese tipo siguiendo el mismo formato.
Las opciones del filtro se calculan después a partir de las ubicaciones cargadas.

## 3. Agregar el registro de la ubicación

Abre [`src/data/coworks.ts`](src/data/coworks.ts) y busca:

```ts
const coworkEntries: Parameters<typeof withLocation>[0][] = [
```

Aunque el archivo se llama `coworks.ts`, este arreglo contiene las ubicaciones de
**todas las categorías**. Agrega el nuevo objeto al final del arreglo, antes de su
corchete de cierre `]`. Conserva la coma entre objetos y no reemplaces los existentes.

Esta plantilla corresponde a una ubicación de la categoría Sala de reuniones:

```ts
  {
    id: 'ubicacion-sala-nueva',
    categoryId: 'sala-reuniones',
    slug: 'sala-nueva',
    name: 'Nombre real del lugar',
    comuna: 'Providencia',
    address: 'Dirección real: calle, número, piso y comuna',
    location: {
      latitude: LATITUD_REAL,
      longitude: LONGITUD_REAL,
    },
    description: 'Descripción real del lugar y de lo que ofrece.',
    amenityIds: [],
    openingHours: schedule(9, 18),
    rules: [],
    images: [],
    photoCaptions: [],
    spaces: [],
  },
```

**Antes de guardar, reemplaza los textos de ejemplo y los horarios por los reales.**
`LATITUD_REAL` y `LONGITUD_REAL` son marcadores de la plantilla: debes sustituirlos
por números decimales, sin comillas, usando punto decimal. Por ejemplo, el formato
de una latitud es `-33.42`; ese número no es la ubicación de tu local. La plantilla
no compilará mientras queden esos marcadores.

Ten en cuenta estos campos:

- `id`: identificador interno único entre todas las ubicaciones.
- `slug`: nombre usado en la URL. Usa minúsculas y guiones, sin espacios ni tildes;
  debe ser único. Evita cambiarlo después, porque cambiaría el enlace de la ficha.
- `categoryId`: identificador del paso 2. Decláralo siempre en altas nuevas;
  los registros antiguos sin categoría se interpretan como Cowork.
- `location`: latitud primero y longitud después, en grados decimales WGS84.
  Obtén ambas de un mapa y verifica que correspondan a la entrada del lugar.
- `amenityIds`: servicios comprobados. Los identificadores disponibles están en
  [`src/data/amenities.ts`](src/data/amenities.ts), por ejemplo `wifi` o `parking`.
- `rules`: un texto por regla, por ejemplo `['Dejar la sala ordenada al terminar.']`,
  únicamente si esa es una regla real del lugar.

**La dirección escrita no genera las coordenadas automáticamente.** Si falta una
dirección válida o las coordenadas son inválidas, el sistema sustituye dirección,
comuna y coordenadas por el respaldo Suecia 810, Providencia. Completa los tres
campos para que el marcador quede en el lugar correcto.

### Configurar el horario

La función `schedule` ya existe en el mismo archivo:

```ts
openingHours: schedule(9, 18), // Lunes a viernes, 09:00–18:00.
```

Si también abre el sábado:

```ts
openingHours: schedule(9, 18, [10, 14]), // Sábado, 10:00–14:00; domingo cerrado.
```

Si cada día tiene un horario distinto, escribe el objeto completo en `openingHours`.
Las claves van de `0` (domingo) a `6` (sábado); cada día admite
`{ open: 9, close: 18 }` o `null` si está cerrado. Actualmente se utilizan horas enteras.

Con `spaces: []`, el lugar aparecerá en el listado y el mapa, pero su ficha no
mostrará precio ni botón de reserva. Continúa con el siguiente paso para agregar
una unidad que se pueda reservar.

## 4. Agregar una sala u otro espacio reservable

Dentro del registro anterior, reemplaza `spaces: []` por un arreglo como este,
ajustando nombre, descripción, capacidad, equipamiento y precio a los datos reales:

```ts
    spaces: [
      {
        id: 'sala-nueva-reunion-1',
        type: 'meeting_room',
        name: 'Sala principal',
        description: 'Descripción real de esta sala.',
        pricePerHour: 15000,
        minHours: 1,
        capacity: { min: 2, max: 6 },
        equipment: [],
      },
    ],
```

El precio del ejemplo es orientativo: `15000` significa $15.000 CLP por hora.
`minHours: 1` permite reservas desde una hora. Agrega más objetos separados por comas
si el lugar tiene varias salas y asigna un `id` distinto a cada una.

El modelo actual admite estos tipos reservables:

| `type` | Campos específicos |
| --- | --- |
| `coworking` | `capacity: 1` y `deskCount` con la cantidad de escritorios |
| `meeting_room` | `capacity: { min, max }` y `equipment` |
| `office_box` | `capacity` como número entero entre 2 y 6 |

Todos necesitan `id`, `name`, `description`, `pricePerHour` y `minHours`.
Para `equipment`, las opciones actuales son `screen`, `whiteboard`, `video_call`
y `projector`. Usa `[]` si no hay equipamiento de esos tipos.

**Categoría y tipo reservable son campos distintos.** Por ejemplo,
`categoryId: 'sala-reuniones'` y `type: 'meeting_room'` son una combinación válida.
Un identificador de categoría como `taller-musica` no puede usarse como `type`.
Si el lugar necesita un tipo reservable nuevo, hay que ampliar
[`src/types/space.ts`](src/types/space.ts) y la lógica de capacidad, presentación y
reserva. Puedes mantener `spaces: []` hasta implementar ese soporte.

## 5. Incorporar fotos del lugar

Guarda las imágenes en `public/images/`, creando la carpeta si hace falta.
Después agrega las rutas y sus descripciones en el registro de la ubicación:

```ts
    images: [
      '/images/sala-nueva-portada.jpg',
      '/images/sala-nueva-interior.jpg',
    ],
    photoCaptions: [
      'Vista general de la sala principal',
      'Mesa y disposición interior de la sala',
    ],
```

En las rutas escribe `/images/...`, sin anteponer `public`.
La primera imagen es la portada y también se utiliza en el marcador del mapa.
Mantén las descripciones en el mismo orden que las fotos. Si todavía no hay imágenes,
deja ambos arreglos vacíos para utilizar los placeholders existentes.

## 6. Habilitar filtros para la categoría, si corresponde

El filtro de categoría se aplica automáticamente. Las categorías nuevas ya incluyen
el filtro de comuna y sus opciones aparecerán al cargar sus ubicaciones.

Para habilitar más filtros, edita el campo `filters` de **la entrada existente** en
[`src/data/categories.ts`](src/data/categories.ts). Por ejemplo, una categoría de
salas de reuniones con datos reales de capacidad y servicios podría usar:

```ts
filters: {
  comuna: true,
  people: [2, 4, 6],
  amenityIds: ['wifi', 'parking'],
},
```

Personas se compara con la capacidad de los elementos de `spaces`; no con una
capacidad total del edificio. Servicios se compara con `amenityIds` de la ubicación.
Configura únicamente opciones respaldadas por los datos de esa categoría.

### Agregar una característica específica

Por ejemplo, si un taller de música dispone realmente de piano, agrega al registro:

```ts
attributes: {
  equipment: ['piano'],
},
```

En `filters` de la categoría `taller-musica`, conserva `comuna` y agrega:

```ts
filters: {
  comuna: true,
  attributes: [
    {
      id: 'equipment',
      label: 'Instrumentos disponibles',
      options: [{ value: 'piano', label: 'Piano' }],
    },
  ],
},
```

El `id` del filtro debe coincidir con la clave en `attributes`, y `value` con el
valor guardado. El sistema generará los chips y filtrará lista y mapa.
Si se seleccionan varias opciones, la ubicación debe tenerlas todas. Una ubicación
sin ese atributo no coincidirá cuando el filtro esté activo.

Estos atributos sirven para filtrar; no generan automáticamente nuevos apartados
de información en la ficha ni nuevos tipos de reserva.

## 7. Agregar una categoría nueva, solo si la necesitas

En `definitions`, dentro de `src/data/categories.ts`, agrega una entrada:

```ts
  { id: 'nombre-categoria', name: 'Nombre de la categoría', filters: { comuna: true } },
```

El `id` debe ser único, estable y apto para URL. Su posición en el arreglo determina
el orden de la tarjeta. El catálogo, el tipo `CategoryId` y las rutas se adaptan
automáticamente. Luego puedes usar ese identificador en una ubicación siguiendo
los pasos anteriores.

La categoría tendrá estas rutas:

- `/espacios/nombre-categoria`: listado.
- `/espacios/nombre-categoria/mapa`: mapa.

Hasta que agregues una ubicación, mostrará un estado vacío.

### Personalizar la tarjeta de categoría

Para usar una imagen, agrega `cover` a la entrada de la categoría:

```ts
cover: { src: '/images/portada-categoria.jpg', alt: 'Descripción de la portada' },
```

Para usar un ícono, impórtalo desde `lucide-react` al principio de `categories.ts`,
por ejemplo `import { Music } from 'lucide-react'`, y agrega `icon: Music` a la entrada.

La imagen tiene prioridad sobre el ícono. Si falta o falla la imagen, se utiliza
el ícono configurado o el placeholder común. Esta portada corresponde a la tarjeta
del catálogo; las fotos de cada ubicación se configuran por separado en el paso 5.

## 8. Comprobar el resultado

Desde la carpeta raíz del proyecto, ejecuta:

```sh
npm run lint
npm run build
npm test
npm run dev
```

Los tests requieren Node 22.18+ o 24+. Abre la dirección que muestre Vite en la
terminal; normalmente es `http://localhost:3000`.

Para el ejemplo `sala-nueva`, comprueba lo siguiente:

1. Entra a `/espacios` y selecciona **Sala de reuniones**.
2. Verifica que el nuevo lugar aparezca en `/espacios/sala-reuniones`.
3. Abre **Ver ubicaciones en el mapa** y revisa dirección, marcador y foto.
4. Abre `/ubicaciones/sala-nueva` y revisa la ficha.
5. Si agregaste elementos a `spaces`, prueba la selección de espacio, fecha,
   horario y personas en la reserva. El pago actual es simulado.
6. Prueba los filtros y cambia entre listado y mapa: deben mostrar los mismos lugares.
7. Comprueba que el lugar no aparezca en otra categoría y revisa la vista móvil.

Algunas pruebas de `tests/categoryFilters.test.mjs` describen los datos actuales de
demostración: asumen que las categorías nuevas están vacías y esperan resultados
concretos para ciertos filtros Cowork. Al agregar datos, actualiza esas expectativas
cuando el cambio sea intencional, manteniendo las pruebas de aislamiento y filtrado.
No elimines pruebas solo para ocultar un error.

## Si algo no aparece como esperabas

| Problema | Qué revisar |
| --- | --- |
| La ubicación no aparece | Que esté dentro de `coworkEntries`, tenga el `categoryId` correcto y no haya filtros activos |
| Aparece en Cowork en vez de otra categoría | Que hayas declarado `categoryId`; omitirlo activa la compatibilidad antigua |
| El marcador aparece en Suecia 810 | Dirección vacía, coordenadas ausentes o inválidas; completa el conjunto correcto |
| No aparece un botón de reserva | El arreglo `spaces` debe contener al menos un espacio reservable válido |
| No aparece una foto | Existencia del archivo, mayúsculas del nombre y ruta `/images/...` |
| No aparece una opción de comuna | Que haya una ubicación de esa categoría con esa comuna |
| Un filtro específico no devuelve resultados | Coincidencia entre `attributes`, el `id` del filtro y sus valores |
| La compilación falla | Marcadores de plantilla sin reemplazar, comas, campos obligatorios e identificadores admitidos |

## Archivos de referencia

- [Configuración central de categorías](src/data/categories.ts).
- [Datos de ubicaciones](src/data/coworks.ts).
- [Modelo de ubicaciones](src/types/index.ts).
- [Tipos de espacios reservables](src/types/space.ts).
- [Guía técnica de categorías y filtros](docs/espacios.md).
- [Guía de coordenadas y funcionamiento del mapa](docs/ubicaciones.md).
