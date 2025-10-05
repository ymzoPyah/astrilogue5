
import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
    return (
        <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="text-4xl text-purple-400 p-3 bg-black/20 rounded-lg">{icon}</div>
            <div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">{label}</div>
                <div className="text-2xl font-bold text-white">{value}</div>
            </div>
        </div>
    );
};

export default StatCard;
