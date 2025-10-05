import React, { useState, useMemo } from 'react';
import { Character, CharacterID } from '../../types';

interface SurvivorCastSelectProps {
    allCharacters: Character[];
    onStartSeason: (castIds: string[], seed: string, openingBet: CharacterID | null, hostId: CharacterID) => void;
}

const SurvivorCastSelect: React.FC<SurvivorCastSelectProps> = ({ allCharacters, onStartSeason }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [seed, setSeed] = useState(() => `SV-${Date.now()}`);
    const [openingBet, setOpeningBet] = useState<CharacterID | ''>('');
    const [hostId, setHostId] = useState<CharacterID | ''>('');

    const toggleCharacter = (id: string) => {
        if (id === hostId) return; // Cannot select host as a player
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(charId => charId !== id);
            }
            return [...prev, id];
        });
    };

    const handleStart = () => {
        if (selectedIds.length !== 12) {
            alert('Please select exactly 12 characters to start a season.');
            return;
        }
        if (!hostId) {
            alert('Please select a Host for the season.');
            return;
        }
        onStartSeason(selectedIds, seed, openingBet || null, hostId);
    };

    const handleRandomize = () => {
        // Start with all non-custom characters.
        let eligibleForCast = allCharacters.filter(c => !c.isCustom);
    
        // If a host is already selected, remove them from the pool of potential players.
        if (hostId) {
            eligibleForCast = eligibleForCast.filter(c => c.id !== hostId);
        }
    
        // Shuffle the eligible characters for the cast.
        const shuffled = [...eligibleForCast].sort(() => 0.5 - Math.random());
        
        // Select the cast of 12.
        const cast = shuffled.slice(0, 12).map(c => c.id);
        setSelectedIds(cast);
    
        // If no host was pre-selected, pick one from the remaining characters.
        if (!hostId) {
            const remainingForHost = shuffled.slice(12);
            setHostId(remainingForHost[0]?.id || '');
        }
        
        // Reset the bet.
        setOpeningBet('');
    };
    
    const selectedCharacters = useMemo(() => allCharacters.filter(c => selectedIds.includes(c.id)), [selectedIds, allCharacters]);
    const availableForCast = useMemo(() => allCharacters.filter(c => c.id !== hostId), [allCharacters, hostId]);
    const availableForHost = useMemo(() => allCharacters.filter(c => !selectedIds.includes(c.id)), [allCharacters, selectedIds]);


    return (
        <div className="max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                    🔱 Survivor Mode: Cast Selection
                </h2>
                <p className="text-gray-400 mt-2">Assemble your cast of 12 characters and select a host.</p>
            </div>

            <div className="p-4 mb-8 bg-black/30 border border-purple-500/20 rounded-xl flex flex-wrap items-center justify-center gap-4 sticky top-24 z-10">
                <button className="btn-secondary" onClick={handleRandomize}>🎲 Randomize</button>
                <select value={hostId} onChange={e => setHostId(e.target.value)} className="input-filter">
                    <option value="">-- Select Host --</option>
                    {availableForHost.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                    type="text"
                    value={seed}
                    onChange={e => setSeed(e.target.value)}
                    className="input-filter"
                    placeholder="Season Seed"
                />
                {selectedIds.length === 12 && (
                    <select value={openingBet} onChange={e => setOpeningBet(e.target.value)} className="input-filter">
                        <option value="">-- Place Opening Bet --</option>
                        {selectedCharacters.map(c => <option key={c.id} value={c.id}>Winner: {c.name}</option>)}
                    </select>
                )}
                <button className="btn-primary" onClick={handleStart} disabled={selectedIds.length !== 12 || !hostId}>
                    Start Season ({selectedIds.length}/12)
                </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
                {availableForCast.map(char => (
                    <CharacterCardSelect
                        key={char.id}
                        character={char}
                        isSelected={selectedIds.includes(char.id)}
                        onClick={() => toggleCharacter(char.id)}
                    />
                ))}
            </div>
            <style>{`
                .input-filter {
                    padding: 0.75rem 1.5rem; border-radius: 9999px; cursor: pointer; transition: all 0.3s; font-size: 1rem; font-weight: 600;
                    background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); color: white; -webkit-appearance: none; 
                }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

const CharacterCardSelect: React.FC<{ character: Character; isSelected: boolean; onClick: () => void; }> = ({ character, isSelected, onClick }) => (
    <div
        className={`p-2 bg-[#100c1c] border-2 rounded-xl cursor-pointer text-center w-[120px] aspect-[3/4] transition-all duration-300 ${isSelected ? 'border-purple-400 scale-105 shadow-lg shadow-purple-900/50' : 'border-white/10'}`}
        onClick={onClick}
    >
        <div className="text-4xl h-16 flex items-center justify-center" style={{ filter: `drop-shadow(0 0 10px ${character.color})` }}>
            {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-14 h-14 object-contain rounded-full" /> : character.avatar}
        </div>
        <div className="mt-1">
            <div className="font-bold text-sm" style={{ color: character.color }}>{character.name}</div>
            <div className="text-[10px] text-gray-400 h-8 flex items-center justify-center">{character.title}</div>
        </div>
    </div>
);

export default SurvivorCastSelect;