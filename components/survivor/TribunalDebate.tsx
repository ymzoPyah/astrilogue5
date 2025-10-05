import React, { useEffect, useRef } from 'react';
import { SurvivorSeason, Character } from '../../types';

interface TribunalDebateProps {
    season: SurvivorSeason;
    characterMap: Map<string, Character>;
    onSkipDebate: () => void;
}

const TribunalDebate: React.FC<TribunalDebateProps> = ({ season, characterMap, onSkipDebate }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const debate = season.tribunalDebate || [];
    const currentIndex = season.tribunalDebateIndex ?? -1;
    const speakingCharId = season.speakingDebateCharacterId;

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [currentIndex]);

    return (
        <div className="p-4 bg-black/20 rounded-lg mb-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-purple-300">Tribunal Debate: {season.tribunalTopic}</h4>
                <button onClick={onSkipDebate} className="btn-secondary text-xs">Skip Debate</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 themed-scrollbar">
                {debate.map((line, index) => {
                    const speaker: Character | undefined = Array.from(characterMap.values()).find(c => c.name === line.speaker_name);
                    if (!speaker) return null;
                    const isSpeaking = speakingCharId === speaker.id && index === currentIndex;
                    return (
                        <div key={index} className={`flex items-start gap-2 transition-opacity duration-300 ${index > currentIndex ? 'opacity-40' : 'opacity-100'}`}>
                            <div className={`text-xl w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isSpeaking ? 'scale-110' : ''}`} style={{ filter: `drop-shadow(0 0 8px ${speaker.color})`}}>
                                {speaker.avatarUrl ? <img src={speaker.avatarUrl} alt={speaker.name} className="w-full h-full object-contain" /> : speaker.avatar}
                            </div>
                            <div className={`p-2 rounded-lg ${isSpeaking ? 'bg-purple-500/20' : 'bg-black/30'}`}>
                                <p className="font-bold text-sm" style={{color: speaker.color}}>{speaker.name}</p>
                                <p className="text-gray-300 text-sm italic">"{line.line}"</p>
                            </div>
                        </div>
                    )
                })}
                <div ref={scrollRef}></div>
            </div>
        </div>
    );
};

export default TribunalDebate;