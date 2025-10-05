import { Character, UserPreferences } from '../types';

interface SpeakOptions {
    text: string;
    character: Character;
    preferences: UserPreferences;
    onStart: () => void;
    onEnd: () => void;
}

// Character-specific voice adjustments for the browser's default voice.
const browserVoiceAdjustments: { [key: string]: { pitch?: number, rate?: number } } = {
    nippy: { pitch: 1.5, rate: 1.2 },
    kiox: { rate: 1.1 },
    ymzo: { pitch: 0.8, rate: 0.9 },
    paus: { pitch: 0.8, rate: 0.9 },
    itz: { pitch: 1.2, rate: 1.2 }
};

class TextToSpeechService {
    private speechQueue: SpeakOptions[] = [];
    private isSpeaking: boolean = false;
    private audioContext: AudioContext | null = null;
    private audioCache: Map<string, ArrayBuffer> = new Map();

    private getAudioContext(): AudioContext {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    public async speak(options: SpeakOptions) {
        if (typeof window === 'undefined') {
            return;
        }
        this.speechQueue.push(options);
        this.processQueue();
    }

    private async processQueue() {
        if (this.isSpeaking || this.speechQueue.length === 0) {
            return;
        }

        this.isSpeaking = true;
        const utteranceData = this.speechQueue.shift();
        if (!utteranceData) {
            this.isSpeaking = false;
            return;
        }

        const { preferences, character } = utteranceData;

        if (!preferences.voiceEnabled) {
            this.isSpeaking = false;
            utteranceData.onEnd();
            this.processQueue();
            return;
        }
        
        // Condition to use XTTS: global setting is 'xtts', server URL exists,
        // and the character has a specific voice profile with a speakerId.
        const providerIsXTTS = preferences.voiceProvider === 'xtts' && !!preferences.xttsServerUrl;
        const characterHasXTTSVoice = !!character.voiceProfile?.speakerId && character.voiceProfile?.provider !== 'browser';

        if (providerIsXTTS && characterHasXTTSVoice) {
             try {
                await this.speakWithXTTS(utteranceData);
            } catch (error) {
                console.error(`XTTS synthesis failed for ${character.name}, falling back to browser voice.`, error);
                const event = new CustomEvent("SHOW_TOAST", { 
                    detail: { message: `Local voice for ${character.name} failed. Falling back to browser's default voice. Please check your XTTS server configuration and console for details.` } 
                });
                document.dispatchEvent(event);
                this.speakWithBrowser(utteranceData);
            }
        } else {
            // Use browser if provider is not XTTS, or if character doesn't have a specific XTTS voice configured.
            this.speakWithBrowser(utteranceData);
        }
    }

    private async speakWithXTTS(data: SpeakOptions) {
        const { text, character, preferences, onStart, onEnd } = data;
        onStart();
        
        const cacheKey = `${character.voiceProfile?.speakerId || 'default'}:${text}`;
        let audioBuffer: ArrayBuffer | undefined = this.audioCache.get(cacheKey);

        if (!audioBuffer) {
            const response = await fetch(`${preferences.xttsServerUrl}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    speaker: character.voiceProfile?.speakerId,
                    language: character.voiceProfile?.lang || 'en',
                    speed: character.voiceProfile?.speed || 1.0,
                }),
            });

            if (!response.ok) {
                throw new Error(`XTTS server request failed with status ${response.status}`);
            }
            audioBuffer = await response.arrayBuffer();
            this.audioCache.set(cacheKey, audioBuffer);
        }
        
        const context = this.getAudioContext();
        const decodedData = await context.decodeAudioData(audioBuffer.slice(0)); // slice to create a copy
        const source = context.createBufferSource();
        source.buffer = decodedData;
        source.connect(context.destination);
        
        source.onended = () => {
            this.isSpeaking = false;
            onEnd();
            this.processQueue();
        };
        
        source.start(0);
    }

    private speakWithBrowser(data: SpeakOptions) {
        if (!window.speechSynthesis) {
            console.warn('Browser Speech Synthesis not supported.');
            data.onEnd();
            this.isSpeaking = false;
            this.processQueue();
            return;
        }

        const { text, character, onStart, onEnd } = data;
        const utterance = new SpeechSynthesisUtterance(text);
        
        const browserAdjustment = browserVoiceAdjustments[character.id];
        const voiceProfile = character.voiceProfile;

        if (browserAdjustment) {
            utterance.pitch = browserAdjustment.pitch ?? 1;
            utterance.rate = browserAdjustment.rate ?? 1;
        } else if (voiceProfile && typeof voiceProfile.speed === 'number') {
            // Map speed (e.g., 0.8-1.2) to browser rate/pitch (typically 0.1-2.0)
            utterance.pitch = 1; // Keep pitch normal unless specified
            utterance.rate = Math.max(0.5, Math.min(2, voiceProfile.speed));
        } else {
            utterance.pitch = 1;
            utterance.rate = 1;
        }
        
        utterance.lang = character.voiceProfile?.lang || 'en-US';

        utterance.onstart = onStart;
        utterance.onend = () => {
            this.isSpeaking = false;
            onEnd();
            this.processQueue();
        };
        utterance.onerror = (event) => {
            console.error('Browser TTS Error:', event);
            this.isSpeaking = false;
            onEnd();
            this.processQueue();
        };

        window.speechSynthesis.speak(utterance);
    }
    
    public async checkHealth(url: string): Promise<boolean> {
        if (!url) return false;
        try {
            const response = await fetch(`${url}/health`, { method: 'GET' });
            return response.ok;
        } catch (error) {
            console.error("XTTS health check failed:", error);
            return false;
        }
    }
    
    public stop() {
        this.speechQueue = [];
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.close();
        }
        this.isSpeaking = false;
    }
}

export const ttsService = new TextToSpeechService();