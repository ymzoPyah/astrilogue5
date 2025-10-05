

import React, { useState, useMemo } from 'react';
import { Character, UserPreferences, View } from '../../types';
import { useAppContext } from '../../state/AppContext';
import DropdownMenu from '../ui/DropdownMenu';

const factions: Record<string, { name: string; color: string; auraColor: string; className: string; }> = {
    'arcane-core': { name: 'Arcane Core', color: '#d8b4fe', auraColor: 'rgba(216, 180, 254, 0.4)', className: 'arcane-aura' },
    'shadow-players': { name: 'Shadow Players', color: '#f87171', auraColor: 'rgba(248, 113, 113, 0.5)', className: 'shadow-aura' },
    'spire-mechanica': { name: 'Spire Mechanica', color: '#7dd3fc', auraColor: 'rgba(125, 211, 252, 0.4)', className: 'spire-aura' },
    'cultural-faces': { name: 'Cultural Faces', color: '#f472b6', auraColor: 'rgba(244, 114, 182, 0.6)', className: 'cultural-aura' },
    'corporate-titan': { name: 'Corporate Titan', color: '#fbbf24', auraColor: 'rgba(251, 191, 36, 0.4)', className: 'corporate-aura' },
    'catalyst': { name: 'The Catalyst', color: '#4ade80', auraColor: 'rgba(74, 222, 128, 0.6)', className: 'catalyst-aura' },
};

const FactionTitle: React.FC<{ faction: typeof factions[string] }> = ({ faction }) => (
    <h3 className="text-2xl font-bold text-center mb-4 tracking-wider" style={{ color: faction.color, textShadow: `0 0 15px ${faction.auraColor}` }}>
        {faction.name}
    </h3>
);

const Section: React.FC<{ title: string; children: React.ReactNode; icon?: string }> = ({ title, children, icon }) => (
    <div>
        <h3 className="text-2xl font-bold text-center mb-6 tracking-wider text-purple-300">
            {icon} {title}
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
            {children}
        </div>
    </div>
);

interface CharacterCardProps {
    character: Character;
    isSelected: boolean;
    onClick: () => void;
    factionAura: string;
    factionClassName: string;
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
    onEdit?: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
    character,
    isSelected,
    onClick,
    factionAura,
    factionClassName,
    isFavorite,
    onToggleFavorite,
    onEdit,
}) => {
    return (
        <div
            className={`relative p-2 bg-[#100c1c] border-2 rounded-xl text-center w-[120px] aspect-[3/4] transition-all duration-300 group ${isSelected ? 'border-purple-400 scale-105 shadow-lg shadow-purple-900/50' : 'border-white/10 hover:border-purple-400/50'}`}
            style={{ '--aura-color': factionAura } as React.CSSProperties}
        >
            <button
                className="absolute top-1 right-1 z-10 p-1 text-lg opacity-50 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(character.id); }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                {isFavorite ? '⭐' : '☆'}
            </button>
            {onEdit && (
                <button
                    className="absolute top-1 left-1 z-10 p-1 text-lg opacity-50 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    title="Edit character"
                >
                    🔧
                </button>
            )}
            <div onClick={onClick} className="cursor-pointer w-full h-full flex flex-col items-center justify-between">
                <div className={`text-5xl h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${factionClassName}`} style={{ filter: `drop-shadow(0 0 10px ${character.color})` }}>
                    {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-16 h-16 object-contain rounded-full" /> : character.avatar}
                </div>
                <div className="mt-1">
                    <div className="font-bold text-sm" style={{ color: character.color }}>{character.name}</div>
                    <div className="text-[10px] text-gray-400 h-8 flex items-center justify-center px-1">{character.title}</div>
                </div>
            </div>
        </div>
    );
};

const SetupScreen: React.FC = () => {
    // FIX: Removed View from destructuring as it's an enum and should be imported directly.
    const { allCharacters, startConversation: onStart, startLiveConversation: onStartLive, handleNavigateToWorkshop: onNavigateToWorkshop, userPreferences, toggleFavoriteCharacter: onToggleFavorite, setView } = useAppContext();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [factionFilter, setFactionFilter] = useState('all');
    
    const { favoriteCharacterIds, recentCharacterIds } = userPreferences;

    const filteredCharacters = useMemo(() => {
        return allCharacters.filter(char => {
            const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (factionFilter === 'all') {
                return true;
            }
            
            // When a specific faction is selected, hide custom characters.
            if (char.isCustom) {
                return false;
            }

            return char.faction === factionFilter;
        });
    }, [allCharacters, searchTerm, factionFilter]);


    const toggleCharacter = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(charId => charId !== id);
            }
            if (prev.length < 5) {
                return [...prev, id];
            }
            alert('Maximum 5 characters for group conversations. To select a new character, please deselect one first.');
            return prev;
        });
    };

    const favoriteCharacters = useMemo(() =>
        favoriteCharacterIds
            .map(id => filteredCharacters.find(c => c.id === id))
            .filter((c): c is Character => !!c),
        [favoriteCharacterIds, filteredCharacters]
    );
    
    const recentCharacters = useMemo(() =>
        recentCharacterIds
            .map(id => filteredCharacters.find(c => c.id === id))
            .filter((c): c is Character => !!c && !favoriteCharacterIds.includes(c.id)),
        [recentCharacterIds, filteredCharacters, favoriteCharacterIds]
    );
    
    const displayedIds = useMemo(() => new Set([...favoriteCharacterIds, ...recentCharacterIds]), [favoriteCharacterIds, recentCharacterIds]);

    const customCharactersForSection = useMemo(() =>
        filteredCharacters.filter(c => c.isCustom && !displayedIds.has(c.id)),
        [filteredCharacters, displayedIds]
    );

    const canonCharactersForFactions = useMemo(() =>
        filteredCharacters.filter(c => !c.isCustom && !displayedIds.has(c.id)),
        [filteredCharacters, displayedIds]
    );

    const createOrderedCharacterList = (ids: string[]) => {
        return ids.map(id => canonCharactersForFactions.find(c => c.id === id)).filter((c): c is Character => !!c);
    };

    const harmonicApexIds = ['kamra', 'vyridion', 'daliez'];
    const harmonicApexChars = useMemo(() => createOrderedCharacterList(harmonicApexIds), [canonCharactersForFactions]);
    
    const astralCoreIds = ['velasca', 'nirey', 'vikadge', 'kiox', 'ymzo', 'nippy', 'edara', 'nymira', 'shiznit'];
    const astralCoreChars = useMemo(() => createOrderedCharacterList(astralCoreIds), [canonCharactersForFactions]);

    const shadowPlayerIds = ['sinira', 'thajal', 'fyxius', 'elsa', 'exactor', 'lutz', 'shazariah', 'akamuy'];
    const shadowPlayerChars = useMemo(() => createOrderedCharacterList(shadowPlayerIds), [canonCharactersForFactions]);

    const spireMechanicaIds = ['lomize', 'paus', 'itz', 'pos', 'sup', 'fembot'];
    const spireMechanicaChars = useMemo(() => createOrderedCharacterList(spireMechanicaIds), [canonCharactersForFactions]);

    const culturalFaceIds = ['luna', 'nero'];
    const culturalFaceChars = useMemo(() => createOrderedCharacterList(culturalFaceIds), [canonCharactersForFactions]);

    const corporateTitanIds = ['vytal', 'diesel', 'brat', 'visquid', 'lucive'];
    const corporateTitanChars = useMemo(() => createOrderedCharacterList(corporateTitanIds), [canonCharactersForFactions]);
    
    const catalystIds = ['tyler', 'david'];
    const catalystChars = useMemo(() => createOrderedCharacterList(catalystIds), [canonCharactersForFactions]);

    return (
        <div className="max-w-7xl mx-auto pb-24">
             <div className="text-center mb-12">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                    Assemble Your Cast
                </h2>
                <p className="text-gray-400 mt-2">Select up to 5 for group chat, or one for a 1-on-1 text or live conversation.</p>
            </div>

            <div className="p-4 mb-8 bg-black/30 border border-purple-500/20 rounded-xl flex flex-wrap items-center justify-center gap-4">
                <input
                    type="search"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-filter"
                />
                <select value={factionFilter} onChange={(e) => setFactionFilter(e.target.value)} className="input-filter">
                    <option value="all">All Factions</option>
                    {Object.entries(factions).map(([id, { name }]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </select>
                <DropdownMenu trigger={<button className="btn-primary">✨ Create Character</button>}>
                    <button className="dropdown-item" onClick={() => onNavigateToWorkshop()}>🔧 Create from Scratch</button>
                    <button className="dropdown-item" onClick={() => setView(View.Genesis)}>🧬 Fuse with Genesis Engine</button>
                </DropdownMenu>
            </div>
            
            <div className="space-y-16">
                {favoriteCharacters.length > 0 && (
                    <Section title="Favorites" icon="⭐">
                        {favoriteCharacters.map(char => (
                            <CharacterCard 
                                key={char.id}
                                character={char} 
                                isSelected={selectedIds.includes(char.id)}
                                onClick={() => toggleCharacter(char.id)}
                                factionAura={factions[char.faction || 'catalyst']?.auraColor || factions['arcane-core'].auraColor}
                                factionClassName={factions[char.faction || 'catalyst']?.className || factions['arcane-core'].className}
                                isFavorite={true}
                                onToggleFavorite={onToggleFavorite}
                                onEdit={char.isCustom ? () => onNavigateToWorkshop(char.id) : undefined}
                            />
                        ))}
                    </Section>
                )}
                 {recentCharacters.length > 0 && (
                    <Section title="Recently Used" icon="🕒">
                        {recentCharacters.map(char => (
                             <CharacterCard 
                                key={char.id}
                                character={char} 
                                isSelected={selectedIds.includes(char.id)}
                                onClick={() => toggleCharacter(char.id)}
                                factionAura={factions[char.faction || 'catalyst']?.auraColor || factions['arcane-core'].auraColor}
                                factionClassName={factions[char.faction || 'catalyst']?.className || factions['arcane-core'].className}
                                isFavorite={false}
                                onToggleFavorite={onToggleFavorite}
                                onEdit={char.isCustom ? () => onNavigateToWorkshop(char.id) : undefined}
                            />
                        ))}
                    </Section>
                )}
                
                 {customCharactersForSection.length > 0 && (
                    <Section title="Custom Characters" icon="🔧">
                        {customCharactersForSection.map(char => (
                            <CharacterCard 
                                key={char.id}
                                character={char} 
                                isSelected={selectedIds.includes(char.id)}
                                onClick={() => toggleCharacter(char.id)}
                                factionAura={factions['catalyst']?.auraColor || factions['arcane-core'].auraColor}
                                factionClassName={factions['catalyst']?.className || factions['arcane-core'].className}
                                isFavorite={favoriteCharacterIds.includes(char.id)}
                                onToggleFavorite={onToggleFavorite}
                                onEdit={() => onNavigateToWorkshop(char.id)}
                            />
                        ))}
                    </Section>
                )}

                {(favoriteCharacters.length > 0 || recentCharacters.length > 0 || customCharactersForSection.length > 0) && (factionFilter === 'all' && searchTerm === '') && (
                    <div className="my-8 h-px bg-purple-500/20 w-1/2 mx-auto"></div>
                )}
                
                {harmonicApexChars.length > 0 && (
                    <div className="text-center">
                        <h3 className="text-3xl font-bold mb-8 tracking-wider" style={{ color: factions['arcane-core'].color, textShadow: `0 0 20px ${factions['arcane-core'].auraColor}` }}>
                            Harmonic Apex
                        </h3>
                        <div className="flex justify-center gap-4">
                            {harmonicApexChars.map(char => (
                                <CharacterCard 
                                    key={char.id}
                                    character={char} 
                                    isSelected={selectedIds.includes(char.id)}
                                    onClick={() => toggleCharacter(char.id)}
                                    factionAura={factions[char.faction || 'shadow-players'].auraColor}
                                    factionClassName={factions[char.faction || 'shadow-players'].className}
                                    isFavorite={favoriteCharacterIds.includes(char.id)}
                                    onToggleFavorite={onToggleFavorite}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {astralCoreChars.length > 0 && <div>
                    <h3 className="text-2xl font-bold text-center mb-4 tracking-wider" style={{ color: factions['arcane-core'].color, textShadow: `0 0 15px ${factions['arcane-core'].auraColor}` }}>
                        Astral Core
                    </h3>
                    <div className="w-full pb-4">
                        <div className="flex justify-center items-center gap-x-1 sm:gap-x-2 mt-8 h-56 px-4">
                            {astralCoreChars.map((char, index) => {
                                const arcLevel = 4 - Math.abs(4 - index);
                                return (
                                    <div key={char.id} className="transition-transform duration-500 ease-out flex-shrink-0" style={{ transform: `translateY(-${arcLevel * 20 + (index === 4 ? 10 : 0)}px) scale(${1 + arcLevel * 0.02})`, zIndex: arcLevel }}>
                                        <CharacterCard 
                                            character={char} 
                                            isSelected={selectedIds.includes(char.id)}
                                            onClick={() => toggleCharacter(char.id)}
                                            factionAura={factions['arcane-core'].auraColor}
                                            factionClassName={factions['arcane-core'].className}
                                            isFavorite={favoriteCharacterIds.includes(char.id)}
                                            onToggleFavorite={onToggleFavorite}
                                            onEdit={char.isCustom ? () => onNavigateToWorkshop(char.id) : undefined}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>}

                {(harmonicApexChars.length > 0 || astralCoreChars.length > 0) && <div className="my-8 h-px bg-purple-500/20 w-1/2 mx-auto"></div>}

                 {shadowPlayerChars.length > 0 && <Section title="Shadow Players" icon="♟️">
                    {shadowPlayerChars.map(char => (
                        <CharacterCard key={char.id} character={char} isSelected={selectedIds.includes(char.id)} onClick={() => toggleCharacter(char.id)} factionAura={factions['shadow-players'].auraColor} factionClassName={factions['shadow-players'].className} isFavorite={favoriteCharacterIds.includes(char.id)} onToggleFavorite={onToggleFavorite} onEdit={char.isCustom ? () => onNavigateToWorkshop(char.id) : undefined} />
                    ))}
                </Section>}
                {spireMechanicaChars.length > 0 && <Section title="Spire Mechanica" icon="⚙️">
                    {spireMechanicaChars.map(char => (
                        <CharacterCard key={char.id} character={char} isSelected={selectedIds.includes(char.id)} onClick={() => toggleCharacter(char.id)} factionAura={factions['spire-mechanica'].auraColor} factionClassName={factions['spire-mechanica'].className} isFavorite={favoriteCharacterIds.includes(char.id)} onToggleFavorite={onToggleFavorite} onEdit={char.isCustom ? () => onNavigateToWorkshop(char.id) : undefined} />
                    ))}
                </Section>}
                 {culturalFaceChars.length > 0 && <Section title="Cultural Faces" icon="🎤">
                    {culturalFaceChars.map(char => (
                        <CharacterCard key={char.id} character={char} isSelected={selectedIds.includes(char.id)} onClick={() => toggleCharacter(char.id)} factionAura={factions['cultural-faces'].auraColor} factionClassName={factions['cultural-faces'].className} isFavorite={favoriteCharacterIds.includes(char.id)} onToggleFavorite={onToggleFavorite} onEdit={char.isCustom ? () => onNavigateToWorkshop(char.id) : undefined} />
                    ))}
                </Section>}
                 {corporateTitanChars.length > 0 && <Section title="Corporate Titan" icon="🏢">
                    {corporateTitanChars.map(char => (
                        <CharacterCard key={char.id} character={char} isSelected={selectedIds.includes(char.id)} onClick={() => toggleCharacter(char.id)} factionAura={factions['corporate-titan'].auraColor} factionClassName={factions['corporate-titan'].className} isFavorite={favoriteCharacterIds.includes(char.id)} onToggleFavorite={onToggleFavorite} onEdit={char.isCustom ? () => onNavigateToWorkshop(char.id) : undefined} />
                    ))}
                </Section>}
                 {catalystChars.length > 0 && <Section title="The Catalyst" icon="🌀">
                    {catalystChars.map(char => (
                        <CharacterCard key={char.id} character={char} isSelected={selectedIds.includes(char.id)} onClick={() => toggleCharacter(char.id)} factionAura={factions['catalyst'].auraColor} factionClassName={factions['catalyst'].className} isFavorite={favoriteCharacterIds.includes(char.id)} onToggleFavorite={onToggleFavorite} onEdit={char.isCustom ? () => onNavigateToWorkshop(char.id) : undefined} />
                    ))}
                </Section>}
            </div>

            <div className={`fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-lg border-t border-purple-500/30 z-20 transition-transform duration-300 ${selectedIds.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <p className="font-bold text-white">{selectedIds.length} / 5 selected</p>
                        <div className="flex -space-x-2 mt-1">
                            {selectedIds.map(id => allCharacters.find(c => c.id === id)).filter(Boolean).map(char => (
                                <div key={char!.id} className="w-8 h-8 rounded-full bg-black/50 border-2 border-purple-800 flex items-center justify-center text-lg overflow-hidden" title={char!.name}>
                                    {char!.avatarUrl ? <img src={char!.avatarUrl} alt={char!.name} className="w-full h-full object-contain" /> : char!.avatar}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn-secondary" onClick={() => onStart(selectedIds)} disabled={selectedIds.length === 0}>
                            💬 Start Text Chat
                        </button>
                        <button className="btn-secondary" onClick={() => onStartLive(selectedIds)} disabled={selectedIds.length !== 1}>
                            🎙️ Start Live Chat (1-on-1)
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .input-filter { padding: 0.75rem 1.5rem; border-radius: 9999px; cursor: pointer; transition: all 0.3s; font-size: 1rem; font-weight: 600; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); color: white; -webkit-appearance: none; }
                .btn-primary, .btn-secondary {
                    padding: 0.5rem 1rem;
                    border-radius: 9999px;
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .btn-primary:hover:not(:disabled), .btn-secondary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    filter: brightness(1.2);
                }
                .btn-primary {
                    border: 1px solid #a855f7;
                    background: linear-gradient(145deg, #a855f7, #ec4899);
                    color: white;
                    box-shadow: 0 4px 15px -5px #a855f7, 0 2px 8px -6px #ec4899;
                }
                .btn-secondary {
                    border: 1px solid rgba(17, 219, 239, 0.4);
                    background: rgba(17, 219, 239, 0.1);
                    color: #11dbef;
                }
                .btn-secondary:hover:not(:disabled) {
                    border-color: #11dbef;
                    box-shadow: 0 0 15px -2px #11dbef;
                }
                .btn-secondary:disabled, .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .dropdown-item {
                    display: block;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    text-align: left;
                    font-size: 0.875rem;
                    color: #d1d5db;
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                .dropdown-item:hover:not(:disabled) {
                    background-color: rgba(17, 219, 239, 0.1);
                    color: #11dbef;
                }
            `}</style>
        </div>
    );
};

export default SetupScreen;