import React from 'react';
import { SurvivorSeason, SurvivorDossier, Character, CharacterID } from '../../types';
import { Spinner } from '../ui/Spinner';

const TrustMeterBar: React.FC<{ score: number }> = ({ score }) => {
    const width = Math.max(0, Math.min(100, (score + 1) / 2 * 100)); // Map -1..1 to 0..100%
    const color = score > 0.1 ? '#4ade80' : score < -0.1 ? '#f87171' : '#9ca3af';
    return (
        <div className="w-16 h-2 bg-black/30 rounded-full">
            <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }}></div>
        </div>
    );
};


const CharacterCard: React.FC<{dossier: SurvivorDossier, character: Character, season: SurvivorSeason, characterMap: Map<string, Character>, onClose: () => void, onGenerateNote: (id: CharacterID) => void, isLoadingNote: boolean}> = ({dossier, character, season, characterMap, onClose, onGenerateNote, isLoadingNote}) => {
    const note = dossier.rounds[season.round]?.materials.schemingNote;
    const allies = React.useMemo(() => {
        const alliance = season.alliances.find(a => a.members.includes(dossier.charId));
        if (!alliance) return 'None';
        return alliance.members
            .filter(mId => mId !== dossier.charId)
            .map(allyId => characterMap.get(allyId)?.name || 'Unknown')
            .join(', ');
    }, [season.alliances, dossier.charId, characterMap]);
    
    const trustScores = dossier.rounds[season.round]?.state.trust || {};
    const activeCharIds = season.cast.filter(id => !season.dossiers[id].eliminatedRound);
    
    const votesAgainst = React.useMemo(() => season.rounds.flatMap(r => r.votes).filter(v => v.targetId === dossier.charId).length, [season.rounds, dossier.charId]);
    
    const sortedTrust = React.useMemo(() => {
        return activeCharIds
            .filter(id => id !== dossier.charId)
            .map(id => ({ id, score: trustScores[id] || 0 }))
            .sort((a, b) => b.score - a.score);
    }, [activeCharIds, trustScores, dossier.charId]);

    const topTrusted = sortedTrust.slice(0, 3);
    const leastTrusted = sortedTrust.slice(-3).reverse();
    const hasImmunity = !!dossier.rounds[season.round]?.state.immunity;
    const advantages = dossier.advantages || [];


    return (
        <div className="bg-black/30 p-3 rounded-lg text-xs animate-[fadeIn_0.3s]">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-3xl w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                        {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" loading="lazy" decoding="async" /> : character.avatar}
                    </div>
                    <div>
                        <div className="font-bold text-base" style={{color: character.color}}>{character.name}</div>
                        <div className="italic text-gray-400 capitalize">{dossier.static.archetype.replace('_', ' ')}</div>
                    </div>
                </div>
                <button onClick={onClose} className="text-xl text-gray-500 hover:text-white">&times;</button>
            </div>
            <div className="space-y-3">
                <p><strong>Allies:</strong> {allies}</p>
                <p><strong>Rivals:</strong> {dossier.rivalries.map(r => characterMap.get(r)?.name || r).join(', ') || 'None'}</p>
                <p><strong>Votes Against:</strong> {votesAgainst}</p>
                <div>
                    <h5 className="font-bold text-gray-400">Status</h5>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {hasImmunity && (
                            <span className="badge-yellow">🛡️ Immunity</span>
                        )}
                        {advantages.map((adv, i) => (
                             <span key={i} className="badge-purple">🤫 {adv.replace('_', ' ')}</span>
                        ))}
                        {!hasImmunity && advantages.length === 0 && (
                            <span className="text-gray-500">Normal</span>
                        )}
                    </div>
                </div>
                <div>
                    <h5 className="font-bold text-gray-400">Trust Meter (R{season.round})</h5>
                     <div className="mt-1 space-y-1">
                        {topTrusted.map(({id, score}) => (
                             <div key={id} className="flex justify-between items-center text-gray-300">
                                <span>{characterMap.get(id)?.name}</span>
                                <TrustMeterBar score={score} />
                            </div>
                        ))}
                         {leastTrusted.length > 0 && topTrusted.length > 0 && <div className="text-center text-gray-600">...</div>}
                         {leastTrusted.map(({id, score}) => (
                             <div key={id} className="flex justify-between items-center text-gray-300">
                                <span>{characterMap.get(id)?.name}</span>
                                <TrustMeterBar score={score} />
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h5 className="font-bold text-gray-400">Scheming Note (R{season.round})</h5>
                    {note?.materialized ? (
                        <p className="p-2 bg-black/30 rounded border border-white/10 italic text-gray-300 mt-1">{note.content}</p>
                    ) : (
                        <button onClick={() => onGenerateNote(dossier.charId)} disabled={isLoadingNote} className="btn-secondary w-full text-xs py-1 mt-1 flex items-center justify-center gap-1">
                             {isLoadingNote ? <><Spinner /> Generating...</> : 'Generate Note'}
                        </button>
                    )}
                </div>
            </div>
             <style>{`
                .badge-yellow {
                    display: inline-flex; align-items: center; gap: 0.25rem;
                    padding: 0.125rem 0.5rem;
                    background: rgba(234, 179, 8, 0.2);
                    border: 1px solid rgba(234, 179, 8, 0.4);
                    border-radius: 9999px;
                    color: #eab308;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: capitalize;
                }
                .badge-purple {
                     display: inline-flex; align-items: center; gap: 0.25rem;
                    padding: 0.125rem 0.5rem;
                    background: rgba(168, 85, 247, 0.2);
                    border: 1px solid rgba(168, 85, 247, 0.4);
                    border-radius: 9999px;
                    color: #c084fc;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: capitalize;
                }
                @keyframes flash-out {
                    0%, 100% { background-color: transparent; opacity: 1; }
                    20%, 60% { background-color: rgba(239, 68, 68, 0.4); opacity: 1; }
                    80% { opacity: 0.4; filter: grayscale(1); }
                }
                .elimination-flash {
                    animation: flash-out 2.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

const SurvivorSidebar: React.FC<{ season: SurvivorSeason, characterMap: Map<string, Character>, selectedCharId: CharacterID | null, onSelectChar: (id: CharacterID | null) => void, onGenerateNote: (id: CharacterID) => void, loadingNoteCharId: CharacterID | null }> = ({ season, characterMap, selectedCharId, onSelectChar, onGenerateNote, loadingNoteCharId }) => {
    const juryMembers = season.jury || [];
    return (
        <>
             {selectedCharId ? (
                <CharacterCard 
                    dossier={season.dossiers[selectedCharId]} 
                    character={characterMap.get(selectedCharId)!}
                    season={season}
                    characterMap={characterMap}
                    onClose={() => onSelectChar(null)}
                    onGenerateNote={onGenerateNote}
                    isLoadingNote={loadingNoteCharId === selectedCharId}
                />
            ) : (
                <div className="space-y-2">
                    {season.cast.map(charId => {
                        const character = characterMap.get(charId);
                        if (!character) return null;
                        const dossier = season.dossiers[charId];
                        const isEliminated = !!dossier.eliminatedRound;
                        const hasImmunity = !!dossier.rounds[season.round]?.state.immunity;
                        const hasAdvantage = dossier.advantages && dossier.advantages.length > 0;
                        const isJustEliminated = season.justEliminatedId === charId;
                        return (
                            <button key={charId} onClick={() => onSelectChar(charId)} className={`p-2 w-full bg-white/5 rounded flex items-center gap-3 transition-colors hover:bg-white/10 ${isEliminated ? 'opacity-40' : ''} ${isJustEliminated ? 'elimination-flash' : ''}`}>
                                <div className="text-2xl w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                    {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" loading="lazy" decoding="async" /> : character.avatar}
                                </div>
                                <div className={`font-semibold text-sm ${isEliminated ? 'line-through' : ''}`} style={{color: character.color}}>{character.name}</div>
                                {hasAdvantage && !isEliminated && <span className="text-sm" title="Has an advantage">🤫</span>}
                                {hasImmunity && <span className="ml-auto text-yellow-400 text-xl" title="Immunity">🛡️</span>}
                            </button>
                        )
                    })}
                </div>
            )}
            {juryMembers.length > 0 && !selectedCharId && (
                <div className="mt-4 pt-4 border-t border-purple-500/20">
                    <h4 className="font-bold text-gray-400 mb-2">Jury Members</h4>
                    <div className="space-y-1">
                        {juryMembers.map(charId => {
                            const character = characterMap.get(charId);
                            if (!character) return null;
                            return (
                                <div key={charId} className="p-1 w-full bg-black/20 rounded flex items-center gap-2 text-xs">
                                    <div className="text-lg w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                                         {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" loading="lazy" decoding="async" /> : character.avatar}
                                    </div>
                                    <div className="font-semibold" style={{color: character.color}}>{character.name}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default SurvivorSidebar;