
import React from 'react';

interface BarChartProps {
    data: { label: string; value: number; color: string }[];
    title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    
    return (
        <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 h-full">
            <h4 className="text-lg font-bold text-purple-300 mb-4">{title}</h4>
            <div className="space-y-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-24 text-gray-300 truncate text-right font-semibold">{item.label}</div>
                        <div className="flex-1 bg-black/30 rounded-full h-6 overflow-hidden">
                             <div 
                                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-white/90 font-bold"
                                style={{
                                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                                    backgroundColor: item.color,
                                    textShadow: '0 0 5px black',
                                }}
                            >
                                {item.value > 0 ? item.value : ''}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarChart;
