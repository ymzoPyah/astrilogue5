
import React from 'react';

export const Spinner: React.FC = () => {
    return (
        <div 
            className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-500 rounded-full animate-spin"
            style={{ animation: 'spin 0.8s linear infinite' }}
        ></div>
    );
};
