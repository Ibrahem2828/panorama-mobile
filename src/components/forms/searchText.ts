/** Search-friendly form of Arabic/Latin text: no diacritics or tatweel, unified alef/ya/ta marbuta. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/gu, '')
    .replace(/[آأإ]/gu, 'ا')
    .replace(/ى/gu, 'ي')
    .replace(/ة/gu, 'ه')
    .trim();
}
