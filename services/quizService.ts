import { QuizData, QuizQuestion, QuizWeights, QuizResult } from '../types';
import { QUIZ_DATA } from '../data/quiz/data';

let quizDataCache: QuizData | null = null;

export const loadQuizData = (): QuizData => {
    if (quizDataCache) {
        return quizDataCache;
    }
    quizDataCache = QUIZ_DATA as QuizData;
    return quizDataCache;
};

export const calculateScores = (
    questions: QuizQuestion[],
    answers: { [questionId: string]: any }
): QuizResult[] => {
    const scores: QuizWeights = {};

    questions.forEach(q => {
        const answer = answers[q.id];
        if (answer === undefined) return;

        let weights: QuizWeights = {};

        switch (q.type) {
            case 'yesno':
                weights = answer === 'yes' ? q.yesWeights! : q.noWeights!;
                break;
            case 'multiple':
                const selectedOption = q.options?.find(opt => opt.id === answer);
                if (selectedOption) {
                    weights = selectedOption.weight;
                }
                break;
            case 'slider':
                const sliderValue = Number(answer); // 0-100
                const proportion = sliderValue / 100;
                const left = q.interpolate!.leftWeights;
                const right = q.interpolate!.rightWeights;
                
                const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
                
                allKeys.forEach(charId => {
                    const leftWeight = left[charId] || 0;
                    const rightWeight = right[charId] || 0;
                    const score = leftWeight * (1 - proportion) + rightWeight * proportion;
                    if (score > 0) {
                        weights[charId] = score;
                    }
                });
                break;
        }

        Object.entries(weights).forEach(([charId, score]) => {
            scores[charId] = (scores[charId] || 0) + score;
        });
    });

    const results: QuizResult[] = Object.entries(scores)
        .map(([characterId, score]) => ({ characterId, score }))
        .sort((a, b) => b.score - a.score);

    return results;
};