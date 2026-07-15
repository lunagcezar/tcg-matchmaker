export interface SelectOption {
  label: string;
  value: string;
}

export const BEST_OF_OPTIONS: SelectOption[] = [
  { label: 'BO1 (Single Game)', value: '1' },
  { label: 'BO3 (Best of 3)', value: '3' },
  { label: 'BO5 (Best of 5)', value: '5' },
];

export const BRACKET_OPTIONS: SelectOption[] = [
  { label: 'Single Elimination', value: 'single_elimination' },
  { label: 'Double Elimination', value: 'double_elimination' },
  { label: 'Round Robin', value: 'round_robin' },
  { label: 'Swiss', value: 'swiss' },
  { label: 'Pool Play', value: 'pool_play' },
] as const;
