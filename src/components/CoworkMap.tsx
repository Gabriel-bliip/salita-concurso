import { useEffect, useEffectEvent, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Cowork } from '../types/index.ts'
import { DEFAULT_LOCATION } from '../lib/location.ts'

interface CoworkMapProps {
  coworkers: Cowork[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
}

const fallbackCover = '/cowork-placeholder.svg'

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
  const [tileError, setTileError] = useState(false)
  const selectCowork = useEffectEvent((slug: string) => onSelect(slug))

  useEffect(() => {
    if (!container.current) return
    const { latitude, longitude } = DEFAULT_LOCATION.location
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([latitude, longitude], 13)
    mapRef.current = map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).on('tileerror', () => setTileError(true)).on('tileload', () => setTileError(false)).addTo(map)
    const resizeObserver = new ResizeObserver(() => map.invalidateSize())
    resizeObserver.observe(container.current)
    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const layer = L.layerGroup().addTo(map)
    const currentMarkers = markers.current
    currentMarkers.clear()
    // Shared addresses keep their true coordinates and expose every cowork in one popup.
    const groups = new Map<string, Cowork[]>()
    for (const cowork of coworkers) {
      const key = `${cowork.location.latitude},${cowork.location.longitude}`
      groups.set(key, [...(groups.get(key) ?? []), cowork])
    }
    for (const group of groups.values()) {
      const cowork = group[0]
      const bubble = document.createElement('div')
      bubble.className = 'cowork-map-bubble'
      bubble.append(cover(cowork))
      if (group.length > 1) {
        const count = document.createElement('span')
        count.className = 'cowork-map-count'
        count.textContent = String(group.length)
        bubble.append(count)
      }
      const popup = document.createElement('div')
      popup.className = 'cowork-map-popup'
      for (const place of group) {
        const entry = document.createElement('div')
        entry.className = 'cowork-map-entry'
        const title = document.createElement('strong')
        title.textContent = place.name
        const address = document.createElement('p')
        address.textContent = place.address
        entry.append(cover(place), title, address)
        popup.append(entry)
      }
      const marker = L.marker([cowork.location.latitude, cowork.location.longitude], {
        icon: L.divIcon({ html: bubble, className: 'cowork-map-marker', iconSize: [64, 76], iconAnchor: [32, 76], popupAnchor: [0, -70] }),
        title: group.map((place) => place.name).join(', '),
        riseOnHover: true,
        alt: `Ver ${group.map((place) => place.name).join(', ')}`,
      }).bindPopup(popup, { maxWidth: 280, maxHeight: 280 }).addTo(layer)
      marker.on('click', () => selectCowork(cowork.slug))
      for (const place of group) currentMarkers.set(place.slug, marker)
    }
    if (coworkers.length) {
      map.fitBounds(L.latLngBounds(coworkers.map(({ location }) => [location.latitude, location.longitude])), { padding: [48, 80], maxZoom: 15 })
    }
    return () => { layer.remove(); currentMarkers.clear() }
  }, [coworkers])

  useEffect(() => {
    const map = mapRef.current
    const marker = selectedSlug ? markers.current.get(selectedSlug) : null
    for (const [slug, item] of markers.current) {
      item.getElement()?.classList.toggle('is-selected', item === marker)
      item.setZIndexOffset(slug === selectedSlug ? 1000 : 0)
    }
    if (map && marker) {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15))
      marker.openPopup()
    } else {
      map?.closePopup()
    }
  }, [selectedSlug, coworkers])

  return (
    <div>
      <div ref={container} className="cowork-map" role="region" aria-label="Mapa de ubicaciones de coworks" />
      {tileError && <p role="status" className="mt-2 text-sm text-amber-800">No se pudo cargar parte del mapa. Revisa tu conexión; puedes seguir consultando los lugares en la lista.</p>}
    </div>
  )
}

export default CoworkMap
