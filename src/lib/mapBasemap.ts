import L from 'leaflet'
import { MaplibreGL } from '@maplibre/maplibre-gl-leaflet'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle } from './mapStyle.ts'

setWorkerUrl(workerUrl)

// El adaptador 0.1.4 deja un frame de resize pendiente al desmontar el mapa.
// Sincronizar aquí de forma síncrona evita que ese frame acceda a un mapa eliminado.
const BasemapLayer = MaplibreGL.extend({
  _transitionEnd() {
    if (!this._map || !this._glMap) return
    this._resizeContainer()
    this._glMap.resize()
    this._zoomEnd()
  },
}) as typeof MaplibreGL

export function addBasemap(map: L.Map, onError: () => void) {
  const layer = new BasemapLayer({ style: mapStyle, attributionControl: false }).addTo(map) as L.MaplibreGL
  layer.getMaplibreMap().on('error', onError)
  return layer
}
