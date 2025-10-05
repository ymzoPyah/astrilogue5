import React, { useMemo } from 'react';

type DataPoint = { x: number; y: number };
type DataSet = {
    label: string;
    data: DataPoint[];
    color: string;
};
interface LineChartProps {
    datasets: DataSet[];
    title: string;
}

const emotionConfig: Record<string, string> = {
    joy: '#facc15', trust: '#4ade80', fear: '#a855f7',
    surprise: '#22d3ee', sadness: '#60a5fa', anger: '#f87171',
};

const LineChart: React.FC<LineChartProps> = ({ datasets, title }) => {
    const PADDING = 40;
    const WIDTH = 500;
    const HEIGHT = 250;

    const { maxX, maxY } = useMemo(() => {
        let maxX = 0;
        let maxY = 1; // Emotion scores are 0-1
        datasets.forEach(dataset => {
            dataset.data.forEach(point => {
                if (point.x > maxX) maxX = point.x;
            });
        });
        return { maxX: Math.max(maxX, 1), maxY };
    }, [datasets]);

    const toSvgCoords = (point: DataPoint): { x: number; y: number } => {
        const x = PADDING + (point.x / maxX) * (WIDTH - 2 * PADDING);
        const y = HEIGHT - PADDING - (point.y / maxY) * (HEIGHT - 2 * PADDING);
        return { x, y };
    };
    
    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.round(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    if (datasets.every(ds => ds.data.length === 0)) {
        return (
            <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 h-full flex flex-col items-center justify-center text-gray-500">
                <h4 className="text-lg font-bold text-purple-300 mb-4">{title}</h4>
                <div className="text-4xl mb-2">📊</div>
                <div>Not enough emotion data to display a chart.</div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 h-full">
            <h4 className="text-lg font-bold text-purple-300 mb-2">{title}</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-2">
                {datasets.map(ds => (
                    <div key={ds.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ds.color }}></div>
                        <span style={{ color: ds.color }}>{ds.label}</span>
                    </div>
                ))}
            </div>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" aria-labelledby="chart-title" role="img">
                <title id="chart-title">{title}</title>
                {/* Y-Axis */}
                <text x="10" y={HEIGHT / 2} fill="#9ca3af" fontSize="10" textAnchor="middle" transform={`rotate(-90 10, ${HEIGHT/2})`}>Emotion Score</text>
                <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="#4b5563" strokeWidth="1" />
                {[0, 0.5, 1].map(val => (
                     <text key={val} x={PADDING - 8} y={toSvgCoords({x: 0, y: val}).y} fill="#9ca3af" fontSize="10" textAnchor="end" alignmentBaseline="middle">{val}</text>
                ))}
               
                {/* X-Axis */}
                <text x={WIDTH / 2} y={HEIGHT - 5} fill="#9ca3af" fontSize="10" textAnchor="middle">Time (mm:ss)</text>
                <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="#4b5563" strokeWidth="1" />
                {[0, Math.round(maxX/2), Math.round(maxX)].map(val => (
                    <text key={val} x={toSvgCoords({x: val, y: 0}).x} y={HEIGHT - PADDING + 15} fill="#9ca3af" fontSize="10" textAnchor="middle">{formatTime(val)}</text>
                ))}

                {/* Data Lines */}
                {datasets.map(dataset => {
                    if (dataset.data.length === 0) return null;
                    const path = dataset.data.map(p => toSvgCoords(p)).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    return (
                        <g key={dataset.label}>
                            <path d={path} fill="none" stroke={dataset.color} strokeWidth="2" />
                            {dataset.data.map((point, i) => {
                                const { x, y } = toSvgCoords(point);
                                return (
                                    <circle key={i} cx={x} cy={y} r="3" fill={dataset.color} className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity" aria-label={`Data point ${dataset.label}: ${point.y.toFixed(2)} at ${formatTime(point.x)}`}>
                                        <title>{`${dataset.label}: ${point.y.toFixed(2)} at ${formatTime(point.x)}`}</title>
                                    </circle>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default LineChart;