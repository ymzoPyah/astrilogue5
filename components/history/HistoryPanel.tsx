import React, { useRef } from 'react';
import { Session } from '../../types';
import { Spinner } from '../ui/Spinner';
import { encodePreset } from '../../services/presets';

interface HistoryPanelProps {
    sessions: Session[];
    activeSessionId: string | null;
    onLoadSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onOpenExport: (session: Session) => void;
    onExtractLore: (sessionId: string) => void;
    isScanningLore: string | null;
    onImportSession: (session: Session) => void;
    id?: string; // For ARIA
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ sessions, activeSessionId, onLoadSession, onDeleteSession, onOpenExport, onExtractLore, isScanningLore, onImportSession, id }) => {
    const importRef = useRef<HTMLInputElement>(null);

    const handleShare = (session: Session) => {
        const preset = {
            characterIds: session.characterIds,
            activeSceneId: session.activeSceneId,
            goals: session.goals,
            seed: session.seed,
            name: session.name.split(' - ')[0], // Get the base name
        };
        const encoded = encodePreset(preset);
        const url = `${window.location.origin}${window.location.pathname}?p=${encoded}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('Preset URL copied to clipboard!');
        }, (err) => {
            alert('Failed to copy URL.');
            console.error('Could not copy text: ', err);
        });
    };

    const handleImportClick = () => {
        importRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const session = JSON.parse(e.target?.result as string) as Session;
                    onImportSession(session);
                } catch (err) {
                    alert("Failed to parse session file. Make sure it's a valid JSON export from Astrilogue.");
                    console.error("Import error:", err);
                }
            };
            reader.readAsText(file);
        }
        // Reset file input
        if(event.target) event.target.value = '';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 id={id} className="text-2xl font-bold text-purple-400">📚 History</h2>
                <button className="btn-action bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/40" onClick={handleImportClick}>
                    Import Session
                </button>
                <input type="file" ref={importRef} className="hidden" accept=".json" onChange={handleFileImport} />
            </div>

            {sessions.length === 0 ? (
                <div className="text-center text-gray-500 py-16">
                    <div className="text-5xl mb-4">📭</div>
                    <div>No conversations yet</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map(session => (
                        <div key={session.id} className={`p-4 bg-white/5 border rounded-lg transition-all ${session.id === activeSessionId ? 'bg-purple-500/20 border-purple-500' : 'border-white/10 hover:bg-purple-500/10 hover:border-purple-500/30'}`}>
                            <div className="cursor-pointer" onClick={() => onLoadSession(session.id)}>
                                <div className="font-bold text-purple-400 truncate">{session.name}</div>
                                <div className="text-xs text-gray-400 flex flex-wrap gap-x-3">
                                    <span>{session.mode === 'group' ? '🎭 Group' : '💬 1-on-1'}</span>
                                    <span>{session.messages.length} msgs</span>
                                    <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <button className="btn-action" onClick={() => handleShare(session)}>🔗 Share</button>
                                <button className="btn-action" onClick={() => onOpenExport(session)}>📄 Export</button>
                                <button className="btn-action" onClick={() => onExtractLore(session.id)} disabled={isScanningLore === session.id}>
                                    {isScanningLore === session.id ? <><Spinner /> Scan...</> : "✨ Lore"}
                                </button>
                                <button className="btn-action-danger" onClick={() => onDeleteSession(session.id)}>🗑️ Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                .btn-action, .btn-action-danger {
                    padding: 0.375rem 0.5rem;
                    font-size: 0.875rem;
                    border-width: 1px;
                    border-radius: 0.375rem;
                    transition: all 150ms;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.25rem;
                }
                .btn-action {
                     background: rgba(168, 85, 247, 0.1); color: #a855f7; border-color: rgba(168, 85, 247, 0.5);
                }
                .btn-action:hover:not(:disabled) { background: rgba(168, 85, 247, 0.2); }
                .btn-action-danger {
                    background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.5);
                }
                .btn-action-danger:hover { background: rgba(239, 68, 68, 0.2); }
                .btn-action:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default HistoryPanel;