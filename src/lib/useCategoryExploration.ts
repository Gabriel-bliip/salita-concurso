import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { getCategory } from '../data/categories.ts'
import { LOCATIONS } from '../data/coworks.ts'
import type { CoworkFilterState } from './coworkFilters.ts'
import { EMPTY_FILTERS, filterCoworks, filtersToParams, parseFilters } from './coworkFilters.ts'

// Shared by the list and map: one category scope, URL format and result pipeline.
export function useCategoryExploration() {
  const { categoryId } = useParams()
  const category = getCategory(categoryId ?? 'cowork')
  const [params, setParams] = useSearchParams()
  const filters = category ? parseFilters(params, category) : EMPTY_FILTERS
  const filterKey = filtersToParams(filters).toString()
  // Selecting a marker must not rebuild the marker collection.
  const results = useMemo(() => category
    ? filterCoworks(LOCATIONS, parseFilters(new URLSearchParams(filterKey), category), category)
    : [], [category, filterKey])
  const locations = useMemo(() => results.map(({ cowork }) => cowork), [results])
  const hasLocations = !!category && LOCATIONS.some(({ categoryId }) => categoryId === category.id)
  const updateFilters = (next: CoworkFilterState) =>
    setParams(filtersToParams(next), { replace: true })

  return { category, filters, filterKey, results, locations, hasLocations, updateFilters, params, setParams }
}
