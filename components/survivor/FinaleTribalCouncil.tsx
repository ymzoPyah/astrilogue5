import React from 'react';
import { SurvivorSeason, Character } from '../../types';

interface FinaleTribalCouncilProps {
    season: SurvivorSeason;
    characterMap: Map<string, Character>;
}

const CharacterAvatar: React.FC<{char: Character, isSpeaking: boolean}> = ({ char, isSpeaking }) => (
    <div className={`flex flex-col items-center gap-1 transition-transform duration-300 ${isSpeaking ? 'scale-110' : ''}`}>
        <div className={`w-16 h-16 rounded-full border-2 bg-black/50 flex items-center justify-center overflow-hidden transition-all duration-300 ${isSpeaking ? 'border-yellow-300' : 'border-purple-800'}`}
             style={{boxShadow: isSpeaking ? `0 0 15px #facc15` : `0 0 10px ${char.color}55`}}
        >
            {char.avatarUrl ? (
                <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-contain" />
            ) : (
                <span className="text-3xl">{char.avatar}</span>
            )}
        </div>
        <span className="text-xs font-semibold" style={{color: char.color}}>{char.name}</span>
    </div>
);


const FinaleTribalCouncil: React.FC<FinaleTribalCouncilProps> = ({ season, characterMap }) => {
    const finalists = season.finalists.map(id => characterMap.get(id)).filter((c): c is Character => !!c);
    const jury = season.jury.map(id => characterMap.get(id)).filter((c): c is Character => !!c);
    const dialogue = season.currentDialogue;
    const speaker = dialogue ? characterMap.get(dialogue.speakerId) : null;
    
    let title = "Final Tribal Council";
    if (season.phase === 'finale_opening_statements') title = "Opening Statements";
    if (season.phase === 'jury_questions') title = "Jury Questions";
    if (season.phase === 'finale_closing_statements') title = "Closing Statements";


    return (
        <div className="flex-1 flex flex-col items-center justify-between p-4 bg-black/50 rounded-lg relative overflow-hidden tribal-council-bg">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
            
            <div className="z-10 w-full">
                <h3 className="text-2xl font-bold text-yellow-300 text-center" style={{textShadow: '0 0 10px #facc15'}}>{title}</h3>
                
                 <div className="my-4">
                    <h4 className="text-sm font-bold text-purple-300 text-center mb-2">THE JURY</h4>
                    <div className="flex justify-center flex-wrap gap-4">
                        {jury.map(char => <CharacterAvatar key={char.id} char={char} isSpeaking={speaker?.id === char.id} />)}
                    </div>
                </div>
            </div>

            <div className="z-10 w-full max-w-2xl min-h-[150px] bg-black/40 p-4 rounded-lg border border-purple-500/20 backdrop-blur-sm">
                {dialogue && speaker ? (
                    <div className="animate-[fadeIn_0.5s]">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {speaker.avatarUrl ? <img src={speaker.avatarUrl} alt={speaker.name}/> : <span className="text-xl">{speaker.avatar}</span>}
                            </div>
                            <span className="font-bold" style={{color: speaker.color}}>{speaker.name}</span>
                            <span className="text-xs uppercase px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">{dialogue.type}</span>
                        </div>
                        <p className="text-gray-300 italic">"{dialogue.line}"</p>
                    </div>
                ) : (
                     <div className="flex items-center justify-center h-full text-gray-500">
                        Waiting for the next speaker...
                    </div>
                )}
            </div>

            <div className="z-10 w-full mt-4">
                <h4 className="text-sm font-bold text-purple-300 text-center mb-2">THE FINALISTS</h4>
                <div className="flex justify-center flex-wrap gap-8">
                    {finalists.map(char => <CharacterAvatar key={char.id} char={char} isSpeaking={speaker?.id === char.id} />)}
                </div>
            </div>

            <style>{`
                .tribal-council-bg {
                    background-image: url('https://deffy.me/astrilogue/imgs/landscapes/landscape_tribal.png');
                    background-size: cover;
                    background-position: center;
                }
            `}</style>
        </div>
    );
};

export default FinaleTribalCouncil;