import { Session, Character, LoreEntry, ModelBehavior } from '../types';
import { callLoreExtractionModel, ExtractedLoreEntry } from './geminiService';

const formatConversationForLore = (session: Session, allCharacters: Character[]): string => {
    const transcript = session.messages.map(msg => {
        let speaker = "SYSTEM";
        if (msg.role === 'user') {
            speaker = "USER";
        } else if (msg.role === 'assistant') {
            const char = allCharacters.find(c => c.id === msg.characterId);
            speaker = char ? char.name.toUpperCase() : "ASSISTANT";
        }
        return `[${msg.id}] ${speaker}: ${msg.content}`;
    }).join('\n');
    return transcript;
};

const formatCharacterProfiles = (session: Session, allCharacters: Character[]): string => {
    return session.characterIds
        .map(id => allCharacters.find(c => c.id === id))
        .filter((c): c is Character => !!c)
        .map(c => `- ${c.name} (id: ${c.id}): ${c.title}`)
        .join('\n');
};

export const extractLoreFromSession = async (
    session: Session,
    allCharacters: Character[],
    apiKey: string,
    modelBehavior: ModelBehavior
): Promise<LoreEntry[]> => {
    if (session.messages.length < 5) {
        return [];
    }

    const conversationText = formatConversationForLore(session, allCharacters);
    const characterProfiles = formatCharacterProfiles(session, allCharacters);

    const extractedLoreEntries: ExtractedLoreEntry[] = await callLoreExtractionModel(apiKey, modelBehavior, conversationText, characterProfiles);

    const loreEntries: LoreEntry[] = extractedLoreEntries.map(lore => ({
        id: `lore-${lore.source_message_id}-${Date.now()}`,
        sessionId: session.id,
        title: lore.title,
        content: lore.content,
        characterIds: lore.character_ids,
        timestamp: Date.now(),
        sourceMessageId: lore.source_message_id,
    }));

    return loreEntries;
};