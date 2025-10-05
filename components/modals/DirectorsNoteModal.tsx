

import React, { useState, FormEvent } from 'react';

interface DirectorsNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (note: string) => void;
}

const DirectorsNoteModal: React.FC<DirectorsNoteModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [note, setNote] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (note.trim()) {
            onSubmit(note.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" style={{animationName: 'fadeIn'}} onClick={onClose}>
            <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" style={{animationName: 'modalSlide'}} onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">🎬 Director's Note</h2>
                <p className="text-gray-400 mb-4 text-sm">Inject a narrative event that characters must react to. (e.g., "Suddenly, the lights flicker and go out")</p>
                <form onSubmit={handleSubmit}>
                    <textarea 
                        className="input min-h-[100px]" 
                        value={note} 
                        onChange={e => setNote(e.target.value)}
                        placeholder="Type your note here..."
                    />
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Inject Note</button>
                    </div>
                </form>
            </div>
            <style>{`
                .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #a855f7; }
                .input { width: 100%; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.5rem; color: white; font-size: 0.9375rem; transition: all 0.3s; }
                .input:focus { outline: none; border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1); }
            `}</style>
        </div>
    );
};

export default DirectorsNoteModal;