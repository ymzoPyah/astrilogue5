import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { SurvivorSeason, Character, CharacterID, LogEntry, TelemetryEvent, CharacterMap, SurvivorSpeed, Vote } from '../../types';
import SurvivorSidebar from './SurvivorSidebar';
import GameLog from './SurvivorLog';
import DropdownMenu from '../ui/DropdownMenu';
import { Spinner } from '../ui/Spinner';

// Lazy load components for performance
const TrialRace = lazy(() => import('./TrialRace'));
const VoteReveal = lazy(() => import('./VoteReveal'));
const AllianceGraph = lazy(() => import('./AllianceGraph'));
const BookmarkTimeline = lazy(() => import('./BookmarkTimeline'));
const TribunalDebate = lazy(() => import('./TribunalDebate'));
const ChampionCelebration = lazy(() => import('./ChampionCelebration'));
const ConfessionCamModal = lazy(() => import('../modals/ConfessionCamModal'));
const VotingCeremony = lazy(() => import('./VotingCeremony'));
const JuryBox = lazy(() => import('./JuryBox'));
const FinaleTribalCouncil = lazy(() => import('./FinaleTribalCouncil'));


interface SurvivorScreenProps {
    season: SurvivorSeason;
    allCharacters: Character[];
    characterMap: Map<string, Character>;
    onUpdateSeason: (seasonId: string, updates: Partial<SurvivorSeason> | ((s: SurvivorSeason) => Partial<SurvivorSeason>)) => void;
    onMaterializeLogEntry: (id: string) => void;
    onGenerateSchemingNote: (id: CharacterID) => void;
    onPlaceBet: (type: 'round' | 'final', target: CharacterID) => void;
    onSkipToDrama: () => void;
    onAudienceInfluence: (power: 'save' | 'tie' | 'reveal', targetId?: CharacterID) => void;
    onAddManualBookmark: (summary: string) => void;
    onAskConfessionQuestion: (seasonId: string, characterId: CharacterID, question: string) => void;
    onAddTelemetry?: (event: Omit<TelemetryEvent, 'timestamp'>) => void;
}

const PhaseDisplay: React.FC<{ phase: string }> = ({ phase }) => {
    const formattedPhase = phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (
        <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full text-sm font-semibold">
            {`Phase: ${formattedPhase}`}
        </div>
    );
};

const HostCommentaryDisplay: React.FC<{ season: SurvivorSeason }> = ({ season }) => {
    if (!season.hostCommentary) return null;
    const host = season.hostCommentary.character;
    return (
        <div className="p-4 bg-black/30 rounded-lg mb-4 text-center animate-[fadeIn_0.5s]">
             <p className="text-lg italic">
                "<span className="font-bold" style={{ color: host.color }}>{host.name}</span>: {season.hostCommentary.line}"
            </p>
        </div>
    );
}

const SurvivorScreen: React.FC<SurvivorScreenProps> = (props) => {
    const { season, allCharacters, characterMap, onUpdateSeason, onMaterializeLogEntry, onGenerateSchemingNote, onPlaceBet, onSkipToDrama, onAudienceInfluence, onAddManualBookmark, onAskConfessionQuestion, onAddTelemetry } = props;
    
    const [selectedCharId, setSelectedCharId] = useState<CharacterID | null>(null);
    const [loadingNoteCharId, setLoadingNoteCharId] = useState<CharacterID | null>(null);
    const [loadingEntryId, setLoadingEntryId] = useState<string | null>(null);
    const [audienceSaveTarget, setAudienceSaveTarget] = useState<CharacterID | ''>('');
    const [isConfessionModalOpen, setIsConfessionModalOpen] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const characterMetaMap: CharacterMap = useMemo(() => {
        const map: CharacterMap = new Map();
        for (const char of allCharacters) {
            map.set(char.id, { id: char.id, name: char.name, color: char.color, avatarUrl: char.avatarUrl });
        }
        return map;
    }, [allCharacters]);

    // Memoize the latest revealed vote to pass to JuryBox for reactions
    const latestRevealedVote = useMemo(() => {
        if (season.phase === 'vote' && season.voteRevealIndex != null && season.voteRevealIndex >= 0 && season.votes) {
            if (season.voteRevealIndex < season.votes.length) {
                return season.votes[season.voteRevealIndex];
            }
        }
        return null;
    }, [season.phase, season.voteRevealIndex, season.votes]);

    useEffect(() => {
        if (season.justEliminatedId && season.settings.toggles.confessionCam) {
            setIsConfessionModalOpen(true);
        }
    }, [season.justEliminatedId, season.settings.toggles.confessionCam]);

    const handleGenerateNote = async (id: CharacterID) => {
        setLoadingNoteCharId(id);
        await onGenerateSchemingNote(id);
        setLoadingNoteCharId(null);
    };

    const handleMaterialize = async (id: string) => {
        setLoadingEntryId(id);
        await onMaterializeLogEntry(id);
        setLoadingEntryId(null);
    };

    const handleAudienceSave = () => {
        if(audienceSaveTarget) {
            onAudienceInfluence('save', audienceSaveTarget);
        }
    }

    const handleSkipDebate = () => {
        onUpdateSeason(season.id, {
            phase: 'advantage_play',
            tribunalDebate: undefined,
            tribunalDebateIndex: undefined,
            speakingDebateCharacterId: null,
        });
    }

    const handleConfessionModalClose = () => {
        setIsConfessionModalOpen(false);
        // Clear the ID so the modal doesn't re-open on re-renders,
        // the engine hook will clear it more permanently on phase change.
        onUpdateSeason(season.id, { justEliminatedId: undefined });
    }

    const handleAskQuestion = (question: string) => {
        if (season.justEliminatedId) {
            onAskConfessionQuestion(season.id, season.justEliminatedId, question);
        }
        handleConfessionModalClose();
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            if (e.key === 'p' || e.key === 'P') {
                onUpdateSeason(season.id, s => ({ isPaused: !s.isPaused }));
                onAddTelemetry?.({ type: 'survivor_pause_toggled', payload: { isPaused: !season.isPaused } });
            }
            if (e.key === '[') {
                const from = season.settings.speed;
                const to = from === 5 ? 2 : (from === 2 ? 1 : 1);
                onUpdateSeason(season.id, s => ({ settings: {...s.settings, speed: to }}));
                onAddTelemetry?.({ type: 'survivor_speed_changed', payload: { from, to } });
            }
            if (e.key === ']') {
                const from = season.settings.speed;
                const to = from === 1 ? 2 : (from === 2 ? 5 : 5);
                onUpdateSeason(season.id, s => ({ settings: {...s.settings, speed: to }}));
                onAddTelemetry?.({ type: 'survivor_speed_changed', payload: { from, to } });
            }
        };

        const togglePauseListener = () => {
            onUpdateSeason(season.id, s => ({ isPaused: !s.isPaused }));
            onAddTelemetry?.({ type: 'survivor_pause_toggled', payload: { isPaused: !season.isPaused } });
        };
        
        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('astrilogue:toggle-pause', togglePauseListener);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('astrilogue:toggle-pause', togglePauseListener);
        };
    }, [season.id, onUpdateSeason, season.isPaused, season.settings.speed, onAddTelemetry]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [season.gameLog, season.phase]);

    const activePlayers = React.useMemo(() => season.cast.filter(id => !season.dossiers[id].eliminatedRound), [season.cast, season.dossiers]);
    const currentBet = season.userBets.find(b => (b.type === 'round' && b.round === season.round) || (b.type === 'final' && season.phase === 'finished'));
    
    const speedButtonText = { 1: '1x', 2: '2x', 5: '5x', [Infinity]: '∞' };
    const eliminatedChar = season.justEliminatedId ? characterMap.get(season.justEliminatedId) : null;
    
    const suspenseFallback = <div className="flex-1 flex items-center justify-center"><Spinner /></div>;

    const handleVoteAdvance = (nextIndex: number) => {
        onUpdateSeason(season.id, { voteRevealIndex: nextIndex });
    };
    
    const handleJuryVoteAdvance = (nextIndex: number) => {
        onUpdateSeason(season.id, { juryVoteRevealIndex: nextIndex });
    };

    const handleVoteComplete = () => {
        onUpdateSeason(season.id, { phase: 'elimination' });
    };
    
    const handleJuryVoteComplete = () => {
        onUpdateSeason(season.id, { phase: 'finale' });
    };

    const juryPhases: SurvivorSeason['phase'][] = [ 'voting_ceremony', 'vote', 'host_elimination_sendoff', 'elimination_reveal', 'host_finale_open', 'finale_opening_statements', 'jury_questions', 'finale_closing_statements', 'jury_voting', 'jury_vote_reveal', 'finale', 'finished' ];
    const showJury = season.settings.toggles.jury && season.jury && season.jury.length > 0 && juryPhases.includes(season.phase);
    
    const finalePhases: SurvivorSeason['phase'][] = ['finale_opening_statements', 'jury_questions', 'finale_closing_statements'];

    return (
        <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-12rem)] bg-black/30 rounded-xl border border-purple-500/20">
            <header className="p-3 bg-black/30 border-b border-purple-500/30 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-purple-300">🔱 Survivor: R{season.round}</h3>
                    <PhaseDisplay phase={`${season.phase} · ${speedButtonText[season.settings.speed]}`} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold">Points: {season.points}</span>
                    <button onClick={() => {
                        onUpdateSeason(season.id, s => ({ isPaused: !s.isPaused }));
                        onAddTelemetry?.({ type: 'survivor_pause_toggled', payload: { isPaused: !season.isPaused } });
                    }} className="btn-secondary text-sm px-4 py-2" aria-label={season.isPaused ? 'Play simulation' : 'Pause simulation'}>
                        {season.isPaused ? '▶️ Play' : '⏸️ Pause'}
                    </button>
                     <div className="flex rounded-full border border-cyan-500/40 bg-cyan-500/10">
                        {[1, 2, 5].map(speedValue => (
                            <button key={speedValue} onClick={() => {
                                const from = season.settings.speed;
                                const to = speedValue;
                                onUpdateSeason(season.id, { settings: {...season.settings, speed: to as any }});
                                onAddTelemetry?.({ type: 'survivor_speed_changed', payload: { from, to } });
                            }} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${season.settings.speed === speedValue ? 'bg-cyan-400 text-black' : 'text-cyan-300'}`}>
                                {speedValue}x
                            </button>
                        ))}
                    </div>
                    {season.phase === 'voting_ceremony' && (
                        <button onClick={() => onUpdateSeason(season.id, { phase: 'vote', voteRevealIndex: -1 })} className="btn-secondary text-sm">
                            Skip to Reveal
                        </button>
                    )}
                    <button onClick={onSkipToDrama} className="btn-secondary text-sm" title="Fast-forward to the next significant event (bookmark)">
                        ⚡ To Drama
                    </button>
                </div>
            </header>
            <div className="flex-1 flex gap-4 p-4 overflow-hidden relative">
                 {showJury && (
                    <Suspense fallback={null}>
                        <JuryBox
                            juryMemberIds={season.jury}
                            characterMap={characterMap}
                            season={season}
                            latestRevealedVote={latestRevealedVote}
                        />
                    </Suspense>
                )}
                <aside className="w-64 flex-shrink-0 overflow-y-auto pr-2 space-y-4 themed-scrollbar">
                    <SurvivorSidebar 
                        season={season} 
                        characterMap={characterMap}
                        selectedCharId={selectedCharId}
                        onSelectChar={setSelectedCharId}
                        onGenerateNote={handleGenerateNote}
                        loadingNoteCharId={loadingNoteCharId}
                    />
                    <div className="p-2 bg-black/20 rounded-lg">
                        <h4 className="font-bold text-yellow-400 text-sm mb-2">Your Bets</h4>
                        {season.phase !== 'finished' ? (
                            <DropdownMenu trigger={<button className="btn-secondary w-full text-xs">Place Bet for R{season.round}</button>}>
                                {activePlayers.map(id => (
                                    <button key={id} onClick={() => onPlaceBet('round', id)} className="dropdown-item text-xs">{characterMap.get(id)?.name}</button>
                                ))}
                            </DropdownMenu>
                        ) : null}
                        {currentBet && <p className="text-xs mt-1">Bet on: {characterMap.get(currentBet.target)?.name}</p>}
                    </div>
                    <div className="p-2 bg-black/20 rounded-lg">
                        <h4 className="font-bold text-purple-400 text-sm mb-2">Audience Influence</h4>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <select value={audienceSaveTarget} onChange={e => setAudienceSaveTarget(e.target.value)} className="input-filter text-xs flex-1">
                                    <option value="">Save a Player...</option>
                                    {activePlayers.map(id => <option key={id} value={id}>{characterMap.get(id)?.name}</option>)}
                                </select>
                                <button onClick={handleAudienceSave} disabled={!audienceSaveTarget || season.audienceInfluenceUses.save} className="btn-secondary text-xs">Save</button>
                            </div>
                            <button onClick={() => onAudienceInfluence('tie')} disabled={season.audienceInfluenceUses.tie} className="btn-secondary w-full text-xs">Force Tie Vote</button>
                            <button onClick={() => onAudienceInfluence('reveal')} disabled={season.audienceInfluenceUses.reveal} className="btn-secondary w-full text-xs">Reveal a Secret</button>
                        </div>
                    </div>
                </aside>
                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => onUpdateSeason(season.id, { activeMainView: 'log' })} className={`btn-secondary text-xs ${season.activeMainView === 'log' ? 'bg-cyan-400/20 !border-cyan-400' : ''}`}>Game Log</button>
                        <button onClick={() => onUpdateSeason(season.id, { activeMainView: 'graph' })} className={`btn-secondary text-xs ${season.activeMainView === 'graph' ? 'bg-cyan-400/20 !border-cyan-400' : ''}`}>Alliance Graph</button>
                    </div>

                    <Suspense fallback={suspenseFallback}>
                        {season.phase === 'finished' && <ChampionCelebration season={season} characterMap={characterMap} />}
                        {season.hostCommentary && <HostCommentaryDisplay season={season} />}

                        {season.activeMainView === 'log' ? (
                            <>
                                {season.phase === 'trial_in_progress' && <TrialRace season={season} characterMap={characterMap} />}
                                {finalePhases.includes(season.phase) && <FinaleTribalCouncil season={season} characterMap={characterMap} />}
                                {season.phase === 'voting_ceremony' && <VotingCeremony season={season} characterMap={characterMap} />}
                                {season.phase === 'jury_voting' && <VotingCeremony season={season} characterMap={characterMap} isJuryVote />}
                                {season.phase === 'vote' && (
                                    <VoteReveal
                                        votes={season.votes || []}
                                        index={season.voteRevealIndex ?? -1}
                                        characterMap={characterMetaMap}
                                        speed={season.settings.speed as SurvivorSpeed}
                                        isPaused={season.isPaused}
                                        onAdvance={handleVoteAdvance}
                                        onComplete={handleVoteComplete}
                                    />
                                )}
                                 {season.phase === 'jury_vote_reveal' && (
                                    <VoteReveal
                                        votes={(season.juryVotes || []).map(v => ({...v, reasoning: `Jury Vote`}))}
                                        index={season.juryVoteRevealIndex ?? -1}
                                        characterMap={characterMetaMap}
                                        speed={season.settings.speed as SurvivorSpeed}
                                        isPaused={season.isPaused}
                                        onAdvance={handleJuryVoteAdvance}
                                        onComplete={handleJuryVoteComplete}
                                        isFinalVote
                                        jurySize={season.jury.length}
                                    />
                                )}
                                {season.tribunalDebate && <TribunalDebate season={season} characterMap={characterMap} onSkipDebate={handleSkipDebate} />}
                                {season.phase !== 'vote' && season.phase !== 'jury_vote_reveal' && season.phase !== 'voting_ceremony' && season.phase !== 'jury_voting' && !finalePhases.includes(season.phase) && <GameLog log={season.gameLog} season={season} characterMap={characterMap} onMaterialize={handleMaterialize} loadingEntryId={loadingEntryId} containerRef={logContainerRef} />}
                            </>
                        ) : (
                            <AllianceGraph season={season} characterMap={characterMap} onSelectChar={setSelectedCharId} />
                        )}
                    </Suspense>
                </main>
            </div>
             <div className="p-2 border-t border-purple-500/20">
                <Suspense fallback={null}>
                    <BookmarkTimeline season={season} onAddManualBookmark={onAddManualBookmark} />
                </Suspense>
             </div>
             {eliminatedChar && (
                <Suspense fallback={null}>
                    <ConfessionCamModal 
                        isOpen={isConfessionModalOpen}
                        onClose={handleConfessionModalClose}
                        onAsk={handleAskQuestion}
                        character={eliminatedChar}
                    />
                </Suspense>
             )}
             <style>{`
                .input-filter { padding: 0.25rem 0.5rem; border-radius: 9999px; cursor: pointer; transition: all 0.3s; font-weight: 600; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); color: white; -webkit-appearance: none; }
                .btn-secondary { border: 1px solid rgba(17, 219, 239, 0.4); background: rgba(17, 219, 239, 0.1); color: #11dbef; padding: 0.5rem 1rem; border-radius: 9999px; cursor: pointer; transition: all 0.2s ease-in-out; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; display: inline-flex; align-items: center; }
                .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
                .dropdown-item { display: block; width: 100%; padding: 0.5rem 1rem; text-align: left; color: #d1d5db; background: none; border: none; cursor: pointer; }
                .dropdown-item:hover:not(:disabled) { background-color: rgba(17, 219, 239, 0.1); color: #11dbef; }
                .themed-scrollbar::-webkit-scrollbar { width: 8px; }
                .themed-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .themed-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(168, 85, 247, 0.3); border-radius: 4px; }
                .themed-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(168, 85, 247, 0.5); }
            `}</style>
        </div>
    );
};

export default SurvivorScreen;