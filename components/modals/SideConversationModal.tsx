import React, { useState, useMemo } from 'react';
import { Character } from '../../types';
import { useAppContext } from '../../state/AppContext';

interface SideConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (char1Id: string, char2Id: string, topic: string) => void;
}

const SideConversationModal: React.FC<SideConversationModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { activeSession, allCharacters, isGenerating } = useAppContext();
    
    const [char1Id, setChar1Id] = useState<string>('');
    const [char2Id, setChar2Id] = useState<string>('');
    const [topic, setTopic] = useState('');

    const sessionCharacters = useMemo(() => allCharacters.filter(c => activeSession?.characterIds.includes(c.id)), [allCharacters, activeSession]);
    const availableForChar2 = useMemo(() => sessionCharacters.filter(c => c.id !== char1Id), [sessionCharacters, char1Id]);
    const canSubmit = char1Id && char2Id && char1Id !== char2Id && topic.trim() && !isGenerating;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (canSubmit) {
            onSubmit(char1Id, char2Id, topic);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" onClick={onClose}>
            <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">🎭 Side Conversation</h2>
                <p className="text-gray-400 mb-6 text-sm">Select two characters to have a private conversation. The AI will simulate their interaction, and you'll see a summary of what happened.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Character 1</label>
                            <select className="select" value={char1Id} onChange={e => { setChar1Id(e.target.value); if (e.target.value === char2Id) setChar2Id(''); }}>
                                <option value="" disabled>Select...</option>
                                {sessionCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Character 2</label>
                            <select className="select" value={char2Id} onChange={e => setChar2Id(e.target.value)} disabled={!char1Id}>
                                <option value="" disabled>Select...</option>
                                {availableForChar2.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Topic of Conversation</label>
                        <textarea className="input min-h-[80px]" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Discuss their conflicting loyalties regarding the recent data leak." />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isGenerating}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={!canSubmit}>Start Conversation</button>
                    </div>
                </form>
            </div>
            <style>{`
                .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #a855f7; }
                .label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #9ca3af; }
                .input, .select { width: 100%; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.5rem; color: white; transition: all 0.3s; }
                .input:focus, .select:focus { outline: none; border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default SideConversationModal;