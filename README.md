# Salita

## Ubicaciones y mapa

Para agregar categorías, ubicaciones, filtros o portadas al catálogo de **Espacios**,
consulta [la guía de espacios](docs/espacios.md).

Para agregar lugares, cambiar sus direcciones o conectar una futura fuente de datos,
consulta [la guía de ubicaciones](docs/ubicaciones.md).
Para administrar ubicaciones, ejecuta `npm run dev` y abre `http://localhost:3000/admin`. El panel valida y guarda en `src/data/locations.json` al pulsar **Guardar**.
Consulta [la guía práctica](AGREGAR-ESPACIOS.md).

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Administración local

Con `npm run dev`, abre `http://localhost:3000/admin`. El panel permite buscar y
filtrar ubicaciones, crear, editar, duplicar y eliminar mediante formularios.
Las categorías y los atributos provienen de `src/data/categories.ts`.

Los cambios se confirman con **Guardar** y escriben directamente en
`src/data/locations.json`, usando las validaciones compartidas y bloqueo entre sesiones,
comprobación de versión y reemplazo atómico. Si otro proceso modificó los datos,
cancela el formulario y recarga el listado antes de repetir el cambio.
Los IDs existentes y las descripciones de fotos de marcadores vacíos se conservan.

Las imágenes PNG/JPEG/WebP (hasta 5 MB por archivo, 35 MB por solicitud) se
previsualizan en memoria y se guardan en `public/images/admin/` al confirmar.
Quitar una imagen o ubicación elimina únicamente archivos creados por el panel
que ya no estén referenciados; las imágenes externas no se borran del disco.
Revisa y versiona el JSON y las nuevas imágenes con Git.

El panel y su API solo funcionan en Vite de desarrollo desde localhost y el
mismo origen. No se incluyen en la compilación de producción ni en `vite preview`.
`npm test` verifica CRUD, filtros, imágenes, conflictos y restricciones HTTP con
copias temporales, sin escribir sobre los datos reales; `npm run build` y
`npm run lint` verifican la integración.
Para ejecutar también la prueba visual con un navegador Chromium instalado,
define `SALITA_BROWSER` con la ruta de su ejecutable y ejecuta
`node --test tests/admin.browser.test.mjs`. Usa un perfil y catálogo temporales.
