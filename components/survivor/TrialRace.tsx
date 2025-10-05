import React from 'react';
import { SurvivorSeason, Character, SurvivorTrialCategory } from '../../types';

interface TrialRaceProps {
    season: SurvivorSeason;
    characterMap: Map<string, Character>;
}

// Self-contained, URL-encoded SVG patterns for backgrounds
const trialBackgrounds: Record<SurvivorTrialCategory, string> = {
    logic: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23a855f7' fill-opacity='0.08' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
    endurance: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20z' fill='%23f59e0b' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
    social: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ec4899' fill-opacity='0.07'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c-5.523 0-10-4.477-10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c-5.523 0-10-4.477-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    chaos: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath fill='%23ef4444' fill-opacity='0.1' d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/svg%3E")`,
    creative: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234ade80' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
};

const TrialRace: React.FC<TrialRaceProps> = ({ season, characterMap }) => {
    const trialRun = season.currentTrialRun || [];
    const trialInfo = season.currentTrial;
    const background = trialInfo ? trialBackgrounds[trialInfo.category] : 'none';

    return (
        <div 
            className="p-4 bg-black/50 rounded-lg mb-4 space-y-3 flex-1 flex flex-col justify-center"
            style={{ backgroundImage: background }}
        >
            <div className="text-center">
                <h4 className="font-bold text-xl text-purple-300">Trial: {trialInfo?.name}</h4>
                <p className="text-sm text-gray-400 max-w-md mx-auto">{trialInfo?.description}</p>
            </div>
            
            <div className="relative w-full space-y-1 py-4">
                {trialRun.map(player => {
                    const character = characterMap.get(player.charId);
                    if (!character) return null;
                    const isOut = player.status === 'out';
                    
                    return (
                        <div key={player.charId} className="h-10 relative flex items-center">
                            <div 
                                className={`absolute h-10 w-10 rounded-full bg-black/50 border-2 transition-all duration-300 ease-linear flex items-center justify-center ${isOut ? 'grayscale opacity-50' : ''}`}
                                style={{
                                    left: `calc(${player.progress}% - 20px)`, // Adjust for half-width
                                    borderColor: character.color,
                                    boxShadow: isOut ? 'none' : `0 0 10px ${character.color}`,
                                }}
                            >
                                <div className="text-2xl w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                                    {character.avatarUrl ? (
                                        <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" />
                                    ) : (
                                        character.avatar
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="absolute top-0 right-0 h-full w-1 border-l-2 border-dashed border-yellow-400 finish-line-glow"></div>
            </div>
            <style>{`
                @keyframes pulse-finish-line {
                    0%, 100% { box-shadow: 0 0 20px -5px #facc15; }
                    50% { box-shadow: 0 0 35px 5px #facc15; }
                }
                .finish-line-glow {
                    animation: pulse-finish-line 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default TrialRace;
