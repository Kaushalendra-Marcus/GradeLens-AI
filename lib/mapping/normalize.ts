export function normalizeLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^q\.?\s*/i, "")
    .replace(/[().]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export function questionKey(displayNumber: string): string {
  return normalizeLabel(displayNumber);
}
