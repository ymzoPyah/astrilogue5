import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Character, QuizResult, QuizData, QuizQuestion } from '../../types';
import { Spinner } from '../ui/Spinner';
import { loadQuizData, calculateScores } from '../../services/quizService';
import ProgressBar from '../ui/ProgressBar';
import { useAppContext } from '../../state/AppContext';

const QuizScreen: React.FC = () => {
    const { allCharacters, handleQuizComplete: onFinishQuiz, startConversation: onStartChat, goBack: onExit } = useAppContext();
    const [status, setStatus] = useState<QuizStatus>('loading');
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [results, setResults] = useState<QuizResult[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    const characterMap: Map<string, Character> = useMemo(() => new Map<string, Character>(allCharacters.map(c => [c.id, c])), [allCharacters]);

    useEffect(() => {
        const data = loadQuizData();
        setQuizData(data);
        setStatus('start');
    }, []);

    const handleAnswer = (questionId: string, answer: any) => {
        if (isTransitioning) return;

        setAnswers(prev => ({ ...prev, [questionId]: answer }));
        setIsTransitioning(true);

        setTimeout(() => {
            if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setIsTransitioning(false);
            } else if (quizData) {
                const newAnswers = { ...answers, [questionId]: answer };
                const finalResults = calculateScores(quizData.questions, newAnswers);
                setResults(finalResults);
                onFinishQuiz(finalResults);
                setStatus('results');
                setIsTransitioning(false);
            }
        }, 500);
    };
    
    const restartQuiz = () => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setResults([]);
        setStatus('start');
    };

    if (status === 'loading' || !quizData) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Spinner />
                <p className="mt-4 text-purple-300">Loading Glyphs...</p>
            </div>
        );
    }
    
    if (status === 'start') {
        return <StartScreen onStart={() => setStatus('in-progress')} />;
    }
    
    if (status === 'results') {
        return <ResultScreen results={results} characterMap={characterMap} onStartChat={onStartChat} onRestart={restartQuiz} />;
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / quizData.questions.length) * 100;

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-black/30 border border-purple-500/20 rounded-2xl animate-[fadeIn_0.5s_ease-out]">
            <ProgressBar percent={progress} />
            <p className="text-center text-sm text-purple-400 my-4">Question {currentQuestionIndex + 1} of {quizData.questions.length}</p>
            <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                <QuestionCard question={currentQuestion} onAnswer={handleAnswer} isTransitioning={isTransitioning}/>
            </div>
             <button onClick={onExit} className="btn-secondary mt-8 mx-auto block">Exit Quiz</button>
            <StyleInjector />
        </div>
    );
};

type QuizStatus = 'loading' | 'start' | 'in-progress' | 'results';

// --- Sub-components ---

const StartScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <div className="text-center p-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="text-6xl mb-4">🔮</div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text mb-4">Find Your Character</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">Answer the glyphs to see which character from the Astrilogue universe resonates with your signature.</p>
        <button className="btn-primary text-lg" onClick={onStart}>Begin the Reading</button>
        <StyleInjector />
    </div>
);

const ResultScreen: React.FC<{ results: QuizResult[], characterMap: Map<string, Character>, onStartChat: (ids: string[]) => void, onRestart: () => void }> = ({ results, characterMap, onStartChat, onRestart }) => {
    const top3 = results.slice(0, 3).map(r => characterMap.get(r.characterId)).filter((c): c is Character => !!c);

    if (top3.length === 0) {
        return <div className="text-center p-8 text-gray-400">Could not determine a result. Please try again.</div>
    }
    
    const [primary, secondary, tertiary] = top3;

    return (
        <div className="text-center p-4 sm:p-8 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-3xl font-bold text-purple-300 mb-2">Your Resonance</h2>
            <p className="text-gray-400 mb-8">These characters align most closely with your choices.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
                {secondary && <ResultCard character={secondary} onStartChat={onStartChat} isPrimary={false} />}
                <div className="md:col-span-3">
                    <ResultCard character={primary} onStartChat={onStartChat} isPrimary={true} />
                </div>
                {tertiary && <ResultCard character={tertiary} onStartChat={onStartChat} isPrimary={false} />}
            </div>
            
            <div className="mt-12 text-center">
                {top3.length >= 3 && (
                    <button className="btn-primary text-lg" onClick={() => onStartChat(top3.map(c => c.id))}>
                        Start Group Chat with Top 3
                    </button>
                )}
                <button className="btn-secondary mt-4" onClick={onRestart}>Retake the Quiz</button>
            </div>
            <StyleInjector />
        </div>
    );
};

const ResultCard: React.FC<{ character: Character, onStartChat: (ids: string[]) => void, isPrimary: boolean }> = ({ character, onStartChat, isPrimary }) => (
    <div className={`p-4 sm:p-6 bg-white/5 border border-purple-500/20 rounded-2xl transition-all duration-300 flex flex-col items-center ${isPrimary ? 'scale-105 shadow-2xl shadow-purple-900/50' : 'opacity-80'}`} style={{ borderColor: character.color }}>
        <div className={`text-6xl sm:text-7xl mb-4 w-24 h-24 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 ${isPrimary ? 'scale-110' : ''}`} style={{ filter: `drop-shadow(0 0 15px ${character.color})` }}>
            {character.avatarUrl ? <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" /> : character.avatar}
        </div>
        <h3 className="text-xl sm:text-2xl font-bold" style={{ color: character.color }}>{character.name}</h3>
        <p className="text-xs sm:text-sm text-gray-400 mb-4 h-8">{character.title}</p>
        <button className="btn-primary w-full" onClick={() => onStartChat([character.id])}>Start 1-on-1 Chat</button>
    </div>
);

const QuestionCard: React.FC<{ question: QuizQuestion, onAnswer: (id: string, answer: any) => void, isTransitioning: boolean }> = ({ question, onAnswer, isTransitioning }) => {
    const [sliderValue, setSliderValue] = useState(50);
    const [thumbPosition, setThumbPosition] = useState('50%');
    const sliderRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (question.type === 'slider') {
            setSliderValue(50);
        }
    }, [question.id, question.type]);

    const calculatePosition = useCallback(() => {
        if (sliderRef.current) {
            const slider = sliderRef.current;
            const thumbWidth = 24; // from CSS
            const trackWidth = slider.offsetWidth;
            if (trackWidth === 0) return;

            const valuePercent = (sliderValue - 0) / (100 - 0);
            const thumbCenterPx = valuePercent * (trackWidth - thumbWidth) + (thumbWidth / 2);
            setThumbPosition(`${thumbCenterPx}px`);
        }
    }, [sliderValue]);

    useEffect(() => {
        // Recalculate on value change and on resize
        calculatePosition();
        window.addEventListener('resize', calculatePosition);
        return () => {
            window.removeEventListener('resize', calculatePosition);
        };
    }, [calculatePosition]);

    return (
        <div className="text-center min-h-[300px]">
            <h3 className="text-2xl font-semibold text-white mb-2">{question.text}</h3>
            {question.subtitle && <p className="text-gray-400 mb-8">{question.subtitle}</p>}

            <div className="mt-12">
                {question.type === 'yesno' && (
                    <div className="flex justify-center gap-4">
                        <button className="btn-primary text-lg" onClick={() => onAnswer(question.id, 'yes')} disabled={isTransitioning}>Yes</button>
                        <button className="btn-primary text-lg" onClick={() => onAnswer(question.id, 'no')} disabled={isTransitioning}>No</button>
                    </div>
                )}
                {question.type === 'multiple' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {question.options?.map(opt => (
                            <button key={opt.id} className="btn-secondary text-left" onClick={() => onAnswer(question.id, opt.id)} disabled={isTransitioning}>{opt.label}</button>
                        ))}
                    </div>
                )}
                 {question.type === 'slider' && question.range && (
                    <div className="w-full max-w-lg mx-auto">
                        <div className="relative">
                            <input
                                ref={sliderRef}
                                type="range"
                                min={question.range.min}
                                max={question.range.max}
                                value={sliderValue}
                                onChange={e => setSliderValue(Number(e.target.value))}
                                onMouseUp={() => onAnswer(question.id, sliderValue)}
                                onTouchEnd={() => onAnswer(question.id, sliderValue)}
                                className="w-full"
                                disabled={isTransitioning}
                            />
                            <div className="absolute left-0 top-6 w-full flex justify-between text-xs text-gray-400">
                                <span>{question.range.labels[0]}</span>
                                <span>{question.range.labels[1]}</span>
                            </div>
                            <div className="absolute top-[-10px] w-full">
                                 <div 
                                    className="absolute text-purple-300 font-bold text-sm bg-purple-900/80 px-2 py-1 rounded-md -translate-x-1/2" 
                                    style={{ left: thumbPosition, transition: 'left 150ms ease' }}
                                >
                                    {sliderValue}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StyleInjector = () => (
    <style>{`
        .btn-primary, .btn-secondary {
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            justify-content: center;
        }
        .btn-primary:hover:not(:disabled), .btn-secondary:hover:not(:disabled) {
            transform: translateY(-2px);
            filter: brightness(1.2);
        }
        .btn-primary {
            border: 1px solid #a855f7;
            background: linear-gradient(145deg, #a855f7, #ec4899);
            color: white;
            box-shadow: 0 4px 15px -5px #a855f7, 0 2px 8px -6px #ec4899;
        }
        .btn-secondary {
            border: 1px solid rgba(17, 219, 239, 0.4);
            background: rgba(17, 219, 239, 0.1);
            color: #11dbef;
        }
        .btn-secondary:hover:not(:disabled) {
            border-color: #11dbef;
            box-shadow: 0 0 15px -2px #11dbef;
        }
        .btn-secondary:disabled { opacity: 0.5; }

        input[type=range] {
            -webkit-appearance: none;
            width: 100%;
            height: 8px;
            background: linear-gradient(to right, #a855f7, #ec4899);
            border-radius: 4px;
            outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            background: #fff;
            border-radius: 50%;
            cursor: pointer;
            border: 4px solid #a855f7;
            box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        input[type=range]::-moz-range-thumb {
            width: 24px;
            height: 24px;
            background: #fff;
            border-radius: 50%;
            cursor: pointer;
            border: 4px solid #a855f7;
            box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
    `}</style>
);

export default QuizScreen;