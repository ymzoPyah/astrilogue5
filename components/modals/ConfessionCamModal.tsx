import React, { useState, useEffect } from 'react';
import { Character } from '../../types';

interface ConfessionCamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAsk: (question: string) => void;
    character: Character;
}

const suggestedPrompts = [
    "What was your biggest mistake?",
    "Who do you think will win, and why?",
    "Who was your most trusted ally?",
    "What was the biggest blindside for you?",
];

const ConfessionCamModal: React.FC<ConfessionCamModalProps> = ({ isOpen, onClose, onAsk, character }) => {
    const [question, setQuestion] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);


    const handleSubmit = (q: string) => {
        if (q.trim()) {
            onAsk(q.trim());
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" onClick={onClose}>
            <div 
                className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confession-title"
            >
                <h2 id="confession-title" className="modal-title flex items-center gap-2">
                    <span className="text-red-500">🔴</span> Confession Cam
                </h2>
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 grayscale">
                        {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" loading="lazy" decoding="async" /> : character.avatar}
                    </div>
                    <div>
                        <p className="text-gray-400">You have one question for the recently eliminated player:</p>
                        <p className="text-2xl font-bold" style={{color: character.color}}>{character.name}</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                     <textarea 
                        className="input min-h-[80px]" 
                        value={question} 
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="Ask your question..."
                        autoFocus
                    />
                     <div className="flex flex-wrap gap-2">
                        {suggestedPrompts.map(p => (
                            <button key={p} className="suggestion-btn" onClick={() => handleSubmit(p)}>{p}</button>
                        ))}
                    </div>
                </div>
                
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" className="btn-secondary" onClick={onClose}>Skip</button>
                    <button type="submit" className="btn-primary" disabled={!question.trim()} onClick={() => handleSubmit(question)}>Ask Question</button>
                </div>
            </div>
            <style>{`
                .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #a855f7; }
                .input { width: 100%; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.5rem; color: white; transition: all 0.3s; resize: vertical; }
                .input:focus { outline: none; border-color: #a855f7; }
                .suggestion-btn { padding: 0.375rem 0.75rem; border: 1px solid rgba(17, 219, 239, 0.4); background: rgba(17, 219, 239, 0.1); color: #11dbef; border-radius: 9999px; cursor: pointer; transition: all 0.2s; font-size: 0.75rem; }
                .suggestion-btn:hover { background: rgba(17, 219, 239, 0.2); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default ConfessionCamModal;