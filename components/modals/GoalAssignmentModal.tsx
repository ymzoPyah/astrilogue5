import React, { useState, useMemo } from 'react';
import { Character, CharacterGoal } from '../../types';
import { useAppContext } from '../../state/AppContext';
import { GOALS } from '../../constants/goals';

interface GoalAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssignGoals: (goals: CharacterGoal[]) => void;
}

const GoalAssignmentModal: React.FC<GoalAssignmentModalProps> = ({ isOpen, onClose, onAssignGoals }) => {
    const { activeSession, allCharacters } = useAppContext();
    const allGoals = GOALS;

    const [selectedGoals, setSelectedGoals] = useState<Record<string, string>>(() => {
        const initialState: Record<string, string> = {};
        (activeSession?.goals || []).forEach(goal => {
            initialState[goal.characterId] = goal.id;
        });
        return initialState;
    });

    const characterMap = useMemo(() => new Map(allCharacters.map(c => [c.id, c])), [allCharacters]);
    
    const sessionCharacters = useMemo(() => 
        (activeSession?.characterIds || [])
            .map(id => characterMap.get(id))
            .filter((c): c is Character => !!c),
        [activeSession?.characterIds, characterMap]
    );

    if (!isOpen || !activeSession) return null;

    const handleGoalChange = (characterId: string, goalId: string) => {
        setSelectedGoals(prev => ({ ...prev, [characterId]: goalId }));
    };

    const handleSave = () => {
        const goalsToAssign = Object.entries(selectedGoals)
            .map(([charId, goalId]) => {
                if (goalId === 'none') return null; // Unassigned
                return allGoals.find(g => g.id === goalId && g.characterId === charId);
            })
            .filter((g): g is CharacterGoal => !!g);
        onAssignGoals(goalsToAssign);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" style={{ animationName: 'fadeIn' }} onClick={onClose}>
            <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" style={{ animationName: 'modalSlide' }} onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">🎯 Assign Secret Goals</h2>
                <p className="text-gray-400 mb-6">Give characters a hidden agenda to influence their behavior in the conversation.</p>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {sessionCharacters.map(char => {
                        const characterGoals = allGoals.filter(g => g.characterId === char.id);
                        if (characterGoals.length === 0) return null;

                        return (
                            <div key={char.id} className="grid grid-cols-3 items-center gap-4 bg-white/5 p-3 rounded-lg">
                                <div className="col-span-1 flex items-center gap-3">
                                    <div className="text-3xl w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                                         {char.avatarUrl ? <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-contain" /> : char.avatar}
                                    </div>
                                    <div className="font-bold" style={{ color: char.color }}>{char.name}</div>
                                </div>
                                <div className="col-span-2">
                                    <select
                                        value={selectedGoals[char.id] || 'none'}
                                        onChange={(e) => handleGoalChange(char.id, e.target.value)}
                                        className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md text-white focus:outline-none focus:border-purple-500 focus:bg-black/70 transition"
                                    >
                                        <option value="none">-- No Goal Assigned --</option>
                                        {characterGoals.map(goal => (
                                            <option key={goal.id} value={goal.id}>{goal.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>Save Goals</button>
                </div>
            </div>
            <style>{`
                .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #a855f7; }
            `}</style>
        </div>
    );
};

export default GoalAssignmentModal;