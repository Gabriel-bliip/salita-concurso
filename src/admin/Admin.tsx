import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CATEGORIES, getCategory } from '../data/categories.ts'
import { AMENITIES } from '../data/amenities.ts'
import { COMUNA_OPTIONS } from '../types/index.ts'
import type { SpaceLocation, Weekday } from '../types/index.ts'
import type { Space } from '../types/space.ts'
import { SPACE_TYPES, SPACE_TYPE_LABELS } from '../lib/spaces.ts'
import { duplicateLocation, filterLocations, newLocation, newSpace, normalize } from './model.ts'
import { attributeFields } from '../lib/fields.ts'
import { spaceFields } from '../data/spaceTypes.ts'
import SchemaFields from './SchemaFields.tsx'
import './admin.css'

type Snapshot = { locations: SpaceLocation[]; revision: string }
const emptyFilters = { name: '', category: '', comuna: '', amenity: '', type: '' }
const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="admin-field"><span>{label}</span>{children}</label> }
function Text({ label, value, onChange, required = true, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <Field label={label}><input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} /></Field>
}
function NumberField({ label, value, onChange, min = 0, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number | 'any' }) {
  return <Field label={label}><input type="number" required value={Number.isFinite(value) ? value : ''} min={min} max={max} step={step} onChange={(e) => onChange(e.target.valueAsNumber)} /></Field>
}
async function api(body?: object): Promise<Snapshot> {
  const response = await fetch('/__admin/locations', body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'No se pudo guardar.')
  return result
}

export default function Admin() {
  const [data, setData] = useState<Snapshot>()
  const [filters, setFilters] = useState(emptyFilters)
  const [draft, setDraft] = useState<SpaceLocation>()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)
  useEffect(() => { api().then(setData).catch((e: Error) => setError(e.message)) }, [])
  useEffect(() => {
    if (!draft) return
    const guard = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [draft])
  const update = (patch: Partial<SpaceLocation>) => setDraft((value) => value && ({ ...value, ...patch }))
  const updateSpace = (index: number, space: Space) => update({ spaces: draft!.spaces.map((old, i) => i === index ? space : old) })
  const visible = filterLocations(data?.locations ?? [], filters)
  async function commit(action: string, location?: SpaceLocation, id?: string) {
    setBusy(true); setError(''); setMessage('')
    try {
      const cleaned = location && { ...location, rules: location.rules.map((rule) => rule.trim()).filter(Boolean) }
      setData(await api({ action, location: cleaned, id, revision: data?.revision }))
      setDraft(undefined); setMessage('Cambios guardados en locations.json.')
    } catch (e) { setError((e as Error).message); window.scrollTo(0, 0) }
    finally { setBusy(false) }
  }
  function open(value: SpaceLocation, existing: boolean) { setDraft(structuredClone(value)); setEditing(existing); setError(''); setMessage(''); window.scrollTo(0, 0) }
  async function upload(files: FileList | null) {
    if (!files || !draft) return
    setReading(true); setError('')
    try {
      const photos = await Promise.all(Array.from(files).map(async (file) => {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Usa PNG, JPEG o WebP de hasta 5 MB por imagen.')
        const src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
          reader.readAsDataURL(file)
        })
        return { src, caption: file.name }
      }))
      update({ images: [...draft.images, ...photos.map(({ src }) => src)], photoCaptions: [...draft.photoCaptions.slice(0, draft.images.length), ...photos.map(({ caption }) => caption)] })
    } catch (e) { setError((e as Error).message) }
    finally { setReading(false) }
  }
  const category = draft && getCategory(draft.categoryId)
  const attributes = category ? attributeFields(category) : {}
  return <main className="admin">
    <header className="admin-bar"><div><a href="/">Salita</a><h1>Administrar ubicaciones</h1><p>Panel local · cambios guardados en el proyecto</p></div>{!draft && <button disabled={!data} onClick={() => open(newLocation(), false)}>Crear espacio</button>}</header>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!data && !error && <p role="status">Cargando ubicaciones…</p>}
    {!draft ? <>
      <section className="admin-panel admin-grid" aria-label="Filtros">
        <Text label="Buscar por nombre" value={filters.name} required={false} onChange={(name) => setFilters({ ...filters, name })} />
        {([['category', 'Categoría', CATEGORIES.map(({ id, name }) => [id, name])], ['comuna', 'Comuna', [...new Set((data?.locations ?? []).map(({ comuna }) => comuna))].sort().map((v) => [v, v])], ['amenity', 'Servicio', AMENITIES.map(({ id, label }) => [id, label])], ['type', 'Unidad reservable', SPACE_TYPES.map((id) => [id, SPACE_TYPE_LABELS[id]])]] as const).map(([key, label, options]) => <Field key={key} label={label}><select value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}><option value="">Todas las opciones</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></Field>)}
        <button className="secondary" onClick={() => setFilters(emptyFilters)}>Limpiar filtros</button>
        <button className="secondary" onClick={() => { setError(''); api().then(setData).catch((e: Error) => setError(e.message)) }}>Recargar datos</button>
      </section>
      <p role="status">{visible.length} resultados</p>
      {CATEGORIES.map((category) => { const entries = visible.filter(({ categoryId }) => categoryId === category.id); return entries.length > 0 && <section key={category.id} className="admin-category"><h2>{category.name} <small>({entries.length})</small></h2><div className="admin-grid">{entries.map((entry) => <article className="admin-panel" key={entry.id}><h3>{entry.name}</h3><p>{entry.comuna}</p><p>{entry.address}</p><p>{entry.spaces.length} unidades reservables</p><div className="admin-actions"><button disabled={busy} onClick={() => open(entry, true)}>Editar</button><button disabled={busy} className="secondary" onClick={() => open(duplicateLocation(entry, data!.locations), false)}>Duplicar</button><button disabled={busy} className="danger" onClick={() => { if (confirm(`¿Eliminar «${entry.name}»? Esta acción no se puede deshacer.`)) void commit('delete', undefined, entry.id) }}>Eliminar</button></div></article>)}</div></section> })}
      {data && !visible.length && <p>No hay ubicaciones que coincidan con los filtros.</p>}
    </> : <form onSubmit={(e) => { e.preventDefault(); void commit(editing ? 'update' : 'create', draft, editing ? draft.id : undefined) }}>
      <fieldset disabled={busy || reading}>
        <section className="admin-panel"><h2>{editing ? 'Editar' : 'Crear'} espacio</h2><div className="admin-grid">
          <Text label="Nombre" value={draft.name} onChange={(name) => update({ name, ...(!editing ? { slug: normalize(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + draft.id } : {}) })} />
          <Field label="Categoría"><select value={draft.categoryId} onChange={(e) => update({ categoryId: e.target.value as SpaceLocation['categoryId'] })}>{CATEGORIES.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}</select></Field>
          <Text label="Dirección" value={draft.address} onChange={(address) => update({ address })} />
          <Field label="Comuna"><select value={draft.comuna} onChange={(e) => update({ comuna: e.target.value as SpaceLocation['comuna'] })}>{COMUNA_OPTIONS.map((name) => <option key={name}>{name}</option>)}</select></Field>
          <NumberField label="Latitud" min={-90} max={90} step="any" value={draft.location.latitude} onChange={(latitude) => update({ location: { ...draft.location, latitude } })} />
          <NumberField label="Longitud" min={-180} max={180} step="any" value={draft.location.longitude} onChange={(longitude) => update({ location: { ...draft.location, longitude } })} />
        </div><Field label="Descripción"><textarea required value={draft.description} onChange={(e) => update({ description: e.target.value })} /></Field></section>
        <section className="admin-panel"><h2>Servicios y atributos</h2><div className="admin-checks">{AMENITIES.map(({ id, label }) => <label key={id}><input type="checkbox" checked={draft.amenityIds.includes(id)} onChange={(e) => update({ amenityIds: e.target.checked ? [...draft.amenityIds, id] : draft.amenityIds.filter((value) => value !== id) })} />{label}</label>)}</div>
          <div className="admin-grid"><SchemaFields fields={attributes} values={draft.attributes ?? {}} onChange={(attributes) => update({ attributes })} /></div>
        </section>
        <section className="admin-panel"><h2>Horarios</h2><p>Horas enteras, de 0 a 24. Desmarca los días cerrados.</p>{days.map((day, index) => { const key = index as Weekday; const hours = draft.openingHours[key]; return <div className="admin-hours" key={day}><label><input type="checkbox" checked={!!hours} onChange={(e) => update({ openingHours: { ...draft.openingHours, [key]: e.target.checked ? { open: 9, close: 18 } : null } })} />{day}</label>{hours && <><NumberField label={`${day}: apertura`} value={hours.open} max={23} onChange={(open) => update({ openingHours: { ...draft.openingHours, [key]: { ...hours, open } } })} /><NumberField label={`${day}: cierre`} value={hours.close} min={hours.open + 1} max={24} onChange={(close) => update({ openingHours: { ...draft.openingHours, [key]: { ...hours, close } } })} /></>}</div> })}</section>
        <section className="admin-panel"><h2>Reglas y contacto</h2><Field label="Reglas (una por línea)"><textarea value={draft.rules.join('\n')} onChange={(e) => update({ rules: e.target.value.split('\n') })} /></Field><div className="admin-grid">{(['email', 'phone', 'website'] as const).map((key) => <Text key={key} label={{ email: 'Correo', phone: 'Teléfono', website: 'Sitio web' }[key]} type={{ email: 'email', phone: 'tel', website: 'url' }[key]} required={false} value={draft.contact?.[key] ?? ''} onChange={(value) => { const contact = { ...draft.contact }; if (value) contact[key] = value; else delete contact[key]; update({ contact }) }} />)}</div></section>
        <section className="admin-panel"><h2>Unidades reservables</h2>{draft.spaces.map((space, index) => <section className="admin-unit" key={space.id}><h3>{SPACE_TYPE_LABELS[space.type]}</h3><div className="admin-grid"><SchemaFields fields={spaceFields(space.type)} values={space} onChange={(value) => updateSpace(index, value)} />
        </div><button type="button" className="danger" onClick={() => { if (confirm('¿Eliminar esta unidad reservable?')) update({ spaces: draft.spaces.filter((_, i) => i !== index) }) }}>Eliminar unidad</button></section>)}<div className="admin-actions">{SPACE_TYPES.map((type) => <button key={type} type="button" className="secondary" onClick={() => update({ spaces: [...draft.spaces, newSpace(type)] })}>Añadir {SPACE_TYPE_LABELS[type].toLowerCase()}</button>)}</div></section>
        <section className="admin-panel"><h2>Imágenes</h2><p>PNG, JPEG o WebP · hasta 5 MB cada una. La primera imagen es la portada.</p><Field label="Subir desde el computador"><input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => { void upload(e.target.files); e.target.value = '' }} /></Field><div className="admin-grid">{draft.images.map((src, index) => <div key={`${index}-${src.slice(-40)}`}><img className="admin-photo" src={src} alt={draft.photoCaptions[index] ?? ''} /><Text label={`Descripción de imagen ${index + 1}`} value={draft.photoCaptions[index] ?? ''} onChange={(caption) => { const captions = [...draft.photoCaptions]; captions[index] = caption; update({ photoCaptions: captions }) }} /><button type="button" className="danger" onClick={() => { if (confirm('¿Quitar esta imagen?')) update({ images: draft.images.filter((_, i) => i !== index), photoCaptions: draft.photoCaptions.filter((_, i) => i !== index) }) }}>Quitar imagen</button></div>)}</div></section>
        <div className="admin-actions admin-save"><button type="submit">{busy ? 'Guardando…' : 'Guardar cambios'}</button><button type="button" className="secondary" onClick={() => { if (confirm('¿Descartar los cambios del formulario?')) { setDraft(undefined); setError('') } }}>Cancelar</button></div>
      </fieldset>
    </form>}
  </main>
}
