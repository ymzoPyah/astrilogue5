import React, { useState, useCallback } from 'react';
import { Character } from '../../types';
import { testCharacterResponse, generateAvatarPrompt, generateImage } from '../../services/geminiService';
import { Spinner } from '../ui/Spinner';
import { useAppContext } from '../../state/AppContext';

type AvatarModalState = 'idle' | 'generating_prompt' | 'prompt_ready' | 'generating_image' | 'image_ready';

const CharacterWorkshopScreen: React.FC = () => {
    const { characterInWorkshop, handleSaveCustomCharacter, goBack, apiKey } = useAppContext();
    // Character must exist to render this screen, so we can assert it's not null.
    const character = characterInWorkshop!;

    const [editedChar, setEditedChar] = useState<Character>(character);
    const [testPrompt, setTestPrompt] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [isTesting, setIsTesting] = useState(false);

    const [avatarModalOpen, setAvatarModalOpen] = useState(false);
    const [avatarModalState, setAvatarModalState] = useState<AvatarModalState>('idle');
    const [avatarGenPrompt, setAvatarGenPrompt] = useState('');
    const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedChar(prev => ({ ...prev, [name]: value }));
    };
    
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedChar(prev => ({ ...prev, color: e.target.value }));
    };

    const handleTest = useCallback(async () => {
        if (!testPrompt.trim() || !editedChar.systemPrompt.trim() || !apiKey) {
            alert('API Key, System Prompt, and a Test Prompt are required to test.');
            return;
        }
        setIsTesting(true);
        setTestResponse('');
        try {
            const response = await testCharacterResponse(apiKey, editedChar.systemPrompt, testPrompt);
            setTestResponse(response);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setTestResponse(`❌ ERROR: ${errorMessage}`);
        } finally {
            setIsTesting(false);
        }
    }, [apiKey, testPrompt, editedChar.systemPrompt]);
    
    const handleSave = () => {
        if (!editedChar.name.trim() || !editedChar.systemPrompt.trim()) {
            alert('Name and System Prompt are required.');
            return;
        }
        handleSaveCustomCharacter(editedChar);
    };

    const openAvatarGenerator = async () => {
        setAvatarModalOpen(true);
        setAvatarModalState('generating_prompt');
        setAvatarError('');
        setGeneratedAvatar(null);
        try {
            const prompt = await generateAvatarPrompt(apiKey, {name: editedChar.name, title: editedChar.title, systemPrompt: editedChar.systemPrompt});
            setAvatarGenPrompt(prompt);
            setAvatarModalState('prompt_ready');
        } catch (error) {
            setAvatarError(error instanceof Error ? error.message : "Failed to generate prompt.");
            setAvatarModalState('idle');
        }
    };

    const handleGenerateAvatarImage = async () => {
        if (!avatarGenPrompt) return;
        setAvatarModalState('generating_image');
        setAvatarError('');
        try {
            const imageUrl = await generateImage(apiKey, avatarGenPrompt);
            setGeneratedAvatar(imageUrl);
            setAvatarModalState('image_ready');
        } catch (error) {
            setAvatarError(error instanceof Error ? error.message : "Failed to generate image.");
            setAvatarModalState('prompt_ready');
        }
    };
    
    const handleUseAvatar = () => {
        if (generatedAvatar) {
            setEditedChar(prev => ({ ...prev, avatarUrl: generatedAvatar }));
        }
        setAvatarModalOpen(false);
        setAvatarModalState('idle');
    };

    return (
        <div className="max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                    Character Workshop
                </h2>
                <p className="text-gray-400 mt-2">Design, refine, and test your own AI personalities.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Character Form */}
                <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-purple-300">Character Profile</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-black/30 flex items-center justify-center text-5xl overflow-hidden flex-shrink-0">
                             {editedChar.avatarUrl ? (
                                <img src={editedChar.avatarUrl} alt={editedChar.name} className="w-full h-full object-contain" />
                            ) : (
                                editedChar.avatar || '🤖'
                            )}
                        </div>
                        <button className="btn-secondary flex-1" onClick={openAvatarGenerator}>✨ Generate Avatar with AI</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="label">Name*</label><input type="text" name="name" className="input" value={editedChar.name} onChange={handleChange} required /></div>
                        <div><label className="label">Title</label><input type="text" name="title" className="input" value={editedChar.title} onChange={handleChange} /></div>
                        <div><label className="label">Fallback Emoji</label><input type="text" name="avatar" className="input" value={editedChar.avatar} onChange={handleChange} /></div>
                        <div><label className="label">Color</label><input type="color" name="color" className="input h-12" value={editedChar.color} onChange={handleColorChange} /></div>
                    </div>
                    <div>
                        <label className="label">System Prompt* (Personality & Lore)</label>
                        <textarea name="systemPrompt" className="input min-h-[250px] font-mono text-sm" value={editedChar.systemPrompt} onChange={handleChange} required placeholder="Define your character's personality, background, and how they should speak..." />
                    </div>
                </div>

                {/* Test Chamber */}
                <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-2xl font-bold text-cyan-300">Test Chamber</h3>
                    <div className="mt-4">
                        <label className="label">Test Prompt</label>
                        <textarea className="input min-h-[80px]" value={testPrompt} onChange={e => setTestPrompt(e.target.value)} placeholder="Say something to your character..." />
                    </div>
                    <button className="btn-secondary mt-4" onClick={handleTest} disabled={isTesting}>
                        {isTesting ? <><Spinner /> Testing...</> : '⚡ Test Response'}
                    </button>
                    <div className="mt-4 flex-1 bg-black/30 rounded-lg p-4 overflow-y-auto min-h-[150px]">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{testResponse || "Test response will appear here..."}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                <button className="btn-secondary" onClick={goBack}>Cancel</button>
                <button className="btn-primary" onClick={handleSave}>Save Character</button>
            </div>

            {/* Avatar Generation Modal */}
            {avatarModalOpen && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" onClick={() => setAvatarModalOpen(false)}>
                    <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">✨ Genesis Engine</h2>
                        {avatarError && <p className="text-red-400 bg-red-500/10 p-2 rounded mb-4">{avatarError}</p>}
                        
                        {avatarModalState === 'generating_prompt' && <div className="text-center p-8"><Spinner /> <p className="mt-2 text-gray-400">Generating image prompt...</p></div>}

                        {(avatarModalState === 'prompt_ready' || avatarModalState === 'generating_image' || avatarModalState === 'image_ready') && (
                            <>
                                <label className="label">AI Generated Image Prompt (Editable)</label>
                                <textarea className="input font-mono text-sm min-h-[100px]" value={avatarGenPrompt} onChange={e => setAvatarGenPrompt(e.target.value)} />
                                <button className="btn-secondary w-full mt-4" onClick={handleGenerateAvatarImage} disabled={avatarModalState === 'generating_image'}>
                                    {avatarModalState === 'generating_image' ? <><Spinner /> Generating Image...</> : '🎨 Generate Image'}
                                </button>
                            </>
                        )}

                        {avatarModalState === 'image_ready' && generatedAvatar && (
                             <div className="mt-4 text-center">
                                <img src={generatedAvatar} alt="Generated Avatar" className="max-w-xs mx-auto rounded-lg border-2 border-purple-400" />
                                <button className="btn-primary mt-4" onClick={handleUseAvatar}>Use this Avatar</button>
                            </div>
                        )}

                        <div className="flex justify-end mt-6">
                            <button className="btn-secondary" onClick={() => setAvatarModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            
             <style>{`
                .label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
                .input { width: 100%; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.5rem; color: white; font-size: 0.9375rem; transition: all 0.3s; resize: vertical; }
                .input:focus { outline: none; border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1); }
                .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #a855f7; }
            `}</style>
        </div>
    );
};

export default CharacterWorkshopScreen;