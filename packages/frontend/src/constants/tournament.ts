export interface SelectOption {
  label: string;
  value: string;
}

export const BRACKET_OPTIONS: SelectOption[] = [
  { label: 'Single Elimination', value: 'single_elimination' },
  { label: 'Double Elimination', value: 'double_elimination' },
  { label: 'Round Robin', value: 'round_robin' },
  { label: 'Swiss', value: 'swiss' },
  { label: 'Pool Play', value: 'pool_play' },
] as const;
