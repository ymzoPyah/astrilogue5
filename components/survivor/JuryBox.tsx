import React, { useState, useEffect } from 'react';
import { Character, CharacterID, SurvivorSeason, Vote } from '../../types';

interface JuryBoxProps {
    juryMemberIds: CharacterID[];
    characterMap: Map<string, Character>;
    season: SurvivorSeason;
    latestRevealedVote: Vote | null;
}

const JuryBox: React.FC<JuryBoxProps> = ({ juryMemberIds, characterMap, season, latestRevealedVote }) => {
    const [reactions, setReactions] = useState<Record<CharacterID, 'strong' | 'weak' | null>>({});

    useEffect(() => {
        if (!latestRevealedVote) return;

        const newReactions: Record<CharacterID, 'strong' | 'weak' | null> = {};
        const { voterId, targetId } = latestRevealedVote;

        juryMemberIds.forEach(jurorId => {
            const jurorDossier = season.dossiers[jurorId];
            if (!jurorDossier) return;

            const jurorAlliances = season.alliances.filter(a => a.members.includes(jurorId));
            const jurorAllies = new Set(jurorAlliances.flatMap(a => a.members));
            const jurorRivals = new Set(jurorDossier.rivalries);

            let reactionLevel: 'strong' | 'weak' | null = null;

            // Strong reactions have priority
            if (jurorRivals.has(voterId) || jurorRivals.has(targetId)) {
                reactionLevel = 'strong';
            } else if (jurorAllies.has(voterId) && jurorAllies.has(targetId)) {
                // A former ally voting for another former ally is a betrayal to witness
                reactionLevel = 'strong';
            }
            // Weak reactions
            else if (jurorAllies.has(voterId) || jurorAllies.has(targetId)) {
                reactionLevel = 'weak';
            }

            if (reactionLevel) {
                newReactions[jurorId] = reactionLevel;
            }
        });

        setReactions(newReactions);

    }, [latestRevealedVote, juryMemberIds, season.dossiers, season.alliances]);


    if (juryMemberIds.length === 0) {
        return null;
    }

    return (
        <>
            <div className="absolute top-4 right-4 bg-black/50 p-3 rounded-lg border border-purple-500/20 backdrop-blur-sm z-20 animate-[fadeIn_0.5s_ease-out]">
                <h4 className="font-bold text-yellow-300 text-sm mb-2 text-center">THE JURY</h4>
                <div className="flex flex-wrap justify-center gap-2">
                    {juryMemberIds.map(id => {
                        const character = characterMap.get(id);
                        if (!character) return null;
                        return (
                            <div 
                                key={id} 
                                className="w-10 h-10 rounded-full bg-black/50 border-2 border-gray-600 flex items-center justify-center overflow-hidden transition-transform duration-200" 
                                title={character.name}
                                data-reaction={reactions[id] || 'none'}
                                onAnimationEnd={() => setReactions(prev => ({ ...prev, [id]: null }))}
                            >
                                {character.avatarUrl ? (
                                    <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-xl">{character.avatar}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <style>{`
                @keyframes react-weak {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 transparent; }
                    50% { transform: scale(1.15); box-shadow: 0 0 10px #facc15; }
                }
                @keyframes react-strong {
                    0%, 100% { transform: translateX(0); box-shadow: 0 0 0 transparent; }
                    20%, 60% { transform: translateX(-3px); }
                    40%, 80% { transform: translateX(3px); }
                    50% { box-shadow: 0 0 12px #f87171; }
                }
                div[data-reaction="weak"] {
                    animation: react-weak 0.6s ease-out;
                }
                div[data-reaction="strong"] {
                    animation: react-strong 0.5s ease-in-out;
                }
            `}</style>
        </>
    );
};

export default JuryBox;
