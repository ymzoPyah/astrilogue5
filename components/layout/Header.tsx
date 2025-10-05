

import React from 'react';
import { View } from '../../types';
import DropdownMenu from '../ui/DropdownMenu';
import { useAppContext } from '../../state/AppContext';

const Header: React.FC = () => {
    const { view, goBack, dryRun, killSwitch, toggleSidebar, setKillSwitch, setView, setIsHelpModalOpen, handleNavigateToQuiz } = useAppContext();
    const showBackButton = view !== View.Welcome;

    return (
        <header className="sticky top-0 z-50 px-4 sm:px-8 py-4 bg-black/80 backdrop-blur-lg border-b border-purple-500/30 flex justify-between items-center gap-4 shadow-2xl shadow-black">
            <div className="flex items-center gap-4 flex-shrink-0">
                {showBackButton ? (
                    <button className="btn-secondary w-24 text-center" onClick={goBack} title="Go back" aria-label="Go back to previous screen">← Back</button>
                ) : (
                    <div className="w-24" /> // Placeholder to maintain layout consistency
                )}
                <img 
                    src="https://deffy.me/astrilogue/imgs/astrilogue-logo.png" 
                    alt="Astrilogue" 
                    title="Astrilogue: The AI Conductor"
                    className="h-6 w-auto"
                />
                {dryRun && <span className="badge-yellow hidden sm:inline">DRY RUN</span>}
                {killSwitch && <span className="badge-red hidden sm:inline">KILL SWITCH</span>}
            </div>
            
            <div className="flex-1 flex justify-end items-center">
                {/* Desktop Navigation */}
                <div className="hidden md:flex gap-3 flex-nowrap justify-end">
                    <button className="btn-secondary" onClick={() => setView(View.Profile)} title="View Dashboard" aria-label="View Dashboard"><span className="text-cyan-400">👤</span> Dashboard</button>
                    <button className="btn-secondary" onClick={() => setView(View.Survivor)} title="Survivor Mode" aria-label="Survivor Mode"><span className="text-amber-400">🔱</span> Survivor</button>
                    <button className="btn-secondary" onClick={handleNavigateToQuiz} title="Character Quiz" aria-label="Take the Character Quiz"><span className="text-purple-400">🔮</span> Quiz</button>
                    <button className="btn-secondary" onClick={() => setView(View.Analytics)} title="View Analytics" aria-label="View Analytics Dashboard"><span className="text-green-400">📊</span> Analytics</button>
                    <DropdownMenu trigger={<button className="btn-secondary"><span className="text-orange-400">📖</span> Lore...</button>}>
                        <button className="dropdown-item" onClick={() => setView(View.LoreBook)}>📖 Lore Book</button>
                        <button className="dropdown-item" onClick={() => setView(View.RelationshipVisualizer)}>🕸️ Lore Web</button>
                        <button className="dropdown-item" onClick={() => setView(View.Codex)}>📇 Codex</button>
                    </DropdownMenu>
                    <button className="btn-secondary" onClick={() => toggleSidebar('history')} title="Open History Panel" aria-label="Open Conversation History Panel"><span className="text-blue-400">📚</span> History</button>
                    <button className="btn-secondary" onClick={() => setIsHelpModalOpen(true)} title="Open Help Guide" aria-label="Open Help Guide"><span className="text-gray-400">❓</span> Help</button>
                    <button className={`btn-secondary ${killSwitch ? 'animate-pulse !border-red-500/50 !bg-red-500/20 !text-red-400' : ''}`} style={killSwitch ? { animationName: 'pulse' } : {}} onClick={() => setKillSwitch(!killSwitch)} title="Toggle Kill Switch" aria-label="Toggle API Kill Switch">
                        <span className={killSwitch ? 'text-red-500' : 'text-gray-400'}>{killSwitch ? '🔴' : '🛡️'}</span> Guard
                    </button>
                    <button className="btn-primary" onClick={() => toggleSidebar('settings')} title="Open Settings" aria-label="Open Settings Panel">⚙️ Settings</button>
                </div>

                {/* Mobile Navigation Dropdown */}
                <div className="md:hidden">
                    <DropdownMenu trigger={<button className="btn-secondary">Menu</button>}>
                        <button className="dropdown-item" onClick={() => setView(View.Profile)}>👤 Dashboard</button>
                        <button className="dropdown-item" onClick={() => setView(View.Survivor)}>🔱 Survivor</button>
                        <button className="dropdown-item" onClick={handleNavigateToQuiz}>🔮 Quiz</button>
                        <button className="dropdown-item" onClick={() => setView(View.Analytics)}>📊 Analytics</button>
                        <button className="dropdown-item" onClick={() => setView(View.LoreBook)}>📖 Lore Book</button>
                        <button className="dropdown-item" onClick={() => setView(View.RelationshipVisualizer)}>🕸️ Lore Web</button>
                        <button className="dropdown-item" onClick={() => setView(View.Codex)}>📇 Codex</button>
                        <button className="dropdown-item" onClick={() => toggleSidebar('history')}>📚 History</button>
                        <div className="my-1 border-t border-purple-500/20" />
                        <button className="dropdown-item" onClick={() => setIsHelpModalOpen(true)}>❓ Help</button>
                        <button className="dropdown-item" onClick={() => setKillSwitch(!killSwitch)}>{killSwitch ? '🔴' : '🛡️'} Guard</button>
                        <button className="dropdown-item" onClick={() => toggleSidebar('settings')}>⚙️ Settings</button>
                    </DropdownMenu>
                </div>
            </div>

            <style>{`
                .btn-primary, .btn-secondary {
                    padding: 0.5rem 1rem;
                    border-radius: 9999px;
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .btn-primary:hover:not(:disabled), .btn-secondary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    filter: brightness(1.2);
                }
                .btn-primary:disabled, .btn-secondary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .btn-primary {
                    border: 1px solid #a855f7;
                    background: linear-gradient(145deg, #a855f7, #ec4899);
                    color: white;
                    box-shadow: 0 4px 15px -5px #a855f7, 0 2px 8px -6px #ec4899;
                }
                .btn-secondary {
                    border: 1px solid rgba(17, 219, 239, 0.4);
                    background: rgba(17, 219, 239, 0.1);
                    color: #11dbef;
                }
                .btn-secondary:hover:not(:disabled) {
                    border-color: #11dbef;
                    box-shadow: 0 0 15px -2px #11dbef;
                }
                .badge-yellow {
                    padding: 0.25rem 0.75rem;
                    background: rgba(234, 179, 8, 0.2);
                    border: 1px solid rgba(234, 179, 8, 0.5);
                    border-radius: 1rem;
                    color: #eab308;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .badge-red {
                    padding: 0.25rem 0.75rem;
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.5);
                    border-radius: 1rem;
                    color: #ef4444;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .dropdown-item {
                    display: block;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    text-align: left;
                    font-size: 0.875rem;
                    color: #d1d5db;
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                .dropdown-item:hover:not(:disabled) {
                    background-color: rgba(17, 219, 239, 0.1);
                    color: #11dbef;
                }
            `}</style>
        </header>
    );
};

export default Header;