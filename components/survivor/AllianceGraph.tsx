import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SurvivorSeason, Character, CharacterID } from '../../types';

// Data structures for the simulation
interface Node {
  id: CharacterID;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
  character: Character;
  isEliminated: boolean;
  hasImmunity: boolean;
}

interface Link {
  source: CharacterID;
  target: CharacterID;
  type: 'alliance' | 'rivalry';
}

// Component Props
interface AllianceGraphProps {
    season: SurvivorSeason;
    characterMap: Map<string, Character>;
    onSelectChar: (id: CharacterID | null) => void;
}

// Main Component
const AllianceGraph: React.FC<AllianceGraphProps> = ({ season, characterMap, onSelectChar }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const nodesRef = useRef<Record<CharacterID, Node>>({});
    const linksRef = useRef<Link[]>([]);
    const simulationRef = useRef<number | null>(null);

    const [hoveredNodeId, setHoveredNodeId] = useState<CharacterID | null>(null);
    const [draggedNode, setDraggedNode] = useState<{ id: CharacterID; offsetX: number; offsetY: number } | null>(null);
     const [_, forceUpdate] = useState(false);

    // Initialize nodes and links based on season data
    useEffect(() => {
        const width = svgRef.current?.clientWidth || 500;
        const height = svgRef.current?.clientHeight || 500;
        
        const activeChars = season.cast.filter(id => !season.dossiers[id].eliminatedRound);
        const eliminatedChars = season.cast.filter(id => !!season.dossiers[id].eliminatedRound);
        const characterIds = [...activeChars, ...eliminatedChars];
        
        const newNodes: Record<CharacterID, Node> = {};
        characterIds.forEach(id => {
            const existingNode = nodesRef.current[id];
            newNodes[id] = {
                id: id,
                x: existingNode?.x || width / 2 + (Math.random() - 0.5) * 200,
                y: existingNode?.y || height / 2 + (Math.random() - 0.5) * 200,
                vx: existingNode?.vx || 0,
                vy: existingNode?.vy || 0,
                fx: 0,
                fy: 0,
                character: characterMap.get(id)!,
                isEliminated: !!season.dossiers[id].eliminatedRound,
                hasImmunity: !!season.dossiers[id].rounds[season.round]?.state.immunity,
            };
        });
        nodesRef.current = newNodes;

        const newLinks: Link[] = [];
        season.alliances.forEach(alliance => {
            for (let i = 0; i < alliance.members.length; i++) {
                for (let j = i + 1; j < alliance.members.length; j++) {
                    newLinks.push({ source: alliance.members[i], target: alliance.members[j], type: 'alliance' });
                }
            }
        });

        season.cast.forEach(id => {
            const dossier = season.dossiers[id];
            if(dossier.rivalries) {
                dossier.rivalries.forEach(rivalId => {
                    if (id < rivalId && characterMap.has(rivalId)) {
                        newLinks.push({ source: id, target: rivalId, type: 'rivalry' });
                    }
                });
            }
        });
        linksRef.current = newLinks;
        forceUpdate(p => !p);
    }, [season, characterMap]);

    // Force simulation logic
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        let width = svg.clientWidth;
        let height = svg.clientHeight;
        if(width === 0 || height === 0) {
            const rect = svg.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
        }

        const centerX = width / 2;
        const centerY = height / 2;
        
        const nodes = Object.values(nodesRef.current);
        const links = linksRef.current;

        const tick = () => {
            nodes.forEach(node => { node.fx = 0; node.fy = 0; });

            const ALLIANCE_STRENGTH = 0.05;
            const ALLIANCE_DISTANCE = 120;
            links.forEach(link => {
                if (link.type === 'alliance') {
                    const source = nodesRef.current[link.source];
                    const target = nodesRef.current[link.target];
                    if (!source || !target) return;
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - ALLIANCE_DISTANCE) * ALLIANCE_STRENGTH;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    source.fx += fx;
                    source.fy += fy;
                    target.fx -= fx;
                    target.fy -= fy;
                }
            });

            const REPULSION_STRENGTH = -600;
            const RIVALRY_REPULSION_STRENGTH = -1800;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeA = nodes[i];
                    const nodeB = nodes[j];
                    const dx = nodeB.x - nodeA.x;
                    const dy = nodeB.y - nodeA.y;
                    let distSq = dx * dx + dy * dy;
                    if (distSq < 100) distSq = 100;

                    const isRival = links.some(l => l.type === 'rivalry' && ((l.source === nodeA.id && l.target === nodeB.id) || (l.source === nodeB.id && l.target === nodeA.id)));
                    const strength = isRival ? RIVALRY_REPULSION_STRENGTH : REPULSION_STRENGTH;
                    
                    const force = strength / distSq;
                    const fx = dx * force;
                    const fy = dy * force;
                    
                    nodeA.fx += fx;
                    nodeA.fy += fy;
                    nodeB.fx -= fx;
                    nodeB.fy -= fy;
                }
            }
            
            const CENTERING_STRENGTH = 0.01;
            nodes.forEach(node => {
                node.fx += (centerX - node.x) * CENTERING_STRENGTH;
                node.fy += (centerY - node.y) * CENTERING_STRENGTH;
            });

            const DAMPING = 0.9;
            nodes.forEach(node => {
                if (draggedNode && node.id === draggedNode.id) {
                    node.vx = 0;
                    node.vy = 0;
                    return;
                }
                node.vx = (node.vx + node.fx) * DAMPING;
                node.vy = (node.vy + node.fy) * DAMPING;
                node.x += node.vx;
                node.y += node.vy;

                node.x = Math.max(25, Math.min(width - 25, node.x));
                node.y = Math.max(25, Math.min(height - 25, node.y));
            });
            
            forceUpdate(p => !p); 
            simulationRef.current = requestAnimationFrame(tick);
        };
        
        simulationRef.current = requestAnimationFrame(tick);

        return () => {
            if (simulationRef.current) cancelAnimationFrame(simulationRef.current);
        };
    }, [draggedNode, season.round]);

    const getSVGPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const pt = svg.createSVGPoint();
        if ('touches' in e) {
            pt.x = e.touches[0].clientX;
            pt.y = e.touches[0].clientY;
        } else {
            pt.x = e.clientX;
            pt.y = e.clientY;
        }
        const ctm = svg.getScreenCTM();
        return ctm ? pt.matrixTransform(ctm.inverse()) : pt;
    }, []);

    const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, nodeId: CharacterID) => {
        e.preventDefault();
        const point = getSVGPoint(e);
        const node = nodesRef.current[nodeId];
        setDraggedNode({ id: nodeId, offsetX: node.x - point.x, offsetY: node.y - point.y });
    }, [getSVGPoint]);

    const onDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!draggedNode) return;
        e.preventDefault();
        const point = getSVGPoint(e);
        const node = nodesRef.current[draggedNode.id];
        node.x = point.x + draggedNode.offsetX;
        node.y = point.y + draggedNode.offsetY;
        forceUpdate(p => !p);
    }, [draggedNode, getSVGPoint]);

    const onDragEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setDraggedNode(null);
    }, []);

    const connectedIds = useMemo(() => {
        if (!hoveredNodeId) return null;
        const connected = new Set([hoveredNodeId]);
        linksRef.current.forEach(link => {
            if (link.source === hoveredNodeId) connected.add(link.target);
            if (link.target === hoveredNodeId) connected.add(link.source);
        });
        return connected;
    }, [hoveredNodeId]);

    const allNodes = Object.values(nodesRef.current);
    const allLinks = linksRef.current;

    return (
        <div className="flex-1 w-full h-full bg-black/20 rounded-lg relative overflow-hidden">
            <svg 
                ref={svgRef} 
                className="w-full h-full"
                onMouseMove={onDrag}
                onMouseUp={onDragEnd}
                onMouseLeave={onDragEnd}
                onTouchMove={onDrag}
                onTouchEnd={onDragEnd}
                onTouchCancel={onDragEnd}
            >
                <g>
                    {allLinks.map((link, i) => {
                        const source = nodesRef.current[link.source];
                        const target = nodesRef.current[link.target];
                        if (!source || !target) return null;

                        const isDimmed = hoveredNodeId && (!connectedIds.has(source.id) || !connectedIds.has(target.id));

                        return (
                            <line
                                key={i}
                                x1={source.x} y1={source.y}
                                x2={target.x} y2={target.y}
                                stroke={link.type === 'rivalry' ? '#f87171' : '#a855f7'}
                                strokeWidth={link.type === 'alliance' ? 2.5 : 1.5}
                                strokeDasharray={link.type === 'rivalry' ? '4 2' : 'none'}
                                opacity={isDimmed ? 0.1 : 0.4}
                                className="transition-opacity duration-300"
                            />
                        );
                    })}
                </g>

                <g>
                    {allNodes.map(node => {
                        const isDimmed = hoveredNodeId && !connectedIds.has(node.id);
                        const isHovered = hoveredNodeId === node.id;
                        
                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                className="cursor-pointer"
                                onClick={() => onSelectChar(node.id)}
                                onMouseEnter={() => setHoveredNodeId(node.id)}
                                onMouseLeave={() => setHoveredNodeId(null)}
                                onMouseDown={(e) => onDragStart(e, node.id)}
                                onTouchStart={(e) => onDragStart(e, node.id)}
                            >
                                <defs>
                                    <clipPath id={`clip-${node.id}`}>
                                        <circle r="20" />
                                    </clipPath>
                                </defs>
                                
                                <circle
                                    r="22"
                                    fill={node.character.color}
                                    stroke={node.hasImmunity ? '#facc15' : 'none'}
                                    strokeWidth={node.hasImmunity ? 3 : 0}
                                    opacity={isDimmed ? 0.3 : 1}
                                    style={{ filter: isHovered ? `drop-shadow(0 0 8px ${node.character.color})` : 'none' }}
                                    className="transition-all duration-300"
                                />

                                {node.character.avatarUrl ? (
                                    <image href={node.character.avatarUrl} x="-20" y="-20" width="40" height="40" clipPath={`url(#clip-${node.id})`} opacity={node.isEliminated ? 0.4 : 1} />
                                ) : (
                                    <text textAnchor="middle" dy=".3em" fontSize="24" opacity={node.isEliminated ? 0.4 : 1}>{node.character.avatar}</text>
                                )}

                                {node.isEliminated && <line x1="-15" y1="-15" x2="15" y2="15" stroke="#ef4444" strokeWidth="3" opacity="0.8" />}

                                <text
                                    y="32"
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill={isHovered ? node.character.color : "#fff"}
                                    paintOrder="stroke"
                                    stroke="#000"
                                    strokeWidth="2px"
                                    strokeLinejoin="round"
                                    className="font-semibold transition-colors"
                                >
                                    {node.character.name}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
            <div className="absolute top-2 left-2 text-xs text-gray-500 bg-black/30 p-2 rounded pointer-events-none">
                Drag characters to rearrange the graph.
            </div>
        </div>
    );
};

export default AllianceGraph;
