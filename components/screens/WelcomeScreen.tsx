import React, { useState } from 'react';
import { ConversationTemplate, Character, EnhancedScenario, BadgeId } from '../../types';
import { ScenarioRibbon } from '../badges/ScenarioRibbon';
import { useAppContext } from '../../state/AppContext';
import { CONVERSATION_TEMPLATES } from '../../constants/templates';
import { ENHANCED_SCENARIOS } from '../../constants/enhancedScenarios';
import { BADGE_CATALOG } from '../../badges/catalog';


const WelcomeScreen: React.FC = () => {
    const { handleStart, startConversationFromTemplate, startConversationFromEnhancedScenario, handleNavigateToQuiz, allCharacters } = useAppContext();
    const templates = CONVERSATION_TEMPLATES;
    const enhancedScenarios = ENHANCED_SCENARIOS;
    const [activeTab, setActiveTab] = useState<'enhanced' | 'regular'>('enhanced');
    
    const TabButton: React.FC<{ tabId: 'enhanced' | 'regular', children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-6 py-3 text-lg font-bold transition-colors duration-300 border-b-4 ${activeTab === tabId ? 'text-purple-300 border-purple-400' : 'text-gray-500 border-transparent hover:text-purple-400'}`}
        >
            {children}
        </button>
    );
    
    return (
        <div className="max-w-4xl mx-auto my-12 text-center animate-[fadeIn_0.5s_ease-out]" style={{animationName: 'fadeIn'}}>
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-transparent bg-clip-text animate-[glow_3s_ease-in-out_infinite]" style={{ animationName: 'glow', textShadow: '0 0 50px rgba(168, 85, 247, 0.5)' }}>
                Astrilogue: the aiConductor
            </h1>
            <p className="text-lg text-gray-400 mb-12 leading-relaxed">
                Orchestrate dynamic group chats, engage in live voice conversations, and guide intricate stories
                <br />
                with a cast of unique AI personalities.
            </p>
            
            <div className="my-16">
                 <h2 className="text-2xl font-bold text-purple-300 mb-4">Start a New Scenario</h2>
                 <div className="flex justify-center border-b border-purple-500/20 mb-8">
                     <TabButton tabId="enhanced">Enhanced Scenarios</TabButton>
                     <TabButton tabId="regular">Regular Scenarios</TabButton>
                 </div>
                 
                 {activeTab === 'enhanced' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.3s]">
                        {enhancedScenarios.map(scenario => (
                            <EnhancedScenarioCard 
                                key={scenario.id}
                                scenario={scenario}
                                onSelect={() => startConversationFromEnhancedScenario(scenario)}
                                allCharacters={allCharacters}
                            />
                        ))}
                     </div>
                 )}

                {activeTab === 'regular' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.3s]">
                        {templates.map(template => (
                            <TemplateCard 
                                key={template.id}
                                template={template}
                                onSelect={() => startConversationFromTemplate(template)}
                                allCharacters={allCharacters}
                            />
                        ))}
                     </div>
                )}
            </div>

            <div className="my-16 flex flex-col items-center">
                 <div className="h-px w-1/3 bg-purple-500/20 my-4"></div>
                <p className="text-gray-400 mb-4">Or, let the glyphs guide you.</p>
                <button
                    onClick={handleNavigateToQuiz}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-full shadow-lg shadow-cyan-500/30 transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/50"
                >
                    🔮 Find Your Character
                </button>
                <div className="h-px w-1/3 bg-purple-500/20 my-4"></div>
                <p className="text-gray-400 mb-4">Or, build your own from scratch.</p>
                <button
                    onClick={handleStart}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-full shadow-lg shadow-purple-500/30 transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50"
                >
                    Assemble Your Cast
                </button>
            </div>
        </div>
    );
};

const Avatar: React.FC<{char: Character, className?: string}> = ({ char, className }) => {
    if (char.avatarUrl) {
        return <img src={char.avatarUrl} alt={char.name} className={`object-contain ${className}`} />;
    }
    return <div className={`flex items-center justify-center text-lg ${className}`}>{char.avatar}</div>
};

interface TemplateCardProps {
    template: ConversationTemplate;
    onSelect: () => void;
    allCharacters: Character[];
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect, allCharacters }) => {
    const characters = template.characterIds.map(id => allCharacters.find(c => c.id === id)).filter(Boolean) as Character[];
    
    return (
        <button 
            onClick={onSelect}
            className="p-6 bg-white/5 border border-purple-500/20 rounded-2xl text-left hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300 hover:scale-105"
        >
            <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">{template.icon}</div>
                <h3 className="text-xl font-bold text-purple-300">{template.name}</h3>
            </div>
            <p className="text-gray-400 mb-4 text-sm">{template.description}</p>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Featuring:</span>
                <div className="flex -space-x-4">
                    {characters.slice(0, 4).map(char => (
                        <div key={char.id} className="w-8 h-8 rounded-full bg-black/50 border-2 border-purple-800 flex items-center justify-center text-lg overflow-hidden" title={char.name}>
                            <Avatar char={char} className="w-full h-full" />
                        </div>
                    ))}
                    {characters.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-black/50 border-2 border-purple-800 flex items-center justify-center text-xs font-bold text-purple-300">
                            +{characters.length - 4}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
};

interface EnhancedScenarioCardProps {
    scenario: EnhancedScenario;
    onSelect: () => void;
    allCharacters: Character[];
}

const EnhancedScenarioCard: React.FC<EnhancedScenarioCardProps> = ({ scenario, onSelect, allCharacters }) => {
    const characters = scenario.castIds.map(id => allCharacters.find(c => c.id === id)).filter(Boolean) as Character[];
    const badgeId = `badge-${scenario.id}` as BadgeId;
    const badgeMeta = BADGE_CATALOG.find(b => b.id === badgeId);
    const sceneUrl = badgeMeta?.sceneUrl;

    return (
        <button 
            onClick={onSelect}
            className="p-6 border border-purple-500/20 rounded-2xl text-left transition-all duration-300 hover:scale-105 relative overflow-hidden group flex flex-col min-h-[240px] bg-cover bg-center"
            style={{
                backgroundImage: sceneUrl ? `url('${sceneUrl}')` : undefined,
                backgroundColor: 'var(--cosmo-bg-surface)',
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--cosmo-bg-surface)] via-[var(--cosmo-bg-surface)]/80 to-transparent transition-opacity duration-300 group-hover:from-[var(--cosmo-bg-surface)]/80 group-hover:via-[var(--cosmo-bg-surface)]/60"></div>
            
            <div className="relative z-10 flex flex-col flex-grow h-full">
                <ScenarioRibbon badgeId={badgeId} />
                <div className="flex items-center gap-4 mb-3">
                    <div className="text-3xl">{scenario.icon}</div>
                    <h3 className="text-xl font-bold text-purple-300">{scenario.title}</h3>
                </div>
                <p className="text-gray-400 mb-4 text-sm flex-grow">{scenario.hook}</p>
                <div className="flex items-center gap-2 mt-auto">
                    <span className="text-xs text-gray-500">Featuring:</span>
                    <div className="flex -space-x-4">
                        {characters.slice(0, 4).map(char => (
                            <div key={char.id} className="w-8 h-8 rounded-full bg-black/50 border-2 border-purple-800 flex items-center justify-center text-lg overflow-hidden" title={char.name}>
                                <Avatar char={char} className="w-full h-full" />
                            </div>
                        ))}
                        {characters.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-black/50 border-2 border-purple-800 flex items-center justify-center text-xs font-bold text-purple-300">
                                +{characters.length - 4}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
};

export default WelcomeScreen;