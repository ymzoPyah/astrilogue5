import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Session, Character, EmotionState, LoreEntry, TopicAnalysis, ConversationMetrics, UserPreferences, EmotionScores } from '../../types';
import { calculateSessionMetrics, getEmotionChartData } from '../../services/analyticsService';
import { callTopicAnalysisModel } from '../../services/geminiService';
import StatCard from '../analytics/StatCard';
import BarChart from '../analytics/BarChart';
import LineChart from '../analytics/LineChart';
import { Spinner } from '../ui/Spinner';
import { useAppContext } from '../../state/AppContext';

const AnalyticsScreen: React.FC = () => {
    const { sessions, allCharacters, emotionStates, loreEntries, apiKey, userPreferences } = useAppContext();
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessions[0]?.id || null);
    const [topicAnalysis, setTopicAnalysis] = useState<TopicAnalysis[]>([]);
    const [isAnalyzingTopics, setIsAnalyzingTopics] = useState(false);
    const [selectedCharForEmotions, setSelectedCharForEmotions] = useState<string>('');

    const characterMap: Map<string, Character> = useMemo(() => new Map<string, Character>(allCharacters.map(c => [c.id, c])), [allCharacters]);
    
    const selectedSession = useMemo(() => sessions.find(s => s.id === selectedSessionId), [sessions, selectedSessionId]);
    
    useEffect(() => {
        if (selectedSession && !selectedSession.characterIds.includes(selectedCharForEmotions)) {
            setSelectedCharForEmotions(selectedSession.characterIds[0] || '');
        }
    }, [selectedSession, selectedCharForEmotions]);
    
    const sessionMetrics = useMemo(() => calculateSessionMetrics(selectedSession, allCharacters), [selectedSession, allCharacters]);
    
    const emotionChartData = useMemo(() => {
        if (!selectedSession) return null;
        return getEmotionChartData(selectedSession, emotionStates);
    }, [selectedSession, emotionStates]);

    const emotionDataSetsForChart = useMemo(() => {
        if (!selectedSession || !emotionChartData || !selectedCharForEmotions) return [];
        
        const emotionColors: Record<keyof EmotionScores, string> = { joy: '#facc15', trust: '#4ade80', fear: '#a855f7', surprise: '#22d3ee', sadness: '#60a5fa', anger: '#f87171' };
        
        const charData = emotionChartData[selectedCharForEmotions];
        if (!charData) return [];

        return (Object.keys(emotionColors) as (keyof EmotionScores)[]).map(emotionKey => ({
            label: emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1),
            data: (charData[emotionKey] || []).sort((a, b) => a.x - b.x),
            color: emotionColors[emotionKey],
        }));

    }, [selectedSession, emotionChartData, selectedCharForEmotions]);

    const handleAnalyzeTopics = useCallback(async () => {
        if (!selectedSession || !apiKey) {
            alert("Please select a session and ensure your API key is set.");
            return;
        }
        setIsAnalyzingTopics(true);
        setTopicAnalysis([]);
        try {
            const transcript = selectedSession.messages.map(m => {
                const speaker = m.role === 'user' ? 'User' : (characterMap.get(m.characterId || '')?.name || 'Assistant');
                return `${speaker}: ${m.content}`;
            }).join('\n');
            const topics = await callTopicAnalysisModel(apiKey, userPreferences.modelPrefs.analysis, transcript);
            setTopicAnalysis(topics);
        } catch (error) {
            alert(`Failed to analyze topics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsAnalyzingTopics(false);
        }
    }, [selectedSession, apiKey, characterMap, userPreferences]);

    return (
        <div className="max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out] space-y-8">
            <div className="text-center">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                    Analytics Dashboard
                </h2>
                <p className="text-gray-400 mt-2">Visualize the dynamics of your conversations.</p>
            </div>

            <div className="bg-black/20 p-6 rounded-2xl border border-purple-500/30">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h3 className="text-2xl font-bold text-purple-300">Session Deep Dive</h3>
                    <select
                        value={selectedSessionId || ''}
                        onChange={(e) => {
                            setSelectedSessionId(e.target.value);
                            setTopicAnalysis([]);
                        }}
                        className="px-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:bg-white/10 transition"
                    >
                        <option value="" disabled>Select a session...</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                
                {!selectedSession || !sessionMetrics ? (
                    <div className="text-center text-gray-500 py-16">
                        <div className="text-5xl mb-4">📊</div>
                        <p>Select a session from the dropdown to view detailed analytics.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Total Messages" value={sessionMetrics.totalMessages} icon="💬" />
                            <StatCard label="User Messages" value={sessionMetrics.userMessages} icon="👤" />
                            <StatCard label="AI Messages" value={sessionMetrics.aiMessages} icon="🤖" />
                            <StatCard label="Duration" value={`${sessionMetrics.durationMinutes} min`} icon="⏱️" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BarChart 
                                title="Character Participation (Messages)"
                                data={sessionMetrics.characterParticipation.map(p => ({
                                    label: characterMap.get(p.characterId)?.name || 'Unknown',
                                    value: p.messageCount,
                                    color: characterMap.get(p.characterId)?.color || '#ffffff'
                                }))}
                            />
                             <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-bold text-purple-300">Key Topics Discussed</h4>
                                    <button onClick={handleAnalyzeTopics} className="btn-secondary" disabled={isAnalyzingTopics}>
                                        {isAnalyzingTopics ? <><Spinner /> Analyzing...</> : '🤖 Analyze Topics'}
                                    </button>
                                </div>
                                {topicAnalysis.length > 0 ? (
                                    <div className="space-y-3 text-sm">
                                        {topicAnalysis.map((topic, i) => (
                                            <div key={i}>
                                                <strong className="text-purple-400">{topic.topic}</strong>
                                                <p className="text-gray-300 text-xs">{topic.summary}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center">
                                         <div className="text-3xl mb-2">💡</div>
                                         <p>{isAnalyzingTopics ? 'AI is reading the transcript...' : 'Click "Analyze Topics" to get an AI-powered summary.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-bold text-purple-300">Emotional Journey</h4>
                                <select 
                                    value={selectedCharForEmotions}
                                    onChange={e => setSelectedCharForEmotions(e.target.value)}
                                    className="px-3 py-1 bg-white/5 border border-purple-500/30 rounded-md text-sm text-white focus:outline-none focus:border-purple-500 focus:bg-white/10 transition"
                                >
                                    {selectedSession.characterIds.map(id => (
                                        <option key={id} value={id}>{characterMap.get(id)?.name || id}</option>
                                    ))}
                                </select>
                            </div>
                             <LineChart datasets={emotionDataSetsForChart} title="" />
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                 .btn-secondary { display: inline-flex; align-items: center; gap: 0.5rem; }
                 .btn-secondary:hover:not(:disabled) { filter: brightness(1.2); transform: translateY(-2px); }
                 .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default AnalyticsScreen;