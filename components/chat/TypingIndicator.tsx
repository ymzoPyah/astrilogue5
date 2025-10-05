import React from 'react';
import { Character, ModelBehavior } from '../../types';
import { Spinner } from '../ui/Spinner';

interface TypingIndicatorProps {
    character: Character | undefined | null;
    modelBehavior?: ModelBehavior;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ character, modelBehavior }) => {
    const avatar = character ? character.avatar : '🎬';
    const name = character ? character.name : 'Scene Director';
    const color = character ? character.color : '#a855f7';
    const baseText = character ? 'is typing...' : 'Choosing next speaker...';
    const modelText = modelBehavior === 'flash-thinking' ? '(model: Quality)' : '(model: Fast)';
    const avatarContent = character?.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain rounded-full" /> : avatar;

    return (
        <div className="flex gap-4 p-6 bg-white/5 rounded-2xl animate-[slideIn_0.3s_ease-out]" style={{animationName: 'slideIn'}}>
            <div 
                className="text-4xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full overflow-hidden filter" 
                style={{ '--char-color': color, filter: `drop-shadow(0 0 10px var(--char-color))` } as React.CSSProperties}
            >
                {avatarContent}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-lg mb-2" style={{ color }}>{name}</div>
                <div className="flex items-center gap-2 text-gray-300">
                    <Spinner />
                    <span>{baseText} <span className="text-gray-500 text-xs">{modelText}</span></span>
                </div>
            </div>
        </div>
    );
};
