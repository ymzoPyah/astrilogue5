
import { Session, Character, Message } from '../types';

const getSpeakerName = (message: Message, allCharacters: Character[]): string => {
    if (message.role === 'user') return 'User';
    if (message.role === 'system') return 'System';
    const character = allCharacters.find(c => c.id === message.characterId);
    return character?.name || 'Assistant';
};

const downloadFile = (filename: string, content: string, mimeType: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
};

export const exportToMarkdown = (session: Session, allCharacters: Character[]) => {
    let content = `# Conversation: ${session.name}\n\n`;
    content += `**Mode:** ${session.mode}\n`;
    content += `**Date:** ${new Date(session.createdAt).toLocaleString()}\n\n---\n\n`;

    session.messages.forEach(msg => {
        const speaker = getSpeakerName(msg, allCharacters);
        content += `**${speaker}** (${new Date(msg.timestamp).toLocaleTimeString()}):\n`;
        // Blockquote the message content
        content += `> ${msg.content.replace(/\n/g, '\n> ')}\n\n`;
    });

    downloadFile(`${session.name.replace(/[^a-z0-9]/gi, '_')}.md`, content, 'text/markdown;charset=utf-8');
};

export const exportToJson = (session: Session) => {
    const content = JSON.stringify(session, null, 2);
    downloadFile(`${session.name.replace(/[^a-z0-9]/gi, '_')}.json`, content, 'application/json;charset=utf-8');
};

export const exportToTxt = (session: Session, allCharacters: Character[]) => {
    let content = `Conversation: ${session.name}\n`;
    content += `Mode: ${session.mode}\n`;
    content += `Date: ${new Date(session.createdAt).toLocaleString()}\n\n--------------------\n\n`;

    session.messages.forEach(msg => {
        const speaker = getSpeakerName(msg, allCharacters);
        content += `${speaker} (${new Date(msg.timestamp).toLocaleTimeString()}):\n`;
        content += `${msg.content}\n\n`;
    });
    
    downloadFile(`${session.name.replace(/[^a-z0-9]/gi, '_')}.txt`, content, 'text/plain;charset=utf-8');
};
