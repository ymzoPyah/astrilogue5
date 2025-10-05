import React, { useState, FormEvent } from 'react';
import { Spinner } from '../ui/Spinner';

interface ImageEditModalProps {
    isOpen: boolean;
    imageUrl: string;
    onClose: () => void;
    onSubmit: (prompt: string) => void;
    isSubmitting?: boolean;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ isOpen, imageUrl, onClose, onSubmit, isSubmitting }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isSubmitting) {
            onSubmit(prompt.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" onClick={onClose}>
            <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">🎨 Edit Image with AI</h2>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2 flex-shrink-0">
                        <img src={imageUrl} alt="Image to edit" className="rounded-lg w-full h-auto object-contain max-h-80" />
                    </div>
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                        <p className="text-gray-400 mb-4 text-sm">Describe the changes you want to make to the image.</p>
                        <textarea 
                            className="input flex-1" 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="e.g., Add a glowing aura around the character, make the background a swirling nebula..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-4 mt-6">
                            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={!prompt.trim() || isSubmitting}>
                                {isSubmitting ? <><Spinner /> Editing...</> : 'Generate Edit'}
                            </button>
                        </div>
                    </form>
                </div>
                 <style>{`
                    .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #a855f7; }
                    .input { width: 100%; min-height: 100px; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.5rem; color: white; font-size: 0.9375rem; transition: all 0.3s; resize: vertical;}
                    .input:focus { outline: none; border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1); }
                    .btn-primary { gap: 0.5rem; align-items: center; }
                    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                `}</style>
            </div>
        </div>
    );
};

export default ImageEditModal;