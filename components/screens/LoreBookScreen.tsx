import React from 'react';
import { LoreEntry, Character } from '../../types';
import { useAppContext } from '../../state/AppContext';

const LoreBookScreen: React.FC = () => {
    const { loreEntries, allCharacters } = useAppContext();
    
    const sortedEntries = [...loreEntries].sort((a, b) => b.timestamp - a.timestamp);
    const characterMap = new Map(allCharacters.map(c => [c.id, c]));

    return (
        <div className="max-w-5xl mx-auto animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                    The Lore Book
                </h2>
                <p className="text-gray-400 mt-2">An evolving chronicle of significant moments from your conversations.</p>
            </div>

            {sortedEntries.length === 0 ? (
                <div className="text-center text-gray-500 py-24">
                    <div className="text-6xl mb-4">📖</div>
                    <h3 className="text-2xl font-semibold">Your Lore Book is Empty</h3>
                    <p className="mt-2">Go to the 'History' panel and use the 'Scan for Lore' button on a conversation to begin.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedEntries.map(entry => {
                        const involvedCharacters = entry.characterIds
                            .map(id => characterMap.get(id))
                            .filter((c): c is Character => !!c);

                        return (
                            <div key={entry.id} className="bg-white/5 border border-purple-500/20 rounded-2xl p-6 shadow-lg shadow-black/30 animate-[slideIn_0.5s_ease-out_forwards] opacity-0" style={{ animationDelay: `${Math.min(sortedEntries.indexOf(entry) * 100, 500)}ms` }}>
                                <h3 className="text-2xl font-bold text-purple-300 mb-3">{entry.title}</h3>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">{entry.content}</p>
                                <div className="border-t border-purple-500/20 pt-4 flex items-center gap-4">
                                    <span className="text-sm font-semibold text-gray-500">INVOLVED:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {involvedCharacters.map(char => (
                                            <div key={char.id} className="flex items-center gap-2 px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-sm">
                                                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-lg">
                                                    {char.avatarUrl ? <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-contain" /> : char.avatar}
                                                </div>
                                                <span className="font-medium" style={{ color: char.color }}>{char.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LoreBookScreen;
