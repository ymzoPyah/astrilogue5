import React, { useMemo } from 'react';
import { SurvivorSeason, Character, CharacterID } from '../../types';

interface ChampionCelebrationProps {
    season: SurvivorSeason;
    characterMap: Map<string, Character>;
}

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div>
        <div className="text-sm font-bold text-yellow-300 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
);

const AwardCard: React.FC<{ title: string; charId: CharacterID; characterMap: Map<string, Character> }> = ({ title, charId, characterMap }) => {
    const character = characterMap.get(charId);
    if (!character) return null;
    return (
        <div className="p-2 bg-black/40 rounded">
            <div className="font-bold text-yellow-400">{title}</div>
            <div className="flex items-center gap-1 mt-1">
                <div className="text-lg w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                    {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" loading="lazy" decoding="async" /> : character.avatar}
                </div>
                <div className="font-semibold" style={{color: character.color}}>{character.name}</div>
            </div>
        </div>
    )
};

const ChampionCelebration: React.FC<ChampionCelebrationProps> = ({ season, characterMap }) => {
    const champion = useMemo(() => season.champion ? characterMap.get(season.champion) : null, [season.champion, characterMap]);
    const stats = season.seasonStats;

    const journeyRecap = useMemo(() => {
        if (!season.champion) return null;
        const champId = season.champion;
        const trialWins = season.rounds.filter(r => r.trial.winnerIds.includes(champId)).length;
        const votesAgainst = season.rounds.flatMap(r => r.votes).filter(v => v.targetId === champId).length;
        
        const finalAlliance = season.alliances.find(a => a.members.includes(champId));
        const keyAllies = finalAlliance ? finalAlliance.members.filter(m => m !== champId).map(id => characterMap.get(id)?.name).join(', ') : 'None';
        
        const betrayals = season.bookmarks
            .filter(b => b.kind === 'betrayal' && (b.summary.includes(characterMap.get(champId)?.name || '')))
            .map(b => b.summary);

        return {
            trialWins,
            votesAgainst,
            keyAllies,
            betrayals
        };
    }, [season, characterMap]);

    if (!champion || !journeyRecap) return null;

    const handleExport = () => {
        let content = `# Survivor Season Recap: ${champion.name}, The Winner!\n\n`;
        content += `**Season Seed:** ${season.seed}\n`;
        content += `**Finished:** ${new Date(season.completedAt!).toLocaleString()}\n\n`;
        content += `## Journey Stats\n`;
        content += `- **Trial Wins:** ${journeyRecap.trialWins}\n`;
        content += `- **Votes Against:** ${journeyRecap.votesAgainst}\n`;
        content += `- **Key Allies:** ${journeyRecap.keyAllies}\n`;
        if (journeyRecap.betrayals.length > 0) {
            content += `- **Notable Moves:**\n`;
            journeyRecap.betrayals.forEach(b => {
                content += `  - ${b}\n`;
            });
        }
        if(stats) {
            content += `\n## Season Awards\n`;
            if(stats.mostLoyal) content += `- **Most Loyal:** ${characterMap.get(stats.mostLoyal.charId)?.name}\n`;
            if(stats.biggestFlip) content += `- **Biggest Flip:** ${characterMap.get(stats.biggestFlip.charId)?.name}\n`;
            if(stats.socialButterfly) content += `- **Social Butterfly:** ${characterMap.get(stats.socialButterfly.charId)?.name}\n`;
            if(stats.underdog) content += `- **Underdog:** ${characterMap.get(stats.underdog.charId)?.name}\n`;
        }


        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `survivor_recap_${season.seed}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="relative p-6 bg-gradient-to-br from-yellow-500/20 to-purple-500/10 rounded-lg text-center animate-[fadeIn_0.5s] overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <div key={i} className="confetti" style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                    backgroundColor: ['#F5C65D', '#A27BFF', '#FF52C6', '#25F2E2'][Math.floor(Math.random() * 4)]
                }}></div>
            ))}
            <h2 className="text-3xl font-black text-yellow-300 tracking-wider" style={{textShadow: '0 0 10px #facc15'}}>SOLE SURVIVOR</h2>
            <div className="text-7xl my-4" style={{ filter: `drop-shadow(0 0 20px ${champion.color})` }}>
                {champion.avatarUrl ? <img src={champion.avatarUrl} alt={champion.name} className="w-32 h-32 mx-auto rounded-full object-contain border-4 border-yellow-400 p-1" loading="lazy" decoding="async" /> : champion.avatar}
            </div>
            <h3 className="text-4xl font-bold" style={{ color: champion.color }}>{champion.name}</h3>
            
            <div className="my-6 p-4 bg-black/20 rounded-lg">
                <h4 className="text-xl font-bold text-purple-300 mb-4">Journey Recap</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <Stat label="Trial Wins" value={journeyRecap.trialWins} />
                    <Stat label="Votes Against" value={journeyRecap.votesAgainst} />
                    <Stat label="Key Allies" value={journeyRecap.keyAllies} />
                </div>
                {journeyRecap.betrayals.length > 0 && (
                     <div className="mt-4 text-left text-sm">
                        <p className="font-bold text-yellow-300">Key Moves:</p>
                        <ul className="list-disc list-inside text-gray-300">
                            {journeyRecap.betrayals.map((b,i) => <li key={i}>{b}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            {stats && (
                <div className="my-6 p-4 bg-black/20 rounded-lg">
                    <h4 className="text-xl font-bold text-purple-300 mb-4">Season Awards</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        {stats.mostLoyal && <AwardCard title="Most Loyal" charId={stats.mostLoyal.charId} characterMap={characterMap} />}
                        {stats.biggestFlip && <AwardCard title="Biggest Flip" charId={stats.biggestFlip.charId} characterMap={characterMap} />}
                        {stats.socialButterfly && <AwardCard title="Social Butterfly" charId={stats.socialButterfly.charId} characterMap={characterMap} />}
                        {stats.underdog && <AwardCard title="Underdog" charId={stats.underdog.charId} characterMap={characterMap} />}
                    </div>
                </div>
            )}

            <div className="flex justify-center gap-4">
                <button onClick={handleExport} className="btn-secondary text-sm">Export Recap</button>
                {/* Replay functionality is in SurvivorHub, this is a placeholder */}
                <button onClick={() => alert("Replay functionality is available from the Survivor Hub.")} className="btn-secondary text-sm">Replay Season</button>
            </div>
            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
                .confetti {
                    position: absolute;
                    top: 0;
                    width: 10px;
                    height: 10px;
                    animation: confetti-fall linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ChampionCelebration;