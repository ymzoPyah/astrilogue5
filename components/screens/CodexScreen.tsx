import React, { useState, useMemo, useEffect } from 'react';
import { Character, CharacterRelationship } from '../../types';
import { useAppContext } from '../../state/AppContext';
import { CHARACTER_RELATIONSHIPS } from '../../constants/relationships';

interface CodexScreenProps {
}

const factions: Record<string, { name: string; color: string; auraColor: string; className: string; }> = {
    'arcane-core': { name: 'Arcane Core', color: '#d8b4fe', auraColor: 'rgba(216, 180, 254, 0.4)', className: 'arcane-aura' },
    'shadow-players': { name: 'Shadow Players', color: '#f87171', auraColor: 'rgba(248, 113, 113, 0.5)', className: 'shadow-aura' },
    'spire-mechanica': { name: 'Spire Mechanica', color: '#7dd3fc', auraColor: 'rgba(125, 211, 252, 0.4)', className: 'spire-aura' },
    'cultural-faces': { name: 'Cultural Faces', color: '#f472b6', auraColor: 'rgba(244, 114, 182, 0.6)', className: 'cultural-aura' },
    'corporate-titan': { name: 'Corporate Titan', color: '#fbbf24', auraColor: 'rgba(251, 191, 36, 0.4)', className: 'corporate-aura' },
    'catalyst': { name: 'The Catalyst', color: '#4ade80', auraColor: 'rgba(74, 222, 128, 0.6)', className: 'catalyst-aura' },
};


const CodexScreen: React.FC<CodexScreenProps> = () => {
    const { allCharacters } = useAppContext();
    const relationships = CHARACTER_RELATIONSHIPS;
    const [modalChar, setModalChar] = useState<Character | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCharacters = useMemo(() => {
        return allCharacters.filter(char => 
            char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allCharacters, searchTerm]);

    const harmonicApexIds = ['kamra', 'vyridion', 'daliez'];
    const astralCoreIds = ['velasca', 'nirey', 'vikadge', 'kiox', 'ymzo', 'nippy', 'edara', 'nymira', 'shiznit'];
    const shadowPlayerIds = ['sinira', 'thajal', 'fyxius', 'elsa', 'exactor', 'lutz', 'shazariah', 'akamuy'];
    const spireMechanicaIds = ['lomize', 'paus', 'itz', 'pos', 'sup', 'fembot'];
    const culturalFaceIds = ['luna', 'nero'];
    const corporateTitanIds = ['vytal', 'diesel', 'brat', 'visquid', 'lucive'];
    const catalystIds = ['tyler', 'david'];

    const sectionConfig = [
        { id: 'harmonic-apex', title: 'Harmonic Apex', ids: harmonicApexIds, styleKey: 'arcane-core' },
        { id: 'astral-core', title: 'Astral Core', ids: astralCoreIds, styleKey: 'arcane-core' },
        { id: 'shadow-players', title: 'Shadow Players', ids: shadowPlayerIds, styleKey: 'shadow-players' },
        { id: 'spire-mechanica', title: 'Spire Mechanica', ids: spireMechanicaIds, styleKey: 'spire-mechanica' },
        { id: 'cultural-faces', title: 'Cultural Faces', ids: culturalFaceIds, styleKey: 'cultural-faces' },
        { id: 'corporate-titan', title: 'Corporate Titan', ids: corporateTitanIds, styleKey: 'corporate-titan' },
        { id: 'catalyst', title: 'The Catalyst', ids: catalystIds, styleKey: 'catalyst' },
    ];

    const getCharactersForSection = (ids: string[]) => {
        return ids
            .map(id => filteredCharacters.find(c => c.id === id))
            .filter((c): c is Character => !!c);
    };

    const customCharacters = useMemo(() => {
        return filteredCharacters.filter(c => c.isCustom);
    }, [filteredCharacters]);
    
    const totalCharsToShow = useMemo(() => 
        sectionConfig.reduce((acc, s) => acc + getCharactersForSection(s.ids).length, 0) + customCharacters.length,
    [filteredCharacters, customCharacters]);

    useEffect(() => {
        if (modalChar) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [modalChar]);

    return (
        <div className="max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                    Character Codex
                </h2>
                <p className="text-gray-400 mt-2">Explore the full cast of the Astrilogue universe.</p>
            </div>

             <div className="p-4 mb-8 bg-black/30 border border-purple-500/20 rounded-xl flex flex-wrap items-center justify-center gap-4">
                <input
                    type="search"
                    placeholder="Search by name or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition"
                />
            </div>

            <div className="space-y-16">
                {sectionConfig.map(section => {
                    const characters = getCharactersForSection(section.ids);
                    if (characters.length === 0) return null;

                    const factionData = factions[section.styleKey];
                    return (
                        <section key={section.id} className="relative p-4 rounded-xl">
                            <h3 className="text-3xl font-bold text-center mb-8 tracking-wider" style={{ color: factionData.color, textShadow: `0 0 20px ${factionData.auraColor}` }}>
                                {section.title}
                            </h3>
                            <div className="flex flex-wrap justify-center gap-6">
                                {characters.map(char => (
                                    <CharacterCard 
                                        key={char.id}
                                        character={char}
                                        onClick={() => setModalChar(char)}
                                        factionAura={factionData.auraColor}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}

                {customCharacters.length > 0 && (
                     <section key="custom-characters" className="relative p-4 rounded-xl">
                        <h3 className="text-3xl font-bold text-center mb-8 tracking-wider" style={{ color: factions['catalyst'].color, textShadow: `0 0 20px ${factions['catalyst'].auraColor}` }}>
                            Your Creations
                        </h3>
                        <div className="flex flex-wrap justify-center gap-6">
                            {customCharacters.map(char => (
                                <CharacterCard 
                                    key={char.id}
                                    character={char}
                                    onClick={() => setModalChar(char)}
                                    factionAura={factions['catalyst'].auraColor}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {totalCharsToShow === 0 && (
                    <div className="text-center text-gray-500 py-16">
                        <p className="text-5xl mb-4">🧐</p>
                        <p>No characters match your search.</p>
                    </div>
                )}
            </div>

            {modalChar && <CodexDetailModal character={modalChar} relationships={relationships} allCharacters={allCharacters} onClose={() => setModalChar(null)} />}
        </div>
    );
};

const CharacterCard: React.FC<{ character: Character; onClick: () => void; factionAura: string; }> = ({ character, onClick, factionAura }) => {
    return (
        <button 
            className="p-4 bg-[#100c1c] border-2 border-white/10 rounded-2xl text-center relative overflow-hidden h-full flex flex-col justify-between w-[150px] aspect-[3/4] transition-all duration-300 ease-in-out hover:border-purple-400/80 hover:scale-105"
            style={{ '--aura-color': factionAura, boxShadow: `0 0 20px -5px ${factionAura}` } as React.CSSProperties}
            onClick={onClick}
        >
            <div className="flex-grow flex items-center justify-center pt-4 overflow-hidden">
                <div className="text-6xl w-full h-full flex items-center justify-center" style={{ filter: `drop-shadow(0 0 10px ${character.color})` }}>
                    {character.avatarUrl ? (
                        <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" />
                    ) : (
                        character.avatar
                    )}
                </div>
            </div>
            <div className="mt-2">
                 <div className="font-bold text-base" style={{ color: character.color }}>{character.name}</div>
                <div className="text-xs text-gray-400 h-8 flex items-center justify-center">{character.title}</div>
            </div>
        </button>
    );
}

const parseMarkdown = (text: string): string => {
    const blocks = text.split(/\n\s*\n/);
    const htmlBlocks = blocks.map(block => {
        const trimmedBlock = block.trim();
        if (trimmedBlock.startsWith('## ')) return `<h4 class="text-lg font-bold text-purple-300 mt-4 mb-2">${trimmedBlock.substring(3).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</h4>`;
        if (trimmedBlock.startsWith('# ')) return `<h3 class="text-xl font-bold text-cyan-300 mt-6 mb-3">${trimmedBlock.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</h3>`;
        if (trimmedBlock.startsWith('**') && trimmedBlock.endsWith('**') && !trimmedBlock.includes('\n')) return `<h4 class="text-lg font-bold text-purple-300 mt-4 mb-2">${trimmedBlock.substring(2, trimmedBlock.length - 2)}</h4>`;
        if (trimmedBlock.startsWith('---')) return '<hr class="border-purple-500/20 my-4" />';
        if (trimmedBlock.startsWith('- ')) {
            const items = block.split('\n').map(item => `<li class="list-disc ml-5">${item.trim().substring(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('');
            return `<ul class="space-y-1">${items}</ul>`;
        }
        return `<p>${block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')}</p>`;
    });
    return htmlBlocks.join('');
};

const CodexDetailModal: React.FC<{ character: Character; relationships: CharacterRelationship[]; allCharacters: Character[]; onClose: () => void; }> = ({ character, relationships, allCharacters, onClose }) => {
    const characterMap = useMemo(() => new Map(allCharacters.map(c => [c.id, c])), [allCharacters]);
    const charRelationships = useMemo(() => relationships.filter(r => r.from === character.id || r.to === character.id), [character, relationships]);
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="codex-modal-title">
            <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-6 sm:p-8 max-w-4xl w-[95%] h-[90vh] flex flex-col shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-start">
                    <div className="flex items-start gap-6 mb-6">
                        <div className="text-7xl w-24 h-24 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ filter: `drop-shadow(0 0 15px ${character.color})` }}>
                            {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" /> : character.avatar}
                        </div>
                        <div className="flex-1">
                            <h3 id="codex-modal-title" className="text-3xl font-bold" style={{ color: character.color }}>{character.name}</h3>
                            <p className="text-gray-400 italic">{character.title}</p>
                            {character.faction && (
                                <div className="mt-2 text-sm">
                                    <span className="font-bold text-cyan-300">FACTION:</span>
                                    <span className="ml-2 text-gray-300">{character.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-3xl text-gray-400 hover:text-white" aria-label="Close modal">&times;</button>
                </div>
                
                <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-y-auto pr-4">
                     <div>
                        <h4 className="text-lg font-bold text-purple-300 mb-2 border-b border-purple-500/20 pb-1">Bio & Personality</h4>
                        <div className="text-sm text-gray-300 bg-black/30 p-4 rounded-lg space-y-4 codex-prose" dangerouslySetInnerHTML={{ __html: parseMarkdown(character.systemPrompt) }} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-purple-300 mb-2 border-b border-purple-500/20 pb-1">Known Relationships</h4>
                        {charRelationships.length > 0 ? (
                            <div className="space-y-3">
                                {charRelationships.map(rel => {
                                    const otherCharId = rel.from === character.id ? rel.to : rel.from;
                                    const otherChar = characterMap.get(otherCharId);
                                    if (!otherChar) return null;
                                    return (
                                        <div key={`${rel.from}-${rel.to}`} className="bg-black/30 p-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                                    {otherChar.avatarUrl ? <img src={otherChar.avatarUrl} alt={otherChar.name} className="w-full h-full object-contain" /> : otherChar.avatar}
                                                </span>
                                                <strong style={{ color: otherChar.color }}>{otherChar.name}</strong>
                                                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `#ffffff22` }}>{rel.type}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 pl-9">{rel.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic p-4">No direct relationships documented.</p>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                .codex-prose p { line-height: 1.6; }
                .codex-prose strong { color: #e5e7eb; }
                .codex-prose li { margin-bottom: 0.25rem; }
            `}</style>
        </div>
    );
}

export default CodexScreen;