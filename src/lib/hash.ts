// FNV-1a: a small stable hash. The same input always gives the same number,
// which keeps mock availability and booking codes deterministic.
export function hash(value: string) {
  let result = 2166136261
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}
