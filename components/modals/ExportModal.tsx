import React from 'react';
import { Session, Character } from '../../types';
import { exportToMarkdown, exportToJson, exportToTxt } from '../../services/exportService';
import { useAppContext } from '../../state/AppContext';

interface ExportModalProps {
    session: Session;
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ session, onClose }) => {
    const { allCharacters } = useAppContext();

    const handleExport = (format: 'md' | 'json' | 'txt') => {
        switch (format) {
            case 'md':
                exportToMarkdown(session, allCharacters);
                break;
            case 'json':
                exportToJson(session);
                break;
            case 'txt':
                exportToTxt(session, allCharacters);
                break;
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" style={{animationName: 'fadeIn'}} onClick={onClose}>
            <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" style={{animationName: 'modalSlide'}} onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">📄 Export Conversation</h2>
                <p className="text-gray-400 mb-6">Choose a format to download this conversation.</p>
                
                <div className="space-y-4">
                    <button className="btn-secondary w-full text-left" onClick={() => handleExport('md')}>
                        <strong className="text-purple-300">Markdown (.md)</strong> - Formatted text, good for notes.
                    </button>
                    <button className="btn-secondary w-full text-left" onClick={() => handleExport('json')}>
                        <strong className="text-purple-300">JSON (.json)</strong> - Raw data, good for developers.
                    </button>
                    <button className="btn-secondary w-full text-left" onClick={() => handleExport('txt')}>
                        <strong className="text-purple-300">Plain Text (.txt)</strong> - Simple text, maximum compatibility.
                    </button>
                </div>
                
                <div className="flex justify-end mt-8">
                    <button className="btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
             <style>{`
                .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #a855f7; }
                .btn-secondary { display: block; text-align: left; padding: 1rem; }
                .btn-secondary:hover { border-color: #a855f7; }
            `}</style>
        </div>
    );
};

export default ExportModal;