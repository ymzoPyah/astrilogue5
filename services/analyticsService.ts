

import { Session, Character, EmotionState, ConversationMetrics, CharacterParticipation } from '../types';

export const calculateSessionMetrics = (session: Session | null, allCharacters: Character[]): ConversationMetrics | null => {
    if (!session) return null;

    const totalMessages = session.messages.length;
    const userMessages = session.messages.filter(m => m.role === 'user').length;
    const aiMessages = session.messages.filter(m => m.role === 'assistant').length;

    const participation = new Map<string, number>();
    session.characterIds.forEach(id => participation.set(id, 0));
    
    session.messages.forEach(msg => {
        if (msg.role === 'assistant' && msg.characterId) {
            participation.set(msg.characterId, (participation.get(msg.characterId) || 0) + 1);
        }
    });

    const characterParticipation: CharacterParticipation[] = Array.from(participation.entries()).map(([charId, count]) => ({
        characterId: charId,
        messageCount: count,
        percentage: aiMessages > 0 ? (count / aiMessages) * 100 : 0,
    })).sort((a,b) => b.messageCount - a.messageCount);
    
    const durationMinutes = (session.updatedAt - session.createdAt) / (1000 * 60);

    return {
        totalMessages,
        userMessages,
        aiMessages,
        characterParticipation,
        durationMinutes: parseFloat(durationMinutes.toFixed(1)),
    };
};

export const getEmotionChartData = (session: Session | null, emotionStates: EmotionState[]) => {
    if (!session) return { labels: [], datasets: [] };
    
    const sessionEmotions = emotionStates.filter(e => e.sessionId === session.id);
    if (sessionEmotions.length === 0) return { labels: [], datasets: [] };
    
    const emotionSeries: { [charId: string]: { [emotion: string]: {x: number, y: number}[] } } = {};
    
    session.characterIds.forEach(charId => {
        emotionSeries[charId] = { joy: [], trust: [], fear: [], surprise: [], sadness: [], anger: [] };
    });

    const sessionStartTime = session.createdAt;

    sessionEmotions.forEach(state => {
        if (emotionSeries[state.characterId]) {
            const timeOffset = (state.timestamp - sessionStartTime) / 1000; // time in seconds
            Object.entries(state.scores).forEach(([emotion, score]) => {
                emotionSeries[state.characterId][emotion].push({ x: timeOffset, y: score });
            });
        }
    });

    return emotionSeries;
};