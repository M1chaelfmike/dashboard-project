const COMPANY_TEXT_FIELDS = {
  companyName: { label: 'Company name', maxLength: 255 },
  country: { label: 'Country', maxLength: 100 },
  city: { label: 'City', maxLength: 100 },
} as const;

export function getCompanyTextError(
  field: keyof typeof COMPANY_TEXT_FIELDS,
  value: string,
): string {
  const { label, maxLength } = COMPANY_TEXT_FIELDS[field];
  // Count Unicode code points to match the database's character limit, not UTF-16 units.
  return Array.from(value.trim()).length > maxLength
    ? `${label} must be at most ${maxLength} characters.`
    : '';
}
