// Use the same counting rule as the backend's class-validator length checks.
export function getValidationLength(value: string): number {
  const surrogatePairs = value.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length ?? 0;
  const presentationSequences = value.match(/[^\uFE0F\uFE0E][\uFE0F\uFE0E]/g)?.length ?? 0;
  return value.length - surrogatePairs - presentationSequences;
}
