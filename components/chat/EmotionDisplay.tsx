

import React from 'react';
import { EmotionScores } from '../../types';

interface EmotionDisplayProps {
    scores: EmotionScores;
}

const emotionConfig = {
    joy: { label: 'Joy', color: '#facc15' },
    trust: { label: 'Trust', color: '#4ade80' },
    fear: { label: 'Fear', color: '#a855f7' },
    surprise: { label: 'Surprise', color: '#22d3ee' },
    sadness: { label: 'Sadness', color: '#60a5fa' },
    anger: { label: 'Anger', color: '#f87171' },
};

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ scores }) => {
    return (
        <div className="space-y-2 text-xs">
            <h4 className="font-bold text-center text-purple-300 text-sm mb-2">Emotional State</h4>
            {Object.entries(scores).map(([key, value]) => {
                const config = emotionConfig[key as keyof EmotionScores];
                if (!config) return null;

                const percentage = Math.round(Number(value) * 100);

                return (
                    <div key={key} className="grid grid-cols-3 items-center gap-2">
                        <span className="font-semibold text-gray-400 truncate" style={{ color: config.color }}>
                            {config.label}
                        </span>
                        <div className="col-span-2 w-full h-4 bg-black/30 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${percentage}%`,
                                    backgroundColor: config.color,
                                    textShadow: '0 0 5px black',
                                }}
                            >
                                <span className="flex items-center justify-end pr-2 text-white/80 font-bold text-[10px]">
                                    {percentage > 10 ? `${percentage}` : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EmotionDisplay;