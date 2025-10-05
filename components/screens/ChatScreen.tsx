

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Session, Character, EmotionState, Message as MessageType, Scene, Feedback, SceneId, DuetSeed, NippyLine, BadgeId, ScenarioId, UserPreferences, TelemetryEvent, CharacterDesire, EmotionScores, Memory, DirectorDecision, ReflectionResult } from '../../types';
import Message from '../chat/Message';
import { TypingIndicator } from '../chat/TypingIndicator';
import DirectorsNoteModal from '../modals/DirectorsNoteModal';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { ttsService } from '../../services/ttsService';
import EmotionDisplay from '../chat/EmotionDisplay';
import { fileToBase64 } from '../../utils/imageUtils';
import DropdownMenu from '../ui/DropdownMenu';
import { SeededRNG } from '../../utils/seededRng';
import { INTERVENTIONS_BY_SCENE, pickIntervention, pickDuet, pickNippy } from '../../constants/content';
import { CompletionBanner } from '../badges/CompletionBanner';
import { ENHANCED_SCENARIOS } from '../../constants/enhancedScenarios';
import ScenarioProgress from '../chat/ScenarioProgress';
import { cosmo } from '../../constants/constants';
import TacticalView from '../chat/TacticalView';
import { useAppContext } from '../../state/AppContext';

const emotionConfig = {
    joy: { color: '#facc15' }, trust: { color: '#4ade80' }, fear: { color: '#a855f7' },
    surprise: { color: '#22d3ee' }, sadness: { color: '#60a5fa' }, anger: { color: '#f87171' },
};

const getDominantEmotion = (scores: EmotionScores | undefined): [keyof EmotionScores, number] | null => {
    if (!scores) return null;
    return (Object.entries(scores) as [keyof EmotionScores, number][])
        .reduce((a, b) => a[1] > b[1] ? a : b, ['joy', 0]);
};

const PromptSuggestions: React.FC<{
    suggestions: {
        intervention?: string;
        duet?: DuetSeed;
        nippyLine?: NippyLine;
    };
    onSuggestionClick: (text: string) => void;
}> = ({ suggestions, onSuggestionClick }) => {
    const hasSuggestions = suggestions.intervention || suggestions.duet || suggestions.nippyLine;
    if (!hasSuggestions) return null;

    return (
        <div className="mb-2 p-2 bg-black/30 rounded-lg animate-[fadeIn_0.3s]">
            <div className="text-xs text-purple-400 font-bold mb-2 text-center">✨ Prompt Suggestions</div>
            <div className="flex flex-wrap justify-center gap-2">
                {suggestions.intervention && (
                    <button className="suggestion-btn" onClick={() => onSuggestionClick(suggestions.intervention!)} title={suggestions.intervention}>
                        🎬 {suggestions.intervention}
                    </button>
                )}
                {suggestions.duet && (
                    <button className="suggestion-btn" onClick={() => onSuggestionClick(`${suggestions.duet!.luna}`)} title={`${suggestions.duet!.luna} / ${suggestions.duet!.nero}`}>
                        🎶 {suggestions.duet.luna}
                    </button>
                )}
                {suggestions.nippyLine && (
                    <button className="suggestion-btn" onClick={() => onSuggestionClick(suggestions.nippyLine!.text)} title={suggestions.nippyLine!.text}>
                        🤪 "{suggestions.nippyLine.text}"
                    </button>
                )}
            </div>
        </div>
    );
};


const ChatScreen: React.FC = () => {
    const context = useAppContext();
    const { 
        activeSession: session, allCharacters, allScenes, isGenerating, typingCharacterId, handleSendMessage: onSendMessage, 
        handleContinueConversation: onContinue, setIsSideConvoModalOpen: onOpenSideConversationModal, handleOpenExportModal, setIsSceneModalOpen: onOpenSceneSelection, 
        setIsGoalModalOpen: onOpenGoalAssignment, emotionStates, handleOpenBranchModal: onOpenBranchModal, handleSwitchBranch: onSwitchBranch, 
        setPreviewImageUrl: onOpenImagePreview, handleOpenImageEditor: onOpenImageEditor, handleTriggerReflection: onTriggerReflection, feedbackItems, handleFeedback: onFeedback, 
        handleCompleteScenario: onCompleteScenario, scenarioJustCompleted, userPreferences, 
        handleObjectiveToggle: onObjectiveToggle, 
        addTelemetry,
    } = context;

    const [messageInput, setMessageInput] = useState('');
    const [mutedCharacters, setMutedCharacters] = useState<string[]>([]);
    const [isNoteModalOpen, setNoteModalOpen] = useState(false);
    const [speakingCharacterId, setSpeakingCharacterId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredCharId, setHoveredCharId] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isTacticalViewOpen, setIsTacticalViewOpen] = useState(true); // Default to true to introduce feature
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!session) return null;

    const onOpenExport = () => handleOpenExportModal(session);

    const characters = allCharacters.filter(c => session.characterIds.includes(c.id));
    const activeScene = allScenes.find(s => s.id === session.activeSceneId);
    const sessionGoals = useMemo(() => session.goals || [], [session.goals]);
    
    const activeMessages = useMemo(() => {
        if (session.activeBranchId) {
            return session.branches?.find(b => b.id === session.activeBranchId)?.messages || [];
        }
        return session.messages;
    }, [session]);
    
    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim()) {
            return activeMessages;
        }
        return activeMessages.filter(msg => 
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeMessages, searchQuery]);

    const activeEnhancedScenario = useMemo(() => {
        if (!session.enhancedScenarioId) return null;
        return ENHANCED_SCENARIOS.find(s => s.id === session.enhancedScenarioId);
    }, [session.enhancedScenarioId]);

    const promptSuggestions = useMemo(() => {
        if (!session) return {};
        const rng = new SeededRNG(session.seed + session.messages.length);
        const suggestions: {
            intervention?: string;
            duet?: DuetSeed;
            nippyLine?: NippyLine;
        } = {};

        if (session.activeSceneId && INTERVENTIONS_BY_SCENE[session.activeSceneId as SceneId]) {
            suggestions.intervention = pickIntervention(session.activeSceneId as SceneId, rng);
        }
        if (session.characterIds.includes('luna') && session.characterIds.includes('nero')) {
            suggestions.duet = pickDuet(rng);
        }
        if (session.characterIds.includes('nippy')) {
            suggestions.nippyLine = pickNippy(rng);
        }
        return suggestions;
    }, [session]);

    const {
        isListening,
        transcript,
        startListening,
        stopListening,
        error: speechError,
        isSupported: speechIsSupported
    } = useSpeechRecognition();
    
    useEffect(() => {
        const lastMessage = activeMessages[activeMessages.length - 1];
        const character = allCharacters.find(c => c.id === lastMessage?.characterId);
        if (lastMessage && character && lastMessage.role === 'assistant' && !mutedCharacters.includes(character.id)) {
            ttsService.speak({
                text: lastMessage.content,
                character: character,
                preferences: userPreferences,
                onStart: () => setSpeakingCharacterId(lastMessage.characterId!),
                onEnd: () => setSpeakingCharacterId(null)
            });
        }
    }, [activeMessages, userPreferences, allCharacters, mutedCharacters]);
    
    useEffect(() => {
        setMessageInput(transcript);
    }, [transcript]);

    const handleSend = useCallback(() => {
        const content = messageInput.trim();
        if (content || imageBase64) {
            onSendMessage(content, imageBase64, false);
            setMessageInput('');
            setImageBase64(null);
        }
    }, [messageInput, imageBase64, onSendMessage]);
    
    const handleSendDirectorsNote = (note: string) => {
        onSendMessage(note, null, true);
        setNoteModalOpen(false);
    };
    
    const handleSuggestionClick = useCallback((text: string) => {
        setMessageInput(text);
        const inputElement = document.getElementById('message-input');
        if (inputElement) {
            inputElement.focus();
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const handleMicPress = () => {
        if (!speechIsSupported) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }
        ttsService.stop();
        startListening();
    };

    const handleMicRelease = () => {
        stopListening();
        setTimeout(() => {
            const finalTranscript = (document.getElementById('message-input') as HTMLTextAreaElement)?.value;
            if ((finalTranscript && finalTranscript.trim()) || imageBase64) {
                onSendMessage(finalTranscript.trim(), imageBase64, false);
                setMessageInput('');
                setImageBase64(null);
            }
        }, 300);
    };

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setImageBase64(base64);
            } catch (error) {
                console.error("Error converting file to base64:", error);
                alert("Sorry, there was an error processing your image.");
            }
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const removeImage = () => {
        setImageBase64(null);
    };
    
    useEffect(() => {
        if (!searchQuery) { // Only auto-scroll if not searching
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeMessages, speakingCharacterId, searchQuery]);

    const toggleMute = (id: string) => {
        if (speakingCharacterId === id) {
            ttsService.stop();
        }
        setMutedCharacters(prev => prev.includes(id) ? prev.filter(charId => charId !== id) : [...prev, id]);
    };

    const canSendMessage = !isGenerating && !isListening && (!!messageInput.trim() || !!imageBase64);
    const canCompleteScenario = session.enhancedScenarioId && !session.isComplete;
    const atmosphereClass = activeScene ? cosmo.scene[activeScene.id as keyof typeof cosmo.scene] : '';
    const canTriggerSideConversation = useMemo(() => session.mode === 'group' && (session.goals || []).length >= 2, [session]);

    return (
        <div className="relative max-w-7xl mx-auto flex flex-col h-[calc(100vh-12rem)] bg-black/80 rounded-3xl border border-purple-500/30 overflow-hidden shadow-2xl shadow-black">
            <div className={`emotion-glow`}></div>
            {atmosphereClass && <div className={`absolute inset-0 bg-gradient-to-b ${atmosphereClass} pointer-events-none z-0`}></div>}
            <header className="relative z-10 p-4 bg-purple-900/20 border-b border-purple-500/30 flex flex-col gap-4 backdrop-blur-sm">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="overflow-x-auto whitespace-nowrap pb-2">
                             <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-gray-400">CAST:</span>
                                {characters.map(char => {
                                    const hasGoal = useMemo(() => sessionGoals.some(g => g.characterId === char.id), [sessionGoals, char.id]);
                                    const latestEmotion = useMemo(() => 
                                        emotionStates
                                            .filter(e => e.characterId === char.id && e.sessionId === session.id)
                                            .sort((a, b) => b.timestamp - a.timestamp)[0]
                                    , [emotionStates, char.id, session.id]);
                                    
                                    const dominantEmotion = getDominantEmotion(latestEmotion?.scores);
                                    const emotionColor = dominantEmotion ? emotionConfig[dominantEmotion[0]].color : 'transparent';

                                    return (
                                    <div 
                                        key={char.id} 
                                        className="relative"
                                        onMouseEnter={() => setHoveredCharId(char.id)}
                                        onMouseLeave={() => setHoveredCharId(null)}
                                    >
                                        <div 
                                            onClick={() => session.mode === 'group' && toggleMute(char.id)} 
                                            title={session.mode === 'group' ? (mutedCharacters.includes(char.id) ? `Click to unmute ${char.name}'s voice` : `Click to mute ${char.name}'s voice`) : char.title}
                                            className={`px-3 py-1 bg-purple-900/20 border rounded-full flex items-center gap-2 text-sm transition-all duration-300 relative ${session.mode === 'group' ? 'cursor-pointer' : ''} ${mutedCharacters.includes(char.id) ? 'opacity-40' : ''} ${speakingCharacterId === char.id ? 'border-cyan-400 scale-110 shadow-lg shadow-cyan-500/30' : 'border-purple-500/30'}`}
                                            style={{"--emotion-color": emotionColor} as React.CSSProperties}
                                        >
                                            {hasGoal && <span className="absolute -top-1 -left-1 text-xs" title="This character has a secret goal">🎯</span>}
                                            {speakingCharacterId === char.id && <span className="text-cyan-400 animate-pulse">🔊</span>}
                                            <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-lg transition-all duration-500 character-avatar-glow`}>
                                                {char.avatarUrl ? <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-contain" /> : char.avatar}
                                            </div>
                                            <span className="hidden md:inline">{char.name}</span>
                                            {mutedCharacters.includes(char.id) && <span>🔇</span>}
                                        </div>
                                        {hoveredCharId === char.id && (latestEmotion || char.isMetaAware) && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-20 p-2 bg-[#1a1a2e] border border-purple-500/30 rounded-lg shadow-2xl shadow-black animate-[fadeIn_0.2s]">
                                                {latestEmotion && <EmotionDisplay scores={latestEmotion.scores} />}
                                                {char.isMetaAware && (
                                                    <div className={`mt-2 ${latestEmotion ? 'border-t border-purple-500/20 pt-2' : ''}`}>
                                                        <button
                                                            onClick={() => onTriggerReflection(char.id)}
                                                            disabled={isGenerating}
                                                            className="w-full text-xs flex items-center justify-center gap-2 px-2 py-1 rounded bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            aria-label={`Trigger reflection for ${char.name}`}
                                                            title={`Trigger reflection for ${char.name}`}
                                                        >
                                                            🤔 Trigger Reflection
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )})}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <input 
                            type="search"
                            placeholder="🔍 Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-28 px-3 py-2 bg-white/5 border border-purple-500/30 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition"
                            aria-label="Search messages"
                        />
                         <button className="btn-secondary" onClick={() => setIsTacticalViewOpen(v => !v)}>
                            {isTacticalViewOpen ? 'Hide' : 'Show'} Tactical
                        </button>
                        <DropdownMenu trigger={
                            <button id="menu-button" className="btn-secondary" title="More Actions" aria-label="More Actions">...</button>
                        }>
                            {canCompleteScenario && (
                                <button className="dropdown-item" onClick={onCompleteScenario} disabled={isGenerating}>
                                    ✓ Complete Scenario
                                </button>
                            )}
                            <button className="dropdown-item" onClick={onOpenExport}>
                                📄 Export Conversation
                            </button>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <select 
                        value={session.activeBranchId || 'main'}
                        onChange={(e) => onSwitchBranch(e.target.value === 'main' ? null : e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition"
                        aria-label="Switch conversation branch"
                    >
                        <option value="main">🌳 Main Timeline</option>
                        {session.branches?.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                    
                    {activeScene && (
                        <div className="w-full md:w-auto text-center md:text-right text-xs text-cyan-300/80 pt-2 md:pt-0 flex-1" title={activeScene.description}>
                            <strong>SCENE:</strong> {activeScene.icon} {activeScene.name}
                        </div>
                    )}
                </div>
            </header>
            
            <div className="relative z-10 flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 space-y-6">
                    {!scenarioJustCompleted && activeEnhancedScenario && (
                        <div className="sticky top-0 z-10 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 p-4 bg-black/50 backdrop-blur-sm">
                            <ScenarioProgress 
                                scenario={activeEnhancedScenario} 
                                completedObjectives={session.completedObjectives || []}
                                onObjectiveToggle={onObjectiveToggle}
                            />
                        </div>
                    )}
                    {scenarioJustCompleted && (
                        <CompletionBanner badgeId={`badge-${scenarioJustCompleted}` as BadgeId} />
                    )}
                    {activeMessages.length === 0 ? (
                        <div className="text-center text-gray-500 pt-16">
                            <div className="text-5xl mb-4">💭</div>
                            <div>Start the conversation by typing or holding the mic button.</div>
                        </div>
                    ) : (
                        filteredMessages.map((msg, index) => <Message key={msg.id} message={msg} allCharacters={allCharacters} searchQuery={searchQuery} onOpenBranchModal={onOpenBranchModal} isLastMessage={index === activeMessages.length - 1} onOpenImagePreview={onOpenImagePreview} onOpenImageEditor={onOpenImageEditor} feedbackItems={feedbackItems} onFeedback={onFeedback} showInterventionReasons={userPreferences.showInterventionReasons} onAddTelemetry={session.id ? (e) => addTelemetry(session.id, e) : undefined} />)
                    )}
                    {isGenerating && (
                        <TypingIndicator 
                            character={allCharacters.find(c => c.id === typingCharacterId)}
                            modelBehavior={userPreferences.modelPrefs.groupChat}
                        />
                    )}
                     {searchQuery && filteredMessages.length === 0 && (
                        <div className="text-center text-gray-500 py-16">
                            <div className="text-5xl mb-4">🧐</div>
                            <div>No messages found for "{searchQuery}".</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                {isTacticalViewOpen && <TacticalView />}
            </div>


            <footer className="relative z-10 p-4 sm:p-6 bg-black/50 border-t border-purple-500/30 backdrop-blur-sm">
                {imageBase64 && (
                    <div className="mb-2 p-2 bg-black/30 rounded-lg relative w-28">
                        <img src={imageBase64} alt="Image preview" className="rounded w-full h-auto" />
                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-black"
                            aria-label="Remove image"
                            title="Remove image"
                        >
                            &times;
                        </button>
                    </div>
                )}
                <PromptSuggestions suggestions={promptSuggestions} onSuggestionClick={handleSuggestionClick} />
                <div className="flex gap-2 sm:gap-4 items-start">
                     <button
                        onClick={handleImageUploadClick}
                        disabled={isGenerating}
                        title="Attach Image"
                        className="btn-secondary p-4"
                        aria-label="Attach Image"
                    >
                        📎
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                    <textarea
                        id="message-input"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? 'Listening...' : 'Type or hold 🎙️ to speak...'}
                        rows={2}
                        disabled={isGenerating}
                        className="flex-1 p-4 bg-white/5 border-2 border-purple-500/30 rounded-xl text-white resize-none focus:outline-none focus:border-purple-500 focus:bg-white/10 transition"
                        aria-label="Message Input"
                    />
                     <button
                        onMouseDown={handleMicPress}
                        onMouseUp={handleMicRelease}
                        onTouchStart={handleMicPress}
                        onTouchEnd={handleMicRelease}
                        disabled={isGenerating || !speechIsSupported}
                        title={speechIsSupported ? "Hold to Speak" : "Speech not supported"}
                        className={`p-4 rounded-xl transition-colors ${isListening ? 'bg-red-500/80' : 'bg-purple-500/50 hover:bg-purple-500/70'}`}
                        aria-label="Hold to speak"
                    >
                        🎙️
                    </button>
                    {session.mode === 'group' && (
                        <button className="btn-secondary p-4 hidden sm:block" onClick={() => setNoteModalOpen(true)} disabled={isGenerating} title="Inject Director's Note" aria-label="Inject Director's Note">
                            🎬
                        </button>
                    )}
                    <button className={`btn-primary ${canSendMessage ? 'send-active' : ''}`} onClick={handleSend} disabled={!canSendMessage}>Send</button>
                </div>
                <div className="flex justify-center gap-2 mt-3 text-xs">
                    {session.mode === 'group' && (
                        <button className="btn-action" onClick={onContinue} disabled={isGenerating}>
                            ▶️ Continue
                        </button>
                    )}
                    {canTriggerSideConversation && (
                         <button className="btn-action" onClick={() => onOpenSideConversationModal(true)} disabled={isGenerating} title="Trigger a private side conversation between two characters.">
                            🎭 Side Conversation
                        </button>
                    )}
                </div>
                <div className="text-xs text-gray-500 mt-2 h-4">
                     {speechError && <span className="text-red-400">Speech Error: {speechError}</span>}
                </div>
            </footer>
            
            <DirectorsNoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setNoteModalOpen(false)}
                onSubmit={handleSendDirectorsNote}
            />

            <style>{`
                @keyframes emotion-glow {
                    0%, 100% { box-shadow: 0 0 20px -5px var(--emotion-color, transparent); }
                    50% { box-shadow: 0 0 35px 5px var(--emotion-color, transparent); }
                }
                .character-avatar-glow {
                    animation: emotion-glow 3s infinite ease-in-out;
                }
                .btn-action {
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    transition: all 0.2s;
                    cursor: pointer;
                    white-space: nowrap;
                    background: rgba(168, 85, 247, 0.1); 
                    color: #a855f7; 
                    border-color: rgba(168, 85, 247, 0.5);
                }
                .btn-action:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
                }
                .btn-action:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                @keyframes send-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(236, 72, 153, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); }
                }
                .send-active {
                    animation: send-pulse 1.5s infinite;
                }
                .dropdown-item {
                    display: block;
                    width: 100%;
                    padding: 0.5rem 1rem;
                    text-align: left;
                    font-size: 0.875rem;
                    color: #d1d5db;
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                .dropdown-item:hover:not(:disabled) {
                    background-color: rgba(17, 219, 239, 0.1);
                    color: #11dbef;
                }
                .dropdown-item:disabled {
                    opacity: 0.5;
                }
                .suggestion-btn {
                    padding: 0.25rem 0.75rem;
                    border: 1px solid rgba(168, 85, 247, 0.4);
                    background: rgba(168, 85, 247, 0.1);
                    color: #c084fc;
                    border-radius: 9999px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.75rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 250px;
                }
                .suggestion-btn:hover {
                    background: rgba(168, 85, 247, 0.2);
                    border-color: #a855f7;
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
};

export default ChatScreen;