# Administrar y extender los espacios de Salita

## 1. Administrador visual

Usa **`/admin`** para crear, editar, duplicar y eliminar ubicaciones. El panel
permite subir imágenes desde el computador; añadir nuevas imágenes por URL o
ruta pública aún no está disponible.

### Acceder y encontrar ubicaciones

Desde la raíz del proyecto, con Node **22.18+ o 24+** y las dependencias instaladas:

```sh
npm run dev
```

Abre **http://localhost:3000/admin**. El panel y su API solo están disponibles en
el servidor de desarrollo desde localhost; no se incluyen en producción ni en
`vite preview`. El panel no carga mapas ni el flujo de reservas.

El listado agrupa las ubicaciones por categoría. **Buscar por nombre** actualiza
los resultados al escribir e ignora mayúsculas y tildes. Puedes combinar categoría,
comuna, servicio y tipo de unidad reservable. Se muestra el número de resultados;
**Limpiar filtros** restablece el listado y **Recargar datos** vuelve a leer el JSON.
Los filtros por atributos configurados para la web no aparecen como filtros
adicionales en este panel.

### Crear, editar, duplicar y eliminar

- **Crear espacio:** abre una ubicación nueva. Completa nombre, categoría,
  descripción, dirección, comuna y coordenadas con punto decimal. La dirección
  no se convierte automáticamente en coordenadas: comprueba ambas por separado.
- **Editar:** modifica la ubicación seleccionada conservando su ID y su URL.
- **Duplicar:** abre una copia para revisar antes de guardar. Genera otros IDs
  para la ubicación y sus unidades, otra URL y un nombre con «(copia)».
- **Eliminar:** solicita confirmación y elimina la ubicación al aceptarla.
  No existe una opción de deshacer.

En el formulario:

- Marca únicamente los **servicios** comprobados. Los **atributos específicos**
  aparecen según la configuración de la categoría: texto, números, casillas o
  selecciones. En una selección múltiple puedes usar Ctrl/Cmd para elegir varias opciones.
- En **Horarios**, marca los días abiertos y escribe horas enteras de 0 a 24.
  El cierre debe ser posterior a la apertura; un día desmarcado está cerrado.
- Escribe una **regla por línea**. El correo, teléfono y sitio web son opcionales;
  el sitio web debe ser una URL completa como `https://ejemplo.cl`. El contacto
  se guarda, pero la ficha pública no muestra una sección de contacto.
- Añade las **unidades reservables** necesarias: escritorios compartidos, salas
  de reuniones u oficinas privadas. Cada unidad tiene nombre, descripción,
  precio por hora en CLP y mínimo de horas. Los escritorios tienen cantidad de
  puestos y capacidad de una persona por reserva; las salas, capacidades mínima
  y máxima y equipamiento; las oficinas, capacidad de 2 a 6 personas.
  Debe existir al menos un horario abierto en el que quepa la duración mínima.

Una ubicación puede quedar sin unidades reservables: aparece en listado y mapa,
sin precio ni botón de reserva. Sin fotos, la aplicación muestra sus respaldos.

### Imágenes y guardado

Usa **Subir desde el computador** para seleccionar PNG, JPEG o WebP de hasta
**5 MB por archivo**. Revisa las previsualizaciones y sus descripciones; la primera
imagen es la portada. **Quitar imagen** solicita confirmación y prepara su retirada.

Las imágenes seleccionadas permanecen en memoria hasta **Guardar**.
Al guardar se escriben en `public/images/admin/` y sus rutas públicas quedan en
el JSON. La solicitud completa admite hasta 35 MB: si supera el límite, guarda
menos imágenes por vez. Al retirar imágenes o eliminar una ubicación, solo se
borran archivos creados por el panel que ya no use ninguna ubicación; los demás
archivos y las imágenes externas no se eliminan del disco. Una copia puede
compartir imágenes con el original.

**Guardar** valida y escribe directamente en `src/data/locations.json`.
Cambiar campos, seleccionar opciones, subir imágenes o enviar el formulario sin
pulsar ese botón no guarda datos. Cancelar o abandonar descarta los cambios locales.
Si falla, corrige el error indicado. **Cancelar** permite descartar el formulario
con confirmación. Si otra sesión cambió los datos, cancela el formulario, recarga
el listado y repite el cambio sobre la versión actual.

Después de guardar, abre o recarga la web principal y revisa:

- La ficha: `/ubicaciones/<slug>`.
- El listado: `/espacios/<categoryId>`.
- El mapa: `/espacios/<categoryId>/mapa`, incluida la posición real.

Los cambios siguen siendo locales hasta publicarlos mediante el flujo habitual.
Revisa y versiona el JSON y las nuevas imágenes, por ejemplo con
`git diff -- src/data/locations.json`.

## 2. Estructura de los datos

**`src/data/locations.json` es la única fuente de datos de las ubicaciones**:
contiene una lista de objetos compartida por la web y el panel.
No hay base de datos ni servicio externo de escritura.

| Concepto | Qué representa |
| --- | --- |
| Ubicación | Un lugar físico: nombre, dirección, coordenadas, horarios, imágenes y sus unidades. |
| Categoría | La clasificación de la ubicación, definida en `src/data/categories.ts`. |
| Unidad reservable | Un escritorio, sala u oficina dentro de `spaces`, con precio y capacidad propios. |

Campos principales:

- `id` identifica la ubicación y `slug` forma su URL. Conserva ambos al editar
  registros existentes, junto con los IDs de sus unidades.
- `categoryId` enlaza la ubicación con el `id` de una categoría existente.
- `amenityIds` contiene los IDs de los servicios activos, por ejemplo
  `"amenityIds": ["wifi", "coffee"]`. **Una amenity no incluida se interpreta
  como desactivada (`false`); no es necesario almacenar valores falsos.**
- `attributes` es opcional y guarda valores específicos de la categoría, por
  ejemplo `"attributes": { "area": 40, "soundproof": true }` si esos atributos
  están configurados. No equivale a `amenityIds`.
- `contact` y sus campos `email`, `phone` y `website` son opcionales.
  `amenityIds`, `images`, `photoCaptions`, `rules` y `spaces` pueden omitirse:
  al leerlos, la web y el administrador usan listas vacías. `photoCaptions` guarda
  descripciones de las fotos o de los espacios de respaldo de registros antiguos.
- `openingHours` usa claves de `0` (domingo) a `6` (sábado); cada valor es
  `null` si está cerrado o un objeto como `{ "open": 9, "close": 18 }`.
  Un día omitido está cerrado; sin `openingHours`, todos los días están cerrados.

### Valores predeterminados y normalización reales

Al cargar datos para la web o el administrador, una ubicación antigua sin `categoryId` se considera
`cowork`. Si falta una dirección no vacía o las coordenadas no son válidas, se
sustituye **todo el conjunto** dirección, comuna y coordenadas por:

```text
Suecia 810, Providencia, Santiago de Chile
Providencia · latitud -33.421795865179 · longitud -70.607290416391
```

Con dirección y coordenadas válidas, solo se recortan los espacios al principio
y al final de la dirección. Esta normalización de lectura no reescribe el JSON
ni deduce coordenadas a partir de una dirección. El guardado del panel valida
los datos introducidos; no usa ese respaldo para corregirlos.

El formulario nuevo del panel parte en categoría `cowork`, comuna Providencia,
latitud `-33.42` y longitud `-70.6`; abre de lunes a viernes de 9 a 18 y deja
cerrados sábado y domingo. **Reemplaza estos datos por los del lugar real.**
Al añadir una unidad, propone precio 0 y mínimo de una hora; comienza con un
escritorio, una sala de 1 a 2 personas o una oficina para 2, según el tipo.
El panel elimina líneas vacías y espacios de los extremos de las reglas al guardar.

Al guardar una ubicación nueva se omiten listas opcionales vacías, `contact` y
`attributes` vacíos y los días cerrados. En una edición se conserva la forma
original de los campos no modificados, incluso omisiones, propiedades adicionales
y descripciones de respaldo. Las demás ubicaciones no se normalizan en disco:
no hay una migración del catálogo ni cambios de formato de reglas o imágenes.
Los valores explícitos inválidos se rechazan; no se convierten en valores vacíos.

Los atributos nuevos no se completan ni se inventan en registros antiguos.
Las descripciones de fotos de respaldo existentes se conservan al editar;
no hace falta borrar esas descripciones porque todavía no haya fotos.

## 3. Extensibilidad

### Qué se puede cambiar desde el panel

El administrador permite gestionar ubicaciones, sus valores de atributos,
servicios seleccionados, horarios, reglas, contacto, unidades e imágenes.
**Crear categorías, definir amenities o atributos, cambiar las comunas admitidas
y añadir tipos de unidades requiere editar las configuraciones o el código.**
No agregues otra lista de categorías ni otra fuente de ubicaciones.

### Agregar ubicaciones, categorías y comunas

Para una ubicación, usa `/admin`.
Para una categoría, agrega una entrada en `definitions`, en
**`src/data/categories.ts`**:

```ts
{
  id: 'sala-danza',
  name: 'Sala de danza',
  filters: { comuna: true },
},
```

Usa un ID único y estable, en minúsculas y con guiones. El catálogo, las rutas
y el tipo `CategoryId` se derivan del mismo registro; no necesitas crear páginas.
Puedes añadir `cover: { src: '/images/danza.jpg', alt: 'Sala de danza' }`.
Recarga el panel para usar la nueva configuración.
Las comunas admitidas se definen en `COMUNA_OPTIONS`, en `src/types/index.ts`;
los filtros web muestran las comunas con datos.

### Agregar amenities

Añade una entrada a **`AMENITIES` en `src/data/amenities.ts`**, por ejemplo
`{ id: 'ducha', label: 'Ducha' }`. El tipo `AmenityId`, las etiquetas y el panel
se derivan de ese registro. Las nuevas amenities usan un icono genérico
si no tienen uno específico; no necesitas modificar componentes para incorporarlas.
Las ubicaciones anteriores no cambian: el nuevo servicio queda desactivado hasta
incluir su ID en `amenityIds`. Activa el servicio
en las ubicaciones que realmente lo tengan. Si una categoría define una lista
explícita en `filters.amenityIds`, incluye allí el nuevo ID para ofrecerlo como
filtro público. Las listas derivadas de `AMENITIES` lo incorporan automáticamente.

### Agregar atributos y filtros por categoría

Dentro de la definición de la categoría, puedes añadir:

```ts
attributes: [
  { id: 'area', label: 'Superficie en m²', type: 'number', min: 1 },
  { id: 'soundproof', label: 'Aislamiento acústico', type: 'boolean' },
  { id: 'notes', label: 'Acceso', type: 'text', example: 'Entrada por el patio' },
  {
    id: 'equipment', label: 'Equipamiento', type: 'multiselect', filter: true,
    options: [
      { value: 'mirrors', label: 'Espejos' },
      { value: 'barre', label: 'Barra de danza' },
    ],
  },
],
```

Cada atributo necesita un ID único dentro de la categoría, `label` y `type`.
Por defecto es opcional; `required: true` exige completarlo al guardar, también
al editar una ubicación antigua. Antes de exigirlo, revisa los registros existentes.
Los números admiten `min`, `max` e `integer: true`. `select` elige una opción y
`multiselect` varias; ambos necesitan `options`. `boolean` permite sí/no.
`example` sirve como ejemplo en los inputs del administrador. El panel usa
`attributeFields` y la validación compartida de `src/lib/fields.ts` y
`src/lib/locationSchema.ts`; no hay que agregar controles manualmente.

En atributos de selección, **`filter: true` genera el filtro público de listado
y mapa** usando las mismas opciones. No lo dupliques en `filters.attributes`.
Las definiciones anteriores en `filters.attributes` siguen funcionando como
selecciones múltiples opcionales. Al elegir varios valores del mismo atributo,
la ubicación debe contenerlos todos.

`filters` también permite configurar `comuna`, `amenityIds`, `spaceTypes` y
`people` para cada categoría. Usa IDs existentes de servicios y tipos de unidad,
y cantidades de personas adecuadas. Los atributos no crean secciones nuevas en
la ficha ni cambian las reglas de reserva por sí solos.

### Incorporar un nuevo tipo de unidad reservable

Registra el tipo en **`SPACE_DEFINITIONS`, en `src/data/spaceTypes.ts`**. Para una
unidad de capacidad fija, copia `office_box` y ajusta el ID, `label`, `plural`,
`defaults`, límites de `fields` y `getCapacity`. Este último devuelve `{ min, max }`.
`icon` puede reutilizar `desk`, `room` u `office`; `takenPercent` controla únicamente
el porcentaje de ocupación de la disponibilidad simulada.

`fields` define texto, números o selecciones; las rutas `capacity.min` y
`capacity.max` permiten editar capacidades anidadas sin cambiar el formato JSON.
`defaults` define los valores iniciales del tipo. El tipo TypeScript `Space`, sus
IDs, etiquetas y formularios del panel se derivan del registro.
No edites listas paralelas ni agregues ramas a los formularios.

Habilita el ID en `filters.spaceTypes` de las categorías que usen una lista
explícita; las que usan `SPACE_TYPES` lo incorporan automáticamente. La ficha
usa una presentación genérica de capacidad para tipos nuevos y las reservas
mantienen el precio por hora y las reglas de duración y personas existentes.
Una presentación especializada o reglas nuevas de precio, capacidad o reserva
sí requieren código y sus pruebas: el registro no inventa esas reglas.

## 4. Validación y tests

Desde la raíz del proyecto:

```sh
npm test
npm run lint
npm run build
```

`npm test` ejecuta las pruebas existentes de categorías, filtros y
administración local. Las pruebas de escritura usan copias temporales y las
eliminan al terminar: no pruebes el CRUD escribiendo sobre el catálogo real.
Cubren validación, conservación de datos e IDs, conflictos entre sesiones,
imágenes y restricciones HTTP de la API local. También comprueban normalización
heredada, serialización compacta, ausencia de amenities, generación de campos
por categoría y ampliaciones de catálogos sin modificar registros previos.
Las pruebas de unidades comprueban capacidades, filtros, precios y reservas.

La prueba de navegador es opcional y se omite si no defines `SALITA_BROWSER`.
Para ejecutarla con un Chromium instalado, en PowerShell:

```powershell
$env:SALITA_BROWSER = 'C:\ruta\al\navegador.exe'
node --test tests/admin.browser.test.mjs
```

Usa un perfil y catálogo temporales para comprobar formularios, filtros,
imágenes, CRUD y ancho móvil. Elimina después la variable de esta sesión con
`Remove-Item Env:SALITA_BROWSER` si no quieres incluirla en ejecuciones posteriores.

Al ampliar la configuración, comprueba lo siguiente:

- **Categorías:** IDs únicos, aparición en catálogo y formularios, rutas correctas
  y listado y mapa limitados a sus propias ubicaciones, incluso sin unidades.
- **Amenities y atributos:** IDs y opciones coherentes entre tipos, registros,
  formularios y filtros; campos obligatorios, límites numéricos y selecciones
  inválidas rechazados. Un servicio ausente debe seguir desactivado.
- **Filtros:** combinaciones de comuna, servicios, personas, tipos y atributos;
  limpieza de filtros y enlaces con parámetros. Los parámetros desconocidos o
  no admitidos por una categoría no deben ocultar sus ubicaciones.
- **Compatibilidad:** conservar IDs, URLs, horarios, capacidades y descripciones
  de respaldo. Las ubicaciones sin `categoryId` deben seguir siendo cowork y las
  que carecen de atributos nuevos deben seguir cargando sin valores inventados.
- **Mapa y reservas:** revisar manualmente posición, dirección, ficha, precios,
  capacidades, duración mínima y disponibilidad. Las ubicaciones sin unidades
  deben seguir mostrándose sin ofrecer reservas. No des por cubierta toda la
  interacción del mapa y las reservas solo porque pasen los tests de filtros.

El guardado usa un bloqueo entre sesiones del panel, comprueba que el archivo
no haya cambiado y lo reemplaza de forma atómica. Si un cierre forzado deja
`src/data/locations.json.lock`, verifica que no haya ningún proceso guardando
antes de eliminar ese bloqueo. Un archivo `locations.json.*.tmp` puede retirarse
una vez cerradas esas sesiones; la web solo consume `locations.json`.
**No elimines el JSON para resolver un bloqueo.**
