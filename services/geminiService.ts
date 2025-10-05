import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Character, Message, EmotionScores, SideConversationResult, InterventionResult, ModelId, CharacterDesire, TopicAnalysis, ModelBehavior, DirectorDecision, ReflectionResult } from '../types';

let ai: GoogleGenAI | null = null;

const TEXT_MODEL: ModelId = 'gemini-2.5-flash';

const getAi = (apiKey: string) => {
    if (!ai) {
        if (!process.env.API_KEY && !apiKey) {
            throw new Error("API key is not set. Please provide it in the settings.");
        }
        ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
    }
    return ai;
};

const getThinkingConfig = (behavior: ModelBehavior) => {
    return behavior === 'flash' ? { thinkingConfig: { thinkingBudget: 0 } } : {};
};

export const selectRelevantMemories = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    memories: string,
    nextSpeakerIds: string[],
    topicNudge: string,
): Promise<string[]> => {
    const ai = getAi(apiKey);
    const model = ai.models;
    const prompt = `You are MEMORY. From {memories[]}, pick <=8 most relevant to {nextSpeakerIds} and {topicNudge}, shortest first.
    
    Memories: ${memories}
    Next Speaker IDs: ${JSON.stringify(nextSpeakerIds)}
    Topic Nudge: "${topicNudge}"

    Return JSON: { "relevant_memories": ["memory content 1", "memory content 2"] }
    `;

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        relevant_memories: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                },
                ...getThinkingConfig(modelBehavior)
            }
        });
        const jsonText = response.text.trim();
        return (JSON.parse(jsonText) as { relevant_memories: string[] }).relevant_memories;
    } catch (error) {
        console.error("Gemini API Error (Memory Selector):", error);
        return [];
    }
};


export const callCharacterModel = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    history: Message[],
    character: Character,
    memoryContext: string | null = null,
    sceneContext: string | null = null,
    goalContext: string | null = null,
    feedbackContext: string | null = null,
    interventionContext: string | null = null,
    whisperContext: string | null = null,
): Promise<string> => {
    const ai = getAi(apiKey);
    const model = ai.models;

    let systemInstruction = character.systemPrompt;

    if (whisperContext) {
        systemInstruction = `[SECRET WHISPER FOR YOU: "${whisperContext}"]\n\n${systemInstruction}`;
    }
    if (interventionContext) {
         systemInstruction = `[DIRECTOR'S HINT FOR THIS TURN: ${interventionContext}]\n\n${systemInstruction}`;
    }
    if (feedbackContext) {
        systemInstruction = `${feedbackContext}\n\n---\n\n${systemInstruction}`;
    }
    if (goalContext) {
        systemInstruction = `[YOUR SECRET GOAL: ${goalContext}]\n\n${systemInstruction}`;
    }
    if (sceneContext) {
        systemInstruction = `[CURRENT SCENE: ${sceneContext}]\n\n${systemInstruction}`;
    }
    if (memoryContext) {
        systemInstruction = `${memoryContext}\n\n---\n\n${systemInstruction}`;
    }

    const contents = history.map(msg => {
        const parts: ({ text: string; } | { inlineData: { mimeType: string; data: string; }; })[] = [{ text: msg.content }];
        if (msg.image) {
            const [meta, base64Data] = msg.image.split(',');
            const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                },
            });
        }
        return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: parts
        };
    });

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: TEXT_MODEL,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.9,
                ...getThinkingConfig(modelBehavior)
            }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (Character Model):", error);
        throw new Error("Failed to get response from character model.");
    }
};

export const testCharacterResponse = async (
    apiKey: string,
    systemPrompt: string,
    testMessage: string
): Promise<string> => {
    const ai = getAi(apiKey);
    const model = ai.models;

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: TEXT_MODEL,
            contents: [{ role: 'user', parts: [{ text: testMessage }] }],
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.8,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (Test Character):", error);
        throw new Error("Failed to get test response from character model.");
    }
};

export const callDirectorModel = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    cast: string,
    scene: string,
    recentTranscript: string,
    topicWeights: string,
    desireScores?: string,
): Promise<DirectorDecision> => {
    const ai = getAi(apiKey);
    const model = ai.models;

    let prompt = `You are DIRECTOR. Goal: maintain momentum and coherence in a multi-character session.
Constraints: do not override user control; never exceed budget guard signals; respect safety lanes defined per character.
Given:
- Cast: ${cast}
- Scene: ${scene}
- Recent Transcript: ${recentTranscript}
- Topic Weights: ${topicWeights}`;

    if (desireScores) {
        prompt += `\n- Character Desire Scores (0-1): ${desireScores}`;
    }

    prompt += `\n\nDecide ONE: {speakerIds:[string], topicNudge:string, tempoHint:'slow|medium|fast', why:string<=120}.
Return JSON only.`;
    
    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        speakerIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                        topicNudge: { type: Type.STRING },
                        tempoHint: { type: Type.STRING, enum: ['slow', 'medium', 'fast'] },
                        why: { type: Type.STRING }
                    },
                    required: ["speakerIds", "topicNudge", "tempoHint", "why"]
                },
                ...getThinkingConfig(modelBehavior)
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as DirectorDecision;
    } catch (error) {
        console.error("Gemini API Error (Director Model):", error);
        throw new Error("Director model failed to produce a valid decision.");
    }
};

export const callInterventionModel = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    context: string,
    characterToJudge: Character,
    lastSpeakerName: string
): Promise<InterventionResult> => {
    const ai = getAi(apiKey);
    const prompt = `You are an INTERVENTION JUDGE for an AI-driven roleplay.
The last speaker was ${lastSpeakerName}.
The current character being judged is ${characterToJudge.name}.
Their personality is: ${characterToJudge.systemPrompt.substring(0, 500)}

Here is the recent conversation context:
---
${context}
---

Based on the context and ${characterToJudge.name}'s personality, should they interject with a comment *right now*? Their interjection should be short and reactive.

Respond with ONLY a valid JSON object matching this schema:
{
  "interject": boolean, // true if they should speak, false otherwise
  "message": string | null, // The message they should say if interjecting, null otherwise.
  "reasoning": string // A brief explanation for your decision.
}`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        interject: { type: Type.BOOLEAN },
                        message: { type: Type.STRING, nullable: true }, // Note: Model may return null, handled by parsing.
                        reasoning: { type: Type.STRING },
                    },
                    required: ["interject", "reasoning"] // 'message' is not required.
                },
                ...getThinkingConfig(modelBehavior)
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as InterventionResult;
        if (!result.interject) {
            result.message = null;
        }
        return result;
    } catch (error) {
        console.error(`Gemini API Error (Intervention Model for ${characterToJudge.name}):`, error);
        return { interject: false, message: null, reasoning: "API error." };
    }
};

export const callReflectionModel = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    windowTranscript: string,
    prevTopicWeights: string
): Promise<ReflectionResult> => {
    const ai = getAi(apiKey);
    const model = ai.models;
    const prompt = `You are REFLECTION. Summarize the last window in 2–3 sentences, update topicWeights (0..1), and note contradictions or hooks.
Given:
- Window Transcript: ${windowTranscript}
- Previous Topic Weights: ${prevTopicWeights}

Return JSON: {summary, topicWeights, hooks[]}
`;

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        topicWeights: { type: Type.OBJECT, properties: {}, additionalProperties: { type: Type.NUMBER } },
                        hooks: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["summary", "topicWeights", "hooks"]
                },
                ...getThinkingConfig(modelBehavior)
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ReflectionResult;
    } catch (error) {
        console.error("Gemini API Error (Reflection Model):", error);
        throw new Error("Reflection model failed.");
    }
};

export interface ExtractedLoreEntry {
    title: string;
    content: string;
    character_ids: string[];
    source_message_id: string;
}

export const callLoreExtractionModel = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    conversationText: string,
    characterProfiles: string,
): Promise<ExtractedLoreEntry[]> => {
    const ai = getAi(apiKey);
    const model = ai.models;

    const prompt = `You are LORE_KEEPER. Analyze the provided conversation transcript to identify significant world-building facts, character revelations, or key plot points. Extract these into a list of structured lore entries.
    - Be concise. Each entry should be a self-contained piece of information.
    - Title each entry with a short, descriptive name.
    - 'content' should summarize the lore point.
    - 'character_ids' must be an array of the character IDs involved in this specific piece of lore.
    - 'source_message_id' must be the ID of the message from the transcript where this lore was revealed. Message IDs are in the format [msg-xxxxxxxx].
    
    Character Profiles:
    ${characterProfiles}
    
    Conversation Transcript:
    ---
    ${conversationText}
    ---

    Return a JSON array of lore entries.`;

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            character_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                            source_message_id: { type: Type.STRING },
                        },
                        required: ["title", "content", "character_ids", "source_message_id"]
                    }
                },
                ...getThinkingConfig(modelBehavior)
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ExtractedLoreEntry[];
    } catch (error) {
        console.error("Gemini API Error (Lore Extraction):", error);
        throw new Error("Failed to extract lore from the conversation.");
    }
};

export const callEmotionAnalysisModel = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    characterName: string,
    messageContent: string,
    sceneContext: string | null
): Promise<EmotionScores> => {
    const ai = getAi(apiKey);
    const model = ai.models;
    const prompt = `Analyze the emotional state of the character "${characterName}" after they said the following: "${messageContent}".
The current scene is: ${sceneContext || "An undefined space."}
Based on their personality, the content of this message, and the scene, provide a score from 0.0 to 1.0 for each of the following emotions. Respond ONLY with a valid JSON object matching the schema.`;

    try {
        const response: GenerateContentResponse = await model.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        joy: { type: Type.NUMBER }, trust: { type: Type.NUMBER }, fear: { type: Type.NUMBER },
                        surprise: { type: Type.NUMBER }, sadness: { type: Type.NUMBER }, anger: { type: Type.NUMBER },
                    },
                    required: ["joy", "trust", "fear", "surprise", "sadness", "anger"]
                },
                ...getThinkingConfig(modelBehavior)
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as EmotionScores;
    } catch (error) {
        console.error("Gemini API Error (Emotion Analysis):", error);
        return { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, anger: 0 };
    }
};

export const callDesireToSpeakModel = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    historyText: string,
    character: Character,
    memoryContext: string | null,
    emotionContext: string | null,
    sceneContext: string | null,
    goalContext: string | null
): Promise<Omit<CharacterDesire, 'characterId'>> => {
    const ai = getAi(apiKey);
    let prompt = `You are a Desire Arbiter. Your job is to determine a character's desire to speak right now.
Rate their desire on a scale of 0.0 (no desire) to 1.0 (desperate to speak).
Provide a brief reasoning.
Character to assess: ${character.name}
Personality: ${character.systemPrompt.substring(0, 300)}
`;
    if (memoryContext) prompt += `\nRelevant Memories: ${memoryContext}`;
    if (emotionContext) prompt += `\nTheir current emotion state: ${emotionContext}`;
    if (sceneContext) prompt += `\nCurrent Scene: ${sceneContext}`;
    if (goalContext) prompt += `\nTheir Secret Goal: ${goalContext}`;
    prompt += `\n\nRecent Conversation Transcript:\n---\n${historyText}\n---\n\nBased on all this, how much does ${character.name} want to speak *next*?
Return ONLY a valid JSON object.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { desire: { type: Type.NUMBER }, reasoning: { type: Type.STRING } },
                    required: ["desire", "reasoning"]
                },
                ...getThinkingConfig(modelBehavior)
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as { desire: number, reasoning: string };
        result.desire = Math.max(0, Math.min(1, result.desire));
        return result;
    } catch (error) {
        console.error(`Gemini API Error (Desire Model for ${character.name}):`, error);
        return { desire: 0.1, reasoning: "API error." };
    }
};

export const simulateSideConversation = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    char1: Character,
    char2: Character,
    goal1: string,
    goal2: string,
    sceneContext: string | null,
    recentHistory: string,
    topic: string,
): Promise<SideConversationResult> => {
    const ai = getAi(apiKey);
    const prompt = `You are a Narrative Simulator. Two characters, ${char1.name} and ${char2.name}, are having a private conversation about the following topic: "${topic}".
The current scene is: ${sceneContext || 'an undefined space'}.
Recent public conversation:
---
${recentHistory}
---
Profiles & Goals:
- **${char1.name} (ID: ${char1.id})**: Goal: "${goal1}"
- **${char2.name} (ID: ${char2.id})**: Goal: "${goal2}"

Simulate their full interaction. Provide a JSON object with:
1. A 'summary' of the event for the main chat (past-tense, third-person).
2. A full 'transcript' of their private conversation, with speaker names.
3. 'goal_updates': Array of goal changes (new_goal can be string or null if completed). Include reasoning.
4. 'new_secrets': Array of secrets formed during their talk.
Return ONLY the valid JSON object.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        transcript: { type: Type.STRING },
                        goal_updates: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT, properties: { character_id: { type: Type.STRING }, new_goal: { type: Type.STRING, nullable: true }, reasoning: { type: Type.STRING }, },
                                required: ["character_id", "reasoning"]
                            }
                        },
                        new_secrets: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT, properties: { character_id: { type: Type.STRING }, secret: { type: Type.STRING }, },
                                required: ["character_id", "secret"]
                            }
                        },
                    },
                    required: ["summary", "transcript", "goal_updates", "new_secrets"]
                },
                ...getThinkingConfig(modelBehavior)
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as SideConversationResult;
    } catch (error) {
        console.error("Gemini API Error (Side Conversation):", error);
        throw new Error("Failed to simulate side conversation.");
    }
};

export const callTopicAnalysisModel = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    transcript: string
): Promise<TopicAnalysis[]> => {
    const ai = getAi(apiKey);
    const prompt = `You are a Topic Analyzer. Read the transcript and identify the top 3-5 most significant topics.
For each, provide a short, one-sentence summary.
Transcript:
---
${transcript}
---
Return ONLY a valid JSON array of objects with "topic" (string) and "summary" (string).`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT, properties: { topic: { type: Type.STRING }, summary: { type: Type.STRING }, },
                        required: ["topic", "summary"]
                    }
                },
                ...getThinkingConfig(modelBehavior)
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as TopicAnalysis[];
    } catch (error) {
        console.error("Gemini API Error (Topic Analysis):", error);
        return [{ topic: "Error", summary: "Failed to analyze topics due to an API error." }];
    }
};

export const generateImage = async (
    apiKey: string,
    prompt: string
): Promise<string> => {
    const ai = getAi(apiKey);
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Gemini API Error (Image Generation):", error);
        throw new Error("Failed to generate image.");
    }
};

export const editImage = async (
    apiKey: string,
    prompt: string,
    base64ImageData: string,
    mimeType: string,
): Promise<{ text: string, imageBase64: string | null }> => {
    const ai = getAi(apiKey);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64ImageData, mimeType: mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        let text = '';
        let imageBase64: string | null = null;
        
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.text) {
                    text += part.text;
                } else if (part.inlineData) {
                    imageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        
        if (!text && !imageBase64) {
            // Fallback to text property if parts are not as expected
            const responseText = response.text;
            if (responseText) return { text: responseText, imageBase64: null };
            throw new Error("Image editing returned no content.");
        }

        return { text, imageBase64 };
    } catch (error) {
        console.error("Gemini API Error (Image Editing):", error);
        throw new Error("Failed to edit image.");
    }
};

export const generateAvatarPrompt = async (
    apiKey: string,
    characterInfo: { name: string, title: string, systemPrompt: string }
): Promise<string> => {
    const ai = getAi(apiKey);
    const prompt = `You are an expert image prompt generator for an AI model. Create a concise, descriptive, and visually rich prompt to generate a character avatar based on the following information. The prompt should focus on visual appearance, style, and mood. It should be a single paragraph.

Character Name: ${characterInfo.name}
Character Title: ${characterInfo.title}
Description:
---
${characterInfo.systemPrompt.substring(0, 1000)}
---

Generated Prompt:`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error (Avatar Prompt Generation):", error);
        throw new Error("Failed to generate avatar prompt.");
    }
};

// FIX: Added callFusionModel to handle character creation via the Genesis Modal.
export const callFusionModel = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    charA: Character,
    charB: Character
): Promise<{ name: string, title: string, systemPrompt: string, avatar: string, color: string } | null> => {
    const ai = getAi(apiKey);

    const prompt = `You are a creative character designer. Fuse the core concepts, personality, and lore of two characters to create a compelling new one.

Character A:
Name: ${charA.name}
Title: ${charA.title}
Bio:
---
${charA.systemPrompt.substring(0, 500)}
---

Character B:
Name: ${charB.name}
Title: ${charB.title}
Bio:
---
${charB.systemPrompt.substring(0, 500)}
---

Canon Invariants (CRITICAL):
- **Zya/Inner-Zya/Zaya:** These are distinct, hierarchical concepts. Do not conflate them.
- **Ymzo's Archetype:** Ymzo is the "Arcane Maverick." He is NOT a "frost sage." Avoid frost/ice themes for him or related fusions.
- **Spelling:** The name of the artifact/concept is "Viridian," not "Vyridion" or other variations. Ensure this spelling is used if relevant.

Generate a JSON object for the fused character.
- The 'name' should be a creative blend or a new concept inspired by both.
- The 'title' should be evocative and unique.
- The 'systemPrompt' should be a detailed personality guide for the new character, merging themes from both parents. It should follow the same format as the source bios.
- The 'avatar' must be a single, appropriate emoji.
- The 'color' must be a hex color code that represents the fusion.

Return ONLY a valid JSON object.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                ...getThinkingConfig(modelBehavior),
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        title: { type: Type.STRING },
                        systemPrompt: { type: Type.STRING },
                        avatar: { type: Type.STRING },
                        color: { type: Type.STRING },
                    },
                    required: ["name", "title", "systemPrompt", "avatar", "color"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini API Error (Fusion Model):", error);
        return null;
    }
};

// --- Survivor Mode Generation ---

const generateSurvivorText = async (apiKey: string, modelBehavior: ModelBehavior, prompt: string, maxTokens: number): Promise<string> => {
    const ai = getAi(apiKey);
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                ...getThinkingConfig(modelBehavior),
                temperature: 0.8,
                stopSequences: ["\n\n", "[END]"],
                maxOutputTokens: maxTokens,
                ...(modelBehavior === 'flash-thinking' && maxTokens > 0 && { thinkingConfig: { thinkingBudget: Math.floor(maxTokens / 2) } }),
            }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (Survivor Mode):", error);
        throw new Error("Failed to generate Survivor content.");
    }
}

const generateHostText = async (apiKey: string, modelBehavior: ModelBehavior, systemInstruction: string, prompt: string, maxTokens: number): Promise<string> => {
    const ai = getAi(apiKey);
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                systemInstruction,
                ...getThinkingConfig(modelBehavior),
                temperature: 0.9,
                stopSequences: ["\n"],
                maxOutputTokens: maxTokens,
                ...(modelBehavior === 'flash-thinking' && maxTokens > 0 && { thinkingConfig: { thinkingBudget: Math.floor(maxTokens / 2) } }),
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error (Survivor Host):", error);
        throw new Error("Failed to generate Survivor host content.");
    }
}

export const generateSurvivorCampWindow = (apiKey: string, modelBehavior: ModelBehavior, participants: string[], flags: string[], seed: string) => {
    const prompt = `Write exactly 6–12 lines of in-universe dialogue. 4–6 distinct speakers from ${participants.join(', ')}. Each line ≤ 15 words. Reflect flags: ${flags.join(', ')}. No new props/events. Tone seeded by ${seed}. End cleanly. No narration outside dialogue.`;
    return generateSurvivorText(apiKey, modelBehavior, prompt, 250);
};

export const generateSurvivorAllianceHint = (apiKey: string, modelBehavior: ModelBehavior, participants: string[], seed: string) => {
    const prompt = `Write 1–3 compact lines indicating a subtle alliance or rift between ${participants.join(', ')}. No exposition or spoilers. ≤ 15 words per line. Seed ${seed}. End clean.`;
    return generateSurvivorText(apiKey, modelBehavior, prompt, 100);
};

export const generateSurvivorSchemingNote = (apiKey: string, modelBehavior: ModelBehavior, characterName: string, recentEvent: string, seed: string) => {
    const prompt = `In ${characterName}’s voice, write 1–2 sentences revealing a current scheme or suspicion. Reference ${recentEvent}. ≤ 35 words total. Seed ${seed}. No new plot items.`;
    return generateSurvivorText(apiKey, modelBehavior, prompt, 50);
};

export const generateSurvivorEchoNote = (apiKey: string, modelBehavior: ModelBehavior, characterName: string, placement: string, summary: string, betrayal: string, seed: string) => {
    const prompt = `You are ${characterName}, eliminated in ${placement}. Your journey: ${summary}. Biggest betrayal: ${betrayal}. Write 3–4 sentences, specific, reflective, in-voice. Hint who might win. ≤ 80 words. Seed ${seed}. End.`;
    return generateSurvivorText(apiKey, modelBehavior, prompt, 120);
};

export const generateSurvivorSpotlight = (apiKey: string, modelBehavior: ModelBehavior, characterName: string, recentEvent: string, archetype: string, seed: string) => {
    const prompt = `In ${characterName}'s voice (archetype: ${archetype}), write a 2-3 sentence inner monologue reflecting on ${recentEvent}. Keep it concise and in-character. ≤ 60 words. Seed ${seed}. End.`;
    return generateSurvivorText(apiKey, modelBehavior, prompt, 100);
};

export const generateSurvivorConfession = (apiKey: string, modelBehavior: ModelBehavior, characterName: string, seed: string, question?: string) => {
    let prompt: string;
    if (question) {
        prompt = `You are ${characterName}, just eliminated from a reality competition. In a confessional, answer this question from an observer: "${question}". Be concise, in-character, and reflective. ≤ 70 words. Seed ${seed}. End.`;
    } else {
        prompt = `You are ${characterName}, just eliminated from a reality competition. In a confessional, answer these two questions: 1. What was your biggest mistake? 2. Who do you think will win, and why? Be concise, in-character, and reflective. ≤ 70 words. Seed ${seed}. End.`;
    }
    return generateSurvivorText(apiKey, modelBehavior, prompt, 100);
};

export const generateSurvivorTribunalDebate = async (
    apiKey: string, 
    modelBehavior: ModelBehavior, 
    participants: string[], 
    topic: string, 
    seed: string
): Promise<{ speaker_name: string; line: string; }[]> => {
    const ai = getAi(apiKey);
    const prompt = `You are a scriptwriter for a tense reality TV show tribal council.
Write a 3-4 person, 4-6 line debate.
Participants: ${participants.join(', ')}.
Topic: "${topic}".
RULES:
- Each line MUST be ≤ 15 words.
- Keep it focused and in-character.
- Do not narrate.
- Return ONLY a valid JSON array of objects, each with "speaker_name" (one of the participants) and "line" (their dialogue).

Example format:
[
  { "speaker_name": "Ymzo", "line": "Your logic is flawed." },
  { "speaker_name": "Sinira", "line": "My logic is survival." }
]

Seed for deterministic output: ${seed}`;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                ...getThinkingConfig(modelBehavior),
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            speaker_name: { type: Type.STRING },
                            line: { type: Type.STRING },
                        },
                        required: ["speaker_name", "line"]
                    }
                },
                maxOutputTokens: 300,
            }
        });
        const jsonText = response.text.trim();
        const debate = JSON.parse(jsonText) as { speaker_name: string; line: string; }[];
        // Validate speaker names
        const participantSet = new Set(participants);
        return debate.filter(d => participantSet.has(d.speaker_name));

    } catch (error) {
        console.error("Gemini API Error (Survivor Tribunal Debate):", error);
        // Fallback to a simple array
        return [{ speaker_name: participants[0], line: "The tension is palpable." }];
    }
};

export const generateHostRoundIntro = (apiKey: string, modelBehavior: ModelBehavior, hostPersona: string, round: number, remainingPlayers: number) => {
    const prompt = `It is round ${round}. ${remainingPlayers} players remain. Deliver a short, thematic opening statement for the round to the players. Keep it under 40 words.`;
    return generateHostText(apiKey, modelBehavior, hostPersona, prompt, 60);
};

export const generateHostTrialIntro = (apiKey: string, modelBehavior: ModelBehavior, hostPersona: string, trial: { name: string, description: string }) => {
    const prompt = `It's time for the immunity challenge. The trial is called "${trial.name}". Explain it to the players: "${trial.description}". Build the tension. End with the line "Survivors ready? Go!".`;
    return generateHostText(apiKey, modelBehavior, hostPersona, prompt, 150);
};

export const generateHostEliminationSendoff = (apiKey: string, modelBehavior: ModelBehavior, hostPersona: string, eliminatedPlayerName: string) => {
    const prompt = `After telling ${eliminatedPlayerName} "the tribe has spoken," you need to give them a final, personal send-off line. What is that one-sentence line? It should be memorable and reflect their time in the game. Respond with ONLY the line itself.`;
    return generateHostText(apiKey, modelBehavior, hostPersona, prompt, 40);
};

export const generateHostFinaleOpen = (apiKey: string, modelBehavior: ModelBehavior, hostPersona: string, finalists: string[], jury: string[]) => {
    const prompt = `This is it, the final tribal council. The finalists are ${finalists.join(', ')}. The jury members are ${jury.join(', ')}. Deliver a powerful opening monologue to set the stage for the final vote.`;
    return generateHostText(apiKey, modelBehavior, hostPersona, prompt, 200);
};

export const generateFinalistOpeningStatement = (apiKey: string, modelBehavior: ModelBehavior, finalistName: string, otherFinalists: string[], jurySize: number) => {
    const prompt = `You are ${finalistName}, a finalist in a reality competition. You are giving your opening statement to a jury of ${jurySize} eliminated players. The other finalists are ${otherFinalists.join(' and ')}. Argue why you deserve to win. Be concise, in-character, and persuasive. Keep it under 80 words.`;
    return generateSurvivorText(apiKey, modelBehavior, prompt, 120);
};

export const generateJuryQuestion = (apiKey: string, modelBehavior: ModelBehavior, jurorName: string, targetFinalistName: string, otherFinalists: string[]) => {
    const prompt = `You are ${jurorName}, a jury member in a reality competition. You get to ask one question to ${targetFinalistName}, one of the finalists. The other finalists are ${otherFinalists.join(' and ')}. Ask a tough, insightful question about their gameplay, strategy, or a specific betrayal. Keep the question to one sentence.`;
    return generateSurvivorText(apiKey, modelBehavior, prompt, 60);
};

export const generateFinalistAnswer = (apiKey: string, modelBehavior: ModelBehavior, finalistName: string, jurorName: string, question: string) => {
    const prompt = `You are ${finalistName}, a finalist in a reality competition. ${jurorName}, a jury member, just asked you: "${question}". Give a direct, persuasive, and in-character answer. Keep it under 60 words.`;
    return generateSurvivorText(apiKey, modelBehavior, prompt, 100);
};

export const generateFinalistClosingStatement = (apiKey: string, modelBehavior: ModelBehavior, finalistName: string) => {
    const prompt = `You are ${finalistName}. Give your final, brief closing statement to the jury. Make one last emotional or logical appeal for why you should be the Sole Survivor. Keep it under 50 words.`;
    return generateSurvivorText(apiKey, modelBehavior, prompt, 80);
};

export const generateSurvivorLore = async (
    apiKey: string,
    modelBehavior: ModelBehavior,
    seasonSummary: string
): Promise<{ title: string; content: string; character_ids: string[] }[]> => {
    const ai = getAi(apiKey);
    const prompt = `You are a LORE KEEPER for a simulated Survivor game. Analyze the provided season summary and extract 3-5 significant, timeless lore entries. Focus on character arcs, legendary moments, and enduring rivalries.

    RULES:
    - Each entry must have a 'title', a 'content' summary (2-3 sentences), and 'character_ids' involved.
    - Do not just restate stats. Create narrative lore.
    - Character IDs are provided in parentheses, like 'Ymzo (ymzo)'. Extract only the ID.

    SEASON SUMMARY:
    ---
    ${seasonSummary}
    ---

    Return ONLY a valid JSON array of lore objects.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                ...getThinkingConfig(modelBehavior),
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            character_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["title", "content", "character_ids"]
                    }
                },
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini API Error (Survivor Lore):", error);
        throw new Error("Failed to generate Survivor lore.");
    }
};