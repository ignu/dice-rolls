import { DiceSelection } from '../types';

export interface CommonRoll {
  name: string;
  dice: DiceSelection[];
  modifier: number;
  description?: string;
}

export interface RollCategory {
  name: string;
  rolls: CommonRoll[];
}

export const COMMON_ROLLS: RollCategory[] = [
  {
    name: "Weapons",
    rolls: [
      { name: "Dagger", dice: [{ type: 'd4', count: 1 }], modifier: 0 },
      { name: "Shortsword", dice: [{ type: 'd6', count: 1 }], modifier: 0 },
      { name: "Longsword", dice: [{ type: 'd8', count: 1 }], modifier: 0 },
      { name: "Greatsword", dice: [{ type: 'd6', count: 2 }], modifier: 0 },
      { name: "Rapier", dice: [{ type: 'd8', count: 1 }], modifier: 0 },
      { name: "Greataxe", dice: [{ type: 'd12', count: 1 }], modifier: 0 },
      { name: "Light Crossbow", dice: [{ type: 'd8', count: 1 }], modifier: 0 },
      { name: "Heavy Crossbow", dice: [{ type: 'd10', count: 1 }], modifier: 0 },
      { name: "Longbow", dice: [{ type: 'd8', count: 1 }], modifier: 0 },
      { name: "Maul", dice: [{ type: 'd6', count: 2 }], modifier: 0 },
    ]
  },
  {
    name: "Spells",
    rolls: [
      { name: "Fireball (3rd)", dice: [{ type: 'd6', count: 8 }], modifier: 0, description: "DEX save for half" },
      { name: "Lightning Bolt (3rd)", dice: [{ type: 'd6', count: 8 }], modifier: 0, description: "DEX save for half" },
      { name: "Magic Missile (1st)", dice: [{ type: 'd4', count: 3 }], modifier: 3, description: "3 missiles, 1d4+1 each" },
      { name: "Scorching Ray (2nd)", dice: [{ type: 'd6', count: 2 }], modifier: 0, description: "Per ray (3 rays)" },
      { name: "Eldritch Blast", dice: [{ type: 'd10', count: 1 }], modifier: 0, description: "Per beam" },
      { name: "Guiding Bolt (1st)", dice: [{ type: 'd6', count: 4 }], modifier: 0 },
      { name: "Inflict Wounds (1st)", dice: [{ type: 'd10', count: 3 }], modifier: 0 },
      { name: "Spiritual Weapon (2nd)", dice: [{ type: 'd8', count: 1 }], modifier: 0 },
      { name: "Disintegrate (6th)", dice: [{ type: 'd6', count: 10 }], modifier: 40 },
    ]
  },
  {
    name: "Healing Spells",
    rolls: [
      { name: "Cure Wounds (1st)", dice: [{ type: 'd8', count: 1 }], modifier: 0, description: "+spell mod" },
      { name: "Cure Wounds (2nd)", dice: [{ type: 'd8', count: 2 }], modifier: 0, description: "+spell mod" },
      { name: "Cure Wounds (3rd)", dice: [{ type: 'd8', count: 3 }], modifier: 0, description: "+spell mod" },
      { name: "Healing Word (1st)", dice: [{ type: 'd4', count: 1 }], modifier: 0, description: "+spell mod" },
      { name: "Healing Word (2nd)", dice: [{ type: 'd4', count: 2 }], modifier: 0, description: "+spell mod" },
      { name: "Heal (6th)", dice: [{ type: 'd8', count: 7 }], modifier: 0 },
      { name: "Mass Cure Wounds (5th)", dice: [{ type: 'd8', count: 3 }], modifier: 0, description: "+spell mod each" },
    ]
  },
  {
    name: "Class Features",
    rolls: [
      { name: "Sneak Attack (1st-2nd)", dice: [{ type: 'd6', count: 1 }], modifier: 0 },
      { name: "Sneak Attack (3rd-4th)", dice: [{ type: 'd6', count: 2 }], modifier: 0 },
      { name: "Sneak Attack (5th-6th)", dice: [{ type: 'd6', count: 3 }], modifier: 0 },
      { name: "Sneak Attack (7th-8th)", dice: [{ type: 'd6', count: 4 }], modifier: 0 },
      { name: "Divine Smite (1st)", dice: [{ type: 'd8', count: 2 }], modifier: 0, description: "+1d8 vs undead/fiend" },
      { name: "Divine Smite (2nd)", dice: [{ type: 'd8', count: 3 }], modifier: 0, description: "+1d8 vs undead/fiend" },
      { name: "Divine Smite (3rd)", dice: [{ type: 'd8', count: 4 }], modifier: 0, description: "+1d8 vs undead/fiend" },
      { name: "Rage Damage (+2)", dice: [], modifier: 2 },
      { name: "Bardic Inspiration (d6)", dice: [{ type: 'd6', count: 1 }], modifier: 0 },
      { name: "Bardic Inspiration (d8)", dice: [{ type: 'd8', count: 1 }], modifier: 0 },
    ]
  },
  {
    name: "Monster Abilities",
    rolls: [
      { name: "Bite (Medium Beast)", dice: [{ type: 'd6', count: 1 }], modifier: 0 },
      { name: "Bite (Large Beast)", dice: [{ type: 'd8', count: 1 }], modifier: 0 },
      { name: "Claw Attack", dice: [{ type: 'd4', count: 1 }], modifier: 0 },
      { name: "Young Dragon Breath", dice: [{ type: 'd6', count: 8 }], modifier: 0, description: "DEX save for half" },
      { name: "Adult Dragon Breath", dice: [{ type: 'd6', count: 12 }], modifier: 0, description: "DEX save for half" },
      { name: "Troll Claw", dice: [{ type: 'd6', count: 1 }], modifier: 4 },
      { name: "Owlbear Claw", dice: [{ type: 'd8', count: 2 }], modifier: 0 },
      { name: "Giant Slam", dice: [{ type: 'd6', count: 3 }], modifier: 0 },
    ]
  }
];