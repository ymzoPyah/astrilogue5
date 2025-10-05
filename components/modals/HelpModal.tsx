

import React, { useState } from 'react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'start' | 'director' | 'agency' | 'features';

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<Tab>('start');

    if (!isOpen) return null;

    const TabButton: React.FC<{ tabId: Tab; currentTab: Tab; onClick: (tabId: Tab) => void; children: React.ReactNode }> = ({ tabId, currentTab, onClick, children }) => (
        <button
            onClick={() => onClick(tabId)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex-shrink-0 ${currentTab === tabId ? 'text-purple-300 border-purple-400' : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}
        >
            {children}
        </button>
    );

    const Feature: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
        <div className="flex gap-4">
            <div className="text-3xl mt-1">{icon}</div>
            <div>
                <h4 className="font-bold text-purple-300">{title}</h4>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s]" style={{ animationName: 'fadeIn' }} onClick={onClose}>
            <div className="bg-[#1a1a2e] border-2 border-purple-500/50 rounded-2xl p-6 sm:p-8 max-w-3xl w-full h-[80vh] flex flex-col shadow-2xl shadow-purple-900/50 animate-[modalSlide_0.3s_ease-out]" style={{ animationName: 'modalSlide' }} onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">❓ Astrilogue Guide</h2>
                <div className="w-full border-b border-purple-500/20 mb-4 overflow-x-auto">
                    <div className="flex flex-nowrap">
                        <TabButton tabId="start" currentTab={activeTab} onClick={setActiveTab}>Getting Started</TabButton>
                        <TabButton tabId="director" currentTab={activeTab} onClick={setActiveTab}>Director's Toolkit</TabButton>
                        <TabButton tabId="agency" currentTab={activeTab} onClick={setActiveTab}>Character Agency</TabButton>
                        <TabButton tabId="features" currentTab={activeTab} onClick={setActiveTab}>Other Features</TabButton>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                    {activeTab === 'start' && (
                        <div className="space-y-6">
                            <Feature icon="🚀" title="The Goal" description="Astrilogue is an 'AI Conductor' app. Your role is to direct and orchestrate dynamic stories with a cast of unique AI characters." />
                            <Feature icon="💬" title="1-on-1 vs. Group Chat" description="Select one character for a focused chat, or up to five for a group conversation where an AI 'Scene Director' manages the dialogue flow." />
                            <Feature icon="🎭" title="Conversation Templates" description="Not sure where to start? Pick a template on the welcome screen for a pre-configured scenario with interesting character dynamics." />
                            <Feature icon="📚" title="History & Settings" description="Use the buttons in the header to access your conversation history (where you can load or delete past chats) and configure your API key and safety limits." />
                        </div>
                    )}
                    {activeTab === 'director' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-cyan-300">Advanced Narrative Control</h3>
                            <Feature icon="🎬" title="Set Scene" description="Ground your conversation in a specific environment. The scene context influences character dialogue, emotions, and actions, making stories more immersive." />
                            <Feature icon="🎯" title="Assign Goals" description="Give characters secret agendas. They will subtly try to steer the conversation to achieve their objectives, creating intrigue and conflict." />
                            <Feature icon="🎭" title="Advance Plot" description="Trigger secret, off-screen conversations between characters who have goals. This can lead to new alliances, betrayals, and plot twists that are reported back to you as 'Events'." />
                            <Feature icon="🌳" title="Branch Conversation" description="Explore 'what-if' scenarios. Hover over any message and click the branch icon to start a new timeline from that point without losing your original progress." />
                        </div>
                    )}
                    {activeTab === 'agency' && (
                         <div className="space-y-6">
                            <h3 className="text-xl font-bold text-cyan-300">How Characters Think</h3>
                             <Feature icon="🧠" title="Persistent Memory" description="Characters remember your past conversations across all sessions. They can recall facts, promises, and events, giving them long-term continuity." />
                             <Feature icon="😊" title="Emotional State" description="Characters have an internal emotional state that is analyzed after each message they send. Hover over their nameplate in the chat header to see a real-time breakdown of their mood." />
                             <Feature icon="🙋" title="Desire to Speak" description="In group chats, the AI Director doesn't just pick randomly. It first asks each character how much they *want* to speak based on the context, their goals, and emotions." />
                             <Feature icon="⚡" title="Proactive Interjections" description="Characters can interrupt the conversation! If a message triggers a strong reaction, they will interject with a response, even when it's not their turn." />
                             <Feature icon="🤔" title="Meta-Cognitive Reflection" description="Certain characters (like Ymzo & Kiox) are self-aware. Hover over their nameplate and click the 'Reflect' button to prompt them for a philosophical, fourth-wall-breaking thought." />
                        </div>
                    )}
                     {activeTab === 'features' && (
                         <div className="space-y-6">
                            <h3 className="text-xl font-bold text-cyan-300">Exploring Your Stories</h3>
                             <Feature icon="📖" title="The Lore Book" description="After a conversation, use the 'Scan for Lore' button in the History panel. The AI will identify key story moments and add them to the Lore Book for you to review." />
                             <Feature icon="🕸️" title="The Lore Web" description="Visualize the intricate web of relationships between characters. See who are allies, rivals, or have complex connections in a dynamic, interactive graph." />
                             <Feature icon="📊" title="Analytics Dashboard" description="Get deep insights into your conversations. Track character participation, see their emotional journeys on a timeline, and use AI to identify the key topics you discussed." />
                             <Feature icon="🔧" title="Character Workshop" description="Create your own AI characters! The workshop lets you define their personality and lore, then test them with sample prompts before adding them to your cast." />
                             <Feature icon="👍" title="Feedback System" description="Teach the characters your preferences. Use the thumbs-up/down buttons on AI messages to guide their personality and style over time." />
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6 border-t border-purple-500/20 pt-4">
                    <button className="btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
             <style>{`
                .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #a855f7; }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4); }
            `}</style>
        </div>
    );
};

export default HelpModal;