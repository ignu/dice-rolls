import { useState, useEffect } from 'react';
import { DiceType, DiceRoll, DiceSelection } from './types';
import { rollDice, rollMultipleDice, formatDiceRoll } from './utils/dice';
import { diceRollDB } from './utils/database';

const DICE_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

function App() {
  const [modifier, setModifier] = useState(0);
  const [rollHistory, setRollHistory] = useState<DiceRoll[]>([]);
  const [multiDice, setMultiDice] = useState<DiceSelection[]>(
    DICE_TYPES.map(type => ({ type, count: 0 }))
  );

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
    
    const roll = rollMultipleDice(activeDice, modifier);
    await addRollToHistory(roll);
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
                  <button
                    onClick={() => handleReroll(roll)}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                  >
                    Reroll
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;