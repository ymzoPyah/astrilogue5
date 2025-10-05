import React from 'react';
import { Scene } from '../../types';
import { useAppContext } from '../../state/AppContext';
import { SCENES } from '../../constants/scenes';

interface SceneSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectScene: (sceneId: string) => void;
}

const SceneSelectionModal: React.FC<SceneSelectionModalProps> = ({ isOpen, onClose, onSelectScene }) => {
    if (!isOpen) return null;
    const scenes = SCENES;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" style={{ animationName: 'fadeIn' }} onClick={onClose}>
            <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" style={{ animationName: 'modalSlide' }} onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">🎬 Set the Scene</h2>
                <p className="text-gray-400 mb-6">Choose an environment to provide context for the conversation.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {scenes.map(scene => (
                        <button
                            key={scene.id}
                            onClick={() => onSelectScene(scene.id)}
                            className="p-4 bg-white/5 border border-purple-500/20 rounded-lg text-left hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300 hover:scale-105"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="text-3xl">{scene.icon}</div>
                                <h3 className="text-lg font-bold text-purple-300">{scene.name}</h3>
                            </div>
                            <p className="text-gray-400 text-sm">{scene.description}</p>
                        </button>
                    ))}
                </div>

                <div className="flex justify-end mt-8">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                </div>
            </div>
            <style>{`
                .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #a855f7; }
            `}</style>
        </div>
    );
};

export default SceneSelectionModal;