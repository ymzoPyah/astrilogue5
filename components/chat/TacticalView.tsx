import React, { useState, useMemo, useCallback } from 'react';
import { Session, Character, EmotionState, Scene, EnhancedScenario, EmotionScores, CharacterDesire, Memory } from '../../types';
import ScenarioProgress from './ScenarioProgress';
import { useAppContext } from '../../state/AppContext';
import { ENHANCED_SCENARIOS } from '../../constants/enhancedScenarios';
import { Spinner } from '../ui/Spinner';

const emotionConfig = {
    joy: { label: 'Joy', color: '#facc15' },
    trust: { label: 'Trust', color: '#4ade80' },
    fear: { label: 'Fear', color: '#a855f7' },
    surprise: { label: 'Surprise', color: '#22d3ee' },
    sadness: { label: 'Sadness', color: '#60a5fa' },
    anger: { label: 'Anger', color: '#f87171' },
};

const EmotionBar: React.FC<{ scores: EmotionScores }> = ({ scores }) => {
    const dominantEmotion = useMemo(() => {
        return (Object.entries(scores) as [keyof EmotionScores, number][])
            .reduce((a, b) => a[1] > b[1] ? a : b, ['joy', 0]);
    }, [scores]);

    const [key, score] = dominantEmotion;
    const config = emotionConfig[key];

    if (!config) return null;

    return (
        <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden border border-white/10" title={`Dominant Emotion: ${config.label} (${(score*100).toFixed(0)}%)`}>
            <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                    width: `${score * 100}%`,
                    backgroundColor: config.color,
                }}
            />
        </div>
    );
};

const DesireBar: React.FC<{ score: number; reasoning: string }> = ({ score, reasoning }) => {
    const color = `rgba(37, 242, 226, ${0.2 + score * 0.8})`; // teal accent
    const glow = `drop-shadow(0 0 ${Math.floor(score * 8)}px ${color})`;
    
    return (
        <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden border border-white/10" title={`Reasoning: ${reasoning}`}>
            <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                    width: `${score * 100}%`,
                    backgroundColor: color,
                    filter: glow,
                }}
            />
        </div>
    );
};

const TacticalView: React.FC = () => {
    const {
        activeSession: session, allCharacters, allScenes, memories, isGenerating, emotionStates, 
        setIsSceneModalOpen: onOpenSceneSelection, setIsSideConvoModalOpen,
        handleSendMessage: onSendMessage, handleSendWhisper: onSendWhisper, handleSendCue: onSendCue, 
        handleObjectiveToggle: onObjectiveToggle, 
        characterDesires
    } = useAppContext();
    
    type TabId = 'status' | 'log' | 'secrets' | 'consequences';
    const [activeTab, setActiveTab] = useState<TabId>('status');
    const [quickNote, setQuickNote] = useState('');
    const [cue, setCue] = useState('');
    const [whisperTargetId, setWhisperTargetId] = useState<string | null>(null);
    const [whisperContent, setWhisperContent] = useState('');

    if (!session) return null;

    const onOpenSideConversationModal = () => setIsSideConvoModalOpen(true);

    const activeEnhancedScenario = useMemo(() => {
        if (!session.enhancedScenarioId) return null;
        return ENHANCED_SCENARIOS.find(s => s.id === session.enhancedScenarioId);
    }, [session.enhancedScenarioId]);

    const sessionCharacters = allCharacters.filter(c => session.characterIds.includes(c.id));
    const activeScene = allScenes.find(s => s.id === session.activeSceneId);
    const activeBranch = session.activeBranchId ? session.branches.find(b => b.id === session.activeBranchId) : null;
    
    const handleSendQuickNote = useCallback(() => { if (quickNote.trim()) { onSendMessage(quickNote, null, true); setQuickNote(''); } }, [quickNote, onSendMessage]);
    const handleSendCue = useCallback(() => { if (cue.trim()) { onSendCue(cue); setCue(''); } }, [cue, onSendCue]);
    const handleSendWhisper = useCallback(() => { if (whisperContent.trim() && whisperTargetId) { onSendWhisper(whisperTargetId, whisperContent); setWhisperContent(''); setWhisperTargetId(null); } }, [whisperContent, whisperTargetId, onSendWhisper]);

    const directorLog = useMemo(() => (session.telemetry || []).filter(t => t.type.startsWith('director_') || t.type.startsWith('intervention') || t.type.startsWith('whisper') || t.type.startsWith('cue')).sort((a,b) => b.timestamp - a.timestamp).slice(0, 10), [session.telemetry]);
    const ignoredEvents = useMemo(() => (session.ignoredEvents || []).sort((a,b) => b.timestamp - a.timestamp), [session.ignoredEvents]);
    const secretMemories = useMemo(() => memories.filter(m => m.sessionId === session.id && m.isSecret), [memories, session.id]);

    const TabButton: React.FC<{ id: TabId; activeTab: TabId; onClick: (id: TabId) => void; children: React.ReactNode }> = ({ id, activeTab, onClick, children }) => (
        <button
            onClick={() => onClick(id)}
            className={`flex-1 px-2 py-1 text-center font-semibold transition-colors ${activeTab === id ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-500 border-b-2 border-transparent hover:text-purple-400'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="w-80 h-full bg-black/50 border-l border-purple-500/30 flex-shrink-0 flex flex-col animate-[slideIn_0.3s_ease-out]">
            <header className="p-4 border-b border-purple-500/30 flex-shrink-0">
                <h3 className="text-lg font-bold text-purple-300">Tactical View</h3>
                <div className="flex border-b border-purple-500/20 mt-2 text-xs">
                    <TabButton id="status" activeTab={activeTab} onClick={setActiveTab}>Status</TabButton>
                    <TabButton id="log" activeTab={activeTab} onClick={setActiveTab}>Log</TabButton>
                    <TabButton id="secrets" activeTab={activeTab} onClick={setActiveTab}>Secrets</TabButton>
                    <TabButton id="consequences" activeTab={activeTab} onClick={setActiveTab}>Ignored</TabButton>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 text-xs space-y-4">
                {activeTab === 'status' && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-purple-400 mb-2">Cast Status</h4>
                            <div className="space-y-3">
                                {sessionCharacters.map(char => {
                                    const desire = characterDesires.find(d => d.characterId === char.id);
                                    const emotion = emotionStates.filter(e => e.characterId === char.id && e.sessionId === session.id).sort((a, b) => b.timestamp - a.timestamp)[0];
                                    return (
                                        <div key={char.id}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-5 h-5 rounded-full overflow-hidden text-sm flex items-center justify-center">{char.avatarUrl ? <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-contain" /> : char.avatar}</div>
                                                <span className="font-semibold" style={{color: char.color}}>{char.name}</span>
                                            </div>
                                            {desire && <DesireBar score={desire.desire} reasoning={desire.reasoning} />}
                                            {emotion && <div className="mt-1"><EmotionBar scores={emotion.scores} /></div>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <hr className="border-purple-500/20" />
                        <div>
                            <h4 className="font-bold text-purple-400 mb-2">Scene & Branch</h4>
                            <p><strong>Scene:</strong> {activeScene?.name || 'None'}</p>
                            <p><strong>Branch:</strong> {activeBranch?.name || 'Main Timeline'}</p>
                        </div>
                        {activeEnhancedScenario && <ScenarioProgress scenario={activeEnhancedScenario} completedObjectives={session.completedObjectives || []} onObjectiveToggle={onObjectiveToggle} />}
                    </div>
                )}
                {activeTab === 'log' && (
                     <div>
                        <h4 className="font-bold text-purple-400 mb-2">Director's Log (Last 10)</h4>
                        <div className="space-y-2">
                            {directorLog.map(log => (
                                <div key={log.timestamp} className="p-2 bg-black/20 rounded">
                                    <p className="font-semibold text-purple-400">{log.type.replace(/_/g, ' ')}</p>
                                    <p className="text-gray-400">{JSON.stringify(log.payload)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'secrets' && (
                     <div>
                        <h4 className="font-bold text-purple-400 mb-2">Secret Memories</h4>
                         <div className="space-y-2">
                            {secretMemories.map(mem => (
                                <div key={mem.id} className="p-2 bg-black/20 rounded">
                                    <p className="font-semibold" style={{color: allCharacters.find(c=>c.id === mem.characterId)?.color}}>{allCharacters.find(c=>c.id === mem.characterId)?.name}</p>
                                    <p className="text-gray-400 italic">"{mem.content}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                 {activeTab === 'consequences' && (
                     <div>
                        <h4 className="font-bold text-purple-400 mb-2">Ignored Events</h4>
                         <div className="space-y-2">
                            {ignoredEvents.map(event => (
                                <div key={event.eventId} className="p-2 bg-black/20 rounded">
                                    <p className="font-semibold text-red-400">{event.title}</p>
                                    <p className="text-gray-400"><strong>Consequence:</strong> {event.consequence}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <footer className="p-4 border-t border-purple-500/30 space-y-3 flex-shrink-0">
                <div>
                     <h4 className="text-xs font-bold text-purple-400 mb-1">Whisper to Character</h4>
                    <div className="flex gap-1">
                        <select value={whisperTargetId || ''} onChange={e => setWhisperTargetId(e.target.value)} className="input-xs flex-1">
                            <option value="">Select...</option>
                            {sessionCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input type="text" value={whisperContent} onChange={e => setWhisperContent(e.target.value)} className="input-xs flex-1" placeholder="Whisper..." />
                        <button onClick={handleSendWhisper} className="btn-xs" disabled={isGenerating}>Send</button>
                    </div>
                </div>
                 <div>
                     <h4 className="text-xs font-bold text-purple-400 mb-1">Send Cue / Director's Note</h4>
                     <div className="flex gap-1">
                        <input type="text" value={cue} onChange={e => setCue(e.target.value)} className="input-xs flex-1" placeholder="e.g., focus on the artifact" />
                        <button onClick={handleSendCue} className="btn-xs" disabled={isGenerating}>Cue</button>
                    </div>
                     <div className="flex gap-1 mt-1">
                        <input type="text" value={quickNote} onChange={e => setQuickNote(e.target.value)} className="input-xs flex-1" placeholder="e.g., A strange noise is heard" />
                        <button onClick={handleSendQuickNote} className="btn-xs" disabled={isGenerating}>Note</button>
                    </div>
                </div>
            </footer>
             <style>{`
                .input-xs { padding: 0.25rem 0.5rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.25rem; color: white; font-size: 0.75rem; }
                .btn-xs { padding: 0.25rem 0.5rem; border: 1px solid rgba(168, 85, 247, 0.5); background: rgba(168, 85, 247, 0.1); color: #a855f7; border-radius: 0.25rem; font-weight: 600; font-size: 0.75rem; }
                .btn-xs:disabled { opacity: 0.5; }
            `}</style>
        </div>
    );
};

export default TacticalView;