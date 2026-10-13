# Agregar ubicaciones a Salita

## Ejecutar el asistente

Desde la raíz del proyecto, con Node **22.18+ o 24+** y las dependencias instaladas:

```sh
npm install
npm run spaces:add
```

No necesitas conocer los archivos internos ni editar código para agregar una ubicación.
Selecciona opciones por su número. Los campos indican si son obligatorios u opcionales;
**Enter** omite los opcionales. Para seleccionar varias opciones, escribe `1,3`.
Escribe `:cancelar` en cualquier pregunta o presiona **Ctrl+C** para salir sin guardar.
Cerrar la entrada de la terminal también cancela.

## Agregar una ubicación completa

Ten a mano los datos reales del lugar y sigue estas preguntas:

1. **Categoría:** elige una de la lista.
2. **Datos básicos:** nombre, descripción, dirección completa y comuna.
3. **Coordenadas:** latitud y longitud, con punto decimal, obtenidas de un mapa.
   La dirección no se convierte automáticamente en coordenadas.
4. **Contacto opcional:** correo, teléfono y sitio web (`https://…`). Se guarda en
   los datos; actualmente la ficha web no muestra una sección de contacto.
5. **Atributos de la categoría:** aparecen automáticamente si están configurados.
6. **Servicios:** selecciona los comprobados o pulsa Enter.
7. **Horario:** indica cada día como `9-18`, con horas enteras de 0 a 24.
   Enter significa cerrado. El cierre debe ser posterior a la apertura.
8. **Reglas:** escribe una por respuesta; termina con Enter.
9. **Fotos opcionales:** confirma con `sí`, indica una URL o una ruta como
   `/images/sala.jpg` y su descripción. Para rutas locales, coloca previamente el
   archivo en `public/images/`. El asistente no descarga ni copia imágenes.
10. **Espacios reservables opcionales:** puedes agregar varios escritorios, salas
    de reuniones u oficinas. Cada uno pide descripción, precio por hora en CLP,
    mínimo de horas, capacidad y equipamiento según corresponda. Debe existir
    un horario abierto que permita la duración mínima de la reserva.
11. **Resumen:** revisa todos los datos y responde `sí` para guardar. Enter o `no`
    cancela sin modificar archivos.

El asistente genera los identificadores y la URL. Rechaza un lugar con el mismo
nombre y dirección (ignorando mayúsculas, tildes y diferencias de puntuación).
Si dos lugares distintos tienen el mismo nombre, agrega un sufijo a la URL.

Sin espacios reservables, la ubicación aparece en lista y mapa, sin precio ni
botón de reserva. Sin fotos se usan las imágenes de respaldo de la aplicación.

Se guarda exclusivamente en **`src/data/locations.json`**, la fuente compartida
por la web y el asistente. Los datos existentes conservan sus identificadores,
URLs, horarios y capacidades. No hay base de datos ni servicio externo de escritura.
El cambio queda local hasta que lo publiques con el flujo habitual del proyecto.

Después de guardar:

```sh
git diff -- src/data/locations.json
npm run dev
```

Abre la ficha indicada en la terminal (`/ubicaciones/…`) y el listado y mapa de
la categoría (`/espacios/…` y `/espacios/…/mapa`). Comprueba la posición real.

## Crear una categoría nueva

En `definitions`, dentro de **`src/data/categories.ts`**, agrega una entrada:

```ts
{
  id: 'sala-danza',
  name: 'Sala de danza',
  filters: { comuna: true },
},
```

Usa un `id` único, estable, en minúsculas y con guiones. Reinicia el asistente:
la categoría estará disponible. El catálogo, sus rutas y el tipo `CategoryId`
se actualizan desde ese mismo registro; no hay que crear páginas.
Puedes agregar `cover: { src: '/images/danza.jpg', alt: 'Sala de danza' }`.

## Agregar atributos específicos

En la misma entrada de categoría agrega `attributes`. Por ejemplo:

```ts
attributes: [
  { id: 'area', label: 'Superficie en m²', type: 'number', min: 1, required: true },
  { id: 'soundproof', label: '¿Tiene aislamiento acústico?', type: 'boolean' },
  { id: 'notes', label: 'Indicaciones de acceso', type: 'text', example: 'Entrada por el patio' },
  {
    id: 'equipment',
    label: 'Equipamiento disponible',
    type: 'multiselect',
    options: [
      { value: 'mirrors', label: 'Espejos' },
      { value: 'barre', label: 'Barra de danza' },
    ],
    filter: true,
  },
],
```

Cada atributo necesita `id`, `label` y `type`. Su `id` debe ser único dentro de
la categoría. Por defecto es opcional; `required: true` lo hace obligatorio para
las nuevas altas. `number` acepta `min`, `max` e `integer: true` si exige enteros.
`select` elige una opción; `multiselect` permite varias. Ambos necesitan `options`.
`boolean` acepta sí/no. `example` muestra una ayuda junto a la pregunta.

En los atributos de selección, `filter: true` genera también los filtros de lista
y mapa usando las mismas opciones. No repitas ese atributo en `filters.attributes`.
Las configuraciones anteriores en `filters.attributes` siguen funcionando y generan
preguntas de selección múltiple opcionales. Los atributos no crean secciones nuevas
en la ficha ni cambian las reglas de reserva. Los registros antiguos pueden carecer
de los atributos nuevos; no se inventan valores ni se modifican automáticamente.

Las comunas se definen una sola vez en `COMUNA_OPTIONS`, en `src/types/index.ts`.
Para incorporar otra, agrégala allí. Los filtros web muestran las comunas con datos.

## Verificar y resolver errores

```sh
npm test
npm run lint
npm run build
```

Las pruebas crean datos en carpetas temporales y los eliminan al terminar.
El asistente vuelve a preguntar ante formatos u opciones inválidos. No sobrescribe
cambios de otra sesión: si los datos cambiaron durante las preguntas, reinícialo.
El guardado usa un bloqueo y reemplazo atómico para evitar escrituras parciales.
Si un cierre forzado dejó `src/data/locations.json.lock`, verifica primero que no
haya otro asistente ejecutándose y elimina ese archivo de bloqueo. No borres el JSON.
Un cierre forzado también puede dejar un archivo `locations.json.*.tmp`; una vez
cerrados los asistentes puedes eliminarlo, pues la web solo consume `locations.json`.
