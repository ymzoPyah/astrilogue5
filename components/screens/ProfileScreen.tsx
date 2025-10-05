import React from 'react';
import ProfileBadgeGrid from '../badges/ProfileBadgeGrid';
import { Session, Character, UserPreferences, LoreEntry, QuizResult } from '../../types';
import StatCard from '../analytics/StatCard';
import { useAppContext } from '../../state/AppContext';

const ProfileScreen: React.FC = () => {
    const { sessions, allCharacters, userPreferences, loadSession, loreEntries, handleNavigateToQuiz, startConversation } = useAppContext();
    
    const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);
    const totalLoreEntries = loreEntries.length;
    const characterMap: Map<string, Character> = new Map(allCharacters.map(c => [c.id, c]));

    const favoriteCharacters = userPreferences.favoriteCharacterIds
        .map(id => allCharacters.find(c => c.id === id))
        .filter((c): c is Character => !!c);

    const latestSession = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0];

    return (
        <div className="max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out] space-y-12">
            <div className="text-center">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                    Dashboard
                </h2>
                <p className="text-gray-400 mt-2">Your command center for Astrilogue.</p>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Total Sessions" value={sessions.length} icon="📚" />
                <StatCard label="Total Messages" value={totalMessages.toLocaleString()} icon="💬" />
                <StatCard label="Total Lore Entries" value={totalLoreEntries} icon="✨" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                 {/* Left Column: Quick Actions */}
                <div className="space-y-8">
                    {latestSession && (
                        <div>
                             <h3 className="text-2xl font-bold text-purple-300 mb-4">Jump Back In</h3>
                             <div className="bg-white/5 border border-purple-500/20 rounded-xl p-6 flex flex-col justify-center text-center">
                                <p className="font-bold text-purple-300 truncate mb-4" title={latestSession.name}>{latestSession.name}</p>
                                <button 
                                    className="btn-primary w-full"
                                    onClick={() => loadSession(latestSession.id)}
                                >
                                    Continue Session →
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div>
                         <h3 className="text-2xl font-bold text-purple-300 mb-4">Character Resonance</h3>
                         {(userPreferences.latestQuizResults && userPreferences.latestQuizResults.length > 0) ? (
                            <QuizResultsDisplay 
                                results={userPreferences.latestQuizResults}
                                characterMap={characterMap}
                                onStartChat={startConversation}
                            />
                         ) : (
                             <div className="bg-white/5 border border-purple-500/20 rounded-xl p-6 flex flex-col justify-center text-center items-center">
                                <div className="text-5xl mb-4">🔮</div>
                                <h4 className="text-lg font-bold text-purple-300">Discover Your Match</h4>
                                <p className="text-gray-400 my-2">Find which character resonates with you.</p>
                                <button className="btn-primary mt-2" onClick={handleNavigateToQuiz}>
                                    Take the Quiz →
                                </button>
                            </div>
                         )}
                    </div>
                </div>
                 {/* Right Column: Favorites */}
                 {favoriteCharacters.length > 0 && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-purple-300 mb-4">⭐ Favorite Characters</h3>
                            <div className="flex flex-wrap gap-4 p-4 bg-black/20 rounded-lg justify-center">
                                {favoriteCharacters.map(char => (
                                    <div key={char.id} className="p-4 bg-black/30 rounded-lg w-32 text-center border border-transparent hover:border-purple-500/50 transition-colors">
                                        <div className="text-5xl" style={{ filter: `drop-shadow(0 0 10px ${char.color})` }}>
                                            {char.avatarUrl ? <img src={char.avatarUrl} alt={char.name} className="w-16 h-16 mx-auto rounded-full object-contain" /> : char.avatar}
                                        </div>
                                        <div className="mt-2 font-bold text-sm" style={{ color: char.color }}>{char.name}</div>
                                        <div className="text-xs text-gray-400 h-8 flex items-center justify-center">{char.title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Badge Grid */}
            <div>
                 <h3 className="text-2xl font-bold text-purple-300 mb-4">🏆 Badge Collection</h3>
                 <ProfileBadgeGrid />
            </div>
            
            <style>{`
                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    filter: brightness(1.2);
                }
            `}</style>
        </div>
    );
};


const QuizResultsDisplay: React.FC<{
    results: QuizResult[],
    characterMap: Map<string, Character>,
    onStartChat: (characterIds: string[]) => void,
}> = ({ results, characterMap, onStartChat }) => {
    const topResult = characterMap.get(results[0].characterId);

    if (!topResult) return null;
    
    return (
         <div className="bg-white/5 border border-purple-500/20 rounded-xl p-6 flex items-center gap-6">
             <div className="text-6xl w-24 h-24 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ filter: `drop-shadow(0 0 15px ${topResult.color})`}}>
                {topResult.avatarUrl ? <img src={topResult.avatarUrl} alt={topResult.name} className="w-full h-full object-contain" /> : topResult.avatar}
             </div>
             <div>
                <p className="text-sm text-gray-400">Your top resonance is:</p>
                <h4 className="text-2xl font-bold" style={{ color: topResult.color }}>{topResult.name}</h4>
                 <button className="btn-primary mt-3" onClick={() => onStartChat([topResult.id])}>Chat with {topResult.name}</button>
            </div>
        </div>
    );
};


export default ProfileScreen;