import { useState, useEffect } from 'react';
import { DiceType, DiceRoll, DiceSelection } from './types';
import { rollDice, rollMultipleDice, formatDiceRoll } from './utils/dice';
import { diceRollDB } from './utils/database';
import { COMMON_ROLLS, CommonRoll } from './data/commonRolls';
import { saveCustomRoll, getCustomRolls, deleteCustomRoll } from './utils/customRolls';

const DICE_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

function App() {
  const [modifier, setModifier] = useState(0);
  const [rollHistory, setRollHistory] = useState<DiceRoll[]>([]);
  const [multiDice, setMultiDice] = useState<DiceSelection[]>(
    DICE_TYPES.map(type => ({ type, count: 0 }))
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(COMMON_ROLLS[0]?.name || '');
  const [showCommonRolls, setShowCommonRolls] = useState(false);
  const [customRolls, setCustomRolls] = useState<CommonRoll[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [rollToSave, setRollToSave] = useState<DiceRoll | null>(null);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await diceRollDB.init();
        const rolls = await diceRollDB.getAllRolls();
        setRollHistory(rolls);
      } catch (error) {
        console.error('Failed to initialize database or load roll history:', error);
        // Fallback to localStorage if IndexedDB fails
        const saved = localStorage.getItem('diceRollHistory');
        if (saved) {
          try {
            setRollHistory(JSON.parse(saved));
          } catch (e) {
            console.error('Failed to load roll history from localStorage:', e);
          }
        }
      }
    };

    initializeDatabase();
  }, []);

  useEffect(() => {
    setCustomRolls(getCustomRolls());
  }, []);


  const addRollToHistory = async (roll: DiceRoll) => {
    try {
      await diceRollDB.addRoll(roll);
      setRollHistory(prev => [roll, ...prev]);
    } catch (error) {
      console.error('Failed to save roll to database:', error);
      // Fallback to localStorage and state only
      setRollHistory(prev => {
        const updated = [roll, ...prev];
        localStorage.setItem('diceRollHistory', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleReroll = async (originalRoll: DiceRoll) => {
    let roll: DiceRoll;
    if (originalRoll.diceGroups.length === 1) {
      const group = originalRoll.diceGroups[0];
      roll = rollDice(group.type, group.count, originalRoll.modifier);
    } else {
      const selections = originalRoll.diceGroups.map(group => ({
        type: group.type,
        count: group.count
      }));
      roll = rollMultipleDice(selections, originalRoll.modifier);
    }
    await addRollToHistory(roll);
  };

  const handleMultiRoll = async () => {
    const activeDice = multiDice.filter(dice => dice.count > 0);
    if (activeDice.length === 0) return;
    
    // Check if this is a custom roll (not a pre-defined common roll)
    const isCustom = !isPreDefinedRoll(activeDice, modifier);
    const roll = rollMultipleDice(activeDice, modifier, isCustom);
    await addRollToHistory(roll);
  };

  const isPreDefinedRoll = (diceSelections: DiceSelection[], mod: number): boolean => {
    // Check if this combination matches any existing common roll
    for (const category of COMMON_ROLLS) {
      for (const commonRoll of category.rolls) {
        if (commonRoll.modifier === mod && 
            diceSelections.length === commonRoll.dice.length &&
            diceSelections.every(selection => 
              commonRoll.dice.some(dice => dice.type === selection.type && dice.count === selection.count)
            )) {
          return true;
        }
      }
    }
    // Also check custom rolls
    for (const customRoll of customRolls) {
      if (customRoll.modifier === mod && 
          diceSelections.length === customRoll.dice.length &&
          diceSelections.every(selection => 
            customRoll.dice.some(dice => dice.type === selection.type && dice.count === selection.count)
          )) {
        return true;
      }
    }
    return false;
  };

  const handleSaveRoll = (roll: DiceRoll) => {
    setRollToSave(roll);
    setSaveName('');
    setShowSaveDialog(true);
  };

  const confirmSaveRoll = () => {
    if (!rollToSave || !saveName.trim()) return;
    
    const customRoll: CommonRoll = {
      name: saveName.trim(),
      dice: rollToSave.diceGroups.map(group => ({
        type: group.type,
        count: group.count
      })),
      modifier: rollToSave.modifier
    };
    
    saveCustomRoll(saveName.trim(), customRoll);
    setCustomRolls(getCustomRolls());
    setShowSaveDialog(false);
    setRollToSave(null);
    setSaveName('');
  };

  const handleDeleteCustomRoll = (name: string) => {
    deleteCustomRoll(name);
    setCustomRolls(getCustomRolls());
  };

  const updateMultiDiceCount = (type: DiceType, count: number) => {
    setMultiDice(prev => 
      prev.map(dice => 
        dice.type === type ? { ...dice, count: Math.max(0, count) } : dice
      )
    );
  };

  const clearMultiDice = () => {
    setMultiDice(DICE_TYPES.map(type => ({ type, count: 0 })));
  };

  const hasActiveDice = multiDice.some(dice => dice.count > 0);
  const multiDiceExpression = multiDice
    .filter(dice => dice.count > 0)
    .map(dice => `${dice.count}${dice.type}`)
    .join(' + ') + (modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : '');

  const clearHistory = async () => {
    try {
      await diceRollDB.clearAllRolls();
      setRollHistory([]);
    } catch (error) {
      console.error('Failed to clear database:', error);
      // Fallback to clearing localStorage and state
      localStorage.removeItem('diceRollHistory');
      setRollHistory([]);
    }
  };

  const quickRoll = async (dice: DiceType, count: number = 1, mod: number = 0) => {
    const roll = rollDice(dice, count, mod);
    await addRollToHistory(roll);
  };

  const handleCommonRoll = async (commonRoll: CommonRoll) => {
    const activeDice = commonRoll.dice.filter(dice => dice.count > 0);
    if (activeDice.length === 0 && commonRoll.modifier === 0) return;
    
    const roll = rollMultipleDice(activeDice, commonRoll.modifier);
    await addRollToHistory(roll);
  };

  const populateFromCommonRoll = (commonRoll: CommonRoll) => {
    // Clear current dice
    setMultiDice(DICE_TYPES.map(type => ({ type, count: 0 })));
    
    // Set dice from common roll
    const newMultiDice = DICE_TYPES.map(type => {
      const diceFromCommon = commonRoll.dice.find(d => d.type === type);
      return {
        type,
        count: diceFromCommon ? diceFromCommon.count : 0
      };
    });
    
    setMultiDice(newMultiDice);
    setModifier(commonRoll.modifier);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-red-400">
          D&D 5e Dice Roller
        </h1>

        {/* Quick Roll Buttons */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Rolls</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DICE_TYPES.map(dice => (
              <button
                key={dice}
                onClick={() => quickRoll(dice)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {dice.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Common D&D Rolls - Collapsible */}
        <div className="mb-8">
          <button
            onClick={() => setShowCommonRolls(!showCommonRolls)}
            className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-left transition-colors flex justify-between items-center"
          >
            <span className="text-xl font-semibold">Common D&D Rolls</span>
            <span className="text-gray-400">
              {showCommonRolls ? '▼' : '▶'}
            </span>
          </button>
          
          {showCommonRolls && (
            <div className="bg-gray-800 rounded-b-lg p-6 border-t border-gray-700">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  {COMMON_ROLLS.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                  <option value="Custom">Custom Rolls</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedCategory === "Custom" ? (
                  customRolls.length === 0 ? (
                    <div className="col-span-full text-center text-gray-400 py-8">
                      No custom rolls saved yet. Roll something custom and save it!
                    </div>
                  ) : (
                    customRolls.map((roll, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-sm">{roll.name}</h3>
                            <p className="text-xs text-gray-400">
                              {roll.dice.map(d => `${d.count}${d.type}`).join(' + ')}
                              {roll.modifier !== 0 && (roll.modifier > 0 ? ` + ${roll.modifier}` : ` - ${Math.abs(roll.modifier)}`)}
                            </p>
                            {roll.description && (
                              <p className="text-xs text-yellow-400 mt-1">{roll.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCommonRoll(roll)}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs font-semibold transition-colors"
                          >
                            Roll
                          </button>
                          <button
                            onClick={() => populateFromCommonRoll(roll)}
                            className="flex-1 bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs font-semibold transition-colors"
                            title="Load into dice roller"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteCustomRoll(roll.name)}
                            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-semibold transition-colors"
                            title="Delete custom roll"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  COMMON_ROLLS.find(cat => cat.name === selectedCategory)?.rolls.map((roll, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{roll.name}</h3>
                        <p className="text-xs text-gray-400">
                          {roll.dice.map(d => `${d.count}${d.type}`).join(' + ')}
                          {roll.modifier !== 0 && (roll.modifier > 0 ? ` + ${roll.modifier}` : ` - ${Math.abs(roll.modifier)}`)}
                        </p>
                        {roll.description && (
                          <p className="text-xs text-yellow-400 mt-1">{roll.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCommonRoll(roll)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs font-semibold transition-colors"
                      >
                        Roll
                      </button>
                      <button
                        onClick={() => populateFromCommonRoll(roll)}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs font-semibold transition-colors"
                        title="Load into dice roller"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dice Roll Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Dice Roll</h2>
            {hasActiveDice && (
              <button
                onClick={clearMultiDice}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
            {DICE_TYPES.map(type => (
              <div key={type} className="text-center">
                <label className="block text-sm font-medium mb-2">{type.toUpperCase()}</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={multiDice.find(d => d.type === type)?.count || 0}
                  onChange={(e) => updateMultiDiceCount(type, parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-center"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Modifier</label>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex-1 flex items-end">
              <button
                onClick={handleMultiRoll}
                disabled={!hasActiveDice}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Roll {hasActiveDice ? multiDiceExpression : 'Select Dice'}
              </button>
            </div>
          </div>
        </div>


        {/* Roll History */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Roll History</h2>
            {rollHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          {rollHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No rolls yet. Roll some dice!</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rollHistory.map((roll) => (
                <div key={roll.id} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-yellow-400">
                        {formatDiceRoll(roll)} = {roll.total}
                      </span>
                      <div className="text-sm text-gray-400">
                        {roll.diceGroups.map((group, index) => (
                          <span key={index}>
                            {index > 0 && ' + '}
                            {group.type.toUpperCase()}: [{group.results.join(', ')}]
                          </span>
                        ))}
                        {roll.modifier !== 0 && ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(roll.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReroll(roll)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Reroll
                    </button>
                    {roll.isCustom && (
                      <button
                        onClick={() => handleSaveRoll(roll)}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                        title="Save as custom roll"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Roll Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Custom Roll</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Roll Name</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && confirmSaveRoll()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                placeholder="Enter a name for this roll..."
                autoFocus
              />
            </div>
            {rollToSave && (
              <div className="mb-4 text-sm text-gray-400">
                Roll: {rollToSave.expression}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={confirmSaveRoll}
                disabled={!saveName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;