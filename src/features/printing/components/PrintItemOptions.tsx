import { useMemo } from 'react';

import { Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { PrintCartItem } from '../types';
import { PrintChoiceChips, type PrintChoice } from './PrintChoiceChips';

type PrintItemOptionsProps = {
  item: PrintCartItem;
  onChange: (patch: Partial<Omit<PrintCartItem, 'key'>>) => void;
};

export function usePrintOptionLabels(): Record<string, string> {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      black_white: t.printing.options.colorBlackWhite,
      color: t.printing.options.colorColored,
      one_sided: t.printing.options.sidesSingle,
      double_sided: t.printing.options.sidesDouble,
      A4: 'A4',
      A3: 'A3',
      A5: 'A5',
      none: t.printing.options.bindingNone,
      staple: t.printing.options.bindingStaple,
      spiral: t.printing.options.bindingSpiral,
      thermal: t.printing.options.bindingThermal,
    }),
    [t],
  );
}

function choices<T extends string>(
  values: readonly T[],
  labels: Record<string, string>,
): PrintChoice<T>[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

export function PrintItemOptions({ item, onChange }: PrintItemOptionsProps) {
  const { t } = useTranslation();
  const labels = usePrintOptionLabels();

  return (
    <Stack gap="lg">
      <PrintChoiceChips
        label={t.printing.options.color}
        onChange={(colorMode) => onChange({ colorMode })}
        options={choices(['black_white', 'color'] as const, labels)}
        value={item.colorMode}
      />
      <PrintChoiceChips
        label={t.printing.options.sides}
        onChange={(sides) => onChange({ sides })}
        options={choices(['one_sided', 'double_sided'] as const, labels)}
        value={item.sides}
      />
      <PrintChoiceChips
        label={t.printing.options.paperSize}
        onChange={(paperSize) => onChange({ paperSize })}
        options={choices(['A4', 'A3', 'A5'] as const, labels)}
        value={item.paperSize}
      />
      <PrintChoiceChips
        label={t.printing.options.binding}
        onChange={(binding) => onChange({ binding })}
        options={choices(['none', 'staple', 'spiral', 'thermal'] as const, labels)}
        value={item.binding}
      />
    </Stack>
  );
}
