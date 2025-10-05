
import React from 'react';

interface ProgressBarProps {
    percent: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent }) => {
    const safePercent = Math.min(Math.max(percent, 0), 100);

    return (
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-2">
            <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" 
                style={{ width: `${safePercent}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;
