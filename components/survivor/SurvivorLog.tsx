import React from 'react';
import { SurvivorSeason, LogEntry, LogKind, Character, CharacterID } from '../../types';
import { Spinner } from '../ui/Spinner';

const GameLogEntryDisplay: React.FC<{ season: SurvivorSeason, entry: LogEntry, characterMap: Map<string, Character>, onMaterialize: (id: string) => void, isLoading: boolean }> = ({ season, entry, characterMap, onMaterialize, isLoading }) => {
    const icons: Record<LogKind, string> = { round_start: '🏁', trial_result: '🏆', camp_window: '🏕️', alliance_hint: '🤝', tribunal_summary: '⚖️', vote_reveal: '🗳️', elimination: '❌', spotlight: '💡', finale: '🎉', confession_cam: '💬', audience_influence: '🎭', secret_advantage_hidden: '🤫', secret_advantage_found: '🃏', secret_advantage_played: '💥', jury_speech: '🎤', jury_vote_reveal: '🧑‍⚖️', rivalry_formed: '🔥' };
    const character = characterMap.get(entry.participants[0]);
    const color = character?.color || '#9ca3af';

    const isExpandable = ['camp_window', 'alliance_hint', 'elimination', 'spotlight', 'confession_cam', 'tribunal_summary'].includes(entry.kind) && !entry.materialized;
    const mainParticipantName = characterMap.get(entry.participants[0])?.name || entry.participants[0];
    
    const tokensUsed = season.tokensUsedThisRound || 0;
    const roundCap = season.settings.tokenPolicy.roundCap;
    const estTokens = entry.estTokens || 0;
    const budgetExceeded = tokensUsed + estTokens > roundCap;

    const summaryColor = 
        entry.kind === 'elimination' ? '#ef4444' :
        entry.kind === 'trial_result' ? '#facc15' :
        entry.kind === 'audience_influence' ? '#a855f7' :
        entry.kind === 'rivalry_formed' ? '#f87171' :
        'inherit';

    return (
        <div id={`log-entry-${entry.id}`} className="p-2 bg-black/20 rounded-md text-sm">
            <div className="flex items-start gap-2" title={entry.reasoning}>
                <div className="text-lg mt-0.5" title={entry.kind}>{icons[entry.kind]}</div>
                <p className="flex-1" style={{ color: summaryColor }}>
                    {entry.kind !== 'audience_influence' && entry.kind !== 'secret_advantage_hidden' && entry.kind !== 'rivalry_formed' && <span className="font-bold" style={{ color: entry.kind === 'vote_reveal' || entry.kind === 'jury_vote_reveal' ? characterMap.get(entry.participants[0])?.color : color }}>{mainParticipantName}</span>}{' '}{entry.summary}
                </p>
            </div>
            {(isExpandable || entry.materializedContent) && (
                <div className="mt-2 pl-8 text-xs">
                    {entry.materialized ? (
                        <div className="p-2 bg-black/30 rounded border border-white/10 italic text-gray-300 whitespace-pre-wrap">{entry.materializedContent}</div>
                    ) : (
                        <button onClick={() => onMaterialize(entry.id)} disabled={isLoading || budgetExceeded} className="text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1" title={budgetExceeded ? `Round token budget would be exceeded (${tokensUsed} + ${estTokens} > ${roundCap})` : ''}>
                            {isLoading ? <><Spinner /> Generating...</> : `[Expand Details (${estTokens || 0} tokens)]`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const LOG_LIMIT = 50;

const GameLog: React.FC<{ season: SurvivorSeason, log: LogEntry[], characterMap: Map<string, Character>, onMaterialize: (id: string) => void, loadingEntryId: string | null, containerRef: React.RefObject<HTMLDivElement> }> = ({ season, log, characterMap, onMaterialize, loadingEntryId, containerRef }) => {
    const truncatedLog = log.length > LOG_LIMIT ? log.slice(log.length - LOG_LIMIT) : log;
    
    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto space-y-2 pr-2 themed-scrollbar">
            {log.length > LOG_LIMIT && (
                <div className="text-center text-xs text-gray-500 py-2">
                    --- Only showing the last {LOG_LIMIT} entries for performance ---
                </div>
            )}
            {[...truncatedLog].reverse().map(entry => (
                <GameLogEntryDisplay key={entry.id} season={season} entry={entry} characterMap={characterMap} onMaterialize={onMaterialize} isLoading={loadingEntryId === entry.id} />
            ))}
        </div>
    );
};

export default GameLog;