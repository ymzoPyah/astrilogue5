

import React, { useState, FormEvent } from 'react';
import { Message } from '../../types';

interface BranchingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (alternatePrompt: string) => void;
    sourceMessage: Message;
}

const BranchingModal: React.FC<BranchingModalProps> = ({ isOpen, onClose, onSubmit, sourceMessage }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" style={{animationName: 'fadeIn'}} onClick={onClose}>
            <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" style={{animationName: 'modalSlide'}} onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">🌳 Create New Branch</h2>
                <p className="text-gray-400 mb-2 text-sm">You are branching off from this message:</p>
                <blockquote className="border-l-4 border-purple-500/50 bg-white/5 p-3 rounded-r-lg text-gray-300 italic mb-4">
                    "{sourceMessage.content.substring(0, 150)}{sourceMessage.content.length > 150 ? '...' : ''}"
                </blockquote>
                <p className="text-gray-400 mb-4 text-sm">What happens instead? Write your new prompt below to start an alternate timeline.</p>
                
                <form onSubmit={handleSubmit}>
                    <textarea 
                        className="input min-h-[100px]" 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="e.g., Instead of agreeing, she draws a hidden weapon..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={!prompt.trim()}>Create Branch</button>
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

export default BranchingModal;