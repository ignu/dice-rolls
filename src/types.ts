export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceGroup {
  type: DiceType;
  count: number;
  results: number[];
}

export interface DiceRoll {
  id: string;
  timestamp: number;
  diceGroups: DiceGroup[];
  total: number;
  modifier: number;
  expression: string;
  name?: string;
  isCustom?: boolean;
}

export interface DiceSelection {
  type: DiceType;
  count: number;
}