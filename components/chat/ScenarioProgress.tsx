import React from 'react';
import { EnhancedScenario } from '../../types';

interface ScenarioProgressProps {
    scenario: EnhancedScenario;
    completedObjectives: string[];
    onObjectiveToggle: (objective: string) => void;
}

const ScenarioProgress: React.FC<ScenarioProgressProps> = ({ scenario, completedObjectives, onObjectiveToggle }) => {
    const glowColor = '#A27BFF'; // Default cosmic accent
    const firstUncompletedIndex = scenario.objectives.findIndex(obj => !completedObjectives.includes(obj));

    const totalPhases = scenario.phases.length;
    const objectivesPerPhase = Math.ceil(scenario.objectives.length / totalPhases);
    const completedCount = completedObjectives.length;
    const currentPhaseIndex = Math.min(Math.floor(completedCount / objectivesPerPhase), totalPhases - 1);
    const currentPhaseName = scenario.phases[currentPhaseIndex];


    return (
        <div 
            className="mb-4 p-4 bg-black/40 rounded-xl border border-purple-500/30 text-xs animate-[fadeIn_0.3s]"
            style={{ boxShadow: `0 0 24px ${glowColor}25`}}
        >
            <div className="flex justify-between items-start">
                 <div>
                    <h4 className="font-bold text-purple-300 mb-2 flex items-center gap-2 text-base">
                        <span className="text-xl">{scenario.icon}</span>
                        <span>{scenario.title}</span>
                    </h4>
                </div>
                {totalPhases > 0 && (
                    <div className="text-right flex-shrink-0 pl-4">
                        <div className="font-semibold text-gray-400 uppercase tracking-wider">Phase {currentPhaseIndex + 1} / {totalPhases}</div>
                        <div className="text-purple-300 font-bold">{currentPhaseName}</div>
                    </div>
                )}
            </div>
            <div>
                <p className="font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Objectives:</p>
                <ul className="space-y-1.5 text-gray-300">
                    {scenario.objectives.map((obj, i) => {
                        const isCompleted = completedObjectives.includes(obj);
                        const isCurrent = i === firstUncompletedIndex;
                        return (
                        <li key={i} className={`flex items-start gap-3 transition-all duration-300 ${isCompleted ? 'opacity-50' : ''} ${isCurrent ? 'font-bold' : ''}`}
                            style={isCurrent ? { textShadow: `0 0 8px ${glowColor}` } : {}}>
                           <input 
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => onObjectiveToggle(obj)}
                                className="mt-1 w-4 h-4 bg-transparent border-purple-400/50 rounded text-purple-500 focus:ring-purple-500/50 cursor-pointer"
                           />
                           <span className={isCompleted ? 'line-through' : ''}>{obj}</span>
                        </li>
                    )})}
                </ul>
            </div>
        </div>
    );
};

export default ScenarioProgress;