import { normalizeSearchText } from '../../../components/forms/searchText';
import type { AcademicOption } from '../types';

/**
 * When a required list has exactly one option and nothing is chosen yet, the student has
 * nothing to decide: pick it for them. Returns that option or null.
 */
export function getAutoSelectOption(
  options: AcademicOption[],
  selectedId: string | number | null,
  isLoading = false,
): AcademicOption | null {
  if (isLoading || selectedId !== null || options.length !== 1) return null;

  return options[0] ?? null;
}

export { normalizeSearchText };

export function filterAcademicOptions(options: AcademicOption[], query: string): AcademicOption[] {
  const needle = normalizeSearchText(query);
  if (!needle) return options;

  return options.filter((option) => {
    const haystack = normalizeSearchText(`${option.name} ${option.code ?? ''}`);
    return haystack.includes(needle);
  });
}
