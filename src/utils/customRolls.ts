import { CommonRoll } from '../data/commonRolls';

const CUSTOM_ROLLS_KEY = 'customDiceRolls';

export function saveCustomRoll(name: string, roll: CommonRoll): void {
  const existing = getCustomRolls();
  const updated = [...existing, { ...roll, name }];
  localStorage.setItem(CUSTOM_ROLLS_KEY, JSON.stringify(updated));
}

export function getCustomRolls(): CommonRoll[] {
  try {
    const saved = localStorage.getItem(CUSTOM_ROLLS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load custom rolls:', error);
    return [];
  }
}

export function deleteCustomRoll(name: string): void {
  const existing = getCustomRolls();
  const updated = existing.filter(roll => roll.name !== name);
  localStorage.setItem(CUSTOM_ROLLS_KEY, JSON.stringify(updated));
}

export function clearCustomRolls(): void {
  localStorage.removeItem(CUSTOM_ROLLS_KEY);
}