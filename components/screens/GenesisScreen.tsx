import React, { useState, useMemo } from 'react';
import { Character } from '../../types';
import { Spinner } from '../ui/Spinner';
import { useAppContext } from '../../state/AppContext';

type FusedCharacterData = { name: string, title: string, systemPrompt: string, avatar: string, color: string };
type GenesisState = 'selecting' | 'fusing' | 'fused';

const GenesisScreen: React.FC = () => {
    const { allCharacters, apiKey, handleSaveCustomCharacter, handleGenerateFusedCharacter, goBack } = useAppContext();
    
    const [state, setState] = useState<GenesisState>('selecting');
    const [parentAId, setParentAId] = useState<string>('');
    const [parentBId, setParentBId] = useState<string>('');
    const [fusedChar, setFusedChar] = useState<Character | null>(null);
    const [error, setError] = useState('');

    const parentA = useMemo(() => allCharacters.find(c => c.id === parentAId), [parentAId, allCharacters]);
    const parentB = useMemo(() => allCharacters.find(c => c.id === parentBId), [parentBId, allCharacters]);

    const handleFuse = async () => {
        if (!parentA || !parentB) {
            setError('Please select two parent characters.');
            return;
        }
        if (!apiKey) {
            setError('API Key is required to use the Genesis Engine. Please set it in Settings.');
            return;
        }
        setState('fusing');
        setError('');
        const result = await handleGenerateFusedCharacter(parentA, parentB);
        if (result) {
            setFusedChar({
                ...result,
                id: '', // Will be assigned on save
                isCustom: true,
            });
            setState('fused');
        } else {
            setError('The Genesis Engine failed to create a fusion. The model may be overloaded or an error occurred. Please try again.');
            setState('selecting');
        }
    };

    const handleSave = () => {
        if (fusedChar) {
            handleSaveCustomCharacter(fusedChar);
            goBack(); // Navigate back after saving
        }
    };
    
    const handleRandomize = () => {
        const eligible = allCharacters.filter(c => !c.isCustom);
        if (eligible.length < 2) {
            setError("Not enough characters to randomize.");
            return;
        }
        let indexA = Math.floor(Math.random() * eligible.length);
        let indexB = Math.floor(Math.random() * eligible.length);
        while (indexA === indexB) {
            indexB = Math.floor(Math.random() * eligible.length);
        }
        setParentAId(eligible[indexA].id);
        setParentBId(eligible[indexB].id);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 flex flex-col h-[calc(100vh-10rem)]">
            <header className="text-center mb-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                    🧬 Genesis Fusion Chamber
                </h2>
                <p className="text-gray-400 mt-2">Combine the essence of two characters to create a new, unique personality.</p>
            </header>

            {error && <p className="text-red-400 bg-red-900/20 p-3 rounded-md my-4 text-center">{error}</p>}
            
            <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <ContainmentPod title="Parent A" allCharacters={allCharacters} selectedId={parentAId} onSelect={setParentAId} otherId={parentBId} />
                
                <FusionCore onFuse={handleFuse} onRandomize={handleRandomize} state={state} canFuse={!!(parentAId && parentBId)} fusedChar={fusedChar} />

                <ContainmentPod title="Parent B" allCharacters={allCharacters} selectedId={parentBId} onSelect={setParentBId} otherId={parentAId} />
            </main>
            
            {state === 'fused' && fusedChar && (
                <ResultEditor fusedChar={fusedChar} setFusedChar={setFusedChar} />
            )}

            <footer className="flex justify-center gap-4 mt-6 flex-shrink-0">
                <button className="btn-secondary" onClick={goBack}>Cancel & Exit</button>
                <button className="btn-primary" onClick={handleSave} disabled={state !== 'fused'}>Save Fused Character</button>
            </footer>
            <StyleInjector />
        </div>
    );
};

const ContainmentPod: React.FC<{title: string, allCharacters: Character[], selectedId: string, onSelect: (id: string) => void, otherId: string}> = ({title, allCharacters, selectedId, onSelect, otherId}) => {
    const selectedChar = allCharacters.find(c => c.id === selectedId);
    return (
        <div className="bg-black/30 p-4 rounded-2xl border-2 border-purple-500/20 h-full flex flex-col">
            <h4 className="text-lg font-bold text-purple-300 mb-4 text-center">{title}</h4>
            <select className="select mb-4" value={selectedId} onChange={e => onSelect(e.target.value)}>
                <option value="">-- Select Character --</option>
                {allCharacters.map(char => (
                    <option key={char.id} value={char.id} disabled={char.id === otherId}>{char.name}</option>
                ))}
            </select>
            <div className="flex-1 flex items-center justify-center bg-black/20 rounded-lg p-4">
                {selectedChar ? (
                     <div className="text-center animate-[fadeIn_0.3s]">
                        <div className="text-7xl w-24 h-24 mx-auto rounded-full flex items-center justify-center overflow-hidden" style={{filter: `drop-shadow(0 0 15px ${selectedChar.color})`}}>
                            {selectedChar.avatarUrl ? <img src={selectedChar.avatarUrl} alt={selectedChar.name} className="w-full h-full object-contain"/> : selectedChar.avatar}
                        </div>
                        <p className="font-bold text-xl mt-4" style={{color: selectedChar.color}}>{selectedChar.name}</p>
                        <p className="text-xs text-gray-400">{selectedChar.title}</p>
                     </div>
                ) : (
                    <div className="text-gray-600">Awaiting Selection...</div>
                )}
            </div>
        </div>
    )
};

const FusionCore: React.FC<{onFuse: ()=>void, onRandomize: ()=>void, state: GenesisState, canFuse: boolean, fusedChar: Character | null}> = ({onFuse, onRandomize, state, canFuse, fusedChar}) => {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-4 relative">
             <div className={`fusion-core ${state}`}>
                {state === 'fused' && fusedChar && (
                     <div className="text-7xl w-24 h-24 rounded-full flex items-center justify-center overflow-hidden" style={{filter: `drop-shadow(0 0 15px ${fusedChar.color})`}}>
                        {fusedChar.avatarUrl ? <img src={fusedChar.avatarUrl} alt={fusedChar.name} className="w-full h-full object-contain"/> : fusedChar.avatar}
                    </div>
                )}
             </div>
             {state === 'selecting' && (
                <>
                    <button onClick={onFuse} disabled={!canFuse} className="btn-primary text-lg w-48 justify-center gap-2">
                        Initiate Fusion
                    </button>
                    <button onClick={onRandomize} className="btn-secondary text-sm w-48 justify-center">
                        🎲 Randomize Parents
                    </button>
                </>
             )}
             {state === 'fusing' && <div className="text-center"><Spinner /><p className="mt-2 text-purple-300">Fusing DNA...</p></div>}
             {state === 'fused' && fusedChar && <p className="text-lg font-bold text-cyan-300 animate-[fadeIn_0.5s_1.5s_both]">Fusion Complete!</p>}
        </div>
    )
};

const ResultEditor: React.FC<{fusedChar: Character, setFusedChar: (char: Character) => void}> = ({fusedChar, setFusedChar}) => {
    return (
        <div className="mt-4 p-4 bg-black/30 rounded-lg animate-[fadeIn_0.5s_1s_both]">
            <h3 className="text-xl font-bold text-cyan-300 mb-4 text-center">Review & Edit Fusion Result</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <input type="text" value={fusedChar.name} onChange={e => setFusedChar({...fusedChar, name: e.target.value})} placeholder="Name" className="input" />
                    <input type="text" value={fusedChar.title} onChange={e => setFusedChar({...fusedChar, title: e.target.value})} placeholder="Title" className="input" />
                    <div className="flex gap-2">
                        <input type="text" value={fusedChar.avatar} onChange={e => setFusedChar({...fusedChar, avatar: e.target.value})} placeholder="Avatar Emoji" className="input w-1/2" />
                        <input type="color" value={fusedChar.color} onChange={e => setFusedChar({...fusedChar, color: e.target.value})} className="input w-1/2 h-12" />
                    </div>
                </div>
                <textarea value={fusedChar.systemPrompt} onChange={e => setFusedChar({...fusedChar, systemPrompt: e.target.value})} placeholder="System Prompt" className="input min-h-[150px] text-xs" />
            </div>
        </div>
    )
};

const StyleInjector = () => (
    <style>{`
        .btn-primary, .btn-secondary { padding: 0.75rem 1.5rem; border-radius: 9999px; cursor: pointer; transition: all 0.2s ease-in-out; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn-primary:hover:not(:disabled), .btn-secondary:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.2); }
        .btn-primary { border: 1px solid #a855f7; background: linear-gradient(145deg, #a855f7, #ec4899); color: white; box-shadow: 0 4px 15px -5px #a855f7; }
        .btn-secondary { border: 1px solid rgba(17, 219, 239, 0.4); background: rgba(17, 219, 239, 0.1); color: #11dbef; }
        .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        .input, .select { width: 100%; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.5rem; color: white; transition: all 0.3s; resize: vertical; }
        .select { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; }
        
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px -5px #a855f7; } 50% { box-shadow: 0 0 40px 10px #a855f7; } }
        @keyframes spin-glow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .fusion-core {
            width: 150px; height: 150px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            position: relative;
            background: radial-gradient(circle, #1e1b4b 0%, transparent 70%);
            border: 3px solid #4c1d95;
            transition: all 0.5s ease;
        }
        .fusion-core::before, .fusion-core::after { content: ''; position: absolute; border-radius: 50%; border: 2px dashed #a855f7; }
        .fusion-core::before { inset: -10px; animation: spin-glow 10s linear infinite; }
        .fusion-core::after { inset: -20px; animation: spin-glow 15s linear infinite reverse; }

        .fusion-core.fusing { animation: pulse-glow 1.5s infinite; border-color: #c084fc; }
        .fusion-core.fused { border-color: #2dd4bf; transform: scale(1.2); box-shadow: 0 0 50px #2dd4bf; }
        .fusion-core.fused::before, .fusion-core.fused::after { animation-play-state: paused; opacity: 0; }
    `}</style>
)

export default GenesisScreen;
