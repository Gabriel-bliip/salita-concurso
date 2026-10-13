import type { StyleSpecification, LayerSpecification } from 'maplibre-gl'
import { MAP_COLORS as colors, MAP_CONFIG } from './mapConfig.ts'

const detail = MAP_CONFIG.detailZoom
const roads = (id: string, classes: string[], minzoom: number, color: string, width: number): LayerSpecification => ({
  id, type: 'line', source: 'city', 'source-layer': 'transportation', minzoom,
  filter: ['in', 'class', ...classes],
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': color,
    'line-opacity': ['interpolate', ['linear'], ['zoom'], minzoom, 0, minzoom + 1, 1],
    'line-width': ['interpolate', ['linear'], ['zoom'], 10, width * 0.3, 14, width, 19, width * 5],
  },
})

// ESTILO: solo avenidas desde lejos; vías secundarias, calles y edificios al acercar.
// Cambiar colores/umbrales en mapConfig.ts. Agregar capas aquí para nuevos detalles.
export const mapStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: { city: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
  layers: [
    { id: 'cream', type: 'background', paint: { 'background-color': colors.background } },
    {
      id: 'urban-area', type: 'fill', source: 'city', 'source-layer': 'landuse',
      filter: ['in', 'class', 'residential', 'commercial', 'industrial', 'suburb'],
      paint: { 'fill-color': colors.urban, 'fill-opacity': 0.55 },
    },
    {
      id: 'green-areas', type: 'fill', source: 'city', 'source-layer': 'landcover',
      filter: ['in', 'class', 'wood', 'grass'],
      paint: { 'fill-color': colors.park, 'fill-opacity': 0.65 },
    },
    { id: 'parks', type: 'fill', source: 'city', 'source-layer': 'park', paint: { 'fill-color': colors.park, 'fill-opacity': 0.7 } },
    { id: 'water', type: 'fill', source: 'city', 'source-layer': 'water', paint: { 'fill-color': colors.water } },
    {
      id: 'rivers', type: 'line', source: 'city', 'source-layer': 'waterway', minzoom: 10,
      paint: { 'line-color': colors.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 4] },
    },
    {
      id: 'buildings', type: 'fill', source: 'city', 'source-layer': 'building', minzoom: detail.buildings,
      paint: { 'fill-color': colors.building, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], detail.buildings, 0, detail.buildings + 1, 0.65] },
    },
    roads('local-streets', ['minor', 'service'], detail.local, colors.street, 1.5),
    roads('secondary-streets', ['secondary', 'tertiary'], detail.secondary, colors.street, 2.5),
    roads('avenues-outline', ['motorway', 'trunk', 'primary'], 3, colors.avenueBorder, 4),
    roads('avenues', ['motorway', 'trunk', 'primary'], 3, colors.avenue, 2.5),
    {
      id: 'city-names', type: 'symbol', source: 'city', 'source-layer': 'place',
      filter: ['in', 'class', 'city', 'town', 'village'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'], 'text-padding': 24,
        'text-size': ['interpolate', ['linear'], ['zoom'], 6, 11, 13, 14],
      },
      paint: { 'text-color': colors.text, 'text-halo-color': colors.background, 'text-halo-width': 2 },
    },
    {
      id: 'neighborhood-names', type: 'symbol', source: 'city', 'source-layer': 'place', minzoom: detail.secondary,
      filter: ['in', 'class', 'suburb', 'quarter', 'neighbourhood'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'], 'text-size': 12, 'text-padding': 40,
      },
      paint: { 'text-color': colors.text, 'text-halo-color': colors.background, 'text-halo-width': 2 },
    },
    {
      id: 'street-names', type: 'symbol', source: 'city', 'source-layer': 'transportation_name', minzoom: detail.streetNames,
      filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor'],
      layout: {
        'symbol-placement': 'line', 'symbol-spacing': 350,
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-padding': 12,
      },
      paint: {
        'text-color': colors.text, 'text-halo-color': colors.street, 'text-halo-width': 2,
        'text-opacity': ['interpolate', ['linear'], ['zoom'], detail.streetNames, 0, detail.streetNames + 1, 1],
      },
    },
  ],
}
