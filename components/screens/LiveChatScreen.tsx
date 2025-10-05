import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Character, VoiceProfile, LiveTranscriptItem, EmotionScores } from '../../types';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { callEmotionAnalysisModel } from '../../services/geminiService';
import EmotionDisplay from '../chat/EmotionDisplay';
import { useAppContext } from '../../state/AppContext';

// --- Audio Utility Functions (as per Gemini API guidelines) ---

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Helper Functions ---
const emotionConfig = {
    joy: { color: 'rgba(250, 204, 21, 0.5)' }, trust: { color: 'rgba(74, 222, 128, 0.5)' }, fear: { color: 'rgba(168, 85, 247, 0.5)' },
    surprise: { color: 'rgba(34, 211, 238, 0.5)' }, sadness: { color: 'rgba(96, 165, 250, 0.5)' }, anger: { color: 'rgba(248, 113, 113, 0.5)' },
};

const getDominantEmotion = (scores: EmotionScores | undefined): [keyof EmotionScores, number] | null => {
    if (!scores) return null;
    return (Object.entries(scores) as [keyof EmotionScores, number][])
        .reduce((a, b) => a[1] > b[1] ? a : b, ['joy', 0]);
};

// --- Sub-components ---

const UserVoiceOrb: React.FC<{ analyser: AnalyserNode | null, connectionState: ConnectionState }> = ({ analyser, connectionState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !analyser) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const draw = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            const scale = 1 + (average / 128) * 0.3;
            const glowOpacity = Math.min(0.8, average / 128);
            
            // Outer glow
            ctx.beginPath();
            ctx.arc(100, 100, 45 * scale, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(45, 212, 191, ${glowOpacity * 0.5})`;
            ctx.filter = `blur(30px)`;
            ctx.fill();
            ctx.filter = 'none';

            // Main orb
            const gradient = ctx.createRadialGradient(100, 100, 10, 100, 100, 40 * scale);
            gradient.addColorStop(0, 'rgba(45, 212, 191, 1)');
            gradient.addColorStop(1, 'rgba(162, 123, 255, 0.5)');

            ctx.beginPath();
            ctx.arc(100, 100, 40 * scale, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            animationFrameRef.current = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [analyser]);

    let statusText, statusColor;
    switch(connectionState) {
        case 'connected': statusText = 'LIVE'; statusColor = 'text-green-400'; break;
        case 'connecting': statusText = 'CONNECTING'; statusColor = 'text-yellow-400'; break;
        case 'error': statusText = 'ERROR'; statusColor = 'text-red-400'; break;
        case 'closed': statusText = 'ENDED'; statusColor = 'text-gray-500'; break;
    }

    return (
        <div className="relative w-52 h-52 flex flex-col items-center justify-center">
            <canvas ref={canvasRef} width="200" height="200" />
            <div className={`absolute font-bold uppercase tracking-widest ${statusColor}`}>
                {statusText}
            </div>
        </div>
    );
};


const CharacterPortal: React.FC<{ character: Character; isSpeaking: boolean; emotions: EmotionScores | undefined; }> = ({ character, isSpeaking, emotions }) => {
    const dominantEmotion = getDominantEmotion(emotions);
    const emotionColor = dominantEmotion ? emotionConfig[dominantEmotion[0]].color : 'rgba(162, 123, 255, 0.1)';

    return (
        <div className="flex flex-col items-center gap-2">
            <div 
                className="relative w-24 h-24 rounded-full transition-all duration-300"
                style={{
                    boxShadow: isSpeaking ? `0 0 25px ${character.color}, 0 0 8px ${character.color} inset` : `0 0 15px ${emotionColor}`,
                    animation: isSpeaking ? `pulse-glow 2s infinite` : 'none',
                    '--char-color': character.color
                } as React.CSSProperties}
            >
                <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: isSpeaking ? character.color : 'rgba(162, 123, 255, 0.3)' }}></div>
                <div className="absolute inset-1.5 rounded-full overflow-hidden flex items-center justify-center bg-black">
                    {character.avatarUrl ? 
                        <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" /> : 
                        <span className="text-4xl">{character.avatar}</span>
                    }
                </div>
            </div>
            <span className="font-semibold text-sm text-purple-200">{character.name}</span>
        </div>
    );
};


// --- Main Component ---

type ConnectionState = 'connecting' | 'connected' | 'error' | 'closed';

const parseSpeaker = (text: string, chars: Character[]): { foundChar: Character | null, cleanText: string } => {
    for (const char of chars) {
        const pattern = new RegExp(`^${char.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}:\\s*`, 'i');
        if (pattern.test(text)) {
            return {
                foundChar: char,
                cleanText: text.replace(pattern, ''),
            };
        }
    }
    return { foundChar: null, cleanText: text };
};


const LiveChatScreen: React.FC = () => {
    const { liveCharacters: characters, apiKey, goBack: onEnd } = useAppContext();
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
    const [transcript, setTranscript] = useState<LiveTranscriptItem[]>([]);
    const [activeSpeaker, setActiveSpeaker] = useState<Character | null>(null);
    const [characterEmotions, setCharacterEmotions] = useState<Record<string, EmotionScores>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const sessionRef = useRef<any | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const modelName = 'gemini-2.5-flash-native-audio-preview-09-2025';

    const systemInstruction = useMemo(() => {
        if (!characters) return '';
        const characterProfiles = characters.map(char => 
            `--- CHARACTER: ${char.name} ---\n${char.systemPrompt}`
        ).join('\n\n');
        
        const voiceInstructions = characters.map((c, i) => {
            const vp: Partial<VoiceProfile> = c.voiceProfile ?? {};
            return `${i+1}. ${c.name} — speaker_id_hint=${vp.speakerId ?? "create_unique"}; lang=${vp.lang ?? "en"}; speed=${vp.speed ?? 1.0};`;
        }).join("\n");

        return `You are an AI Conductor, orchestrating a live, real-time voice conversation between a human user and multiple distinct AI characters. You will receive live audio from the user and must respond in real-time by role-playing the appropriate character.

RULES:
1. You will embody ALL of the characters listed below. Switch between them to create a natural, dynamic group conversation.
2. When you respond, you MUST select ONLY ONE character to speak for that entire turn. Your response MUST begin with that character's name, followed by a colon (e.g., "Ymzo: The threads are...").
3. CRITICAL: DO NOT include dialogue from any other character in your response. The entire response must be from the perspective and in the voice of the single chosen character.
4. Do not break character. Do not refer to yourself as an AI or the Conductor. You ARE the characters.
5. Modulate your voice to give each character a unique vocal identity. Follow the detailed guidelines below:
VOICE MODULATION GUIDELINES:
${voiceInstructions}
When speaking AS a character, you MUST adopt their specified voice profile. Create distinct, consistent voices for each person.
6. Keep the conversation flowing. If the user pauses, have the characters interact with each other, but remember to only have ONE character speak per response turn.

AVAILABLE CHARACTERS:
${characterProfiles}
`;
    }, [characters]);

    const cleanup = useCallback(() => {
        console.log('Cleaning up audio resources...');
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
             for (const source of audioSourcesRef.current.values()) {
                source.stop(0);
            }
            audioSourcesRef.current.clear();
            outputAudioContextRef.current.close();
        }
    }, []);

    useEffect(() => {
        if (!characters || characters.length === 0) return;
        
        const ai = new GoogleGenAI({ apiKey });

        const sessionPromise = ai.live.connect({
            model: modelName,
            callbacks: {
                onopen: async () => {
                    console.log('Live session opened.');
                    setConnectionState('connected');
                    
                    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        analyserRef.current = inputAudioContextRef.current.createAnalyser();
                        analyserRef.current.fftSize = 256;
                        
                        mediaStreamSourceRef.current.connect(analyserRef.current);
                        analyserRef.current.connect(scriptProcessorRef.current);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                               session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    } catch (err) {
                        console.error("Error getting user media:", err);
                        setConnectionState('error');
                        alert("Could not access microphone. Please check your browser permissions.");
                    }
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.speaker === 'user' && !last.isFinal) {
                                return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                            }
                            return [...prev, { id: Date.now(), speaker: 'user', text, isFinal: false }];
                        });
                    }
                    
                    if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        setTranscript(prev => {
                            let updatedPrev = [...prev];
                            const last = updatedPrev[updatedPrev.length - 1];
                            
                            if (last?.speaker === 'user' && !last.isFinal) {
                                updatedPrev[updatedPrev.length - 1] = { ...last, isFinal: true };
                            }

                            const newLast = updatedPrev[updatedPrev.length - 1];
                            const isNewTurn = !newLast || newLast.speaker === 'user' || newLast.isFinal;
                            
                            if (isNewTurn) {
                                const { foundChar } = parseSpeaker(text, characters);
                                setActiveSpeaker(foundChar);
                                return [...updatedPrev, { id: Date.now(), speaker: foundChar || characters[0], text, isFinal: false }];
                            }
                            
                            const updatedText = newLast.text + text;
                            const { foundChar } = parseSpeaker(updatedText, characters);
                            setActiveSpeaker(foundChar);
                            const updatedLast = { ...newLast, speaker: foundChar || newLast.speaker, text: updatedText };
                            return [...updatedPrev.slice(0, -1), updatedLast];
                        });
                    }

                    if (message.serverContent?.turnComplete) {
                        setActiveSpeaker(null);
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (!last || last.isFinal) return prev;
                            
                            const finalizedItem = { ...last, isFinal: true };
                             const updatedTranscript = [...prev.slice(0, -1), finalizedItem];

                            if (finalizedItem.speaker !== 'user') {
                                const character = finalizedItem.speaker;
                                const fullText = parseSpeaker(finalizedItem.text, characters).cleanText;
                                
                                (async () => {
                                    const scores = await callEmotionAnalysisModel(apiKey, 'flash', character.name, fullText, null);
                                    setCharacterEmotions(prevEmotions => ({...prevEmotions, [character.id]: scores }));
                                })();
                            }
                            return updatedTranscript;
                        });
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const ctx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        
                        source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });

                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }

                    if (message.serverContent?.interrupted) {
                        for (const source of audioSourcesRef.current.values()) {
                            // FIX: The stop() method on AudioBufferSourceNode requires a 'when' argument.
                            source.stop(0);
                            audioSourcesRef.current.delete(source);
                        }
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    setConnectionState('error');
                    cleanup();
                },
                onclose: (e: CloseEvent) => {
                    console.log('Live session closed.');
                    setConnectionState('closed');
                    cleanup();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: systemInstruction,
            },
        });
        
        sessionPromise.then(session => sessionRef.current = session);

        return cleanup;
    }, [apiKey, systemInstruction, cleanup, characters]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    if (!characters) return null;

    return (
        <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-12rem)] bg-[#0A0810] rounded-3xl border border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-900/50 backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-stars opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-black"></div>
            
            <header className="relative z-10 p-4 flex justify-center items-center gap-x-8 gap-y-4 flex-wrap">
                {characters.map(char => (
                    <CharacterPortal
                        key={char.id}
                        character={char}
                        isSpeaking={activeSpeaker?.id === char.id}
                        emotions={characterEmotions[char.id]}
                    />
                ))}
            </header>
            
            <main className="relative z-10 flex-1 flex flex-col items-center overflow-hidden">
                <UserVoiceOrb analyser={analyserRef.current} connectionState={connectionState} />

                <div className="w-full flex-1 overflow-y-auto p-6 space-y-5 transcript-container">
                    {transcript.length === 0 && connectionState === 'connected' && (
                        <div className="text-center text-gray-400 pt-8">
                            <p>Connection is live. Start speaking to the characters.</p>
                        </div>
                    )}
                    {transcript.map((item) => {
                        const character = item.speaker === 'user' ? null : item.speaker;
                        const isUser = !character;
                        const name = character ? character.name : 'You';
                        const color = character ? character.color : '#2dd4bf';

                        return (
                            <div key={item.id} className="animate-[slideIn_0.3s_ease-out]" data-final={item.isFinal}>
                                <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                                    <div className="font-bold text-sm" style={{ color: color }}>{name}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="leading-relaxed text-gray-200">{item.text}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            <footer className="relative z-10 p-6 bg-black/30 border-t border-purple-500/30 text-center">
                 <button className="btn-end" onClick={onEnd}>End Conversation</button>
            </footer>

            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 25px var(--char-color), 0 0 8px var(--char-color) inset; }
                    50% { box-shadow: 0 0 40px var(--char-color), 0 0 12px var(--char-color) inset; }
                }
                @keyframes stars-anim {
                    from { background-position: 0 0; }
                    to { background-position: 0 -10000px; }
                }
                .bg-stars {
                    background-image: url(https://www.transparenttextures.com/patterns/stardust.png);
                    animation: stars-anim 600s linear infinite;
                }
                .transcript-container {
                    mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
                }
                .transcript-container [data-final="false"] p {
                    opacity: 0.7;
                    animation: flicker 1.5s infinite;
                }
                @keyframes flicker {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 0.9; }
                }
                .btn-end {
                    padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600;
                    transition: all 0.2s; cursor: pointer; color: white;
                    background: linear-gradient(135deg, #ef4444, #b91c1c);
                    border: 1px solid #ef444455; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
                }
                .btn-end:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4); }
            `}</style>
        </div>
    );
};

export default LiveChatScreen;