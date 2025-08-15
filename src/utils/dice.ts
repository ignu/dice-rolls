import { DiceType, DiceRoll, DiceGroup, DiceSelection } from '../types';

const DICE_SIDES: Record<DiceType, number> = {
  'd4': 4,
  'd6': 6,
  'd8': 8,
  'd10': 10,
  'd12': 12,
  'd20': 20,
  'd100': 100,
};

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(type: DiceType, count: number, modifier: number = 0): DiceRoll {
  const sides = DICE_SIDES[type];
  const results: number[] = [];
  
  for (let i = 0; i < count; i++) {
    results.push(rollDie(sides));
  }
  
  const diceGroup: DiceGroup = { type, count, results };
  const total = results.reduce((sum, result) => sum + result, 0) + modifier;
  
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    diceGroups: [diceGroup],
    total,
    modifier,
    expression: formatDiceExpression([diceGroup], modifier),
  };
}

export function rollMultipleDice(diceSelections: DiceSelection[], modifier: number = 0, isCustom: boolean = false): DiceRoll {
  const diceGroups: DiceGroup[] = [];
  let totalSum = 0;
  
  for (const selection of diceSelections) {
    if (selection.count <= 0) continue;
    
    const sides = DICE_SIDES[selection.type];
    const results: number[] = [];
    
    for (let i = 0; i < selection.count; i++) {
      results.push(rollDie(sides));
    }
    
    const groupSum = results.reduce((sum, result) => sum + result, 0);
    totalSum += groupSum;
    
    diceGroups.push({
      type: selection.type,
      count: selection.count,
      results,
    });
  }
  
  const total = totalSum + modifier;
  
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    diceGroups,
    total,
    modifier,
    expression: formatDiceExpression(diceGroups, modifier),
    isCustom,
  };
}

export function formatDiceExpression(diceGroups: DiceGroup[], modifier: number = 0): string {
  const groupStrings = diceGroups.map(group => `${group.count}${group.type}`);
  let expression = groupStrings.join(' + ');
  
  if (modifier !== 0) {
    expression += modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
  }
  
  return expression;
}

export function formatDiceRoll(roll: DiceRoll): string {
  return roll.expression;
}