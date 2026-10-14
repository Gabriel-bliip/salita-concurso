// Shared look for text inputs, textareas and selects. A field with aria-invalid gets a danger border.
export const fieldControlClass =
  'mt-1.5 w-full rounded-control border border-line-strong bg-surface px-3 py-2.5 text-ink aria-invalid:border-danger aria-invalid:border-2'

export const fieldLabelClass = 'block text-sm font-semibold text-ink'

export const fieldHintClass = 'mt-1 text-sm text-ink-muted'

// ids of the hint and error paragraphs, joined for aria-describedby.
export function describedBy(id: string, hint: unknown, error: string | null) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}
