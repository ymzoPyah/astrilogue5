import React, { useState, useRef, useMemo } from 'react';
import { Character, CharacterID, TelemetryEvent } from '../../types';
import { useAppContext } from '../../state/AppContext';
import SurvivorCastSelect from './SurvivorCastSelect';
import SurvivorScreen from './SurvivorScreen';
import ErrorBoundary from '../ErrorBoundary';

const SurvivorHub: React.FC = () => {
    const { 
        allCharacters, characterMap, survivorSeasons, activeSurvivorSeason, handleStartSurvivorSeason,
        onLoadSeason, onDeleteSeason, onExportSeason, onImportSeason, updateSurvivorSeason, 
        handleMaterializeLogEntry, onGenerateSchemingNote, onPlaceBet, onSkipToDrama, 
        onAudienceInfluence, onAddManualBookmark, onAskConfessionQuestion,
        onReplaySeason, onExtractSurvivorLore, isExtractingLore,
        addTelemetry, sessions
    } = useAppContext();

    const [showCastSelect, setShowCastSelect] = useState(false);
    const importRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => importRef.current?.click();
    
    const telemetryLogger = useMemo(() => {
        const mostRecentSessionId = [...sessions].sort((a,b) => b.updatedAt - a.updatedAt)[0]?.id;
        if (!mostRecentSessionId) return undefined;
        return (event: Omit<TelemetryEvent, 'timestamp'>) => addTelemetry(mostRecentSessionId, event);
    }, [sessions, addTelemetry]);

    if (activeSurvivorSeason) {
        return (
            <ErrorBoundary>
                <SurvivorScreen 
                    season={activeSurvivorSeason} 
                    allCharacters={allCharacters}
                    characterMap={characterMap}
                    onUpdateSeason={updateSurvivorSeason}
                    onMaterializeLogEntry={handleMaterializeLogEntry}
                    onGenerateSchemingNote={onGenerateSchemingNote}
                    onPlaceBet={onPlaceBet}
                    onSkipToDrama={onSkipToDrama}
                    onAudienceInfluence={onAudienceInfluence}
                    onAddManualBookmark={onAddManualBookmark}
                    onAskConfessionQuestion={onAskConfessionQuestion}
                    onAddTelemetry={telemetryLogger}
                />
            </ErrorBoundary>
        );
    }

    if (showCastSelect) {
        return <SurvivorCastSelect allCharacters={allCharacters} onStartSeason={handleStartSurvivorSeason} />;
    }

    return (
        <div className="max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">🔱 Survivor Mode</h2>
                <p className="text-gray-400 mt-2">Manage past seasons or start a new one.</p>
            </div>
            <div className="flex justify-center gap-4 mb-8">
                <button className="btn-primary" onClick={() => setShowCastSelect(true)}>+ New Season</button>
                <button className="btn-secondary" onClick={handleImportClick}>Import Season</button>
                <input type="file" ref={importRef} className="hidden" accept=".json" onChange={onImportSeason} />
            </div>
            <h3 className="text-xl font-bold text-purple-300 mb-4">Past Seasons</h3>
            {survivorSeasons.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    <div className="text-5xl mb-4">📭</div>
                    <p>No seasons played yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {survivorSeasons.map(season => (
                        <div key={season.id} className="p-4 bg-white/5 border border-purple-500/20 rounded-lg flex items-center justify-between flex-wrap gap-4 transition-all duration-300 group hover:bg-purple-500/10 hover:border-purple-500/40 hover:scale-[1.02]">
                            <div>
                                <div className="font-bold text-purple-400">Season from {new Date(season.createdAt).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-400">
                                    {season.completedAt ? `Champion: ${characterMap.get(season.champion!)?.name || 'Unknown'}` : `In Progress (Round ${season.round})`}
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button className="btn-action" onClick={() => onLoadSeason(season.id)}>Load</button>
                                {season.completedAt && (
                                    <>
                                        <button className="btn-action" onClick={() => onReplaySeason(season.id)}>Replay</button>
                                        <button 
                                            className="btn-action" 
                                            onClick={() => onExtractSurvivorLore(season.id)} 
                                            disabled={isExtractingLore === season.id}
                                        >
                                            {isExtractingLore === season.id ? 'Extracting...' : '✨ Extract Lore'}
                                        </button>
                                    </>
                                )}
                                <button className="btn-action" onClick={() => onExportSeason(season.id)}>Export</button>
                                <button className="btn-action-danger" onClick={() => onDeleteSeason(season.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
             <style>{`
                .btn-action, .btn-action-danger { padding: 0.375rem 0.75rem; font-size: 0.875rem; border-width: 1px; border-radius: 0.375rem; transition: all 150ms; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.25rem; }
                .btn-action { background: rgba(168, 85, 247, 0.1); color: #a855f7; border-color: rgba(168, 85, 247, 0.5); }
                .btn-action:hover:not(:disabled) { background: rgba(168, 85, 247, 0.2); }
                .btn-action-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.5); }
                .btn-action-danger:hover { background: rgba(239, 68, 68, 0.2); }
                .btn-action:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default SurvivorHub;