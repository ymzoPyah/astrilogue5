import React from 'react';
import { SurvivorSeason, Character } from '../../types';

interface VotingCeremonyProps {
    season: SurvivorSeason;
    characterMap: Map<string, Character>;
    isJuryVote?: boolean;
}

const VotingCeremony: React.FC<VotingCeremonyProps> = ({ season, characterMap, isJuryVote }) => {
    const players = isJuryVote ? season.jury : season.cast.filter(id => !season.dossiers[id].eliminatedRound);
    const votingIndex = isJuryVote ? (season.votingCeremonyIndex ?? -1) : (season.votingCeremonyIndex ?? -1);
    const currentVoterId = players[votingIndex];
    const votes = isJuryVote ? season.juryVotes : season.votes;
    const voteBeingCast = (votes || [])[votingIndex];
    const voteTarget = voteBeingCast ? characterMap.get(voteBeingCast.targetId) : null;
    const host = characterMap.get(season.hostId);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black/50 rounded-lg relative overflow-hidden tribal-council-bg">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
            
            <h3 className="text-2xl font-bold text-yellow-300 z-10" style={{textShadow: '0 0 10px #facc15'}}>Tribal Council</h3>
            <p className="text-gray-400 mb-8 z-10">It is time to vote.</p>

            <div className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-12 z-10">
                {players.map((id, index) => {
                    const character = characterMap.get(id);
                    if (!character) return null;
                    const isVoting = index === votingIndex;
                    return (
                        <div key={id} className={`flex flex-col items-center transition-all duration-500 ${isVoting ? 'is-voting' : ''}`}>
                            <div className="avatar-container w-16 h-16 rounded-full border-2 border-purple-800 bg-black/50 flex items-center justify-center overflow-hidden transition-all duration-500">
                                {character.avatarUrl ? (
                                    <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-3xl">{character.avatar}</span>
                                )}
                            </div>
                            <span className="text-xs font-semibold mt-1" style={{color: character.color}}>{character.name}</span>
                        </div>
                    );
                })}
            </div>

            <div className="voting-area">
                <div className="voting-booth">
                    <div className="parchment">
                        {voteTarget && <span className="vote-name">{voteTarget.name}</span>}
                    </div>
                </div>
                 <div className="flex flex-col items-center">
                    {host && (
                         <div className="w-12 h-12 rounded-full border-2 border-yellow-700 bg-black/50 flex items-center justify-center overflow-hidden mb-1">
                            {host.avatarUrl ? (
                                <img src={host.avatarUrl} alt={host.name} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-2xl">{host.avatar}</span>
                            )}
                        </div>
                    )}
                    <div className="vote-urn"></div>
                </div>
            </div>

            <style>{`
                .tribal-council-bg {
                    background-image: url('https://deffy.me/astrilogue/imgs/landscapes/landscape_tribal.png');
                    background-size: cover;
                    background-position: center;
                }
                .avatar-container {
                    transform: translateY(0);
                }
                .is-voting .avatar-container {
                    animation: walkToVote 4s ease-in-out forwards;
                }
                @keyframes walkToVote {
                    0% { transform: translateY(0) scale(1); }
                    20% { transform: translateY(-80px) scale(1.2); }
                    80% { transform: translateY(-80px) scale(1.2); }
                    100% { transform: translateY(0) scale(1); }
                }

                .voting-area {
                    position: absolute;
                    bottom: 20%;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    align-items: flex-end;
                    gap: 40px;
                }
                .voting-booth {
                    width: 100px;
                    height: 120px;
                    background-color: #3a1a0a;
                    border: 2px solid #5c2c0c;
                    border-radius: 5px;
                    position: relative;
                }
                .parchment {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    right: 10px;
                    height: 60px;
                    background-color: #f3e8d3;
                    border: 1px solid #c7b89d;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Georgia', serif;
                    color: #4a2c0c;
                    font-weight: bold;
                    overflow: hidden;
                    opacity: 0;
                }
                .is-voting .parchment {
                    animation: writeVote 4s ease-in-out forwards;
                }
                .vote-name {
                    opacity: 0;
                    animation: revealName 4s ease-in-out forwards;
                }

                @keyframes writeVote {
                    0%, 25% { opacity: 0; }
                    35% { opacity: 1; }
                    75% { opacity: 1; }
                    85%, 100% { opacity: 0; }
                }

                @keyframes revealName {
                    0%, 40% { opacity: 0; }
                    50% { opacity: 1; }
                    70% { opacity: 1; }
                    80%, 100% { opacity: 0; }
                }

                .vote-urn {
                    width: 60px;
                    height: 80px;
                    background-color: #4a2c0c;
                    border: 2px solid #6c3c1c;
                    border-radius: 5px 5px 20px 20px;
                    position: relative;
                }
                .vote-urn::before {
                    content: '';
                    position: absolute;
                    top: -5px;
                    left: 10px;
                    right: 10px;
                    height: 10px;
                    background-color: #2a0a00;
                    border-radius: 2px;
                }

            `}</style>
        </div>
    );
};

export default VotingCeremony;