
import { useState, useEffect, useRef } from 'react';

// Polyfill for browsers that might have prefixed versions
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const recognitionRef = useRef<any | null>(null);

    const isSupported = !!SpeechRecognition;

    useEffect(() => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        const recognition = new (SpeechRecognition as any)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
             setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: any) => {
            setError(event.error);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
    }, [isSupported]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setError('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        error,
        isSupported
    };
};