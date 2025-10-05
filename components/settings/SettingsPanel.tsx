

import React from 'react';
import { Usage, Limits, UserPreferences, ModelBehavior, TelemetryEvent } from '../../types';
import ProgressBar from '../ui/ProgressBar';
import { ttsService } from '../../services/ttsService';
import { Spinner } from '../ui/Spinner';

interface SettingsPanelProps {
    apiKey: string;
    setApiKey: (key: string) => void;
    usage: Usage;
    limits: Limits;
    setLimits: React.Dispatch<React.SetStateAction<Limits>>;
    dryRun: boolean;
    setDryRun: (dryRun: boolean) => void;
    killSwitch: boolean;
    setKillSwitch: (killSwitch: boolean) => void;
    resetUsage: () => void;
    showHexGrid: boolean;
    setShowHexGrid: (show: boolean) => void;
    userPreferences: UserPreferences;
    onUpdateUserPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
    onAddTelemetry?: (event: Omit<TelemetryEvent, 'timestamp'>) => void;
    id?: string; // For ARIA
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ apiKey, setApiKey, usage, limits, setLimits, dryRun, setDryRun, killSwitch, setKillSwitch, resetUsage, showHexGrid, setShowHexGrid, userPreferences, onUpdateUserPreferences, onAddTelemetry, id }) => {
    const [isCheckingHealth, setIsCheckingHealth] = React.useState(false);
    
    const updateLimit = (field: keyof Limits, value: number) => {
        if (!isNaN(value) && value >= 0) {
            setLimits(prev => ({ ...prev, [field]: value }));
        }
    };
    
    const updateModelPref = (flow: keyof UserPreferences['modelPrefs'], value: ModelBehavior) => {
        onUpdateUserPreferences(prev => ({
            ...prev,
            modelPrefs: {
                ...prev.modelPrefs,
                [flow]: value,
            }
        }));
        onAddTelemetry?.({ type: 'settings.model_changed', payload: { preset: value } });
    };

    const handleToggleVoice = async () => {
        const currentlyEnabled = userPreferences.voiceEnabled;
        if (currentlyEnabled) {
            onUpdateUserPreferences(p => ({...p, voiceEnabled: false}));
            return;
        }
    
        if (userPreferences.voiceProvider === 'xtts') {
            setIsCheckingHealth(true);
            const isHealthy = await ttsService.checkHealth(userPreferences.xttsServerUrl!);
            setIsCheckingHealth(false);
    
            if (isHealthy) {
                 onUpdateUserPreferences(p => ({...p, voiceEnabled: true}));
            } else {
                 alert(`Failed to connect to XTTS server at ${userPreferences.xttsServerUrl}. Please check if the server is running and the URL is correct.`);
            }
        } else { // browser provider
            onUpdateUserPreferences(p => ({...p, voiceEnabled: true}));
        }
    };

    return (
        <div>
            <h2 id={id} className="modal-title">⚙️ Settings & Guard</h2>
            
            <Section title="API Configuration">
                <div className="form-group">
                    <label className="label" htmlFor="api-key-input">Gemini API Key</label>
                    <input id="api-key-input" type="password" className="input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your Gemini API key..." />
                    <div className="text-xs text-gray-500 mt-2">
                        Get your key at <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Google AI Studio</a>
                    </div>
                </div>
            </Section>

            <Section title="Voice Synthesis (Experimental)">
                 <div className="form-group">
                    <label className="label" htmlFor="voice-provider-select">Voice Provider</label>
                    <select 
                        id="voice-provider-select" 
                        className="select" 
                        value={userPreferences.voiceProvider || 'xtts'} 
                        onChange={(e) => onUpdateUserPreferences(p => ({ ...p, voiceProvider: e.target.value as 'xtts' | 'browser' }))}
                    >
                        <option value="xtts">Local (XTTS)</option>
                        <option value="browser">Browser Default</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        'Local' uses a GPU-powered XTTS server for high quality voices. 'Browser' uses your browser's built-in TTS.
                    </p>
                </div>
                 <div className="form-group">
                    <label className="label" htmlFor="xtts-url-input">Local XTTS Server URL</label>
                    <input id="xtts-url-input" type="text" className="input" value={userPreferences.xttsServerUrl} onChange={(e) => onUpdateUserPreferences(p => ({ ...p, xttsServerUrl: e.target.value }))} placeholder="http://127.0.0.1:8020" />
                </div>
                <div className="space-y-4">
                    <ToggleButton 
                        active={userPreferences.voiceEnabled || false} 
                        onClick={handleToggleVoice} 
                        description="Use a local XTTS v2 server for high-quality, character-specific voices in the main chat screen. Falls back to browser TTS if unavailable." 
                        activeText="✓ Main Chat Voices Enabled" 
                        inactiveText={isCheckingHealth ? "Checking Server..." : "Enable Main Chat Voices"} 
                        disabled={isCheckingHealth}
                    />
                     <ToggleButton 
                        active={userPreferences.survivorVoicesEnabled || false} 
                        onClick={() => onUpdateUserPreferences(prev => ({ ...prev, survivorVoicesEnabled: !prev.survivorVoicesEnabled }))} 
                        description="Enable spoken dialogue for generated content in Survivor Mode (e.g., Tribal Debates, Spotlights)."
                        activeText="✓ Survivor Voices Enabled" 
                        inactiveText="Enable Survivor Voices" 
                    />
                </div>
            </Section>
            
            <Section title="Model Quality Presets">
                 <p className="text-xs text-gray-500 mb-4">Choose a preset for different tasks. 'Quality' enables deeper reasoning but is slower and more expensive.</p>
                <div className="grid grid-cols-2 gap-4">
                    <ModelPrefSelector label="Group Chat" value={userPreferences.modelPrefs.groupChat} onChange={(v) => updateModelPref('groupChat', v)} />
                    <ModelPrefSelector label="Director/Overseer" value={userPreferences.modelPrefs.director} onChange={(v) => updateModelPref('director', v)} />
                    <ModelPrefSelector label="Analysis (Lore/Emotion)" value={userPreferences.modelPrefs.analysis} onChange={(v) => updateModelPref('analysis', v)} />
                    <ModelPrefSelector label="Live Chat" value={userPreferences.modelPrefs.live} onChange={(v) => updateModelPref('live', v)} />
                </div>
            </Section>

            <Section title="Usage Monitor">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Spend" value={`$${usage.cost.toFixed(4)}`} limit={`$${limits.maxCost.toFixed(2)}`} percent={(usage.cost / limits.maxCost) * 100} />
                    <StatCard label="Tokens" value={usage.tokens.toLocaleString()} limit={limits.maxTokens.toLocaleString()} percent={(usage.tokens / limits.maxTokens) * 100} />
                    <StatCard label="Requests" value={usage.requests.toString()} limit={limits.maxRequests.toString()} percent={(usage.requests / limits.maxRequests) * 100} />
                </div>
                <button className="btn-secondary w-full mt-4" onClick={resetUsage}>Reset Usage Statistics</button>
            </Section>
            
            <Section title="Budget Limits">
                <div className="form-group">
                    <label className="label" htmlFor="max-cost-input">Max Spend ($)</label>
                    <input id="max-cost-input" type="number" className="input" value={limits.maxCost} step="0.01" min="0" onChange={(e) => updateLimit('maxCost', parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                    <label className="label" htmlFor="max-tokens-input">Max Tokens</label>
                    <input id="max-tokens-input" type="number" className="input" value={limits.maxTokens} step="1000" min="0" onChange={(e) => updateLimit('maxTokens', parseInt(e.target.value))} />
                </div>
                <div className="form-group">
                    <label className="label" htmlFor="max-requests-input">Max Requests</label>
                    <input id="max-requests-input" type="number" className="input" value={limits.maxRequests} step="10" min="0" onChange={(e) => updateLimit('maxRequests', parseInt(e.target.value))} />
                </div>
            </Section>

            <Section title="Safety & UI Controls">
                <div className="space-y-4">
                    <ToggleButton active={dryRun} onClick={() => setDryRun(!dryRun)} description="Dry Run simulates API calls without spending money." activeText="✓ Dry Run Active" inactiveText="Enable Dry Run Mode" />
                    <ToggleButton active={killSwitch} onClick={() => setKillSwitch(!killSwitch)} description="Kill Switch blocks all API requests." activeText="🔴 Deactivate Kill Switch" inactiveText="🛡️ Activate Kill Switch" activeClass="bg-red-500/30 border-red-400" />
                    <ToggleButton active={showHexGrid} onClick={() => setShowHexGrid(!showHexGrid)} description="Toggle the cosmetic hexagonal grid background." activeText="✓ Hex Grid Visible" inactiveText="Show Hex Grid Background" />
                     <ToggleButton 
                        active={userPreferences.dynamicWorldEventsEnabled || false}
                        onClick={() => onUpdateUserPreferences(prev => ({ ...prev, dynamicWorldEventsEnabled: !prev.dynamicWorldEventsEnabled }))} 
                        description="Allow random, dynamic world events to interrupt conversations, introducing new challenges."
                        activeText="✓ Dynamic World Events Enabled"
                        inactiveText="Enable Dynamic World Events"
                    />
                    <ToggleButton 
                        active={userPreferences.showInterventionReasons || false}
                        onClick={() => onUpdateUserPreferences(prev => ({ ...prev, showInterventionReasons: !prev.showInterventionReasons }))} 
                        description="Show AI's reasoning for interjections inline."
                        activeText="✓ Showing Intervention Reasons"
                        inactiveText="Show Intervention Reasons"
                    />
                    <ToggleButton 
                        active={userPreferences.motionSensitivity === 'reduced'} 
                        onClick={() => onUpdateUserPreferences(prev => ({ ...prev, motionSensitivity: prev.motionSensitivity === 'reduced' ? 'full' : 'reduced' }))} 
                        description="Reduce or disable animations for a calmer experience." 
                        activeText="✓ Reduced Motion Active" 
                        inactiveText="Enable Reduced Motion" 
                    />
                </div>
            </Section>

            <style>{`
                .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: #a855f7; }
                .section-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #ec4899; }
                .form-group { margin-bottom: 1.5rem; }
                .label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
                .input, .select { width: 100%; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.5rem; color: white; font-size: 0.9375rem; transition: all 0.3s; }
                .input:focus, .select:focus { outline: none; border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1); }
                .select { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; }
            `}</style>
        </div>
    );
};

const Section: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="mb-8"> <h3 className="section-title">{title}</h3> {children} </div>
);

const StatCard: React.FC<{label: string, value: string, limit: string, percent: number}> = ({label, value, limit, percent}) => (
    <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{label}</div>
        <div className="text-xl font-bold text-purple-400">{value}</div>
        <div className="text-xs text-gray-500">/ {limit}</div>
        <ProgressBar percent={percent} />
    </div>
);

const ToggleButton: React.FC<{active: boolean, onClick: () => void, description: string, activeText: string, inactiveText: string, activeClass?: string, disabled?: boolean}> = ({active, onClick, description, activeText, inactiveText, activeClass, disabled}) => (
    <div>
        <button disabled={disabled} className={`btn-secondary w-full flex items-center justify-center gap-2 ${active ? (activeClass || 'bg-purple-500/30 border-purple-400') : ''}`} onClick={onClick} aria-describedby={`${inactiveText.replace(/\s+/g, '-')}-desc`}>
            {disabled && <Spinner />}
            {active ? activeText : inactiveText}
        </button>
        <p id={`${inactiveText.replace(/\s+/g, '-')}-desc`} className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
);

const ModelPrefSelector: React.FC<{label: string, value: ModelBehavior, onChange: (value: ModelBehavior) => void}> = ({label, value, onChange}) => (
    <div className="form-group">
        <label className="label text-sm" htmlFor={`model-pref-${label}`}>{label}</label>
        <select id={`model-pref-${label}`} className="select text-sm" value={value} onChange={(e) => onChange(e.target.value as ModelBehavior)} aria-describedby={`model-pref-desc-${label}`}>
            <option value="flash">Fast</option>
            <option value="flash-thinking">Quality</option>
        </select>
        <p id={`model-pref-desc-${label}`} className="text-xs text-gray-500 mt-1 h-4" title={value === 'flash-thinking' ? "Uses 'thinking' for deeper reasoning. Slower and more expensive." : "Optimized for speed and cost."}>
            {value === 'flash' ? 'Optimized for speed & cost.' : 'Deeper reasoning (slower).'}
        </p>
    </div>
);

export default SettingsPanel;