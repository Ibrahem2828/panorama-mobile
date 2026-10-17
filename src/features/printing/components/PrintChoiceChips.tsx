import { ChoiceChips, type ChoiceChip } from '../../../components';

export type PrintChoice<T extends string> = ChoiceChip<T>;

type PrintChoiceChipsProps<T extends string> = {
  label: string;
  value: T;
  options: ReadonlyArray<PrintChoice<T>>;
  onChange: (value: T) => void;
};

/** A single-choice group of chips (one radio group), used for every print option. */
export function PrintChoiceChips<T extends string>(props: PrintChoiceChipsProps<T>) {
  return <ChoiceChips {...props} />;
}
