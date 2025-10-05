import React, { useState, useEffect } from 'react';
import { Message as MessageType, Character, Feedback, TelemetryEvent } from '../../types';
import { cosmo } from '../../constants/constants';
import { Spinner } from '../ui/Spinner';

interface MessageProps {
    message: MessageType;
    allCharacters: Character[];
    searchQuery?: string;
    onOpenBranchModal: (message: MessageType) => void;
    isLastMessage: boolean;
    onOpenImagePreview: (url: string) => void;
    onOpenImageEditor: (messageId: string, imageUrl: string) => void;
    feedbackItems: Feedback[];
    onFeedback: (messageId: string, rating: 'up' | 'down') => void;
    showInterventionReasons?: boolean;
    onAddTelemetry?: (event: Omit<TelemetryEvent, 'timestamp'>) => void;
}

const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <>{text}</>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-yellow-500/50 text-white px-1 rounded-sm">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

const Message: React.FC<MessageProps> = ({ message, allCharacters, searchQuery, onOpenBranchModal, isLastMessage, onOpenImagePreview, onOpenImageEditor, feedbackItems, onFeedback, showInterventionReasons, onAddTelemetry }) => {
    const [isHovered, setIsHovered] = useState(false);
    const character = allCharacters.find(c => c.id === message.characterId);
    
    const myFeedback = feedbackItems.find(f => f.messageId === message.id);
    
    const eventBaseClasses = "my-4 text-sm p-4 rounded-xl border-y-2 animate-[fadeIn_0.5s_ease-out]";
    
    useEffect(() => {
        if (message.eventType === 'interjection' && onAddTelemetry) {
            onAddTelemetry({
                type: 'intervention.shown',
                payload: { reasonType: message.reasoning }
            });
        }
    }, [message.eventType, message.reasoning, onAddTelemetry]);

    if (message.eventType === 'world_event') {
        return (
            <div className={`${eventBaseClasses} text-amber-300 bg-amber-900/20 border-amber-500/30 text-center`}>
                <div className="font-bold mb-1 text-amber-400">--- 🌎 World Event ---</div>
                <span className="italic">
                    <HighlightedText text={message.content} highlight={searchQuery || ''} />
                </span>
            </div>
        )
    }

    if (message.eventType === 'side_conversation_summary') {
        return (
            <div className={`${eventBaseClasses} text-purple-300 bg-purple-900/20 border-purple-500/30`}>
                <div className="font-bold mb-2 text-purple-400 text-center">--- 🎭 Side Conversation ---</div>
                <p className="italic mb-3 text-center">
                    <HighlightedText text={message.content} highlight={searchQuery || ''} />
                </p>
                <details className="text-xs">
                    <summary className="cursor-pointer text-purple-400/80 hover:text-purple-300 font-semibold">
                        [Expand Full Transcript]
                    </summary>
                    <div className="mt-2 p-3 bg-black/30 rounded whitespace-pre-wrap font-mono text-gray-400">
                         <HighlightedText text={message.fullTranscript || 'Transcript not available.'} highlight={searchQuery || ''} />
                    </div>
                </details>
            </div>
        )
    }

    if (message.eventType === 'interjection' || message.eventType === 'meta_reflection') {
        if (!character) return null;
        const isReflection = message.eventType === 'meta_reflection';
        const title = isReflection ? `🧠 ${character.name} reflects...` : `Interjection`;
        const colorClass = isReflection ? 'cyan' : 'yellow';
        const icon = isReflection ? '🤔' : '⚡';

        return (
            <div 
                className={`my-2 flex gap-3 p-4 bg-${colorClass}-900/10 border-l-4 border-${colorClass}-500 rounded-r-lg animate-[slideIn_0.3s_ease-out] relative group`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ boxShadow: `0 0 20px ${isReflection ? cosmo.accent.teal : cosmo.accent.gold}20` }}
                title={!showInterventionReasons && message.reasoning ? `Intervention — reason: ${message.reasoning}` : undefined}
            >
                 <div className="text-xl text-yellow-300 mt-1" style={{ textShadow: `0 0 10px ${cosmo.accent.gold}`}}>{icon}</div>
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div 
                            className="text-2xl w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                            style={{ '--char-color': character.color, filter: `drop-shadow(0 0 10px var(--char-color))` } as React.CSSProperties}
                        >
                            {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" /> : character.avatar}
                        </div>
                        <div className={`font-bold text-${colorClass}-400`}>{title}</div>
                    </div>
                    <p className="text-gray-300 italic">
                        <HighlightedText text={message.content} highlight={searchQuery || ''} />
                    </p>
                    {showInterventionReasons && message.reasoning && (
                         <p className="mt-2 text-xs text-yellow-500/70 border-t border-yellow-500/20 pt-2">
                            <strong>Reasoning:</strong> {message.reasoning}
                        </p>
                    )}
                 </div>
                 {isHovered && !isLastMessage && (
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button
                            onClick={() => onOpenBranchModal(message)}
                            title="Create a new branch from this point"
                            aria-label="Create a new branch from this message"
                            className={`p-2 bg-black/50 rounded-full text-xl hover:bg-${colorClass}-500/30 transition-all duration-200 opacity-0 group-hover:opacity-100`}
                        >
                            🌳
                        </button>
                    </div>
                )}
            </div>
        )
    }

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAssistant = message.role === 'assistant';

    const targetCharacter = message.targetCharacterId ? allCharacters.find(c => c.id === message.targetCharacterId) : null;
    
    let senderName = 'You';
    let avatarContent: React.ReactNode = '👤';
    let color = cosmo.accent.teal;
    let content = message.content;

    if (isSystem) {
        senderName = message.eventType === 'whisper' ? 'You' : 'System';
        avatarContent = message.eventType === 'whisper' ? '👤' : '🎬';
        color = message.eventType === 'whisper' ? cosmo.accent.violet : cosmo.accent.gold;
        if (message.eventType === 'whisper' && targetCharacter) {
            content = `(Whisper to ${targetCharacter.name}) ${message.content}`;
        }
    } else if (isAssistant && character) {
        senderName = character.name;
        avatarContent = character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain rounded-full" /> : character.avatar;
        color = character.color;
    }

    const containerClasses = `flex gap-4 p-4 sm:p-6 rounded-2xl animate-[slideIn_0.3s_ease-out] relative group`;
    const themeClasses = 
        message.eventType === 'whisper' ? 'bg-gradient-to-br from-indigo-900/30 to-black/30 border border-indigo-500/30' :
        isUser ? 'bg-gradient-to-br from-cyan-900/30 to-black/30 border border-cyan-500/30' : 
        isSystem ? 'bg-gradient-to-br from-orange-900/30 to-black/30 border border-orange-500/30' : 
        'bg-gradient-to-br from-zinc-800/30 to-black/30 border border-zinc-700/50';

    if (message.isGeneratingImage) {
        return (
            <div className={`${containerClasses} ${themeClasses}`} style={{ animationName: 'slideIn' }}>
                <div 
                    className="text-4xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full overflow-hidden filter" 
                    style={{ '--char-color': color, filter: `drop-shadow(0 0 12px var(--char-color))` } as React.CSSProperties}
                >
                    {avatarContent}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg mb-2" style={{ color }}>{senderName}</div>
                    <div className="flex items-center gap-2 text-gray-300">
                        <Spinner />
                        <span>{message.content.includes("Editing image") ? "Editing image..." : "Generating image..."}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 italic">
                        <HighlightedText text={message.content} highlight={searchQuery || ''} />
                    </p>
                </div>
            </div>
        );
    }
        
    return (
        <div 
            className={`${containerClasses} ${themeClasses}`} 
            style={{ animationName: 'slideIn' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                className="text-4xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full overflow-hidden filter" 
                style={{ '--char-color': color, filter: `drop-shadow(0 0 12px var(--char-color))` } as React.CSSProperties}
            >
                 {avatarContent}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    {message.eventType === 'whisper' && <span className="text-indigo-400" title="This is a private whisper only you can see">🤫</span>}
                    {message.eventType === 'cue' && <span className="text-orange-400" title="This is a non-verbal cue">👉</span>}
                    <div className="font-bold text-lg" style={{ color: color }}>{senderName}</div>
                </div>
                {message.image && (
                    <div className="mb-2">
                        <button onClick={() => onOpenImagePreview(message.image!)} className="block w-48 h-48 rounded-lg overflow-hidden border-2 border-purple-500/30 hover:border-purple-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400">
                            <img src={message.image} alt="User upload" className="w-full h-full object-cover" />
                        </button>
                    </div>
                )}
                {content && (
                     <p className={`leading-relaxed text-gray-200 whitespace-pre-wrap break-words ${message.eventType === 'cue' || message.eventType === 'whisper' ? 'italic text-gray-400' : ''}`}>
                        <HighlightedText text={content} highlight={searchQuery || ''} />
                    </p>
                )}
                <div className="text-xs text-gray-500 mt-2">{new Date(message.timestamp).toLocaleTimeString()}</div>
            </div>
            
            {isHovered && !isLastMessage && (message.role === 'assistant' || message.role === 'user') && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100">
                    {isAssistant && (
                        <>
                            <button
                                onClick={() => onFeedback(message.id, 'up')}
                                title="Good response"
                                aria-label="Good response"
                                className={`p-2 rounded-full text-lg hover:bg-green-500/30 transition-colors ${myFeedback?.rating === 'up' ? 'bg-green-500/30' : ''}`}
                            >
                                👍
                            </button>
                            <button
                                onClick={() => onFeedback(message.id, 'down')}
                                title="Bad response"
                                aria-label="Bad response"
                                className={`p-2 rounded-full text-lg hover:bg-red-500/30 transition-colors ${myFeedback?.rating === 'down' ? 'bg-red-500/30' : ''}`}
                            >
                                👎
                            </button>
                        </>
                    )}
                     {message.image && (
                        <button
                            onClick={() => onOpenImageEditor(message.id, message.image!)}
                            title="Edit image with AI"
                            aria-label="Edit image with AI"
                            className="p-2 rounded-full text-lg hover:bg-cyan-500/30 transition-colors"
                        >
                            🎨
                        </button>
                    )}
                    <button
                        onClick={() => onOpenBranchModal(message)}
                        title="Create a new branch from this point"
                        aria-label="Create a new branch from this message"
                        className="p-2 text-xl hover:bg-purple-500/30 rounded-full transition-colors"
                    >
                        🌳
                    </button>
                </div>
            )}
        </div>
    );
};

export default Message;