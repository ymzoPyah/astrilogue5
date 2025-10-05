import React from 'react';
import { View } from '../types';
import { useAppContext } from '../state/AppContext';

import WelcomeScreen from './screens/WelcomeScreen';
import SetupScreen from './screens/SetupScreen';
import ChatScreen from './screens/ChatScreen';
import LiveChatScreen from './screens/LiveChatScreen';
import RelationshipVisualizerScreen from './screens/RelationshipVisualizerScreen';
import LoreBookScreen from './screens/LoreBookScreen';
import CodexScreen from './screens/CodexScreen';
import CharacterWorkshopScreen from './screens/CharacterWorkshopScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ProfileScreen from './screens/ProfileScreen';
import QuizScreen from './screens/QuizScreen';
import GenesisScreen from './screens/GenesisScreen';
import SurvivorHub from './survivor/SurvivorHub';

const ViewRouter: React.FC = () => {
    const { 
        view, 
        activeSession, 
        liveCharacters, 
        characterInWorkshop, 
    } = useAppContext();
    
    switch (view) {
        case View.Welcome:
            return <WelcomeScreen />;
        case View.Setup:
            return <SetupScreen />;
        case View.Chat:
            return activeSession ? <ChatScreen /> : <WelcomeScreen />;
        case View.LiveChat:
            return liveCharacters ? <LiveChatScreen /> : <WelcomeScreen />;
        case View.RelationshipVisualizer:
            return <RelationshipVisualizerScreen />;
        case View.LoreBook:
            return <LoreBookScreen />;
        case View.Codex:
            return <CodexScreen />;
        case View.Workshop:
             return characterInWorkshop ? <CharacterWorkshopScreen /> : <SetupScreen />;
        case View.Analytics:
            return <AnalyticsScreen />;
        case View.Profile:
            return <ProfileScreen />;
        case View.Quiz:
            return <QuizScreen />;
        case View.Genesis:
            return <GenesisScreen />;
        case View.Survivor:
            return <SurvivorHub />;
        default:
            return <WelcomeScreen />;
    }
};

export default ViewRouter;