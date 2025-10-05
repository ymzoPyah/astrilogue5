import React, { useState, useMemo } from 'react';
import { Character, CharacterRelationship } from '../../types';
import { useAppContext } from '../../state/AppContext';
import { CHARACTER_RELATIONSHIPS } from '../../constants/relationships';

const RELATIONSHIP_COLORS: Record<string, string> = {
    ally: '#4ade80', // green
    rival: '#f87171', // red
    complex: '#a855f7', // purple
    family: '#38bdf8', // light blue
    mentor: '#facc15', // yellow
    love: '#f472b6', // pink
    creator: '#fb923c', // orange
    control: '#9ca3af', // gray
    antagonist: '#4b0000', // dark red
};

const CharacterNode: React.FC<{
    character: Character;
    position: { x: number; y: number };
    isSelected: boolean;
    isHovered: boolean;
    isDimmed: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}> = ({ character, position, isSelected, isHovered, isDimmed, onClick, onMouseEnter, onMouseLeave }) => {
    const size = isHovered || isSelected ? 80 : 70;
    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-300"
            style={{ 
                left: `${position.x}%`, 
                top: `${position.y}%`,
                opacity: isDimmed ? 0.2 : 1,
                transform: `translate(-50%, -50%) scale(${isHovered || isSelected ? 1.1 : 1})`,
            }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#100c1c] flex items-center justify-center text-4xl sm:text-5xl border-4 transition-all duration-300 overflow-hidden"
                style={{
                    borderColor: isSelected || isHovered ? character.color : '#4a044e',
                    boxShadow: isSelected || isHovered ? `0 0 20px ${character.color}` : '0 0 10px #000',
                    width: size,
                    height: size,
                }}
            >
                {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" /> : character.avatar}
            </div>
            <span className="mt-2 text-center text-sm font-bold text-white whitespace-nowrap" style={{ textShadow: '0 0 5px black' }}>
                {character.name}
            </span>
        </div>
    );
};

const RelationshipLine: React.FC<{
    pos1: { x: number; y: number };
    pos2: { x: number; y: number };
    type: string;
    isDimmed: boolean;
}> = ({ pos1, pos2, type, isDimmed }) => {
    const color = RELATIONSHIP_COLORS[type] || '#6b7280';
    return (
        <line
            x1={`${pos1.x}%`}
            y1={`${pos1.y}%`}
            x2={`${pos2.x}%`}
            y2={`${pos2.y}%`}
            stroke={color}
            strokeWidth="3"
            strokeDasharray={type === 'complex' ? '8 4' : 'none'}
            className="transition-opacity duration-300"
            style={{ opacity: isDimmed ? 0.05 : 0.6 }}
        />
    );
};

const RelationshipVisualizerScreen: React.FC = () => {
    const { allCharacters } = useAppContext();
    const relationships = CHARACTER_RELATIONSHIPS;
    
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const characterMap: Map<string, Character> = useMemo(() => new Map(allCharacters.map(c => [c.id, c])), [allCharacters]);
    
    // Filter out relationships for characters that don't exist in the map
    const validRelationships = useMemo(() => relationships.filter(
        r => characterMap.has(r.from) && characterMap.has(r.to)
    ), [relationships, characterMap]);
    
    // Include only characters that have relationships
    const charactersWithRelations = useMemo(() => {
        const involvedIds = new Set(validRelationships.flatMap(r => [r.from, r.to]));
        return allCharacters.filter(c => involvedIds.has(c.id));
    }, [allCharacters, validRelationships]);

    const positions = useMemo(() => {
        const posMap = new Map<string, { x: number; y: number }>();
        const numChars = charactersWithRelations.length;
        const radius = 40; // Percentage of the container
        const center = { x: 50, y: 50 };

        charactersWithRelations.forEach((char, i) => {
            const angle = (i / numChars) * 2 * Math.PI;
            const x = center.x + radius * Math.cos(angle);
            const y = center.y + radius * Math.sin(angle);
            posMap.set(char.id, { x, y });
        });
        return posMap;
    }, [charactersWithRelations]);

    const activeId = hoveredId || selectedId;
    const relatedIds = useMemo(() => {
        if (!activeId) return new Set();
        const connected = new Set([activeId]);
        validRelationships.forEach(r => {
            if (r.from === activeId) connected.add(r.to);
            if (r.to === activeId) connected.add(r.from);
        });
        return connected;
    }, [activeId, validRelationships]);

    const selectedCharacterDetails = useMemo(() => {
        if (!selectedId) return null;
        const character = characterMap.get(selectedId);
        const characterRelations = validRelationships.filter(r => r.from === selectedId || r.to === selectedId);
        return { character, relations: characterRelations };
    }, [selectedId, validRelationships, characterMap]);

    return (
        <div className="w-full h-[calc(100vh-10rem)] flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
             <div className="text-center mb-4 md:mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                    Character Lore Web
                </h2>
                <p className="text-gray-400 mt-2">Hover to explore connections. Click a character for details.</p>
            </div>
            <div className="w-full flex-1 flex flex-col md:flex-row items-center overflow-hidden">
                <div className="w-full h-[60%] md:h-full md:w-2/3 relative">
                    <svg className="absolute inset-0 w-full h-full">
                        {validRelationships.map((rel, i) => {
                            const pos1 = positions.get(rel.from);
                            const pos2 = positions.get(rel.to);
                            if (!pos1 || !pos2) return null;
                            const isDimmed = activeId ? !relatedIds.has(rel.from) || !relatedIds.has(rel.to) : false;
                            return <RelationshipLine key={i} pos1={pos1} pos2={pos2} type={rel.type} isDimmed={isDimmed} />;
                        })}
                    </svg>
                    {charactersWithRelations.map(char => {
                        const pos = positions.get(char.id);
                        if (!pos) return null;
                        return (
                            <CharacterNode
                                key={char.id}
                                character={char}
                                position={pos}
                                isSelected={selectedId === char.id}
                                isHovered={hoveredId === char.id}
                                isDimmed={activeId ? !relatedIds.has(char.id) : false}
                                onClick={() => setSelectedId(current => current === char.id ? null : char.id)}
                                onMouseEnter={() => setHoveredId(char.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            />
                        );
                    })}
                </div>
                <div className="w-full h-[40%] md:h-full md:w-1/3 p-4 overflow-y-auto">
                    {selectedCharacterDetails ? (
                         <div className="bg-black/30 p-4 sm:p-6 rounded-2xl border border-purple-500/30 animate-[slideIn_0.3s_ease-out]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-5xl sm:text-6xl w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center">
                                    {selectedCharacterDetails.character?.avatarUrl ? <img src={selectedCharacterDetails.character.avatarUrl} alt={selectedCharacterDetails.character.name} className="w-full h-full object-contain" /> : selectedCharacterDetails.character?.avatar}
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold" style={{color: selectedCharacterDetails.character?.color}}>{selectedCharacterDetails.character?.name}</h3>
                                    <p className="text-gray-400 text-sm sm:text-base">{selectedCharacterDetails.character?.title}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {selectedCharacterDetails.relations.map((rel, i) => {
                                    const otherCharId = rel.from === selectedId ? rel.to : rel.from;
                                    const otherChar = characterMap.get(otherCharId);
                                    if (!otherChar) return null;
                                    return (
                                        <div key={i} className="border-l-4 p-3" style={{borderColor: RELATIONSHIP_COLORS[rel.type]}}>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                 <span className="text-2xl w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                                                    {otherChar.avatarUrl ? <img src={otherChar.avatarUrl} alt={otherChar.name} className="w-full h-full object-contain" /> : otherChar.avatar}
                                                 </span>
                                                <strong className="text-lg" style={{color: otherChar.color}}>{otherChar.name}</strong>
                                                <span className="text-xs uppercase font-bold px-2 py-1 rounded-full" style={{backgroundColor: `${RELATIONSHIP_COLORS[rel.type]}22`, color: RELATIONSHIP_COLORS[rel.type]}}>{rel.type}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 mt-1">{rel.description}</p>
                                        </div>
                                    )
                                })}
                            </div>
                         </div>
                    ) : (
                         <div className="text-center text-gray-500 p-8 h-full flex flex-col items-center justify-center">
                            <div className="text-5xl mb-4">🕸️</div>
                            Select a character to view their relationship details.
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RelationshipVisualizerScreen;