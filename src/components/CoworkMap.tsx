import { useEffect, useEffectEvent, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import type { Cowork } from '../types/index.ts'
import { DEFAULT_LOCATION } from '../lib/location.ts'
import { MAP_COLORS, MAP_CONFIG } from '../lib/mapConfig.ts'

interface CoworkMapProps {
  coworkers: Cowork[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
}

const fallbackCover = MAP_CONFIG.fallbackCover

function cover(cowork: Cowork) {
  const image = document.createElement('img')
  image.src = cowork.images[0] || fallbackCover
  image.alt = ''
  image.className = 'cowork-map-cover'
  image.addEventListener('error', () => { image.src = fallbackCover }, { once: true })
  return image
}

function CoworkMap({ coworkers, selectedSlug, onSelect }: CoworkMapProps) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markers = useRef(new Map<string, L.Marker>())
  const clusters = useRef<L.MarkerClusterGroup | null>(null)
  const spiderfied = useRef(false)
  const [tileError, setTileError] = useState(false)
  const selectCowork = useEffectEvent((slug: string) => onSelect(slug))
  const highlightMarker = useEffectEvent((marker: L.Marker, slug: string) => {
    marker.getElement()?.classList.toggle('is-selected', slug === selectedSlug)
  })
  const reframeOnResize = useEffectEvent((map: L.Map) => {
    const selected = coworkers.find((cowork) => cowork.slug === selectedSlug)
    if (selected) {
      map.panTo([selected.location.latitude, selected.location.longitude], { animate: false })
    } else if (coworkers.length) {
      map.fitBounds(L.latLngBounds(coworkers.map(({ location }) => [location.latitude, location.longitude])), { padding: [48, 80], maxZoom: MAP_CONFIG.overviewMaxZoom, animate: false })
    }
  })

  useEffect(() => {
    if (!container.current) return
    const { latitude, longitude } = DEFAULT_LOCATION.location
    container.current.style.backgroundColor = MAP_COLORS.background
    const map = L.map(container.current, { scrollWheelZoom: true, wheelPxPerZoomLevel: 200, wheelDebounceTime: 40, zoomSnap: 0.25, touchZoom: true, doubleClickZoom: true, zoomDelta: 1, zoomControl: false, zoomAnimation: false, minZoom: MAP_CONFIG.minZoom, maxZoom: MAP_CONFIG.maxZoom }).setView([latitude, longitude], 13)
    L.control.zoom({ position: 'bottomright', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(map)
    mapRef.current = map
    map.on('resize', () => reframeOnResize(map))
    map.attributionControl.addAttribution('<a href="https://openfreemap.org">OpenFreeMap</a> · &copy; <a href="https://openmaptiles.org">OpenMapTiles</a> · &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
    let disposed = false
    void import('../lib/mapBasemap.ts').then(({ addBasemap }) => {
      if (!disposed) addBasemap(map, () => { if (!disposed) setTileError(true) })
    }).catch(() => { if (!disposed) setTileError(true) })
    const resizeObserver = new ResizeObserver(() => map.invalidateSize())
    resizeObserver.observe(container.current)
    return () => {
      disposed = true
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const layer = L.markerClusterGroup({
      maxClusterRadius: MAP_CONFIG.clusterRadius,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      spiderfyDistanceMultiplier: MAP_CONFIG.spiderfyDistanceMultiplier,
      // Evita callbacks de animación pendientes al cambiar filtros o salir de la página.
      animate: false,
      iconCreateFunction: (cluster) => {
        const badge = document.createElement('div')
        badge.className = 'cowork-map-cluster-badge'
        badge.textContent = String(cluster.getChildCount())
        badge.setAttribute('aria-label', `${cluster.getChildCount()} lugares. Acercar para verlos`)
        return L.divIcon({ html: badge, className: 'cowork-map-cluster', iconSize: [52, 52] })
      },
    }).addTo(map)
    clusters.current = layer
    layer.on('spiderfied', () => { spiderfied.current = true })
    layer.on('unspiderfied', () => { spiderfied.current = false })
    const currentMarkers = markers.current
    currentMarkers.clear()
    // Un marcador por registro: el agrupamiento se recalcula automáticamente por zoom.
    const nextMarkers: L.Marker[] = []
    for (const cowork of coworkers) {
      const bubble = document.createElement('div')
      bubble.className = 'cowork-map-bubble'
      bubble.append(cover(cowork))
      const popup = document.createElement('div')
      popup.className = 'cowork-map-popup'
      const entry = document.createElement('div')
      entry.className = 'cowork-map-entry'
      const title = document.createElement('strong')
      title.textContent = cowork.name
      const address = document.createElement('p')
      address.textContent = cowork.address
      const link = document.createElement('a')
      link.href = `/ubicaciones/${cowork.slug}`
      link.textContent = 'Ver espacio →'
      entry.append(cover(cowork), title, address, link)
      popup.append(entry)
      const marker = L.marker([cowork.location.latitude, cowork.location.longitude], {
        icon: L.divIcon({ html: bubble, className: 'cowork-map-marker', iconSize: [48, 56], iconAnchor: [24, 56], popupAnchor: [0, -50] }),
        title: cowork.name,
        riseOnHover: true,
        alt: `Ver ${cowork.name}`,
      }).bindPopup(popup, { maxWidth: 280, maxHeight: 280 })
      marker.on('click', () => selectCowork(cowork.slug))
      marker.on('add', () => highlightMarker(marker, cowork.slug))
      currentMarkers.set(cowork.slug, marker)
      nextMarkers.push(marker)
    }
    layer.addLayers(nextMarkers)
    if (coworkers.length) {
      map.fitBounds(L.latLngBounds(coworkers.map(({ location }) => [location.latitude, location.longitude])), { padding: [48, 80], maxZoom: MAP_CONFIG.overviewMaxZoom })
    }
    return () => { layer.clearLayers(); layer.remove(); currentMarkers.clear(); clusters.current = null; spiderfied.current = false }
  }, [coworkers])

  useEffect(() => {
    const map = mapRef.current
    const marker = selectedSlug ? markers.current.get(selectedSlug) : null
    let cancelled = false
    for (const [slug, item] of markers.current) {
      item.getElement()?.classList.toggle('is-selected', item === marker)
      item.setZIndexOffset(slug === selectedSlug ? 1000 : 0)
    }
    if (map && marker) {
      const showPopup = () => {
        if (cancelled) return
        marker.getElement()?.classList.add('is-selected')
        marker.openPopup()
      }
      // Revela también marcadores ocultos en grupos o con coordenadas idénticas.
      if (!spiderfied.current && map.getZoom() < MAP_CONFIG.selectionZoom) {
        map.setView(marker.getLatLng(), MAP_CONFIG.selectionZoom, { animate: false })
      }
      clusters.current?.zoomToShowLayer(marker, showPopup)
    } else {
      map?.closePopup()
    }
    return () => { cancelled = true }
  }, [selectedSlug, coworkers])

  return (
    <div>
      <div ref={container} className="cowork-map" role="region" aria-label="Mapa de ubicaciones" />
      {tileError && <p role="status" className="mt-2 text-sm text-danger">No se pudo cargar parte del mapa. Revisa tu conexión; puedes seguir consultando los lugares en la lista.</p>}
    </div>
  )
}

export default CoworkMap
